---
id: "10_serverless_e_aplicacoes"
title: "Módulo 10 — Serverless e Aplicações"
sidebar_label: "10 · Serverless e Aplicações"
sidebar_position: 10
---

# Módulo 10 — Serverless e Aplicações

> **Objetivo**: entender o modelo orientado a eventos do GCP — Cloud Run, Cloud Functions, App Engine, Pub/Sub, Eventarc e Cloud Tasks — e processar os pedidos do TrilhaShop com uma função acionada por mensagem.
>
> **Pré-requisitos**: módulos 04 e 09 (SA, Cloud Run).
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre serverless e mensageria do **Associate Cloud Engineer** e "Modernize infrastructure and applications" do **Cloud Digital Leader**. Referência: https://cloud.google.com/serverless

---

## Táxi em vez de carro próprio

Ter um carro significa pagar seguro e garagem mesmo parado; o táxi cobra só pela corrida. **Serverless** é o táxi: há servidores, claro, mas você não os vê nem administra — entrega código (ou um container) e o Google executa **quando algo acontece**, escala sozinho (até zero) e cobra **por uso**. O custo: cold start, limites de tempo e um desenho orientado a eventos, **sem estado local**.

## As opções de serverless no GCP

| Serviço | O que roda | Disparo | Use quando |
|---|---|---|---|
| **Cloud Run** | Container (qualquer linguagem) | HTTP, eventos, jobs | APIs e serviços; o padrão atual |
| **Cloud Run functions** (antes Cloud Functions) | Função em uma linguagem suportada | HTTP ou evento | Lógica pequena e reativa |
| **App Engine** | Aplicação web (Standard/Flexible) | HTTP | Apps web clássicos, legado |
| **Cloud Run jobs** | Tarefa em lote até concluir | Agendado/manual | Batch, migrações |

> `[TEORIA]` O próprio Google recomenda **Cloud Run** como a plataforma serverless principal; as **functions de 2ª geração** são construídas sobre ele. Na prova, relacione: "função disparada por evento" → Functions; "container sem servidor" → Cloud Run; "app web com runtime gerenciado" → App Engine.

## Cloud Run functions (2ª geração)

Uma função é um trecho de código com um **trigger** (HTTP ou evento). Exemplo em Python, acionada por mensagem do Pub/Sub:

```python
# main.py
import base64, json
import functions_framework

@functions_framework.cloud_event
def processa_pedido(cloud_event):
    dados = base64.b64decode(cloud_event.data["message"]["data"]).decode()
    pedido = json.loads(dados)
    print(f"Pedido recebido: {pedido['id']}")     # vai para o Cloud Logging
```

```bash
PROJETO=$(gcloud config get project); REGIAO=southamerica-east1
gcloud services enable cloudfunctions.googleapis.com eventarc.googleapis.com pubsub.googleapis.com run.googleapis.com

echo "functions-framework" > requirements.txt
gcloud functions deploy processa-pedido --gen2 --runtime=python312 --region=$REGIAO \
  --source=. --entry-point=processa_pedido \
  --trigger-topic=pedidos \
  --service-account=sa-trilhashop-api@$PROJETO.iam.gserviceaccount.com
gcloud functions describe processa-pedido --gen2 --region=$REGIAO --format="value(state)"
gcloud functions logs read processa-pedido --gen2 --region=$REGIAO --limit=10
```

> `[ATENÇÃO]` Funções devem ser **sem estado** e **idempotentes**: a mesma mensagem pode ser entregue mais de uma vez (entrega *at-least-once*). Processar duas vezes não pode cobrar duas vezes o cliente.

## Pub/Sub: mensageria assíncrona

O **Pub/Sub** desacopla quem **produz** de quem **consome**: o produtor publica numa **topic**; cada **subscription** recebe sua própria cópia das mensagens. É global, escalável e garante entrega **pelo menos uma vez**.

```
Publisher → [Topic "pedidos"] ─┬→ Subscription "worker" → Function/serviço
                               └→ Subscription "auditoria" → BigQuery
```

Tipos de subscription: **pull** (o consumidor busca), **push** (o Pub/Sub chama uma URL HTTPS) e **BigQuery/Cloud Storage** (grava direto).

```bash
gcloud pubsub topics create pedidos
gcloud pubsub subscriptions create pedidos-worker --topic=pedidos \
  --ack-deadline=30 --message-retention-duration=1d \
  --dead-letter-topic=pedidos-dlq --max-delivery-attempts=5          # mensagens que falham 5x vão para a DLQ
gcloud pubsub topics create pedidos-dlq
gcloud pubsub subscriptions create pedidos-dlq-sub --topic=pedidos-dlq

gcloud pubsub topics publish pedidos --message='{"id":"p-001","total":59.9}'
gcloud pubsub subscriptions pull pedidos-worker --limit=1 --auto-ack      # para testar manualmente
gcloud pubsub topics list; gcloud pubsub subscriptions list
```

Conceitos para a prova: **ack** (confirmação — sem ele a mensagem é reenviada após o *ack deadline*), **dead-letter topic** (guarda o que falha repetidamente, para análise), **ordenação** por chave (`--enable-message-ordering`), **retenção**. Pub/Sub x fila simples: Pub/Sub é **publish-subscribe** global; para tarefas com controle de taxa e agendamento, use **Cloud Tasks**.

> `[ATENÇÃO]` Sem **dead-letter**, uma mensagem "venenosa" (que sempre falha) fica reentregue indefinidamente. Defina `max-delivery-attempts` e uma DLQ desde o início.

## Eventarc: reagir a eventos do Google Cloud

