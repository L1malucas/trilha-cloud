---
id: "12_computacao_serverless"
title: "Módulo 12 — Computação Serverless"
sidebar_label: "12 · Computação Serverless"
sidebar_position: 12
---

# Módulo 12 — Computação Serverless

> **Objetivo**: entender o modelo serverless e orientado a eventos do Azure — Functions, Logic Apps, Event Grid, Service Bus e Event Hubs — e processar os pedidos do TrilhaShop com uma Function acionada por fila.
>
> **Pré-requisitos**: módulos 04, 05 e 10 (Managed Identity, Key Vault, Storage Queue).
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre **Describe Azure compute and networking services → serverless** (AZ-900) e **Deploy and manage Azure compute resources** (AZ-104). Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900

---

## Táxi em vez de carro próprio

Ter um carro significa pagar seguro e garagem mesmo parado. O táxi cobra só pela corrida. **Serverless** é o táxi: há servidores, claro, mas você não os vê nem os administra — escreve a função, o Azure a executa **quando um evento acontece**, escala sozinho (inclusive até zero) e cobra **por execução e tempo**, não por hora ligada.

A vantagem é custo baixo para carga irregular e zero administração. O custo é: limite de tempo por execução, *cold start* (primeira chamada depois de ociosa demora mais) e desenho orientado a eventos.

## Azure Functions

Uma **Function App** hospeda funções. Cada função tem um **trigger** (o que a dispara) e, opcionalmente, **bindings** (entradas/saídas declarativas, sem código de conexão).

| Trigger | Dispara quando... |
|---|---|
| HTTP | alguém chama uma URL |
| Timer | por agenda (cron) |
| Queue / Service Bus | chega mensagem numa fila |
| Blob | um arquivo é criado |
| Event Grid | um evento é publicado |

**Planos de hospedagem:** *Consumption* (paga por execução, escala a zero), *Flex Consumption* (o sucessor recomendado, com mais controle), *Premium* (sem cold start, VNet) e *Dedicated* (num App Service Plan).

```bash
# Desenvolvimento local com o Core Tools (instale: npm i -g azure-functions-core-tools@4)
func init processa-pedidos --python
cd processa-pedidos
func new --name ProcessaPedido --template "Azure Queue Storage trigger"
func start
```

```bash
RG=rg-trilhashop-dev
az storage account create -g $RG -n stfunc$RANDOM -l brazilsouth --sku Standard_LRS
az functionapp create -g $RG -n func-trilhashop-$RANDOM \
  --storage-account <conta> --consumption-plan-location brazilsouth \
  --runtime python --runtime-version 3.12 --functions-version 4 --os-type Linux \
  --assign-identity '[system]'
func azure functionapp publish <nome-da-function-app>
az functionapp log deployment show -g $RG -n <nome-da-function-app>
```

Exemplo mínimo de função de fila em Python:

```python
import azure.functions as func
import logging

app = func.FunctionApp()

@app.queue_trigger(arg_name="msg", queue_name="pedidos", connection="AzureWebJobsStorage")
def processa_pedido(msg: func.QueueMessage):
    logging.info("Pedido recebido: %s", msg.get_body().decode())
```

> `[ATENÇÃO]` Funções devem ser **sem estado** e **idempotentes**: a mesma mensagem pode ser entregue mais de uma vez. Processar duas vezes não pode cobrar duas vezes o cliente.

> `[ATENÇÃO]` Os planos e comandos de criação mudam com frequência (Flex Consumption). Confira a referência atual em https://learn.microsoft.com/azure/azure-functions/functions-create-function-app-portal antes de rodar `functionapp create`.

![Function App no portal com a função ProcessaPedido listada e o trigger de fila](screenshots/12-computacao-serverless/01-function-app-funcoes.png)
> `[PRINT]` Passo a passo para capturar: portal → Function App → Functions. Capturar a função e seu trigger.

## Mensageria: Queue, Service Bus, Event Grid e Event Hubs

A pergunta-chave: *é uma ordem a ser executada, uma notificação de que algo aconteceu, ou um fluxo contínuo de dados?*

| Serviço | Padrão | Use para |
|---|---|---|
| **Storage Queue** | Fila simples e barata | Tarefas em segundo plano, volume alto, sem requisitos avançados |
| **Service Bus** | Fila/tópico empresarial (ordem, DLQ, transações, sessões) | Comandos críticos entre sistemas (pedido, pagamento) |
| **Event Grid** | Eventos reativos (publish-subscribe) | "Um blob foi criado" → disparar reação |
| **Event Hubs** | Ingestão de fluxo massivo | Telemetria, logs, streaming de milhões de eventos |

