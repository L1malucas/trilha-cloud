---
id: "13_dados_e_analytics"
title: "Módulo 13 — Dados e Analytics"
sidebar_label: "13 · Dados e Analytics"
sidebar_position: 13
---

# Módulo 13 — Dados e Analytics

> **Objetivo**: entender o ecossistema de dados do GCP — BigQuery, Dataflow, Dataproc, Pub/Sub e Looker — e usar o BigQuery para analisar as vendas do TrilhaShop, controlando o custo das consultas.
>
> **Pré-requisitos**: módulos 10, 11 e 12.
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> É o diferencial histórico do Google Cloud; cobre "Data" do **Cloud Digital Leader** e BigQuery do **Associate Cloud Engineer**. Referência: https://cloud.google.com/bigquery/docs

---

## Banco transacional x banco analítico

Dois mundos que se complementam. O banco do Módulo 12 (Cloud SQL) é **OLTP**: muitas operações pequenas e rápidas ("registrar este pedido"). Já um **data warehouse** é **OLAP**: poucas consultas enormes sobre histórico ("vendas por categoria e mês nos últimos 3 anos"). Misturar os dois no mesmo banco faz a análise derrubar a loja.

O **BigQuery** é o data warehouse serverless do Google: você carrega ou consulta dados em SQL, **sem provisionar servidor**, e ele escala para petabytes. Dois pontos que o tornam diferente:

- **Armazenamento e computação separados**: pague separadamente por guardar e por consultar.
- **Armazenamento em colunas**: lê só as colunas pedidas — por isso `SELECT *` é um desperdício caro.

## Hierarquia e custo no BigQuery

```
Projeto → Dataset (agrupa tabelas, define localização) → Tabela (ou view)
```

Cobrança, em dois modelos de computação:

| Modelo | Como cobra | Use quando |
|---|---|---|
| **On-demand** | Por **bytes lidos** pela consulta (o primeiro 1 TB/mês é gratuito) | Cargas ocasionais, estudo |
| **Capacity (slots/Editions)** | Por capacidade reservada | Cargas contínuas e previsíveis |

> `[ATENÇÃO]` No modo on-demand, o custo depende de **quanto de dado a consulta lê**, e não do tamanho do resultado. `SELECT *` numa tabela de 1 TB custa 1 TB lido. Selecione só as colunas necessárias, filtre por **partição**, e **estime antes de rodar** (`--dry_run`).

```bash
PROJETO=$(gcloud config get project)
gcloud services enable bigquery.googleapis.com

bq --location=southamerica-east1 mk --dataset --label=projeto:trilhashop $PROJETO:vendas
bq ls
bq show $PROJETO:vendas

# Estimar o custo ANTES de executar
bq query --use_legacy_sql=false --dry_run 'SELECT COUNT(*) FROM `bigquery-public-data.usa_names.usa_1910_2013`'
```

## Carregando e consultando dados

```bash
# Dados de vendas de exemplo
cat > vendas.csv <<'EOF'
pedido_id,data,categoria,valor
1,2026-01-03,camisetas,59.90
2,2026-01-03,canecas,29.90
3,2026-01-04,camisetas,119.80
4,2026-02-10,canecas,59.80
5,2026-02-11,acessorios,15.00
EOF

bq load --autodetect --source_format=CSV --skip_leading_rows=1 vendas.pedidos vendas.csv
bq show --schema --format=prettyjson vendas.pedidos
bq query --use_legacy_sql=false \
  'SELECT categoria, COUNT(*) AS pedidos, ROUND(SUM(valor),2) AS total
   FROM `vendas.pedidos`
   GROUP BY categoria ORDER BY total DESC'
```

Fontes de dados: arquivos do Cloud Storage (`gs://...`), **tabelas externas** (consulta direto no bucket sem carregar), **Pub/Sub → BigQuery** (assinatura que grava mensagens direto numa tabela — Módulo 10) e *federated queries* ao Cloud SQL.

```bash
# Pub/Sub grava direto em BigQuery (assinatura "BigQuery")
gcloud pubsub subscriptions create pedidos-bq --topic=pedidos \
  --bigquery-table=$PROJETO:vendas.pedidos_stream --use-topic-schema
```

### Particionamento e clustering

Para reduzir o dado lido (e o custo):

- **Particionar** a tabela por data (ou inteiro): a consulta com filtro de data lê só as partições necessárias.
- **Clusterizar** por colunas muito filtradas: reordena fisicamente os dados.

```sql
CREATE TABLE vendas.pedidos_part
PARTITION BY DATE(data)
CLUSTER BY categoria AS
SELECT * FROM vendas.pedidos;

SELECT categoria, SUM(valor) FROM vendas.pedidos_part
WHERE data BETWEEN '2026-01-01' AND '2026-01-31'     -- lê só a partição de janeiro
GROUP BY categoria;
```

![Console do BigQuery com o editor SQL, o resultado da consulta de vendas por categoria e o painel mostrando bytes processados](screenshots/13-dados-e-analytics/01-bigquery-consulta-vendas.png)
> `[PRINT]` Passo a passo para capturar: Console → BigQuery → Editor SQL. Rodar a consulta de vendas por categoria e capturar o resultado e a estimativa de bytes processados.

## O restante do ecossistema

| Serviço | Para quê | Analogia |
|---|---|---|
| **Pub/Sub** | Ingestão de eventos em tempo real | A esteira de entrada |
| **Dataflow** | Pipelines de dados em **lote e streaming** (Apache Beam), gerenciado | A linha de processamento |
| **Dataproc** | Clusters **Spark/Hadoop** gerenciados (migrar cargas existentes) | Cozinha pronta para quem já usa Spark |
| **Dataplex / Data Catalog** | Catalogar e governar dados | A biblioteca e seu índice |
| **Looker / Looker Studio** | Dashboards e BI | A vitrine dos resultados |
| **Vertex AI / BigQuery ML** | Modelos de ML sobre os dados | O laboratório de previsão |

