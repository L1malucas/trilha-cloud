---
id: "16_custos_e_faturamento"
title: "Módulo 16 — Custos e Faturamento"
sidebar_label: "16 · Custos e Faturamento"
sidebar_position: 16
---

# Módulo 16 — Custos e Faturamento

> **Objetivo**: estimar, controlar e reduzir custos no GCP — Pricing Calculator, Billing Reports, budgets e alertas, exportação de billing para o BigQuery, descontos (sustained use e CUD), labels e a prática de **FinOps** — encerrando com um budget de alerta para o TrilhaShop.
>
> **Pré-requisitos**: módulos 03 (labels) e 08 (modelos de compra).
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre "Billing" do **Associate Cloud Engineer** e "Financial governance" do **Cloud Digital Leader**. Referência: https://cloud.google.com/billing/docs

---

## Conta de luz com tarifa e medidor

Na nuvem você paga como na conta de luz: **medidor** (consumo) vezes **tarifa** (preço por unidade). Duas consequências: o custo é **variável** e depende do seu comportamento, e um aparelho esquecido ligado continua no medidor. Controle de custo é primeiro **disciplina operacional** (apagar o que não usa) e depois **engenharia** (escolher o modelo certo).

## O que determina o custo

- **Tipo e tamanho** do recurso; **consumo** (horas, GB, requisições, bytes lidos).
- **Região** (a mesma VM custa diferente por região).
- **Rede**: tráfego **entrando** é grátis; **saindo** para a internet ou entre regiões é cobrado (**egress**).
- **Modelo de compra** (on-demand, descontos, Spot).
- **Camadas gratuitas**: **Free Tier / Always Free** com cotas mensais por produto.

### Descontos por uso

| Desconto | Como funciona |
|---|---|
| **Sustained use discount** | **Automático**: quanto mais do mês a VM roda, maior o desconto (algumas famílias) |
| **Committed use discounts (CUD)** | Compromisso de **1 ou 3 anos** (recurso ou gasto), grande desconto |
| **Spot VMs** | Capacidade ociosa, muito mais barata, pode ser interrompida |
| **Free tier** | Cotas gratuitas mensais |

> `[TEORIA]` Prova: **sustained use** não exige ação nem compromisso; **CUD** exige compromisso em troca de desconto maior; **Spot** é o mais barato com risco de interrupção. Compromisso de gasto (flexível) x de recurso (específico) são dois sabores de CUD.

## Estimar antes de criar

