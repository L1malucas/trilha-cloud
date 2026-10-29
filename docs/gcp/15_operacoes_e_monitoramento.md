---
id: "15_operacoes_e_monitoramento"
title: "Módulo 15 — Operações e Monitoramento"
sidebar_label: "15 · Operações e Monitoramento"
sidebar_position: 15
---

# Módulo 15 — Operações e Monitoramento

> **Objetivo**: enxergar o que acontece nos recursos — Cloud Monitoring, Cloud Logging, Error Reporting, Trace, Audit Logs —, criar alertas e dashboards, definir SLIs/SLOs e entender resiliência (RPO/RTO) para a API do TrilhaShop.
>
> **Pré-requisitos**: módulos 08 a 12 (recursos para monitorar).
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre "Ensuring successful operation of a cloud solution" do **Associate Cloud Engineer** e operações do **Cloud Digital Leader**. Referência: https://cloud.google.com/products/operations

---

## O painel do carro (e o diário de bordo)

Um carro sem painel só avisa que quebrou quando para. **Monitoramento** é o painel (como está agora); **logs** são o diário de bordo (o que aconteceu). O Google reúne isso na suíte **Cloud Operations** (antiga Stackdriver):

| Serviço | Responde | Dado |
|---|---|---|
| **Cloud Monitoring** | "Como está? Algo está errado?" | **Métricas** (CPU, latência, requisições), dashboards, alertas |
| **Cloud Logging** | "O que aconteceu?" | **Logs** de recursos e aplicações |
| **Error Reporting** | "Que exceções estão ocorrendo?" | Agrupa erros dos logs |
| **Cloud Trace** | "Onde está a lentidão?" | Latência por requisição entre serviços |
| **Cloud Profiler** | "Qual função consome CPU?" | Perfil contínuo de código |
| **Audit Logs** | "Quem fez o quê?" | Registro de ações de administração e acesso |

> `[TEORIA]` Fluxo de investigação: **alerta** (métrica) → **dashboard** (qual serviço, desde quando) → **trace** (qual chamada lenta) → **log** (a mensagem exata). Cada sinal leva ao próximo (aprofundado no Módulo 24 da trilha Linux).

## Cloud Logging

A maioria dos serviços do GCP envia **logs automaticamente** (Cloud Run, GKE, Functions, Load Balancer). Em VMs, é o **Ops Agent** que coleta logs e métricas detalhadas. Os logs vão para **log buckets**, com retenção configurável (padrão de 30 dias para `_Default`).

```bash
gcloud logging read 'resource.type="cloud_run_revision" AND severity>=ERROR' --limit=10 \
  --format="table(timestamp,severity,textPayload)"
gcloud logging read 'resource.type="gce_instance" AND resource.labels.instance_id="123"' --freshness=1h
gcloud logging read 'protoPayload.methodName="v1.compute.instances.delete"' --limit=5 \
  --format="table(timestamp,protoPayload.authenticationInfo.principalEmail,protoPayload.resourceName)"
```

A linguagem de consulta lê como filtros combináveis: `resource.type`, `severity`, `jsonPayload.campo`, `timestamp`. **Logs estruturados em JSON** (`{"severity":"ERROR","message":"timeout","order_id":"p-1"}`) são muito mais fáceis de filtrar.

### Sinks: exportar logs

Um **sink** exporta logs (filtrados) para **BigQuery** (análise), **Cloud Storage** (arquivo/retenção longa) ou **Pub/Sub** (integração):

```bash
gcloud logging sinks create sink-erros-bq \
  bigquery.googleapis.com/projects/$PROJETO/datasets/logs \
  --log-filter='severity>=ERROR'
# conceda ao writerIdentity do sink o role de escrita no destino (BigQuery Data Editor)
gcloud logging sinks describe sink-erros-bq --format="value(writerIdentity)"
```

**Log-based metrics** transformam logs em métricas (ex.: contar "pagamento recusado") para alertar:

```bash
gcloud logging metrics create pagamentos_recusados \
  --description="Pagamentos recusados" --log-filter='jsonPayload.evento="pagamento_recusado"'
```

