---
id: "15_monitoramento_e_resiliencia"
title: "Módulo 15 — Monitoramento e Resiliência"
sidebar_label: "15 · Monitoramento e Resiliência"
sidebar_position: 15
---

# Módulo 15 — Monitoramento e Resiliência

> **Objetivo**: enxergar o que acontece nos recursos — métricas, logs, alertas, Application Insights, Advisor, Service Health —, entender backup/DR (RPO/RTO) e SLAs, e criar o alerta e o dashboard da API do TrilhaShop.
>
> **Pré-requisitos**: módulos 08 a 12 (recursos para monitorar).
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre **Monitor and maintain Azure resources** (AZ-104) e **Describe management and governance → monitoramento** (AZ-900). Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104

---

## O painel do carro

Um carro sem painel só avisa que quebrou quando para de andar. Com painel você vê temperatura, combustível e luzes de alerta **antes** da pane. **Monitoramento** é o painel da sua infraestrutura; **resiliência** é a capacidade de continuar (ou voltar rápido) depois de uma falha.

## Azure Monitor: métricas e logs

O **Azure Monitor** é a plataforma central. Ele trabalha com dois tipos de dado, e saber distingui-los é a base de tudo:

| | Métricas | Logs |
|---|---|---|
| O que são | Números ao longo do tempo (CPU %, requisições/s) | Registros de eventos, textuais/estruturados |
| Latência | Quase em tempo real | Minutos |
| Armazenamento | Banco de séries temporais leve | **Log Analytics workspace** |
| Consulta | Metrics Explorer | **KQL** |
| Uso | Alertas rápidos, autoscale | Diagnóstico, auditoria, investigação |

> `[ATENÇÃO]` Métricas de plataforma já existem sem configurar nada. Já os **logs de recurso** exigem uma **diagnostic setting** que envie os dados ao workspace — sem ela, o workspace fica vazio e o KQL não acha nada.

```bash
RG=rg-trilhashop-dev
az monitor log-analytics workspace create -g $RG -n law-trilhashop -l brazilsouth
LAW=$(az monitor log-analytics workspace show -g $RG -n law-trilhashop --query id -o tsv)

# Enviar logs e métricas de um recurso ao workspace
az monitor diagnostic-settings create --name enviar-ao-law \
  --resource $(az keyvault show -n $KV --query id -o tsv) \
  --workspace $LAW --logs '[{"categoryGroup":"audit","enabled":true}]' --metrics '[{"category":"AllMetrics","enabled":true}]'

# Métricas pela CLI
az monitor metrics list --resource <id-da-vm> --metric "Percentage CPU" --interval PT5M --aggregation Average -o table
az monitor metrics list-definitions --resource <id-da-vm> -o table
```

## KQL: a linguagem dos logs

O **Kusto Query Language** lê como um pipe do Linux: uma tabela entra e cada `|` a transforma.

```kusto
// Erros HTTP 5xx da API por hora, últimas 24h
AppRequests
| where TimeGenerated > ago(24h) and ResultCode startswith "5"
| summarize erros = count() by bin(TimeGenerated, 1h)
| order by TimeGenerated asc
```

```bash
az monitor log-analytics query -w $(az monitor log-analytics workspace show -g $RG -n law-trilhashop --query customerId -o tsv) \
  --analytics-query "AzureActivity | where TimeGenerated > ago(1d) | summarize count() by OperationNameValue | top 10 by count_" -o table
```

> `[TENTE VOCÊ]` Reescreva a consulta para contar requisições por `ResultCode` nas últimas 6 horas. Resposta: `AppRequests | where TimeGenerated > ago(6h) | summarize count() by ResultCode`.

![Log Analytics com uma consulta KQL e o gráfico de resultado em barras](screenshots/15-monitoramento-e-resiliencia/01-kql-log-analytics.png)
> `[PRINT]` Passo a passo para capturar: portal → Log Analytics workspace → Logs. Executar a consulta `AzureActivity | summarize count() by OperationNameValue` e capturar o resultado.

## Application Insights

O **Application Insights** (parte do Azure Monitor) monitora a **aplicação**: tempo de resposta, taxa de falha, dependências (banco, API externa), rastreamento distribuído e exceções, a partir de um SDK ou agente (inclusive OpenTelemetry).

```bash
az extension add --name application-insights
az monitor app-insights component create -g $RG -a ai-trilhashop -l brazilsouth \
  --workspace $LAW --kind web
az monitor app-insights component show -g $RG -a ai-trilhashop --query connectionString -o tsv
```

A *connection string* vai como variável de ambiente (`APPLICATIONINSIGHTS_CONNECTION_STRING`) na API.

## Alertas e grupos de ação

Um **alerta** tem três partes: uma **condição** (a métrica/consulta passou do limite), um **escopo** (o recurso) e um **action group** (quem avisar e como).

```bash
az monitor action-group create -g $RG -n ag-equipe --short-name equipe \
  --action email dono voce@exemplo.com

az monitor metrics alert create -g $RG -n alerta-cpu-alta \
  --scopes $(az vmss show -g $RG -n vmss-api --query id -o tsv) \
  --condition "avg Percentage CPU > 80" --window-size 5m --evaluation-frequency 1m \
  --action ag-equipe --severity 2 --description "CPU da API acima de 80%"
az monitor metrics alert list -g $RG -o table
```