O **Eventarc** entrega **eventos de serviços do GCP** (arquivo criado no Cloud Storage, VM criada, logs de auditoria) a destinos como Cloud Run e functions.

```bash
gcloud eventarc triggers create novo-arquivo --location=$REGIAO \
  --destination-run-service=trilhashop-api --destination-run-region=$REGIAO \
  --event-filters="type=google.cloud.storage.object.v1.finalized" \
  --event-filters="bucket=<BUCKET>" \
  --service-account=sa-trilhashop-api@$PROJETO.iam.gserviceaccount.com
```

## Cloud Tasks e Cloud Scheduler

- **Cloud Tasks**: fila de **tarefas HTTP** com controle de taxa, retentativas e agendamento (ex.: enviar e-mail depois de 10 minutos).
- **Cloud Scheduler**: **cron gerenciado** que dispara HTTP, Pub/Sub ou Cloud Run.

```bash
gcloud scheduler jobs create pubsub relatorio-diario --location=$REGIAO \
  --schedule="0 6 * * *" --time-zone="America/Sao_Paulo" \
  --topic=pedidos --message-body='{"tipo":"relatorio"}'
```

## App Engine, em uma olhada

O **App Engine Standard** roda seu código em um runtime gerenciado (Python, Node, Java, Go...), escala a zero e exige pouca configuração (`app.yaml`). O **Flexible** roda containers em VMs gerenciadas. Hoje, para projetos novos, o Cloud Run costuma ser a escolha; o App Engine aparece em provas e sistemas existentes.

```bash
# app.yaml mínimo
# runtime: python312
gcloud app create --region=southamerica-east1       # uma vez por projeto, região definitiva!
gcloud app deploy app.yaml --quiet
gcloud app browse
```

> `[ATENÇÃO]` A região do App Engine é **definida uma vez por projeto e não pode ser alterada**. Escolha com cuidado (e prefira Cloud Run para novos projetos).

![Console do Pub/Sub mostrando a topic pedidos com suas subscriptions e a função processa-pedido recebendo mensagens](screenshots/10-serverless-e-aplicacoes/01-pubsub-topic-subscriptions.png)
> `[PRINT]` Passo a passo para capturar: Console → Pub/Sub → Tópicos → `pedidos`. Capturar a aba de assinaturas e o gráfico de mensagens.

## Práticas

### Prática isolada

1. Crie a topic `pedidos` e a subscription com **dead-letter**; publique 3 mensagens e leia com `pull`.
2. Implante a função `processa-pedido` com trigger na topic, publique uma mensagem e veja o log (`gcloud functions logs read`).
3. Publique uma mensagem inválida e observe as tentativas e o envio à DLQ.
4. Crie um job do Cloud Scheduler que publique uma mensagem a cada minuto e acompanhe.

**Limpeza:** apague jobs, functions, subscriptions e topics.

### Contribuição ao projeto integrador

Construa o fluxo de pedidos do TrilhaShop: a API (Cloud Run) **publica** em `pedidos`; a função `processa-pedido` **consome**, grava no banco (Módulo 12) usando a SA e o segredo do Secret Manager, e registra em log. Defina a DLQ e `max-delivery-attempts`. No `decisoes.md`, explique por que usou Pub/Sub (e não chamada HTTP direta) e como garante **idempotência**.

`[CUSTO]` Cloud Run/Functions têm cotas gratuitas mensais; Pub/Sub tem os primeiros 10 GB/mês gratuitos; Cloud Scheduler tem jobs gratuitos por conta (confira os limites vigentes).

## Erros comuns nesta fase

- Função com estado local ou efeito colateral não idempotente.
- Mensagens venenosas sem DLQ.
- Esquecer de dar `roles/pubsub.publisher`/`subscriber` às SAs.
- Esperar que o Pub/Sub entregue **exatamente uma vez** e **em ordem** por padrão.
- Escolher a região do App Engine sem pensar (irreversível).

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Pub/Sub → BigQuery | Dados e analytics — Módulo 13 |
| Eventarc/Storage | Armazenamento — Módulo 11 |
| Logs de função | Monitoramento — Módulo 15 |
| Service Bus/Functions no Azure | Azure, Módulo 12 |
| Eventos e filas (teoria) | Trilha Linux, Módulo 22 |

## `[REFERÊNCIA]`

- Google Cloud — *Serverless*: https://cloud.google.com/serverless
- Google Cloud — *Cloud Run functions*: https://cloud.google.com/functions/docs/concepts/overview
- Google Cloud — *Pub/Sub overview*: https://cloud.google.com/pubsub/docs/overview
- Google Cloud — *Dead-letter topics*: https://cloud.google.com/pubsub/docs/dead-letter-topics
- Google Cloud — *Eventarc*: https://cloud.google.com/eventarc/docs
- Google Cloud — *Cloud Tasks*: https://cloud.google.com/tasks/docs · *Cloud Scheduler*: https://cloud.google.com/scheduler/docs
- Google Cloud — *App Engine*: https://cloud.google.com/appengine/docs

**Como aprofundar:** estude *Workflows* (orquestração de serviços) e os padrões de mensageria (fan-out, DLQ, idempotência) na documentação do Pub/Sub.

## Checklist de saída

- [ ] Escolher entre Cloud Run, Functions, App Engine e Cloud Run jobs.
- [ ] Explicar topic, subscription, ack e dead-letter no Pub/Sub.
- [ ] Explicar entrega *at-least-once* e a necessidade de idempotência.
- [ ] Implantar uma função acionada por Pub/Sub e ler seus logs.
- [ ] Diferenciar Pub/Sub, Eventarc, Cloud Tasks e Cloud Scheduler.
- [ ] Ter montado o fluxo de pedidos do TrilhaShop.
