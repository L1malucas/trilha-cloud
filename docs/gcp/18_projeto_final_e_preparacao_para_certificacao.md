---
id: "18_projeto_final_e_preparacao_para_certificacao"
title: "Módulo 18 — Projeto final e preparação para certificação"
sidebar_label: "18 · Projeto final e certificação"
sidebar_position: 18
---

# Módulo 18 — Projeto final e preparação para certificação

> **Objetivo**: fechar a trilha — reconstruir o TrilhaShop completo no GCP a partir do código, revisar por seção do exame (Cloud Digital Leader e Associate Cloud Engineer), planejar o estudo final e desmontar tudo sem deixar custo para trás.
>
> **Pré-requisitos**: módulos 00 a 17.
>
> **Tempo de referência (não prazo)**: duas a três semanas.
>
> Provas: **Cloud Digital Leader** (https://cloud.google.com/learn/certification/cloud-digital-leader) e **Associate Cloud Engineer** (https://cloud.google.com/learn/certification/cloud-engineer). Confira sempre o *exam guide* vigente: as seções e os pesos mudam.

---

## O projeto final: do zero ao ambiente completo

Hora de provar que a trilha funcionou: reconstruir o TrilhaShop **do zero**, só a partir do seu repositório, sem clicar no Console.

### Arquitetura alvo

```
Internet
   │
Cloud CDN + Cloud Armor ─── Cloud Storage (site estático)
   │
Application LB global (lb-trilhashop)
   │
Cloud Run (API)  ── SA sa-trilhashop-api ──► Secret Manager (segredos)
   │            │
   │            └──► Pub/Sub (pedidos) ──► Cloud Run functions (processa pedido) ──► BigQuery (vendas)
   ▼
Cloud SQL PostgreSQL (IP privado, VPC)

Transversal: VPC + firewall + Cloud NAT · IAM/Org Policies/Labels · Cloud Logging/Monitoring + SLO · Budget
```

### Roteiro de reconstrução

1. `git clone` do seu repositório de estudo (scripts `provisiona.sh`/`limpa.sh`, módulos Terraform, `decisoes.md`).
2. `gcloud auth login`, `gcloud auth application-default login` e `gcloud config list` (projeto certo?).
3. Governança: projeto, labels, Org Policies (Módulo 03) e IAM com menor privilégio (Módulo 04).
4. Rede e segurança: VPC, sub-redes, firewall, Cloud NAT, Secret Manager (Módulos 04 e 05).
5. Dados: Cloud SQL privado, buckets (Módulos 11 e 12).
6. Aplicação: imagem no Artifact Registry, Cloud Run, balanceador e CDN (Módulos 06, 09 e 10).
7. Eventos: Pub/Sub → função → banco/BigQuery (Módulos 10 e 13).
8. Observabilidade e custo: dashboards, alertas, SLO e budget (Módulos 15 e 16).
9. **Prova de funcionamento**: `curl` no site e na API, um pedido de ponta a ponta, um alerta disparado de propósito e uma consulta de vendas no BigQuery.

```bash
cd infra && terraform init && terraform plan -var projeto=$(gcloud config get project)
terraform apply -var projeto=$(gcloud config get project)
./verifica.sh        # seus testes: curl no front e na API, leitura do segredo, publicação no Pub/Sub, etc.
```

### Critérios de aceite

- [ ] Tudo criado por código (Terraform/scripts); nada manual.
- [ ] Nenhum segredo no Git; tudo via Secret Manager + service account (sem chaves JSON).
- [ ] Cloud SQL **sem IP público**; buckets privados exceto o do site, com `public-access-prevention` onde cabe.
- [ ] Labels `projeto`/`ambiente` em 100% dos recursos (`gcloud asset search-all-resources` ou listagens filtradas).
- [ ] Alerta, uptime check e budget funcionando.
- [ ] Documentação: `decisoes.md` com escolhas, custo estimado e justificativas.

> `[ATENÇÃO]` Antes de apagar, **tire os prints** pendentes dos módulos: depois do `destroy`, não dá para recuperar.

## Preparação para as provas

### Cloud Digital Leader

Prova **conceitual**, para quem decide e conversa com negócio: o que é a nuvem, por que migrar e qual produto resolve qual problema.

| Seção do exame | Onde estudar na trilha |
|---|---|
| Transformação digital com Google Cloud | Módulos 01, 02 |
| Inovar com dados e Google Cloud | Módulos 12, 13 |
| Inovar com IA/ML | Módulo 17 |
| Modernizar infraestrutura e aplicações | Módulos 08, 09, 10, 14 |
| Confiança e segurança | Módulos 03, 04, 05 |
| Escalar com excelência operacional | Módulos 15, 16 |

### Associate Cloud Engineer (ACE)

Prova **prática/técnica**: configurar, implantar e operar no GCP, **com foco em `gcloud` e Console**.

| Seção do exame | Onde estudar na trilha |
|---|---|
| Configurando o ambiente de nuvem | Módulos 00, 03, 04, 16 |
| Planejando e configurando a solução | Módulos 02, 05, 08, 11, 12 |
| Implantando a solução | Módulos 06, 08, 09, 10, 14 |
| Garantindo o funcionamento | Módulos 07, 15 |
| Configurando acesso e segurança | Módulos 04, 05 |

### Plano de revisão (sugestão)

1. **Semana 1 — Diagnóstico:** releia os checklists de saída; marque o que não consegue responder sem consultar.
2. **Semana 2 — Lacunas:** refaça no terminal os laboratórios dos módulos fracos, com cronômetro; para o ACE, a fluência em `gcloud` conta.
3. **Semana 3 — Simulados:** o exame de amostra oficial e os cursos do Skills Boost; analise **cada erro** (conceito, comando ou leitura da pergunta).
4. **Semana 4 — Polimento:** revise as tabelas de decisão (balanceadores, bancos, containers, storage, IAM) e SLA/RPO/RTO.

> `[TEORIA]` Dicas de prova: leia **o fim** da pergunta primeiro (o que está sendo pedido); elimine opções que violam o **menor privilégio** ou a responsabilidade compartilhada; em cenários, a resposta costuma ser o **serviço gerenciado/serverless mais simples que atende** ao requisito; cuidado com palavras absolutas ("sempre", "nunca"). O ACE costuma cobrar o **comando/flag exato** ou a ordem de passos.

## Desmontagem completa

Ao encerrar, apague tudo e **confirme** que não sobrou nada cobrando:

```bash
terraform destroy -var projeto=$(gcloud config get project)      # se usou Terraform
./limpa.sh                                                       # scripts do Módulo 07

# Verificações de recursos órfãos
gcloud compute instances list; gcloud compute disks list
gcloud compute addresses list --filter="status=RESERVED"         # IPs reservados ociosos
gcloud sql instances list; gcloud container clusters list
gcloud run services list; gcloud storage buckets list
gcloud compute forwarding-rules list; gcloud compute routers list     # LB e NAT

# Opção mais radical e completa: apagar o projeto (30 dias para desfazer)
gcloud projects delete $(gcloud config get project)
```

> `[ATENÇÃO]` Apagar o **projeto** remove tudo, mas fica em *pending deletion* por 30 dias (dá para `undelete`). Confirme no dia seguinte em **Billing → Reports** se não há gasto residual; um custo restante aponta algo esquecido (frequentemente IP reservado, disco ou cluster).

`[CUSTO]` O custo desta fase é o do ambiente completo ligado: faça a prova de funcionamento em **uma única sessão** e desmonte logo em seguida.

## Erros comuns nesta fase

- Deixar recursos ligados "para depois" e descobrir na fatura.
- Estudar só decorando; a prova cobra cenários e decisão.
- Não praticar `gcloud` para o ACE.
- Não revisar o *exam guide* atualizado.
- Apagar o projeto antes de tirar os prints e anotar os aprendizados.

## `[REFERÊNCIA]`

- Google Cloud — *Cloud Digital Leader: exam guide*: https://cloud.google.com/learn/certification/guides/cloud-digital-leader
- Google Cloud — *Associate Cloud Engineer: exam guide*: https://cloud.google.com/learn/certification/guides/cloud-engineer
- Google Cloud Skills Boost — trilhas de preparação: https://www.cloudskillsboost.google/
- Google Cloud — *Architecture Framework*: https://cloud.google.com/architecture/framework
- Google Cloud — *Free Tier*: https://cloud.google.com/free
- Google Cloud — *Pricing Calculator*: https://cloud.google.com/products/calculator

**Próximos passos:** *Professional Cloud Architect*, *Professional Cloud DevOps Engineer*, *Professional Data Engineer*, ou a trilha Linux, que aprofunda Kubernetes, CI/CD e IaC.

## Checklist de saída

- [ ] Reconstruir o TrilhaShop a partir do repositório, sem Console.
- [ ] Passar nos critérios de aceite (segredos, banco privado, labels, alertas, budget).
- [ ] Ter revisado os checklists de todos os módulos.
- [ ] Ter feito o exame de amostra do Cloud Digital Leader e/ou do ACE.
- [ ] Ter desmontado o ambiente e confirmado que nada ficou cobrando.