```bash
az servicebus namespace create -g $RG -n sb-trilhashop-$RANDOM -l brazilsouth --sku Standard
az servicebus queue create -g $RG --namespace-name <namespace> -n pedidos --max-delivery-count 5
az eventgrid topic create -g $RG -n evgt-trilhashop -l brazilsouth
az eventhubs namespace create -g $RG -n evh-trilhashop-$RANDOM -l brazilsouth --sku Standard
```

> `[TEORIA]` Fila (Service Bus/Queue) = *um* consumidor processa cada mensagem; Tópico = *vários* assinantes recebem cópia. A **dead-letter queue (DLQ)** guarda mensagens que falharam repetidas vezes, para análise, em vez de ficarem em loop.

## Logic Apps

**Logic Apps** é automação **low-code**: um fluxo visual "quando X acontecer, faça Y e Z" com centenas de conectores (e-mail, Teams, SQL, SAP). Use-o para integrar sistemas sem programar; Functions quando precisa de lógica em código.

## Práticas

### Prática isolada

1. Crie uma Storage Queue `pedidos` e uma Function com trigger de fila (`func new`), rode localmente com `func start`.
2. Envie uma mensagem pelo terminal e veja a função reagir:
   ```bash
   az storage message put --queue-name pedidos --content "pedido-001" --account-name <conta> --auth-mode login
   ```
3. Envie uma mensagem "venenosa" (a função lança exceção) e observe a fila `pedidos-poison`.
4. Publique no Azure e confirme a execução em `az functionapp log` / Application Insights.

**Limpeza:** apague o RG do lab.

### Contribuição ao projeto integrador

Crie o fluxo de pedidos: o front envia o pedido para a fila `pedidos` (Service Bus ou Storage Queue); a Function `ProcessaPedido` lê, grava no banco do Módulo 11 usando a **Managed Identity** e o segredo do Key Vault, e registra em log. Defina a DLQ/`max-delivery-count`. Registre a decisão Storage Queue × Service Bus no `decisoes.md`.

`[CUSTO]` O plano Consumption tem 1 milhão de execuções gratuitas por mês; Service Bus Standard cobra uma base mensal. Event Hubs e Premium cobram por hora — apague depois do lab.

## Erros comuns nesta fase

- Função com estado local ou efeito colateral não idempotente.
- Ignorar o cold start em rotas HTTP sensíveis a latência.
- Mensagens venenosas retentando para sempre sem DLQ.
- Usar Event Hubs onde uma fila simples resolveria.
- Colocar segredos em *app settings* sem Key Vault.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Triggers por evento | CI/CD e automação — trilha Linux, Módulo 22 |
| Application Insights | Monitoramento — Módulo 15 |
| Managed Identity | Módulos 04 e 05 |
| Scale to zero e custo | Custos — Módulo 16 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Azure Functions overview*: https://learn.microsoft.com/azure/azure-functions/functions-overview
- Microsoft Learn — *Functions hosting options*: https://learn.microsoft.com/azure/azure-functions/functions-scale
- Microsoft Learn — *Choose between messaging services*: https://learn.microsoft.com/azure/service-bus-messaging/compare-messaging-services
- Microsoft Learn — *Service Bus*: https://learn.microsoft.com/azure/service-bus-messaging/service-bus-messaging-overview
- Microsoft Learn — *Event Grid*: https://learn.microsoft.com/azure/event-grid/overview
- Microsoft Learn — *Logic Apps*: https://learn.microsoft.com/azure/logic-apps/logic-apps-overview

**Como aprofundar:** explore **Durable Functions** (fluxos com estado e orquestração) depois de dominar triggers simples.

## Checklist de saída

- [ ] Explicar serverless e as trocas (custo por execução x cold start).
- [ ] Explicar trigger e binding e dar três exemplos de trigger.
- [ ] Comparar Storage Queue, Service Bus, Event Grid e Event Hubs.
- [ ] Explicar idempotência e dead-letter queue.
- [ ] Rodar uma Function local e publicá-la no Azure.
- [ ] Ter montado o fluxo de pedidos do TrilhaShop.
