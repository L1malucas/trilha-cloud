---
id: "09_containers_e_kubernetes"
title: "Módulo 09 — Containers e Kubernetes"
sidebar_label: "09 · Containers e Kubernetes"
sidebar_position: 9
---

# Módulo 09 — Containers e Kubernetes

> **Objetivo**: empacotar e rodar containers no GCP — Artifact Registry, Cloud Build, Cloud Run e GKE (Standard x Autopilot) —, saber escolher entre eles e publicar a API do TrilhaShop em container.
>
> **Pré-requisitos**: módulos 04 e 08. Containers e Kubernetes em profundidade estão na trilha Linux (Módulos 20 e 23).
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre "Deploying and implementing a cloud solution → GKE e Cloud Run" do **Associate Cloud Engineer**. O Google criou o Kubernetes; o GKE é o seu serviço gerenciado. Referência: https://cloud.google.com/kubernetes-engine/docs

---

## Da VM ao container

No Módulo 08 você alugou a máquina e cuidou do SO. Um **container** empacota a aplicação com suas dependências numa **imagem** que roda igual em qualquer lugar, **compartilhando o kernel** do host — leve e rápido (Módulo 14 da trilha Linux explica por dentro). Com containers, a pergunta deixa de ser "onde está o servidor?" e vira "**onde rodo esta imagem?**".

## Artifact Registry: o repositório de imagens

O **Artifact Registry** guarda imagens de container (e pacotes Maven, npm, Python...), com IAM e escaneamento de vulnerabilidades. Substitui o antigo Container Registry (`gcr.io`).

```bash
PROJETO=$(gcloud config get project)
REGIAO=southamerica-east1
gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com run.googleapis.com container.googleapis.com

gcloud artifacts repositories create trilhashop --repository-format=docker \
  --location=$REGIAO --description="Imagens do TrilhaShop"
gcloud artifacts repositories list
gcloud auth configure-docker $REGIAO-docker.pkg.dev            # permite 'docker push' para este registry
```

A imagem recebe o nome `REGIAO-docker.pkg.dev/PROJETO/REPOSITORIO/IMAGEM:TAG`.

## Cloud Build: construir sem Docker local

O **Cloud Build** executa o build **na nuvem** (a partir de um Dockerfile ou `cloudbuild.yaml`) e publica a imagem — sem precisar de Docker instalado.

```bash
# Dockerfile e app de exemplo (reaproveite os do Módulo 20 da trilha Linux)
IMG=$REGIAO-docker.pkg.dev/$PROJETO/trilhashop/api:v1
gcloud builds submit --tag=$IMG .
gcloud artifacts docker images list $REGIAO-docker.pkg.dev/$PROJETO/trilhashop
gcloud builds list --limit=3
```

Para pipelines mais elaborados, `cloudbuild.yaml`:

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args: ["build", "-t", "${_IMG}", "."]
  - name: gcr.io/cloud-builders/docker
    args: ["push", "${_IMG}"]
substitutions:
  _IMG: southamerica-east1-docker.pkg.dev/$PROJECT_ID/trilhashop/api:v1
```

## Onde rodar o container: a árvore de decisão

| Serviço | Modelo | Use quando |
|---|---|---|
| **Cloud Run** | Serverless para containers: escala (inclusive **a zero**), cobra por uso | APIs e sites **sem estado**, sem querer administrar cluster |
| **GKE Autopilot** | Kubernetes gerenciado, o Google cuida dos nós; você paga por Pod | Quer Kubernetes, sem operar nós |
| **GKE Standard** | Kubernetes com você gerenciando os node pools | Controle total sobre nós e configuração |
| **Compute Engine** | VM com container (ou Docker na mão) | Caso especial, controle de SO |
| **App Engine** | PaaS clássico | Apps web simples (legado/novos casos específicos) |

> `[TEORIA]` Prova (ACE/CDL): "rodar um container **sem gerenciar infraestrutura**, escalando a zero" → **Cloud Run**; "Kubernetes gerenciado, **sem** administrar nós" → **GKE Autopilot**; "Kubernetes com controle dos nós" → **GKE Standard**. Se o cenário diz "microsserviços com muitas dependências do ecossistema K8s", é GKE; se é "uma API simples", é Cloud Run.

## Cloud Run: o caminho mais curto

O **Cloud Run** recebe a imagem, dá uma URL **HTTPS** e escala por **requisições concorrentes**. Você paga pelo tempo em que há requisição sendo atendida (e opcionalmente por instâncias mínimas).

```bash
gcloud run deploy trilhashop-api --image=$IMG --region=$REGIAO \
  --service-account=sa-trilhashop-api@$PROJETO.iam.gserviceaccount.com \
  --port=8080 --min-instances=0 --max-instances=5 --concurrency=80 \
  --set-secrets=DB_CONNECTION=db-connection:latest \
  --no-allow-unauthenticated --labels=projeto=trilhashop

