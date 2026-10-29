---
id: "09_app_services_e_containers"
title: "Módulo 09 — App Services e Containers"
sidebar_label: "09 · App Services e Containers"
sidebar_position: 9
---

# Módulo 09 — App Services e Containers

> **Objetivo**: conhecer as opções de hospedar aplicações sem administrar servidor — App Service, Container Instances, Container Registry, Container Apps e AKS — saber escolher entre elas e publicar a API do TrilhaShop em container.
>
> **Pré-requisitos**: módulos 01 (PaaS) e 08 (VMs, para comparar).
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre **Deploy and manage Azure compute resources → containers e App Service** (AZ-104). Para Kubernetes em profundidade, siga a trilha Linux (Módulo 23). Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104

---

## Do aluguel do prédio ao aluguel da sala

No Módulo 08 você alugou o prédio (VM) e cuidou da manutenção. Aqui você aluga só a **sala pronta**: traz o código (ou o container) e o Azure cuida de SO, patch, balanceamento e certificado. A troca é clássica: menos controle, menos trabalho.

## App Service

O **Azure App Service** hospeda aplicações web e APIs (.NET, Java, Node, Python, PHP, ou container) com deploy simples, HTTPS, domínio próprio e autoscale. O conceito central é o **App Service Plan**: o conjunto de VMs (tamanho e quantidade) que *roda* um ou mais apps. Você paga pelo plano, não por app — vários apps podem dividir o mesmo plano.

| Camada (SKU) | Para quê |
|---|---|
| Free/Shared (`F1`/`D1`) | Estudo; sem SLA, cota limitada |
| Basic (`B1`) | Dev/teste |
| Standard (`S1`) | Produção; **slots de deploy** e autoscale |
| Premium (`P1v3`) | Escala maior, mais desempenho |

**Deployment slots** (a partir de Standard) são cópias do app (por exemplo `staging`) que permitem testar a nova versão e depois *trocar* (swap) com produção sem downtime, e voltar atrás em segundos.

```bash
RG=rg-trilhashop-dev
az appservice plan create -g $RG -n plan-trilhashop --sku S1 --is-linux
az webapp create -g $RG -p plan-trilhashop -n app-trilhashop-$RANDOM --runtime "PYTHON:3.12"

# Deploy direto da pasta atual (detecta o runtime, empacota e publica)
az webapp up -g $RG -n <nome-do-app> --runtime "PYTHON:3.12" --sku S1

az webapp deployment slot create -g $RG -n <nome-do-app> --slot staging
az webapp deployment slot swap   -g $RG -n <nome-do-app> --slot staging --target-slot production
az webapp config appsettings set -g $RG -n <nome-do-app> --settings DB_SECRET="@Microsoft.KeyVault(SecretUri=...)"
az webapp log tail -g $RG -n <nome-do-app>
```

> `[ATENÇÃO]` `appsettings` com a sintaxe `@Microsoft.KeyVault(...)` lê o segredo do cofre usando a **Managed Identity do app** (Módulos 04 e 05) — o app precisa ter a identidade e o role *Key Vault Secrets User*. Sem isso, o valor chega literal.

![App Service no portal com a visão geral do app, URL padrão e slots de implantação](screenshots/09-app-services-e-containers/01-app-service-visao-geral.png)
> `[PRINT]` Passo a passo para capturar: portal → App Services → o app → Overview; depois Deployment → Deployment slots. Capturar URL e slots.

## Containers: o que são e por que

Um **container** empacota a aplicação e suas dependências numa imagem que roda igual em qualquer lugar. Diferente da VM, **não carrega um SO inteiro**: compartilha o kernel do host, por isso é leve e inicia em segundos. A imagem é construída a partir de um **Dockerfile** (detalhado no Módulo 20 da trilha Linux).

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
```

### Azure Container Registry (ACR): onde as imagens moram

```bash
ACR=acrtrilhashop$RANDOM
az acr create -g $RG -n $ACR --sku Basic
az acr build -r $ACR -t trilhashop-api:v1 .          # constrói NA NUVEM, sem Docker local
az acr repository list -n $ACR -o table
az acr repository show-tags -n $ACR --repository trilhashop-api -o table
```

`az acr build` envia o contexto ao ACR e constrói lá — ótimo para quem não quer instalar Docker.

## Onde rodar o container: a árvore de decisão

| Serviço | Modelo | Use quando |
|---|---|---|
| **Container Instances (ACI)** | Container avulso, cobrado por segundo | Tarefa pontual, teste, job rápido |
| **Container Apps** | Serverless para containers (baseado em K8s, mas você não vê o cluster), autoscale até zero, KEDA | Microsserviços e APIs sem querer administrar Kubernetes |
| **App Service (containers)** | PaaS web com suporte a container | App web simples, equipe já usa App Service |
| **AKS** | Kubernetes gerenciado | Controle total, ecossistema K8s, muitos serviços |

```bash
# ACI: rodar rápido
az container create -g $RG -n aci-api --image $ACR.azurecr.io/trilhashop-api:v1 \
  --registry-login-server $ACR.azurecr.io --assign-identity --ports 8080 --cpu 1 --memory 1