> `[ATENÇÃO]` **Audit Logs**: *Admin Activity* (mudanças de configuração) vem **ligado e gratuito**; *Data Access* (leitura de dados) vem **desligado por padrão** na maioria dos serviços (gera volume e custo). Ligue-o onde há dado sensível. Ingestão de logs acima da cota gratuita **cobra**: use filtros de exclusão para ruído.

![Logs Explorer com uma consulta filtrando severity>=ERROR do Cloud Run e a lista de entradas de log](screenshots/15-operacoes-e-monitoramento/01-logs-explorer-erros.png)
> `[PRINT]` Passo a passo para capturar: Console → Logging → Logs Explorer. Aplicar o filtro de erros do Cloud Run e capturar o resultado.

## Cloud Monitoring: métricas, dashboards e alertas

As métricas dos serviços já existem sem configurar (ex.: `run.googleapis.com/request_count`, `compute.googleapis.com/instance/cpu/utilization`). Você as consulta no **Metrics Explorer** (linguagem **MQL/PromQL**) e monta **dashboards**.

Um **alerta** tem: uma **condição** (a métrica passou do limite por X minutos), um **canal de notificação** (e-mail, Slack, PagerDuty, SMS, Pub/Sub) e documentação:

```bash
gcloud services enable monitoring.googleapis.com

# Canal de notificação por e-mail
gcloud beta monitoring channels create --display-name="Equipe" --type=email \
  --channel-labels=email_address=voce@exemplo.com

# Política de alerta: CPU > 80% por 5 minutos em instâncias do MIG
cat > alerta-cpu.json <<'EOF'
{
  "displayName": "CPU alta - API",
  "combiner": "OR",
  "conditions": [{
    "displayName": "CPU > 80% por 5 min",
    "conditionThreshold": {
      "filter": "resource.type=\"gce_instance\" AND metric.type=\"compute.googleapis.com/instance/cpu/utilization\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 0.8,
      "duration": "300s",
      "aggregations": [{"alignmentPeriod": "60s", "perSeriesAligner": "ALIGN_MEAN"}]
    }
  }]
}
EOF
gcloud alpha monitoring policies create --policy-from-file=alerta-cpu.json \
  --notification-channels=<ID-DO-CANAL>
gcloud alpha monitoring policies list --format="table(displayName,enabled)"
```

