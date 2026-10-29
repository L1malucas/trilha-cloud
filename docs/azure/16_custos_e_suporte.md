---
id: "16_custos_e_suporte"
title: "Módulo 16 — Custos e Suporte"
sidebar_label: "16 · Custos e Suporte"
sidebar_position: 16
---

# Módulo 16 — Custos e Suporte

> **Objetivo**: estimar, controlar e reduzir custos no Azure — Pricing Calculator, TCO, Cost Management, budgets, tags, reservas — e conhecer SLAs, planos de suporte e o ciclo de vida dos serviços; encerrando com um budget de alerta para o TrilhaShop.
>
> **Pré-requisitos**: módulos 03 (tags) e 08 (modelos de compra).
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre **Describe Azure cost management and service level agreements** (AZ-900), domínio sempre cobrado. Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900

---

## Conta de luz com tarifa e medidor

Na nuvem você paga como na conta de luz: um **medidor** (quanto consumiu) vezes uma **tarifa** (preço por unidade). Duas consequências: o custo é **variável** e depende do seu comportamento, e um aparelho esquecido ligado continua no medidor. Controle de custo é, antes de tudo, disciplina operacional (apagar o que não usa) e depois engenharia (escolher o modelo certo).

## O que determina o custo

- **Tipo de recurso e tamanho** (SKU, tier).
- **Consumo** (horas, GB, operações, transferência).
- **Localização** (a mesma VM custa diferente por região).
- **Rede**: tráfego **entrando** é grátis; **saindo** do Azure (internet, entre regiões) é cobrado.
- **Tipo de conta**: pay-as-you-go, assinatura empresarial, créditos.
- **Modelo de compra**: sob demanda, **Reservations**, **Savings Plan**, **Spot** e **Azure Hybrid Benefit** (reutilizar licenças Windows Server/SQL).

> `[TEORIA]` Prova: Reservations (1 ou 3 anos, recurso específico, maior desconto), Savings Plan (compromisso de gasto por hora, mais flexível), Spot (capacidade ociosa, pode ser despejada), Hybrid Benefit (licença que você já possui). Referência: https://learn.microsoft.com/azure/cost-management-billing/reservations/save-compute-costs-reservations

## Estimar antes de criar

Duas calculadoras diferentes, que a prova adora confundir:

| Ferramenta | Pergunta que responde |
|---|---|
| **Pricing Calculator** (https://azure.microsoft.com/pricing/calculator/) | "Quanto vai custar **esta arquitetura no Azure**?" |
| **TCO Calculator** | "Quanto eu **economizo** migrando minha infraestrutura **local** para o Azure?" |

> `[ATENÇÃO]` Pricing Calculator estima o custo *no Azure*. TCO compara o on-premises com o Azure. Se a pergunta fala de "economia de migrar", é TCO.

## Cost Management: ver, alertar, reduzir

O **Microsoft Cost Management** mostra o que você gastou, por recurso, grupo, tag e período, e permite orçar e alertar.

```bash
az consumption usage list --start-date 2026-01-01 --end-date 2026-01-31 \
  --query "[].{recurso:instanceName, custo:pretaxCost, moeda:currency}" -o table | head -20

# Budget mensal de R$/US$ 50 no RG, alerta aos 80% e 100%
az consumption budget create --budget-name bgt-trilhashop --category cost \
  --amount 50 --time-grain monthly \
  --start-date 2026-01-01 --end-date 2027-01-01 \
  --resource-group rg-trilhashop-dev \
  --notifications '{"alerta80":{"enabled":true,"operator":"GreaterThan","threshold":80,"contactEmails":["voce@exemplo.com"]}}'
az consumption budget list -o table

az advisor recommendation list --category Cost -o table      # recomendações de economia
```

> `[ATENÇÃO]` **Budget alerta, mas não corta.** Atingir o limite não desliga nada; para agir automaticamente, ligue o budget a um *action group* que dispare uma automação (por exemplo, desalocar VMs). Os dados de custo também têm **atraso** (horas), então não são em tempo real.

![Cost Management — Cost analysis agrupando o custo por resource group em um mês](screenshots/16-custos-e-suporte/01-cost-analysis.png)
> `[PRINT]` Passo a passo para capturar: portal → Cost Management → Cost analysis. Agrupar por "Resource group" ou "Tag: projeto" e capturar o gráfico.

### Tags para custos

As tags `projeto` e `ambiente` do Módulo 03 viram filtros na Cost analysis: "quanto custou o TrilhaShop em dev?". Sem tag, o custo fica anônimo. Boa prática: exigir tags com Azure Policy.

## Como reduzir, na prática

1. **Apagar/desalocar** o que está ocioso (`az vm deallocate`, `az group delete`).
2. **Dimensionar certo** (*right-sizing*): VM maior do que a carga pede.
3. **Comprometer-se** com Reservations/Savings Plan para carga estável.
4. **Spot** para trabalho tolerante a interrupção.
5. **Tiers de storage** e lifecycle (Módulo 10).
6. **Autoscale** e *scale to zero* (Módulos 08, 09, 12).
7. **Hybrid Benefit** e licenças.
8. **Desligar ambientes de dev à noite** (automação).

## SLAs, ciclo de vida e suporte

- **SLA** (acordo de nível de serviço): a Microsoft garante uma disponibilidade (ex.: 99,9%); se não cumprir, você recebe **créditos de serviço**, não prejuízo em dinheiro. Cada serviço tem o seu; a composição segue o raciocínio do Módulo 15.
- **Ciclo de vida**: **Private preview** (convidados, sem SLA), **Public preview** (aberto, *sem SLA* normalmente, não para produção), **GA — General Availability** (pronto para produção, com SLA).
- **Planos de suporte**: **Basic** (grátis, faturamento e documentação), **Developer**, **Standard**, **Professional Direct** (pagos, com tempos de resposta e acesso a engenheiros); **Enterprise** via Unified.

> `[TEORIA]` Pergunta clássica: "um serviço em *public preview* tem SLA?" → normalmente **não**, e não deve ser usado em produção.

## Práticas

### Prática isolada

1. Abra a Pricing Calculator e monte: 2 VMs `D2s_v5` em Brazil South + 1 Load Balancer + 100 GB de armazenamento. Anote o total e repita com *Reserved 1 ano*.
2. Na Cost analysis, agrupe por tag e por serviço.
3. Crie um budget mensal e uma notificação por e-mail pelo CLI.
4. Liste as recomendações de custo do Advisor.

### Contribuição ao projeto integrador

Controle de custo do TrilhaShop:

1. Budget `bgt-trilhashop` com alertas a 80% e 100% no `rg-trilhashop-dev`.
2. Relatório (cost analysis agrupada pela tag `projeto`) salvo/exportado.
3. Uma tabela no `decisoes.md`: custo estimado/mês do TrilhaShop em dev, com e sem Reservation/Spot, e quais recursos *devem* ser desalocados à noite.

`[CUSTO]` Os recursos de Cost Management e Advisor são gratuitos; exportações de dados cobram só o armazenamento.

## Erros comuns nesta fase

- Achar que o budget bloqueia o gasto.
- Confundir Pricing Calculator com TCO Calculator.
- Esquecer o custo de **saída de dados** (egress).
- Não aplicar tags e ficar sem como separar custos.
- Usar serviço em preview em produção esperando SLA.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Tags | Governança — Módulo 03 |
| Reservations/Spot | VMs — Módulo 08 |
| Scale to zero | Containers e Serverless — Módulos 09 e 12 |
| FinOps | Projeto final — Módulo 18 e GCP — Módulo 16 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Microsoft Cost Management*: https://learn.microsoft.com/azure/cost-management-billing/costs/overview-cost-management
- Microsoft Learn — *Plan and manage costs*: https://learn.microsoft.com/azure/cost-management-billing/understand/plan-manage-costs
- Microsoft Learn — *Reservations*: https://learn.microsoft.com/azure/cost-management-billing/reservations/save-compute-costs-reservations
- Microsoft Learn — *Azure SLAs*: https://azure.microsoft.com/support/legal/sla/
- Microsoft Learn — *Support plans*: https://azure.microsoft.com/support/plans/
- Pricing Calculator: https://azure.microsoft.com/pricing/calculator/ · TCO: https://azure.microsoft.com/pricing/tco/calculator/
- FinOps Foundation: https://www.finops.org/

**Como aprofundar:** o *Cost optimization pillar* do Well-Architected Framework (https://learn.microsoft.com/azure/well-architected/cost-optimization/) e o curso gratuito de FinOps.

## Checklist de saída

- [ ] Citar os fatores que determinam o custo de um recurso.
- [ ] Diferenciar Pricing Calculator de TCO Calculator.
- [ ] Diferenciar Reservations, Savings Plan, Spot e Hybrid Benefit.
- [ ] Explicar o que um budget faz e **o que não faz**.
- [ ] Usar tags para dividir custo por projeto.
- [ ] Diferenciar preview e GA quanto a SLA e uso em produção.
- [ ] Listar os planos de suporte e quando usar cada um.
- [ ] Ter criado o budget do TrilhaShop.