- **Pricing Calculator** (https://cloud.google.com/products/calculator): "quanto custará **esta arquitetura**?"
- No Console, **estimativa de custo** aparece ao criar VMs e outros recursos.
- Para BigQuery, `--dry_run` (Módulo 13).

```bash
# Exemplo mental de estimativa: 2x e2-small 24/7 + Cloud SQL db-custom-1-3840 + 100 GB Storage
# Monte na calculadora e anote o total; refaça com CUD de 1 ano para comparar.
```

## Faturamento: contas, projetos e permissões

O **Billing Account** paga; projetos são vinculados a ele (Módulo 03). Papéis típicos: **Billing Account Administrator** (gerencia a conta), **Billing Account User** (vincula projetos), **Billing Account Viewer** (só vê). Dê o mínimo.

```bash
gcloud billing accounts list
gcloud billing accounts get-iam-policy <ID-DA-CONTA> --format="table(bindings.role,bindings.members)"
gcloud billing projects list --billing-account=<ID-DA-CONTA>
```

## Budgets e alertas

Um **budget** acompanha o gasto (da conta, de projetos ou serviços) e **alerta por e-mail ou Pub/Sub** ao atingir percentuais do valor definido.

```bash
gcloud services enable billingbudgets.googleapis.com
gcloud billing budgets create --billing-account=<ID-DA-CONTA> \
  --display-name="Budget TrilhaShop" \
  --budget-amount=50BRL \
  --filter-projects=projects/$(gcloud projects describe $PROJETO --format="value(projectNumber)") \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.8 \
  --threshold-rule=percent=1.0
gcloud billing budgets list --billing-account=<ID-DA-CONTA>
```

> `[ATENÇÃO]` **Budget alerta, mas não corta.** Atingir 100% não desliga nada. Para agir automaticamente, envie as notificações a um **tópico Pub/Sub** e dispare uma função que desvincule o faturamento ou pare recursos (cuidado: desvincular derruba serviços). E os dados de billing têm **atraso** de horas.

![Console de Billing, tela de Orçamentos e alertas com o budget do TrilhaShop e os limites de 50%, 80% e 100%](screenshots/16-custos-e-faturamento/01-budget-alertas.png)
> `[PRINT]` Passo a passo para capturar: Console → Faturamento → Orçamentos e alertas. Capturar o budget com os limites configurados.

## Billing Reports e exportação para o BigQuery

- **Billing Reports** (Console): gráficos de custo por projeto, serviço, SKU e **label**.
- **Exportação para o BigQuery**: grava **cada linha de custo** (padrão e detalhada) em tabelas que você consulta em SQL — a base de FinOps. Configure no Console: Faturamento → Exportação de faturamento → BigQuery.

```sql
-- Custo do último mês por label "projeto" (tabela de export; ajuste o nome)
SELECT
  (SELECT value FROM UNNEST(labels) WHERE key = 'projeto') AS projeto,
  service.description AS servico,
  ROUND(SUM(cost), 2) AS custo
FROM `PROJETO.billing_export.gcp_billing_export_v1_XXXXXX`
WHERE invoice.month = FORMAT_DATE('%Y%m', CURRENT_DATE())
GROUP BY projeto, servico
ORDER BY custo DESC;
```

> `[TEORIA]` Os **labels** (Módulo 03) só aparecem no relatório de custos se foram aplicados **antes** do gasto. Sem labels, o custo fica anônimo. Padronize `projeto`, `ambiente`, `dono` e exija por política.

## Como reduzir, na prática

1. **Apagar/parar** o que está ocioso (VMs, clusters GKE, IPs reservados, discos órfãos, instâncias Cloud SQL).
2. **Dimensionar certo** (*right-sizing*): use as recomendações do **Recommender**.
3. **Descontos**: CUD para carga estável; Spot para batch.
4. **Autoscaling** e **scale to zero** (Cloud Run, MIG — Módulos 08 e 09).
5. **Classes de armazenamento** e **lifecycle** (Módulo 11); **particionar** no BigQuery (Módulo 13).
6. **Reduzir egress**: Cloud CDN, mesma região para serviços que conversam.
7. **Desligar ambientes de dev à noite** (Cloud Scheduler + função).
8. **Labels e budgets** em todo projeto.

```bash
gcloud recommender recommendations list --recommender=google.compute.instance.IdleResourceRecommender \
  --project=$PROJETO --location=southamerica-east1-a
gcloud compute disks list --filter="-users:*" --format="table(name,zone.basename(),sizeGb)"     # discos órfãos
gcloud compute addresses list --filter="status=RESERVED" --format="table(name,region,address)"  # IPs ociosos
```

## FinOps em uma olhada

**FinOps** é a prática de levar responsabilidade financeira para as equipes de engenharia: **informar** (visibilidade por time/label), **otimizar** (right-sizing, descontos) e **operar** (budgets, revisões periódicas, automação). Custo vira uma métrica de engenharia, ao lado de latência e disponibilidade. Referência: https://www.finops.org/.

## Suporte

Planos de suporte (**Basic** gratuito, **Standard**, **Enhanced**, **Premium**) diferem em tempos de resposta e acesso; o **Customer Care** inclui consultoria técnica nos planos superiores. Para o CDL, saiba que o suporte é pago e escalonado por criticidade.

## Práticas

### Prática isolada

1. Monte na **Pricing Calculator**: 2 VMs `e2-small` + 1 Cloud SQL + 100 GB Storage em São Paulo; anote o total e refaça com CUD de 1 ano.
2. Abra os **Billing Reports** e agrupe por serviço e por label.
3. Crie um **budget** com alertas de 50/80/100% e um canal de e-mail.
4. Liste discos órfãos e IPs reservados ociosos no projeto e apague-os.
5. (Opcional) Configure a exportação de billing para o BigQuery e rode a consulta de custo por label.

### Contribuição ao projeto integrador

Controle de custo do TrilhaShop: budget `Budget TrilhaShop` (50/80/100%) no projeto; relatório por label `projeto=trilhashop` salvo; uma tabela no `decisoes.md` com o **custo estimado/mês** em dev (com e sem CUD/Spot) e a lista do que **deve** ser desligado fora do horário. Rode `limpa.sh` (Módulo 07) ao fim de cada sessão.

`[CUSTO]` Budgets, Billing Reports e Recommender são gratuitos; a exportação para o BigQuery cobra só armazenamento/consulta.

## Erros comuns nesta fase

- Achar que o budget bloqueia o gasto.
- Esquecer o custo de **egress** e de recursos ociosos (IP, disco, cluster).
- Não aplicar labels e não conseguir dividir custo por projeto.
- Aplicar labels depois do gasto e esperar relatório retroativo.
- Confundir sustained use (automático) com CUD (compromisso).
- Deixar GKE/Cloud SQL/NAT ligados entre sessões.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Labels | Hierarquia — Módulo 03 |
| Egress, CDN | Load balancer e CDN — Módulo 06 |
| Custo por bytes no BigQuery | Módulo 13 |
| Budgets, Cost Management | Azure, Módulo 16 |
| FinOps | Projeto final — Módulo 18 |

## `[REFERÊNCIA]`

- Google Cloud — *Cloud Billing documentation*: https://cloud.google.com/billing/docs
- Google Cloud — *Budgets and alerts*: https://cloud.google.com/billing/docs/how-to/budgets
- Google Cloud — *Export Cloud Billing data to BigQuery*: https://cloud.google.com/billing/docs/how-to/export-data-bigquery
- Google Cloud — *Committed use discounts*: https://cloud.google.com/docs/cuds
- Google Cloud — *Pricing Calculator*: https://cloud.google.com/products/calculator
- Google Cloud — *Free Tier*: https://cloud.google.com/free/docs/free-cloud-features
- Google Cloud — *Cost optimization (Architecture Framework)*: https://cloud.google.com/architecture/framework/cost-optimization
- FinOps Foundation: https://www.finops.org/

**Como aprofundar:** o pilar de *Cost optimization* do Architecture Framework e o curso gratuito da FinOps Foundation.

## Checklist de saída

- [ ] Citar os fatores que determinam o custo de um recurso (incluindo egress).
- [ ] Diferenciar sustained use, CUD, Spot e free tier.
- [ ] Usar a Pricing Calculator para estimar uma arquitetura.
- [ ] Explicar o que um budget faz **e o que não faz**.
- [ ] Usar labels e a exportação de billing para dividir custo por projeto.
- [ ] Listar práticas para reduzir custo e achar recursos ociosos.
- [ ] Explicar FinOps em uma frase.
- [ ] Ter criado o budget do TrilhaShop.
