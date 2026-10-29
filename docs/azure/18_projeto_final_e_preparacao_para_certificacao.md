---
id: "18_projeto_final_e_preparacao_para_certificacao"
title: "Módulo 18 — Projeto final e preparação para certificação"
sidebar_label: "18 · Projeto final e certificação"
sidebar_position: 18
---

# Módulo 18 — Projeto final e preparação para certificação

> **Objetivo**: fechar a trilha — montar o TrilhaShop completo no Azure a partir do código, revisar por domínio de prova (AZ-900 e AZ-104), planejar o estudo final e desmontar tudo sem deixar custo para trás.
>
> **Pré-requisitos**: módulos 00 a 17.
>
> **Tempo de referência (não prazo)**: duas a três semanas.
>
> Provas: **AZ-900** (https://learn.microsoft.com/credentials/certifications/azure-fundamentals/) e **AZ-104** (https://learn.microsoft.com/credentials/certifications/azure-administrator/). Os pesos dos domínios mudam; confira sempre o *study guide* vigente.

---

## O projeto final: do zero ao ambiente completo

Chegou a hora de provar que a trilha funcionou: reconstruir o TrilhaShop **do zero**, só a partir do seu repositório, sem clicar no Portal.

### Arquitetura alvo

```
Internet
   │
Front Door (CDN + WAF) ─── Storage (site estático, $web)
   │
Load Balancer (lb-api)
   │
VMSS / Container Apps (API)  ── Managed Identity ──► Key Vault (segredos)
   │            │
   │            └──► Service Bus / Queue ──► Function (processa pedidos)
   ▼
PostgreSQL (snet-dados, Private Endpoint)

Transversal: VNet + NSGs · Policy/Tags/Locks · Log Analytics + Alertas · Budget
```

### Roteiro de reconstrução

1. `git clone` do seu repositório de estudo (scripts `provisiona.sh`/`limpa.sh`, `main.bicep`, `decisoes.md`).
2. `az login` e `az account show` (assinatura certa?).
3. Governança: grupos, tags, policy e locks (Módulo 03).
4. Rede e segurança: VNet, NSGs, Key Vault (Módulos 05 e 06).
5. Dados: PostgreSQL privado, segredos no cofre (Módulo 11).
6. Aplicação: imagem no ACR, Container Apps/VMSS atrás do LB (Módulos 07–09).
7. Eventos: fila + Function (Módulo 12).
8. Front estático no Storage + Front Door (Módulos 07 e 10).
9. Observabilidade e custo: Log Analytics, alertas, budget (Módulos 15 e 16).
10. **Prova de funcionamento**: `curl` no front e na API, um pedido de ponta a ponta e um alerta disparado de propósito.

```bash
az deployment group what-if -g rg-trilhashop-dev -f main.bicep --parameters ambiente=dev
az deployment group create  -g rg-trilhashop-dev -f main.bicep --parameters ambiente=dev
./verifica.sh        # seus testes: curl no front, na API, leitura do segredo, etc.
```

### Critérios de aceite

- Tudo criado por código (Bicep/scripts), nada manual.
- Nenhum segredo no Git; tudo via Key Vault + Managed Identity.
- Banco sem IP público.
- Tags `projeto`/`ambiente` em 100% dos recursos (`az resource list --query "[?tags.projeto==null]"` deve vir vazio).
- Alerta e budget funcionando.
- Documentação: `decisoes.md` com as escolhas e o custo estimado.

> `[ATENÇÃO]` Antes de apagar, **tire os prints** pendentes dos módulos e registre tudo de que precisar: depois do `delete`, não dá para recuperar.

## Preparação para a prova

### AZ-900 — Azure Fundamentals

| Domínio | Onde estudar na trilha |
|---|---|
| Conceitos de nuvem | Módulo 01 |
| Arquitetura e serviços do Azure | Módulos 02, 06–12, 17 |
| Gestão e governança | Módulos 03–05, 13–16 |

### AZ-104 — Azure Administrator

| Domínio | Onde estudar na trilha |
|---|---|
| Identidades e governança | Módulos 03 e 04 |
| Armazenamento | Módulo 10 |
| Computação | Módulos 08, 09, 12, 14 |
| Redes virtuais | Módulos 05, 06, 07 |
| Monitorar e manter | Módulos 08 e 15 |

### Plano de revisão (sugestão)

1. **Semana 1** — Releia os checklists de saída; marque o que não consegue responder sem consultar.
2. **Semana 2** — Faça os *Practice Assessments* oficiais gratuitos do Microsoft Learn e erre sem pressa: o objetivo é descobrir lacunas.
3. **Semana 3** — Refaça, no terminal, os laboratórios dos domínios fracos. Na AZ-104 há **laboratórios práticos**, então fluência em `az` e no Portal conta.
4. **Véspera** — Revise tabelas de decisão (balanceamento, mensageria, redundância, containers) e SLA/RPO/RTO.

> `[TEORIA]` Dica de prova: leia o **fim** da pergunta primeiro (o que está sendo pedido), elimine as respostas que violam o menor privilégio ou a responsabilidade compartilhada e cuidado com palavras absolutas ("sempre", "nunca"). A AZ-104 tem estudos de caso e laboratórios; o Microsoft Learn oferece uma *exam sandbox*.

## Desmontagem completa

Ao encerrar, apague tudo e **confirme** que não sobrou nada cobrando:

```bash
./limpa.sh                                           # ou:
for rg in $(az group list --tag projeto=trilhashop --query "[].name" -o tsv); do
  az group delete -n "$rg" --yes --no-wait
done

az group list -o table                               # deve estar vazio
az resource list --query "length(@)"                 # 0
az disk list --query "[?managedBy==null].name" -o tsv   # discos órfãos
az network public-ip list --query "[?ipConfiguration==null].name" -o tsv   # IPs soltos
az keyvault list-deleted -o table                    # cofres em soft-delete
```

> `[ATENÇÃO]` Key Vaults e algumas contas ficam em **soft-delete** por dias; se a purge protection estiver ligada, o nome fica reservado. Verifique `az keyvault list-deleted` e, se permitido, `az keyvault purge`.

Confira também em **Cost Management** no dia seguinte: um gasto residual aponta algo esquecido.

`[CUSTO]` O custo desta fase é o do ambiente completo ligado: faça a prova de funcionamento em uma única sessão e desmonte logo em seguida.

## Erros comuns nesta fase

- Deixar recursos pelo caminho "para depois" e descobrir na fatura.
- Estudar só decorando; a prova cobra cenários e decisão.
- Pular os laboratórios da AZ-104.
- Não revisar o *skills outline* atualizado antes do exame.

## `[REFERÊNCIA]`

- Study guide AZ-900: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900
- Study guide AZ-104: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104
- Practice Assessments: https://learn.microsoft.com/credentials/certifications/exams/az-104/practice/assessment?assessment-type=practice
- Exam sandbox: https://aka.ms/examdemo
- Microsoft Learn — caminhos de aprendizado AZ-104: https://learn.microsoft.com/training/courses/az-104t00
- Azure Well-Architected Framework: https://learn.microsoft.com/azure/well-architected/

**Próximos passos:** AZ-500 (segurança), AZ-305 (arquitetura), AZ-400 (DevOps) ou a trilha Linux, que aprofunda IaC, containers e Kubernetes.

## Checklist de saída

- [ ] Reconstruir o TrilhaShop a partir do repositório, sem Portal.
- [ ] Passar nos critérios de aceite (segredos, banco privado, tags, alertas, budget).
- [ ] Ter revisado os checklists de todos os módulos.
- [ ] Ter feito os Practice Assessments do AZ-900 e/ou AZ-104.
- [ ] Ter desmontado o ambiente e confirmado que nada ficou cobrando.