gcloud run services describe trilhashop-api --region=$REGIAO --format="value(status.url)"
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" $(gcloud run services describe trilhashop-api --region=$REGIAO --format="value(status.url)")/saude
gcloud run revisions list --service=trilhashop-api --region=$REGIAO
gcloud run services update-traffic trilhashop-api --region=$REGIAO --to-revisions=LATEST=100
```

Pontos-chave:

- **Revisões**: cada deploy cria uma revisão imutável; dá para dividir tráfego (`--to-revisions=rev1=90,rev2=10`) e fazer **canary/rollback** instantâneo.
- **`--no-allow-unauthenticated`**: exige token de identidade IAM (`roles/run.invoker`); use `--allow-unauthenticated` só para serviços públicos.
- **`--set-secrets`**: injeta segredos do **Secret Manager** como variável, lidos pela SA do serviço (Módulo 04) — sem segredo na imagem.
- **Cold start**: com `min-instances=0`, a primeira requisição após ociosidade é mais lenta.

> `[ATENÇÃO]` A SA do Cloud Run precisa do role `secretmanager.secretAccessor` no segredo, senão o deploy falha ao tentar montá-lo. E `--allow-unauthenticated` torna o serviço **público na internet**: faça de caso pensado.

![Console do Cloud Run com o serviço trilhashop-api, a URL, a revisão ativa e o gráfico de requisições](screenshots/09-containers-e-kubernetes/01-cloud-run-servico.png)
> `[PRINT]` Passo a passo para capturar: Console → Cloud Run → `trilhashop-api`. Capturar a aba de métricas e a URL do serviço.

## GKE: Kubernetes gerenciado

O **GKE** opera o *control plane* (API server, etcd, scheduler) e, no Autopilot, também os nós. Você usa o `kubectl` como em qualquer Kubernetes (aprofunde no Módulo 23 da trilha Linux).

```bash
gcloud container clusters create-auto cl-trilhashop --region=$REGIAO \
  --network=vpc-trilhashop --subnetwork=snet-app
gcloud container clusters get-credentials cl-trilhashop --region=$REGIAO
kubectl get nodes