> `[ATENÇÃO]` Alerta demais vira ruído, e o time passa a ignorar todos. Alerte em **sintomas que exigem ação** (erro alto, latência alta, serviço fora), e não em toda oscilação.

## Advisor e Service Health

- **Azure Advisor**: recomendações de **confiabilidade, segurança, desempenho, custo e excelência operacional** para os seus recursos: `az advisor recommendation list -o table`.
- **Service Health**: avisa de incidentes do *próprio Azure* que afetam seus recursos e de manutenções planejadas (e dá para criar alertas sobre eles).
- **Resource Health**: estado de saúde de **um** recurso específico.

## Resiliência: RPO, RTO e SLA

| Termo | Pergunta | Exemplo |
|---|---|---|
| **RPO** (Recovery Point Objective) | Quantos dados posso perder? | Backup a cada hora → RPO 1 h |
| **RTO** (Recovery Time Objective) | Quanto tempo posso ficar fora? | Subir tudo em 30 min → RTO 30 min |
| **SLA** | Disponibilidade prometida pelo serviço | 99,95% ≈ 4,4 h de indisponibilidade/ano |

**SLAs compostos**: ao encadear serviços **em série**, as disponibilidades se **multiplicam** (99,95% × 99,9% ≈ 99,85%) e o total fica **menor** que o menor deles; redundância **em paralelo** a aumenta. Por isso resiliência se projeta em camadas: zonas (Módulo 02/08), regiões, backup (Módulo 08/11) e Site Recovery.

> `[TEORIA]` Prova: Backup protege contra perda/corrupção de **dados**; Site Recovery mantém a **aplicação rodando** em outra região (DR). Quanto menor o RPO/RTO desejado, mais caro o desenho.

## Práticas

### Prática isolada

1. Crie um Log Analytics workspace e uma diagnostic setting do Key Vault (ou Storage) para ele.
2. Gere atividade (leia segredos, crie/apague um recurso) e consulte `AzureActivity` e `AzureDiagnostics` em KQL.
3. Crie um alerta de métrica e um action group com seu e-mail; force o disparo com carga: `stress-ng --cpu 2 --timeout 600` na VM.
4. Rode `az advisor recommendation list` e escolha uma recomendação para aplicar.

**Limpeza:** apague o RG do lab (workspace e Application Insights cobram por ingestão).

### Contribuição ao projeto integrador

Observabilidade do TrilhaShop: workspace `law-trilhashop`, Application Insights ligado à API, diagnostic settings dos recursos principais, um alerta de **CPU > 80%** e outro de **falhas 5xx** para o `ag-equipe`, e um **dashboard** no portal com CPU, requisições e erros. Registre no `decisoes.md` o RPO/RTO alvo do TrilhaShop e quais recursos têm backup.

`[CUSTO]` O Log Analytics cobra por **GB ingerido** (com camada gratuita mensal): defina uma *retenção curta* e um *daily cap* em laboratório. Alertas de métrica custam poucos centavos cada.

## Erros comuns nesta fase

- Esquecer a diagnostic setting e achar que "o Azure não loga".
- Ingerir tudo sem limite e ser surpreendido pela fatura de logs.
- Alertar em tudo (fadiga de alerta) e sem action group.
- Confundir backup com DR.
- Calcular SLA ignorando que dependências em série reduzem a disponibilidade.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Diagnostic settings, Log Analytics | Segurança (Defender, Sentinel) — Módulo 05 |
| Métricas e autoscale | VMSS — Módulo 08 |
| Observabilidade em outras stacks | Prometheus/Grafana — trilha Linux, Módulo 24 |
| SLO/SLI, incidentes | SRE — trilha Linux, Módulo 25 |
| Custo de ingestão | Custos — Módulo 16 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Azure Monitor overview*: https://learn.microsoft.com/azure/azure-monitor/overview
- Microsoft Learn — *Log Analytics tutorial*: https://learn.microsoft.com/azure/azure-monitor/logs/log-analytics-tutorial
- Microsoft Learn — *Kusto Query Language*: https://learn.microsoft.com/azure/data-explorer/kusto/query/
- Microsoft Learn — *Application Insights*: https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview
- Microsoft Learn — *Alerts*: https://learn.microsoft.com/azure/azure-monitor/alerts/alerts-overview
- Microsoft Learn — *Azure Advisor*: https://learn.microsoft.com/azure/advisor/advisor-overview
- Microsoft Learn — *Reliability pillar*: https://learn.microsoft.com/azure/well-architected/reliability/

**Como aprofundar:** o site *Kusto Detective Agency* (https://detective.kusto.io/) ensina KQL como jogo.

## Checklist de saída

- [ ] Diferenciar métricas de logs e dizer onde cada um vive.
- [ ] Explicar a diagnostic setting e por que ela é necessária.
- [ ] Escrever e executar uma consulta KQL simples.
- [ ] Criar um action group e um alerta de métrica.
- [ ] Diferenciar Advisor, Service Health e Resource Health.
- [ ] Explicar RPO, RTO, SLA e a composição de SLAs.
- [ ] Diferenciar Backup de Site Recovery.
- [ ] Ter montado alertas e dashboard do TrilhaShop.
