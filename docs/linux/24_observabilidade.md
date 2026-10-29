---
id: "24_observabilidade"
title: "Módulo 24 — Observabilidade"
sidebar_label: "24 · Observabilidade"
sidebar_position: 24
---

# Módulo 24 — Observabilidade

> **Objetivo**: enxergar o comportamento de sistemas em produção pelos três pilares — **métricas**, **logs** e **traces** — com Prometheus, Grafana, Loki e OpenTelemetry, criar dashboards e alertas, e definir SLIs/SLOs.
>
> **Pré-requisitos**: módulos 12, 20 e 23 (logs, Compose, Kubernetes).
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Base de SRE e dos serviços de monitoramento em nuvem (Azure Monitor, Módulo 15; Cloud Monitoring, GCP). Documentação: https://prometheus.io/docs/ · https://grafana.com/docs/

---

## Monitoramento x observabilidade

**Monitoramento** responde a perguntas que você **já previu** ("a CPU passou de 80%?"). **Observabilidade** é a capacidade de responder a perguntas que você **não previu** ("por que só os usuários do Brasil têm erro 500 nas segundas?") a partir do que o sistema emite. Para isso, ele precisa produzir três tipos de sinal:

| Pilar | O que é | Pergunta que responde | Ferramentas |
|---|---|---|---|
| **Métricas** | Números agregados no tempo (req/s, latência, CPU) | *Algo está errado? Quanto?* | Prometheus + Grafana |
| **Logs** | Registros de eventos discretos | *O que aconteceu naquele momento?* | Loki, ELK/Elastic, Fluent Bit |
| **Traces** | O caminho de **uma requisição** entre serviços | *Onde está a lentidão/erro?* | Jaeger, Tempo, OpenTelemetry |

> `[TEORIA]` Fluxo típico de investigação: **alerta** (métrica) → **dashboard** (qual serviço, desde quando) → **traces** (qual chamada lenta) → **logs** (a mensagem exata do erro). Cada pilar leva ao próximo.

## Métricas com Prometheus

O **Prometheus** é um banco de séries temporais que **coleta (*scrape*) métricas por HTTP** dos alvos, a cada N segundos (modelo *pull*). Cada alvo expõe `/metrics` em texto:

```
http_requests_total{metodo="GET",status="200"} 1027
```

Tipos de métrica: **Counter** (só cresce: requisições), **Gauge** (sobe e desce: memória), **Histogram** (distribuição: latências em faixas).

Subindo a stack de laboratório com Docker Compose (Módulo 20):

```bash
mkdir -p ~/lab/obs && cd ~/lab/obs
cat > prometheus.yml <<'EOF'
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: prometheus
    static_configs: [{ targets: ["prometheus:9090"] }]
  - job_name: node
    static_configs: [{ targets: ["node-exporter:9100"] }]
EOF

cat > compose.yaml <<'EOF'
services:
  prometheus:
    image: prom/prometheus:latest
    volumes: ["./prometheus.yml:/etc/prometheus/prometheus.yml:ro"]
    ports: ["9090:9090"]
  node-exporter:
    image: prom/node-exporter:latest
    ports: ["9100:9100"]
  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    environment:
      GF_SECURITY_ADMIN_PASSWORD: lab-troque
    volumes: [grafana:/var/lib/grafana]
volumes:
  grafana:
EOF
docker compose up -d
curl -s localhost:9100/metrics | head
```

Abra `http://localhost:9090` e consulte com **PromQL**, a linguagem de consulta:

```promql
up                                                  # 1 = alvo saudável
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes   # fração de memória livre
rate(node_cpu_seconds_total{mode!="idle"}[5m])      # uso de CPU por núcleo (taxa por segundo)
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)   # % de CPU usada
sum by (status) (rate(http_requests_total[5m]))     # req/s por status
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))   # latência p95
```

Leia `rate(x[5m])` como "quanto `x` cresceu **por segundo**, nos últimos 5 minutos" — o jeito certo de olhar um *counter*.

> `[ATENÇÃO]` Cuidado com **cardinalidade**: cada combinação única de labels vira uma série. Um label como `user_id` ou `url` completo cria milhões de séries e derruba o Prometheus. Use labels de **baixa cardinalidade** (método, status, serviço).

## Dashboards com Grafana