# Container Apps: o caminho recomendado para a API
az extension add --name containerapp --upgrade
az containerapp env create -g $RG -n env-trilhashop -l brazilsouth
az containerapp create -g $RG -n ca-api --environment env-trilhashop \
  --image $ACR.azurecr.io/trilhashop-api:v1 --target-port 8080 --ingress external \
  --registry-server $ACR.azurecr.io --min-replicas 0 --max-replicas 5

# AKS (visão geral; aprofunde no Módulo 23 da trilha Linux)
az aks create -g $RG -n aks-trilhashop --node-count 1 --generate-ssh-keys --attach-acr $ACR
az aks get-credentials -g $RG -n aks-trilhashop
kubectl get nodes
```

> `[TEORIA]` Para a prova: "rodar um container sem gerenciar infraestrutura, escalando até zero" → **Container Apps**; "execução simples e rápida de container, sem orquestração" → **ACI**; "orquestração Kubernetes completa" → **AKS**.

> `[ATENÇÃO]` Container Apps e AKS precisam de permissão de pull no ACR (role `AcrPull` para a identidade). `--attach-acr` no AKS e `--registry-identity` no Container Apps fazem isso; sem eles, o erro é `ImagePullBackOff`.

## Práticas

### Prática isolada

1. Escreva uma API mínima (`/saude` devolvendo `ok`) e o Dockerfile acima.
2. `az acr build` e confira a imagem em `az acr repository list`.
3. Rode em ACI, acesse pelo FQDN, e apague (cobra por segundo).
4. Rode o mesmo em Container Apps com `min-replicas 0` e observe o *cold start* na primeira requisição depois de ficar ocioso.
5. No App Service, faça `deployment slot create`, publique uma versão alterada no slot e faça o swap.

**Limpeza:** `az group delete -n rg-lab-containers --yes --no-wait` (AKS e ACR cobram enquanto existirem).

### Contribuição ao projeto integrador

Containerize a API do TrilhaShop (`trilhashop-api`) e publique no ACR; implante em **Container Apps** como `ca-api` no ambiente `env-trilhashop`, lendo `db-connection` do Key Vault pela Managed Identity `id-trilhashop-api`. Registre no `decisoes.md` por que escolheu Container Apps, e não AKS/App Service.

`[CUSTO]` Container Apps tem camada gratuita mensal generosa; ACR Basic cobra por dia; **AKS cobra pelos nós (VMs)**; App Service `S1` cobra por hora. Apague o que não estiver usando.

## Erros comuns nesta fase

- Esquecer o role `AcrPull` (ImagePullBackOff).
- Deixar `min-replicas 1+` sem necessidade e pagar por contêiner parado.
- Gravar segredos na imagem ou em variável em texto puro.
- Criar AKS para um app simples que Container Apps resolveria.
- Esquecer que o plano do App Service cobra mesmo sem tráfego.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Container e imagem | Docker/Podman — trilha Linux, Módulo 20 |
| AKS | Kubernetes — trilha Linux, Módulo 23 |
| Managed Identity + ACR/Key Vault | Módulos 04 e 05 (já usados) |
| Scale to zero | Serverless — Módulo 12 |

## `[REFERÊNCIA]`

- Microsoft Learn — *App Service overview*: https://learn.microsoft.com/azure/app-service/overview
- Microsoft Learn — *Deployment slots*: https://learn.microsoft.com/azure/app-service/deploy-staging-slots
- Microsoft Learn — *Azure Container Apps*: https://learn.microsoft.com/azure/container-apps/overview
- Microsoft Learn — *Azure Container Registry*: https://learn.microsoft.com/azure/container-registry/container-registry-intro
- Microsoft Learn — *Choose an Azure container service*: https://learn.microsoft.com/azure/architecture/guide/choose-azure-container-service
- Docker — Dockerfile reference: https://docs.docker.com/reference/dockerfile/

**Como aprofundar:** leia o guia "Choose an Azure compute service" e refaça a decisão para três apps fictícios.

## Checklist de saída

- [ ] Explicar App Service Plan e a diferença entre plano e app.
- [ ] Explicar deployment slots e o swap sem downtime.
- [ ] Explicar por que container é mais leve que VM.
- [ ] Escolher entre ACI, Container Apps, App Service e AKS para cenários.
- [ ] Construir uma imagem com `az acr build`.
- [ ] Implantar uma API em Container Apps com Managed Identity.
