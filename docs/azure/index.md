---
id: index
title: Trilha Azure
sidebar_label: Visão geral
sidebar_position: -1
slug: /
---

**Certificações-alvo:** AZ-900 (Azure Fundamentals) e AZ-104 (Azure Administrator Associate).

Esta trilha ensina Azure em módulos, na mesma ordem de aprendizado da trilha AWS, para facilitar a comparação entre clouds. A teoria fica de um lado da tela e o terminal (`az`, no WSL ou no Cloud Shell) do outro: cada módulo traz comandos para rodar, laboratórios isolados e uma contribuição ao **projeto integrador TrilhaShop**, o e-commerce fictício que você constrói passo a passo e reproduz do zero no módulo final.

Os espaços marcados com `[PRINT]` são capturas de tela que ainda serão adicionadas, seguindo o passo a passo de cada módulo.

## Como estudar

1. Leia o conceito, depois rode os comandos na segunda tela.
2. Faça a **prática isolada** e depois a **contribuição ao projeto**.
3. Apague o que criou (cada módulo traz o comando de limpeza) e confira o `[CUSTO]`.
4. Feche com o **checklist de saída** antes de avançar.

## Módulos

* [Módulo 00: Preparando o ambiente](./00_preparando_o_ambiente.md) — conta, `az` no WSL, login, `--query`
* [Módulo 01: Conceitos de Nuvem](./01_conceitos_de_nuvem.md) — IaaS/PaaS/SaaS, CapEx x OpEx, responsabilidade compartilhada
* [Módulo 02: Infraestrutura Global do Azure](./02_infraestrutura_global_do_azure.md) — regiões, pares, zonas de disponibilidade
* [Módulo 03: Hierarquia e Governança](./03_hierarquia_e_governanca.md) — grupos de gerenciamento, Policy, locks, tags, RBAC
* [Módulo 04: Identidade e Acesso](./04_identidade_e_acesso.md) — Entra ID, MFA, Conditional Access, Managed Identities
* [Módulo 05: Segurança na Nuvem](./05_seguranca_na_nuvem.md) — Defender, Key Vault, Zero Trust, NSG
* [Módulo 06: Redes Virtuais](./06_redes_virtuais.md) — VNet, peering, UDR, Private Endpoint, VPN, ExpressRoute
* [Módulo 07: Balanceamento e Entrega de Conteúdo](./07_balanceamento_e_entrega_de_conteudo.md) — Load Balancer, Application Gateway, Front Door, Traffic Manager
* [Módulo 08: Máquinas Virtuais](./08_maquinas_virtuais.md) — tamanhos, discos, Scale Sets, backup
* [Módulo 09: App Services e Containers](./09_app_services_e_containers.md) — App Service, ACI, ACR, Container Apps, AKS
* [Módulo 10: Armazenamento](./10_armazenamento.md) — Storage Accounts, redundância, tiers, SAS
* [Módulo 11: Banco de Dados](./11_banco_de_dados.md) — Azure SQL, Cosmos DB, PostgreSQL/MySQL
* [Módulo 12: Computação Serverless](./12_computacao_serverless.md) — Functions, Logic Apps, Event Grid, Service Bus
* [Módulo 13: Azure CLI, PowerShell e Cloud Shell](./13_azure_cli_powershell_e_cloud_shell.md) — scripts idempotentes, `az rest`, Arc
* [Módulo 14: Infraestrutura como Código](./14_infraestrutura_como_codigo.md) — Bicep, templates ARM, Terraform
* [Módulo 15: Monitoramento e Resiliência](./15_monitoramento_e_resiliencia.md) — Monitor, Log Analytics, alertas, RPO/RTO
* [Módulo 16: Custos e Suporte](./16_custos_e_suporte.md) — Pricing Calculator, TCO, Cost Management, SLAs
* [Módulo 17: IA e Machine Learning](./17_ia_e_machine_learning.md) — Azure AI Services, Azure OpenAI, Azure ML
* [Módulo 18: Projeto final e preparação para certificação](./18_projeto_final_e_preparacao_para_certificacao.md) — reconstrução do TrilhaShop e revisão de prova