O **Grafana** conecta fontes de dados (Prometheus, Loki, Tempo...) e desenha painéis.

1. `http://localhost:3000` (usuário `admin`, senha definida no Compose).
2. *Connections → Data sources → Add → Prometheus*, URL `http://prometheus:9090`.
3. *Dashboards → Import* o painel pronto **1860** ("Node Exporter Full").
4. Crie um painel seu com uma consulta PromQL; configure *thresholds* de cor.

Boas práticas: painéis por **serviço** com os **quatro sinais de ouro** (Google SRE): **latência**, **tráfego**, **erros** e **saturação**. Dashboards são código: exporte em JSON e versione (Módulo 19), ou provisione por arquivo.

![Painel do Grafana "Node Exporter Full" mostrando gráficos de CPU, memória e disco da máquina](screenshots/24-observabilidade/01-grafana-node-exporter.png)
> `[PRINT]` Passo a passo para capturar: importar o dashboard 1860 no Grafana e capturar a visão geral com CPU, memória e disco.

## Alertas

Uma **regra de alerta** do Prometheus avalia uma condição por um tempo; o **Alertmanager** roteia, agrupa e notifica (e-mail, Slack, PagerDuty/Opsgenie).

```yaml
# alertas.yml
groups:
  - name: sistema
    rules:
      - alert: DiscoQuaseCheio
        expr: (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes) < 0.10
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "Disco com menos de 10% livre em {{ $labels.instance }}"
      - alert: AlvoForaDoAr
        expr: up == 0
        for: 2m
        labels: { severity: critical }
        annotations:
          summary: "{{ $labels.job }} fora do ar"
```

O `for: 5m` evita alertar por oscilações breves. Bons alertas: **acionáveis** (alguém sabe o que fazer), com **runbook** linkado, baseados em **sintomas** que o usuário sente (erro alto, latência alta) mais que em causas (CPU 85%). **Fadiga de alerta** faz o time ignorar tudo.

## Logs com Loki e Fluent Bit

O **Loki** guarda logs indexando só os **labels** (barato, simples) e o Grafana os consulta com **LogQL**; o **Fluent Bit** (ou Promtail/Alloy) **coleta e envia** logs dos containers. A alternativa clássica é a stack **ELK/Elastic** (mais poderosa na busca de texto, mais pesada).

```logql
{container="api"} |= "ERROR"                       # logs de api com "ERROR"
{container="api"} | json | status >= 500            # logs JSON: filtra por campo
sum by (container) (rate({job="docker"} |= "ERROR" [5m]))    # taxa de erros como métrica
```

**Logs estruturados (JSON)** — `{"nivel":"error","req_id":"abc","msg":"timeout"}` — são muito mais fáceis de filtrar e correlacionar que texto livre. Inclua sempre um **ID de requisição** para ligar logs e traces.

> `[ATENÇÃO]` **Nunca** logue segredos, senhas, tokens nem dados pessoais (LGPD). Mascare antes de emitir.

## Traces e OpenTelemetry

Num sistema com vários serviços, uma requisição passa por muitos. Um **trace** registra o caminho completo, dividido em **spans** (cada chamada, com duração e status); o **trace ID** é propagado entre serviços. O **OpenTelemetry (OTel)** é o padrão aberto (APIs/SDKs, *collector*) para gerar métricas, logs e traces de forma neutra — você instrumenta uma vez e envia para Jaeger/Tempo/Azure Monitor/Datadog sem trocar o código.

```python
# instrumentação mínima em Python (conceito)
from opentelemetry import trace
tracer = trace.get_tracer(__name__)
with tracer.start_as_current_span("processa-pedido") as span:
    span.set_attribute("pedido.id", "123")
    ...
```

O **OTel Collector** recebe os dados e os encaminha (`receivers → processors → exporters`). Em muitos casos, a **auto-instrumentação** (agente) dá traces úteis sem alterar o código.

## SLI, SLO, SLA e error budget

- **SLI** (indicador): uma **medida** de qualidade — ex.: "% de requisições respondidas com sucesso em < 300 ms".
- **SLO** (objetivo): a **meta** para o SLI — "99,9% em 30 dias".
- **SLA**: o **contrato** com consequências (créditos) se o SLO for descumprido.
- **Error budget**: o quanto você **pode falhar** — com 99,9% em 30 dias, são ~43 minutos de indisponibilidade tolerada. Orçamento sobrando → pode arriscar mudanças; esgotado → congele novidades e priorize confiabilidade.