kubectl create deployment api --image=$IMG --replicas=2
kubectl expose deployment api --port=80 --target-port=8080 --type=LoadBalancer
kubectl get svc api -w                        # aguarde o IP externo
kubectl get pods -o wide
```

| | **Autopilot** | **Standard** |
|---|---|---|
| Nós | Google gerencia | Você gerencia node pools |
| Cobrança | Por **recursos do Pod** | Por **VMs do node pool** |
| Segurança/boas práticas | Aplicadas por padrão | Você configura |
| Flexibilidade | Menor (algumas restrições) | Total |

> `[ATENÇÃO]` Em **Standard**, um cluster ocioso **continua cobrando** os nós (VMs). Em ambos, o cluster tem taxa de gerenciamento (há crédito gratuito mensal para um cluster zonal/Autopilot — confira). **Apague o cluster** ao terminar o estudo.

**Workload Identity** liga uma **ServiceAccount do Kubernetes** a uma **SA do Google** (sem chaves), para os Pods acessarem Storage, Secret Manager etc. com menor privilégio (Módulo 04):

```bash
kubectl create serviceaccount ksa-api
gcloud iam service-accounts add-iam-policy-binding sa-trilhashop-api@$PROJETO.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser --member="serviceAccount:$PROJETO.svc.id.goog[default/ksa-api]"
kubectl annotate serviceaccount ksa-api iam.gke.io/gcp-service-account=sa-trilhashop-api@$PROJETO.iam.gserviceaccount.com
```

## Práticas

### Prática isolada

1. Crie o repositório do Artifact Registry e construa a imagem com `gcloud builds submit`.
2. Publique no Cloud Run com `--allow-unauthenticated` (lab), teste com `curl` e depois restrinja.
3. Faça uma segunda revisão (mude a mensagem), divida o tráfego 90/10 e depois reverta.
4. (Opcional) Crie um GKE Autopilot, faça deploy da imagem e exponha com LoadBalancer.

**Limpeza:**

```bash
gcloud run services delete trilhashop-api --region=$REGIAO --quiet
gcloud container clusters delete cl-trilhashop --region=$REGIAO --quiet
gcloud artifacts repositories delete trilhashop --location=$REGIAO --quiet
```

### Contribuição ao projeto integrador

Containerize a API do TrilhaShop e publique no Artifact Registry; implante no **Cloud Run** como `trilhashop-api`, com a SA `sa-trilhashop-api` e o segredo `db-connection` montado do Secret Manager (Módulo 04). No `decisoes.md`, justifique **Cloud Run em vez de GKE** para este caso (e quando você mudaria de ideia).

`[CUSTO]` Cloud Run tem cota gratuita mensal e escala a zero; Artifact Registry cobra por armazenamento; **GKE Standard/Autopilot cobra enquanto existir** — apague o cluster.

## Erros comuns nesta fase

- Esquecer o role do Secret Manager (ou `run.invoker`) e o serviço não subir/não responder.
- `--allow-unauthenticated` sem intenção.
- Deixar o cluster GKE ligado.
- Colocar segredos na imagem ou em variáveis em texto puro.
- Escolher GKE para uma API simples que o Cloud Run resolveria.
- Usar `gcr.io` (legado) em vez do Artifact Registry.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Cloud Run e serverless | Serverless e aplicações — Módulo 10 |
| SA e Secret Manager | Módulo 04 |
| GKE e Kubernetes | Trilha Linux, Módulo 23 |
| Container | Trilha Linux, Módulos 14 e 20 |
| Container Apps/AKS no Azure | Azure, Módulo 09 |

## `[REFERÊNCIA]`

- Google Cloud — *Cloud Run*: https://cloud.google.com/run/docs
- Google Cloud — *Artifact Registry*: https://cloud.google.com/artifact-registry/docs
- Google Cloud — *Cloud Build*: https://cloud.google.com/build/docs
- Google Cloud — *GKE overview*: https://cloud.google.com/kubernetes-engine/docs/concepts/kubernetes-engine-overview
- Google Cloud — *Autopilot overview*: https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview
- Google Cloud — *Workload Identity Federation for GKE*: https://cloud.google.com/kubernetes-engine/docs/concepts/workload-identity
- Google Cloud — *Choose a compute option*: https://cloud.google.com/docs/choosing-a-compute-option

**Como aprofundar:** pratique o Módulo 23 (Kubernetes) da trilha Linux com kind e depois repita no GKE; leia sobre *Cloud Deploy* para entrega contínua.

## Checklist de saída

- [ ] Explicar imagem, container e registry e o papel do Artifact Registry.
- [ ] Construir uma imagem com Cloud Build.
- [ ] Escolher entre Cloud Run, GKE Autopilot, GKE Standard e Compute Engine.
- [ ] Implantar no Cloud Run com SA, segredo e controle de acesso.
- [ ] Usar revisões e divisão de tráfego (canary/rollback).
- [ ] Diferenciar Autopilot e Standard (nós e cobrança).
- [ ] Explicar Workload Identity.
- [ ] Ter publicado a API do TrilhaShop em container.