(Os subcomandos `alpha/beta` de monitoring mudam: confira https://cloud.google.com/monitoring/alerts. Pelo Console, a criação é guiada.)

> `[ATENÇÃO]` Alerta demais vira ruído e o time passa a ignorar todos. Alerte em **sintomas que exigem ação** (erro alto, latência alta, serviço fora) e use **duração** para evitar falsos positivos.

**Uptime checks** testam de fora se seu endpoint responde e alertam se cair:

```bash
gcloud monitoring uptime create api-saude --resource-type=uptime-url \
  --resource-labels=host=<IP-OU-DOMINIO>,project_id=$PROJETO --path=/saude --period=1
```

## SLI, SLO e error budget

- **SLI**: medida do que o usuário sente (ex.: % de requisições bem-sucedidas em < 500 ms).
- **SLO**: a meta (ex.: 99,5% em 30 dias).
- **Error budget**: o quanto pode falhar (0,5% ≈ 3 h 36 min por mês). Sobrando, arrisque mudanças; esgotado, congele e foque em estabilidade.

O Cloud Monitoring tem **Service Monitoring** para definir SLOs sobre serviços (Cloud Run, GKE) e alertar na **queima do orçamento** (*burn rate*). Detalhes de SRE na trilha Linux (Módulos 24 e 25).

## Resiliência: RPO, RTO e SLA

| Termo | Pergunta | Exemplo |
|---|---|---|
| **RPO** | Quantos dados posso perder? | Backup a cada hora → RPO 1 h |
| **RTO** | Quanto tempo posso ficar fora? | Subir em 30 min → RTO 30 min |
| **SLA** | Disponibilidade prometida pelo serviço | 99,95% ≈ 4,4 h/ano |

Recursos do GCP para cada camada de falha: **zonas** (MIG regional, Cloud SQL HA — Módulos 08 e 12), **regiões** (réplicas entre regiões, multirregião do Storage/BigQuery), **backups e snapshots** testados e **DR** documentado. Ao encadear serviços **em série**, as disponibilidades se **multiplicam** (o total fica menor que o menor deles).

## Operação do dia a dia

```bash
gcloud compute instances list --filter="status!=RUNNING"             # o que está parado
gcloud recommender recommendations list --recommender=google.compute.instance.MachineTypeRecommender \
  --project=$PROJETO --location=southamerica-east1-a                 # right-sizing sugerido
gcloud compute operations list --limit=5                             # operações recentes
gcloud logging read 'severity>=WARNING' --freshness=1d --limit=20
```

O **Active Assist/Recommender** sugere melhorias (VMs superdimensionadas, IAM excessivo, projetos ociosos) — ótimo para custo e segurança.

## Práticas

### Prática isolada

1. No Logs Explorer, filtre erros do Cloud Run das últimas 24 h; depois escreva o mesmo filtro com `gcloud logging read`.
2. Crie uma **log-based metric** e um **alerta** sobre ela (ou sobre CPU) com um canal de e-mail; force o disparo (`stress-ng` na VM, ou gere erros na API).
3. Crie um **uptime check** do `/saude` da API e derrube o serviço para ver o alerta.
4. Crie um **sink** de logs de erro para o BigQuery e consulte-os em SQL.
5. Escreva o RPO/RTO desejados do TrilhaShop e onde cada um é atendido.

**Limpeza:** apague alertas, canais, sinks, uptime checks e datasets de logs.

### Contribuição ao projeto integrador

Observabilidade do TrilhaShop: dashboard com requisições, latência p95, erros e CPU do Cloud Run/MIG; alerta de **erros 5xx** e de **CPU > 80%** para um canal de e-mail; uptime check no `/saude`; sink de erros para o BigQuery; e um **SLO** (99,5% de disponibilidade em 30 dias) com política de queima de orçamento. Registre no `decisoes.md` o RPO/RTO alvo e como cada componente os cumpre.

`[CUSTO]` Logging cobra **ingestão** acima da cota gratuita mensal; defina **exclusões** e retenção curta em laboratório. Monitoring cobra por métricas customizadas e chamadas de API acima da cota.

## Erros comuns nesta fase

- Achar que "o Google já loga tudo" (Data Access Logs vêm desligados).
- Ingerir tudo sem filtros e ser surpreendido pela fatura de logs.
- Alertas sem canal de notificação, ou excessivos (fadiga de alerta).
- Esquecer de conceder ao writer identity do sink permissão no destino.
- Calcular SLA ignorando dependências em série.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Logs no BigQuery | Dados e analytics — Módulo 13 |
| Custo de ingestão | Custos — Módulo 16 |
| SLO, SRE, Prometheus/Grafana | Trilha Linux, Módulos 24 e 25 |
| Azure Monitor | Azure, Módulo 15 |

## `[REFERÊNCIA]`

- Google Cloud — *Operations suite*: https://cloud.google.com/products/operations
- Google Cloud — *Cloud Logging*: https://cloud.google.com/logging/docs
- Google Cloud — *Cloud Monitoring*: https://cloud.google.com/monitoring/docs
- Google Cloud — *Alerting*: https://cloud.google.com/monitoring/alerts
- Google Cloud — *Audit logging*: https://cloud.google.com/logging/docs/audit
- Google Cloud — *Service monitoring (SLOs)*: https://cloud.google.com/stackdriver/docs/solutions/slo-monitoring
- Google — *SRE books*: https://sre.google/books/

**Como aprofundar:** leia o capítulo de SLOs do *SRE Workbook* e a documentação de *Managed Service for Prometheus* para quem usa GKE.

## Checklist de saída

- [ ] Diferenciar métricas, logs, traces e audit logs e o serviço de cada um.
- [ ] Consultar logs com `gcloud logging read` e criar sinks e log-based metrics.
- [ ] Criar um alerta com condição, duração e canal de notificação.
- [ ] Explicar por que Data Access Logs devem ser ligados com critério.
- [ ] Definir SLI, SLO e error budget.
- [ ] Explicar RPO, RTO e SLA e a composição de SLAs.
- [ ] Ter montado dashboard, alertas e SLO do TrilhaShop.