Exemplo de SLI de disponibilidade em PromQL:

```promql
sum(rate(http_requests_total{status!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))
```

Aprofundamos SLOs e incidentes no Módulo 25.

## Laboratórios

### Lab 1 — Métricas
Suba Prometheus + node_exporter + Grafana; consulte `up` e a % de CPU; importe o dashboard 1860.

### Lab 2 — Seu próprio exportador
Escreva um script (ou app Python com `prometheus_client`) que exponha uma métrica `lab_pedidos_total` em `/metrics`; adicione ao `scrape_configs` e desenhe-a no Grafana.

### Lab 3 — Alertas
Configure a regra `DiscoQuaseCheio` (reduza o limite para disparar), crie uma carga que a ative (`fallocate` de um arquivo grande) e observe o alerta em *Alerts* no Prometheus.

### Lab 4 — Logs
Adicione Loki + Promtail/Alloy ao Compose, gere logs com a API do Módulo 20 e consulte `|= "ERROR"` no Grafana *Explore*.

### Lab 5 — Traces (introdução)
Suba Jaeger (`jaegertracing/all-in-one`) e uma app instrumentada com OTel; veja um trace com 2 spans.

### Desafios

- **Desafio 1:** dashboard dos **4 sinais de ouro** para a API do TrilhaShop (latência p95, req/s, taxa de erros, saturação).
- **Desafio 2:** defina um **SLO de 99,5%** de disponibilidade para a API, calcule o error budget do mês e escreva o alerta de **queima de orçamento** (burn rate).
- **Desafio 3:** correlacione: provoque um erro na API e mostre, partindo do alerta, o caminho **métrica → trace → log** até a causa.

**Limpeza:** `docker compose down -v`.

## Erros comuns nesta fase

- Labels de alta cardinalidade nas métricas.
- Alertar por causa (CPU) e não por sintoma (erro/latência).
- Alertas sem `for:` (oscilação) ou sem ação clara/runbook.
- Logs em texto livre e sem ID de requisição.
- Logar segredos e dados pessoais.
- Dashboards que ninguém usa em vez de poucos, bons e acionáveis.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| SLI/SLO/error budget | SRE — Módulo 25 |
| Probes e métricas do cluster | Kubernetes — Módulo 23 |
| Azure Monitor, Log Analytics | Módulo 15 (Azure); Cloud Monitoring (GCP, Módulo 15) |
| Logs de segurança/auditoria | Segurança — Módulo 25 |

## `[REFERÊNCIA]`

- Prometheus — documentação: https://prometheus.io/docs/
- Grafana — documentação: https://grafana.com/docs/
- Grafana Loki: https://grafana.com/docs/loki/latest/
- OpenTelemetry: https://opentelemetry.io/docs/
- Jaeger: https://www.jaegertracing.io/docs/ · Grafana Tempo: https://grafana.com/docs/tempo/latest/
- Google — *SRE Book*, caps. "Monitoring Distributed Systems" e SLOs: https://sre.google/sre-book/monitoring-distributed-systems/
- *Google SRE Workbook* — SLOs e alertas: https://sre.google/workbook/alerting-on-slos/
- Brendan Gregg — USE Method: https://www.brendangregg.com/usemethod.html
- Tom Wilkie — *RED Method*: https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/

**Como aprofundar:** estude o *kube-prometheus-stack* (Helm) para monitorar o cluster do Módulo 23, e alertas de **burn rate** do SRE Workbook.

## Checklist de saída

- [ ] Diferenciar monitoramento de observabilidade e descrever os três pilares.
- [ ] Explicar o modelo *pull* do Prometheus e os tipos de métrica.
- [ ] Escrever consultas PromQL com `rate`, `sum by` e `histogram_quantile`.
- [ ] Criar dashboards no Grafana com os 4 sinais de ouro.
- [ ] Configurar regras de alerta acionáveis com `for:` e Alertmanager.
- [ ] Consultar logs com Loki/LogQL e adotar logs estruturados.
- [ ] Explicar traces, spans e o papel do OpenTelemetry.
- [ ] Definir SLI, SLO e error budget e calcular o orçamento.
