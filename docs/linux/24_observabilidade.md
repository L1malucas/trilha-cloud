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

> `[TENTE VOCÊ]` Como saber se o Prometheus está mesmo coletando os alvos, sem abrir o navegador? Resposta: `curl -s 'localhost:9090/api/v1/query?query=up'` devolve JSON com `"value":[...,"1"]` para cada alvo saudável. É a mesma API que o Grafana usa; vale para scripts e testes.

> `[ATENÇÃO]` Dentro do Compose, o alvo é `node-exporter:9100` (nome do serviço), não `localhost:9100`. O `localhost` do Prometheus é o próprio container dele. O alvo aparece como `DOWN` em *Status → Targets* quando você usa o endereço errado.

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

> `[TENTE VOCÊ]` Por que olhar um counter cru (`node_cpu_seconds_total`) não ajuda? Resposta: ele só cresce desde o boot, então o valor absoluto não diz nada sobre o *agora*. O que importa é a **velocidade**: `rate(node_cpu_seconds_total{mode="idle"}[5m])` mostra quanto tempo por segundo cada núcleo esteve ocioso nos últimos 5 minutos. Se o counter zera (reinício do processo), o `rate` já compensa.

> `[TENTE VOCÊ]` Como obter o espaço livre do disco em %? Resposta: `100 * node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}`. Raciocínio: dividir os dois gauges dá a fração, e o `* 100` converte em porcentagem.

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

> `[TENTE VOCÊ]` Como validar o `alertas.yml` antes de recarregar o Prometheus? Resposta: `docker run --rm -v "$PWD":/w --entrypoint promtool prom/prometheus:latest check rules /w/alertas.yml` — termina com `SUCCESS: 2 rules found`. Um YAML ou PromQL inválido derrubaria o carregamento da configuração; testar antes evita isso.

> `[ATENÇÃO]` Criar o `alertas.yml` não basta: é preciso referenciá-lo em `rule_files: ["/etc/prometheus/alertas.yml"]` no `prometheus.yml`, montar o arquivo no container e recarregar (`docker compose restart prometheus`). Sem isso a regra nunca é avaliada, e o erro parece "o alerta não dispara".

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

> `[TENTE VOCÊ]` Quanto de indisponibilidade um SLO de 99,5% tolera em 30 dias? Resposta: 30 dias = 43.200 minutos; a margem é 0,5%, ou seja, `43200 * 0.005 = 216` minutos (~3h36). Confira no terminal: `awk 'BEGIN{print 43200*0.005}'` imprime `216`. Cada "nove" a mais divide o orçamento por 10: 99,9% dá ~43 min.

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

### Lab 6 — Métrica a partir do access.log (textfile do node_exporter)
Cenário: seu Nginx já escreve logs, mas ninguém tem número de erros no Grafana. Transforme o `access.log` do laboratório em métrica, sem alterar a aplicação.

```bash
cd ~/lab/obs && mkdir -p textfile
cat > gera-metricas.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
LOG=${1:-$HOME/lab/dados/access.log}
OUT=${2:-$HOME/lab/obs/textfile/access.prom}
{
  echo '# HELP lab_http_requests_total Requisicoes por status (do access.log).'
  echo '# TYPE lab_http_requests_total counter'
  awk '{c[$9]++} END{for (s in c) printf "lab_http_requests_total{status=\"%s\"} %d\n", s, c[s]}' "$LOG"
} > "$OUT.tmp" && mv "$OUT.tmp" "$OUT"      # gravação atômica
EOF
chmod +x gera-metricas.sh && ./gera-metricas.sh && cat textfile/access.prom
```

Para o node-exporter ler a pasta, ajuste o serviço no `compose.yaml`:

```yaml
  node-exporter:
    image: prom/node-exporter:latest
    command: ["--collector.textfile.directory=/textfile"]
    volumes: ["./textfile:/textfile:ro"]
    ports: ["9100:9100"]
```

```bash
docker compose up -d
curl -s localhost:9100/metrics | grep lab_http_requests_total
```

No Prometheus, consulte `sum(lab_http_requests_total{status=~"5.."}) / sum(lab_http_requests_total)` (fração de erros). Por que gravar em `.tmp` e fazer `mv`? Para o exportador nunca ler um arquivo pela metade.

### Lab 7 — Consultar o Prometheus pela API e montar um mini-relatório
Cenário: você precisa de um número de disponibilidade num script, sem abrir o navegador.

```bash
cd ~/lab/obs
q() { curl -s --get 'http://localhost:9090/api/v1/query' --data-urlencode "query=$1"; }
q 'up' | python3 -c 'import json,sys; [print(r["metric"]["job"], r["value"][1]) for r in json.load(sys.stdin)["data"]["result"]]'
q 'sum(lab_http_requests_total{status=~"5.."}) / sum(lab_http_requests_total)' \
  | python3 -c 'import json,sys; v=json.load(sys.stdin)["data"]["result"][0]["value"][1]; print(f"taxa de erro 5xx: {float(v)*100:.2f}%")'
```

> `[WSL]` Aguarde pelo menos um ciclo de scrape (15 s) depois de subir ou alterar o `textfile`, senão a consulta volta vazia.