> `[TEORIA]` Fluxo típico de dados no GCP: **fontes** → **Pub/Sub** (ingestão) → **Dataflow** (transformação) → **BigQuery** (armazenamento/análise) → **Looker** (visualização). Prova: "processamento em **streaming** com Apache Beam" → Dataflow; "migrar jobs **Spark/Hadoop**" → Dataproc; "análise SQL em petabytes sem gerenciar servidor" → BigQuery.

```bash
# Dataflow: um template gerenciado (Pub/Sub -> BigQuery), sem escrever código
gcloud services enable dataflow.googleapis.com
gcloud dataflow jobs run pedidos-para-bq --region=southamerica-east1 \
  --gcs-location=gs://dataflow-templates-southamerica-east1/latest/PubSub_to_BigQuery \
  --parameters=inputTopic=projects/$PROJETO/topics/pedidos,outputTableSpec=$PROJETO:vendas.pedidos_stream
gcloud dataflow jobs list --region=southamerica-east1
# Dataproc (cluster pequeno efêmero)
gcloud dataproc clusters create cl-spark --region=southamerica-east1 --single-node
```

(Os templates e nomes de buckets evoluem; confira o catálogo em https://cloud.google.com/dataflow/docs/guides/templates/provided-templates.)

## BigQuery ML: ML com SQL

Treine e use modelos **com SQL**, sem exportar os dados:

```sql
CREATE OR REPLACE MODEL vendas.modelo_valor
OPTIONS (model_type='linear_reg', input_label_cols=['valor']) AS
SELECT categoria, EXTRACT(MONTH FROM data) AS mes, valor FROM vendas.pedidos;

SELECT * FROM ML.PREDICT(MODEL vendas.modelo_valor,
  (SELECT 'camisetas' AS categoria, 3 AS mes));
```

## Práticas

### Prática isolada

1. Crie o dataset `vendas` na região de São Paulo e carregue o `vendas.csv`.
2. Rode a consulta por categoria e compare o `--dry_run` (bytes estimados) de `SELECT *` e de uma consulta com colunas específicas.
3. Crie a tabela particionada/clusterizada e compare os bytes lidos com e sem filtro de data.
4. Consulte um **dataset público** (`bigquery-public-data`) e responda a uma pergunta de negócio.
5. (Opcional) Conecte o Looker Studio (https://lookerstudio.google.com) ao dataset e monte um gráfico.

**Limpeza:** `bq rm -r -f -d $PROJETO:vendas` e encerre jobs do Dataflow/Dataproc.

### Contribuição ao projeto integrador

Análise de vendas do TrilhaShop: o `pedidos` (Pub/Sub, Módulo 10) alimenta uma tabela BigQuery (assinatura BigQuery ou Dataflow); crie **3 consultas** de negócio (vendas por categoria, ticket médio por mês, produtos mais vendidos) e um dashboard no Looker Studio. Defina no `decisoes.md` o **limite de custo** de consulta (`maximum_bytes_billed`) e por que particionou por data.

`[CUSTO]` Use `maximum_bytes_billed` (`bq query --maximum_bytes_billed=1000000000`) como trava de segurança. Dataflow e Dataproc cobram por hora enquanto existirem: apague ao fim.

## Erros comuns nesta fase

- `SELECT *` em tabelas grandes (custo alto).
- Não particionar tabelas que crescem por data.
- Esquecer a localização do dataset (dados e consultas devem estar na mesma região/multirregião).
- Rodar análise pesada no Cloud SQL em vez do BigQuery.
- Deixar jobs de Dataflow/Dataproc ligados.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Pub/Sub, Cloud SQL | Módulos 10 e 12 |
| Custo por bytes | Custos — Módulo 16 |
| BigQuery ML e dados para IA | IA e ML — Módulo 17 |
| Logs no BigQuery | Monitoramento — Módulo 15 |

## `[REFERÊNCIA]`

- Google Cloud — *BigQuery documentation*: https://cloud.google.com/bigquery/docs
- Google Cloud — *Introduction to partitioned tables*: https://cloud.google.com/bigquery/docs/partitioned-tables
- Google Cloud — *BigQuery pricing*: https://cloud.google.com/bigquery/pricing
- Google Cloud — *BigQuery ML*: https://cloud.google.com/bigquery/docs/bqml-introduction
- Google Cloud — *Dataflow*: https://cloud.google.com/dataflow/docs · *Dataproc*: https://cloud.google.com/dataproc/docs
- Looker Studio: https://lookerstudio.google.com/ · Looker: https://cloud.google.com/looker/docs
- Google Cloud — *Public datasets*: https://cloud.google.com/bigquery/public-data

**Como aprofundar:** os *BigQuery public datasets* e os desafios do Skills Boost ("BigQuery for Data Analysis") para ganhar prática em SQL analítico.

## Checklist de saída

- [ ] Diferenciar OLTP de OLAP e explicar por que não analisar no banco da aplicação.
- [ ] Explicar dataset, tabela e a separação armazenamento/computação do BigQuery.
- [ ] Estimar e controlar custo de consultas (`--dry_run`, colunas, partições).
- [ ] Carregar dados e rodar consultas com `bq`.
- [ ] Explicar particionamento e clustering.
- [ ] Escolher entre Pub/Sub, Dataflow, Dataproc, BigQuery e Looker.
- [ ] Ter produzido consultas de negócio para o TrilhaShop.
