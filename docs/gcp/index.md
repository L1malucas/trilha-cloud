---
id: index
title: Trilha GCP
sidebar_label: Visão geral
sidebar_position: -1
slug: /
---

**Certificações-alvo:** Cloud Digital Leader e Associate Cloud Engineer (ACE).

Esta trilha ensina Google Cloud em módulos, na mesma ordem de aprendizado das trilhas AWS e Azure, para facilitar a comparação entre clouds. A teoria fica de um lado da tela e o terminal (`gcloud`, no WSL ou no Cloud Shell) do outro: cada módulo traz comandos para rodar, laboratórios isolados e uma contribuição ao **projeto integrador TrilhaShop**, o e-commerce fictício que você constrói passo a passo e reproduz do zero no módulo final.

Os espaços marcados com `[PRINT]` são capturas de tela que ainda serão adicionadas.

## Como estudar

1. Leia o conceito, depois rode os comandos na segunda tela.
2. Faça a **prática isolada** e depois a **contribuição ao projeto**.
3. Apague o que criou (cada módulo traz o comando de limpeza) e confira o `[CUSTO]`.
4. Feche com o **checklist de saída** antes de avançar.

## Módulos

* [Módulo 00: Preparando o ambiente](./00_preparando_o_ambiente.md) — conta, `gcloud` no WSL, projeto, configurações, APIs
* [Módulo 01: Conceitos de Nuvem e Transformação Digital](./01_conceitos_de_nuvem_e_transformacao_digital.md) — IaaS/PaaS/SaaS, CapEx x OpEx, modernização
* [Módulo 02: Infraestrutura Global do GCP](./02_infraestrutura_global_do_gcp.md) — regiões, zonas, edge, rede global
* [Módulo 03: Hierarquia de Recursos e Organização](./03_hierarquia_de_recursos_e_organizacao.md) — Organization, Folders, Projects, Billing, Org Policies, Labels
* [Módulo 04: IAM e Segurança](./04_iam_e_seguranca.md) — roles, service accounts, Secret Manager, Cloud KMS, Security Command Center
* [Módulo 05: Redes VPC](./05_redes_vpc.md) — VPC global, firewall, Cloud NAT, Shared VPC, Peering, VPN, Interconnect
* [Módulo 06: Load Balancing e Entrega de Conteúdo](./06_load_balancing_e_entrega_de_conteudo.md) — tipos de LB, Cloud CDN, Cloud Armor
* [Módulo 07: gcloud CLI, Cloud Shell e Console](./07_gcloud_cli_cloud_shell_e_console.md) — configurações, `--format`/`--filter`, scripts idempotentes
* [Módulo 08: Compute Engine](./08_compute_engine.md) — máquinas, discos, templates, MIGs, Spot, CUD
* [Módulo 09: Containers e Kubernetes](./09_containers_e_kubernetes.md) — Artifact Registry, Cloud Build, Cloud Run, GKE
* [Módulo 10: Serverless e Aplicações](./10_serverless_e_aplicacoes.md) — Cloud Run, Functions, Pub/Sub, Eventarc, App Engine
* [Módulo 11: Armazenamento](./11_armazenamento.md) — Cloud Storage, classes, lifecycle, Persistent Disk, Filestore
* [Módulo 12: Banco de Dados](./12_banco_de_dados.md) — Cloud SQL, AlloyDB, Spanner, Firestore, Bigtable, Memorystore
* [Módulo 13: Dados e Analytics](./13_dados_e_analytics.md) — BigQuery, Dataflow, Dataproc, Looker
* [Módulo 14: Infraestrutura como Código](./14_infraestrutura_como_codigo.md) — Terraform, Infrastructure Manager, Config Connector
* [Módulo 15: Operações e Monitoramento](./15_operacoes_e_monitoramento.md) — Cloud Monitoring, Logging, SLOs, alertas
* [Módulo 16: Custos e Faturamento](./16_custos_e_faturamento.md) — budgets, billing export, descontos, FinOps
* [Módulo 17: IA e Machine Learning](./17_ia_e_machine_learning.md) — Vertex AI, APIs pré-treinadas, Gemini, AutoML
* [Módulo 18: Projeto final e preparação para certificação](./18_projeto_final_e_preparacao_para_certificacao.md) — reconstrução do TrilhaShop e revisão de prova