### Lab 8 — Orçamento de erro calculado do log
Cenário: o time prometeu 99,5% de disponibilidade. Calcule se o log do dia cabe no orçamento.

```bash
awk '{t++; if ($9 ~ /^5/) e++} END{
  slo=99.5; disp=100*(t-e)/t; orc=100-slo; gasto=100*e/t
  printf "disponibilidade=%.2f%% orcamento=%.2f%% gasto=%.2f%% -> %s\n", disp, orc, gasto, (gasto<=orc ? "DENTRO do SLO" : "ESTOUROU o SLO")
}' ~/lab/dados/access.log
```

Mude `slo=99.5` para `99.9` e `95` e compare. Pergunta de raciocínio: se o orçamento estourou, o que muda no ritmo de deploys do time?

### Desafios

- **Desafio 1:** dashboard dos **4 sinais de ouro** para a API do TrilhaShop (latência p95, req/s, taxa de erros, saturação).
- **Desafio 2:** defina um **SLO de 99,5%** de disponibilidade para a API, calcule o error budget do mês e escreva o alerta de **queima de orçamento** (burn rate).
- **Desafio 3:** correlacione: provoque um erro na API e mostre, partindo do alerta, o caminho **métrica → trace → log** até a causa.
- **Desafio 4:** estenda o `gera-metricas.sh` para exportar também `lab_http_bytes_total` (soma dos bytes, coluna 10) e a contagem por rota (coluna 7), cuidando da cardinalidade (agrupe rotas desconhecidas em `outros`).

  **Verifique:** `curl -s localhost:9100/metrics | grep -c '^lab_http_'` imprime um número maior que `0` e `curl -s localhost:9100/metrics | grep 'lab_http_bytes_total'` mostra uma única linha com a soma.

- **Desafio 5:** escreva uma regra `ErroAlto` (`for: 1m`) que dispare quando a fração de 5xx do `lab_http_requests_total` passar de 3% e valide com `promtool`.

  **Verifique:** `docker run --rm -v "$PWD":/w --entrypoint promtool prom/prometheus:latest check rules /w/alertas.yml` termina com `SUCCESS: 3 rules found` (as duas originais mais a nova).

- **Desafio 6:** monte um script `slo.sh` que consulte o Prometheus pela API e imprima `OK` ou `ESTOURADO` conforme o SLO de 99,5%, com código de saída `0`/`1` (para uso num pipeline do módulo 22).

  **Verifique:** `./slo.sh; echo $?` imprime `OK` e `0` com o log atual; ao adicionar muitas linhas de status 500 ao `access.log` e rodar o coletor, imprime `ESTOURADO` e `1`.

**Limpeza:** `docker compose down -v`.

## Erros comuns nesta fase

- Labels de alta cardinalidade nas métricas.
- Alertar por causa (CPU) e não por sintoma (erro/latência).
- Alertas sem `for:` (oscilação) ou sem ação clara/runbook.
- Logs em texto livre e sem ID de requisição.
- Logar segredos e dados pessoais.
- Dashboards que ninguém usa em vez de poucos, bons e acionáveis.
- Criar a regra de alerta mas esquecer o `rule_files` (a regra nunca roda) ou não validar com `promtool`.
- Apontar o alvo para `localhost` dentro do Compose em vez do nome do serviço.
- Ler um counter cru em vez de usar `rate()`, e tirar conclusões do valor acumulado.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 12 (logs e monitoramento) | `journalctl`/`tail` viram LogQL; `top`/`free` viram `node_cpu_*`/`node_memory_*` |
| Módulo 04 (texto) | `awk` transforma `access.log` em métrica no formato do Prometheus |
| Módulo 11 (scripts) | Script de coleta idempotente e atômico (`tmp` + `mv`) |
| Módulo 06 (systemd) | Timer/cron que roda o coletor a cada minuto |
| Módulo 20 (Compose) | A stack inteira (Prometheus, Grafana, exporters) é um `compose.yaml` |

### Lab integrador — Coletor agendado do access.log
Una `awk` (04), script robusto (11) e agendamento (06) para alimentar o Prometheus continuamente.

```bash
cd ~/lab/obs
# agenda a cada minuto com cron simples (alternativa: systemd timer, módulo 06)
( crontab -l 2>/dev/null | grep -v gera-metricas.sh; echo "* * * * * $HOME/lab/obs/gera-metricas.sh" ) | crontab -
crontab -l | tail -1
# simule o log crescendo e veja a métrica acompanhar
head -n 100 ~/lab/dados/access.log >> ~/lab/dados/access.log
sleep 65 && grep -c . textfile/access.prom && curl -s localhost:9100/metrics | grep 'lab_http_requests_total{status="200"}'
crontab -l | grep -v gera-metricas.sh | crontab -     # remove o agendamento ao fim
```

> `[WSL]` O `cron` só roda se o serviço estiver ativo: `sudo systemctl enable --now cron` (precisa do systemd habilitado, módulo 00/06). Sem ele, execute `./gera-metricas.sh` na mão ou com `watch -n 60 ./gera-metricas.sh`.

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
