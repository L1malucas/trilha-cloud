---
id: "01_conceitos_de_nuvem_e_transformacao_digital"
title: "Módulo 01 — Conceitos de Nuvem e Transformação Digital"
sidebar_label: "01 · Conceitos e Transformação Digital"
sidebar_position: 1
---

# Módulo 01 — Conceitos de Nuvem e Transformação Digital

> **Objetivo**: entender o que a nuvem muda na forma de comprar e operar tecnologia, os modelos de serviço, a responsabilidade compartilhada e as estratégias de modernização — e sentir a diferença entre IaaS e serverless criando os dois.
>
> **Pré-requisitos**: módulo 00.
>
> **Tempo de referência (não prazo)**: uma semana em ritmo moderado.
>
> Cobre o domínio **Digital transformation with Google Cloud** do **Cloud Digital Leader** (https://cloud.google.com/learn/certification/cloud-digital-leader) e a base do **Associate Cloud Engineer**.

---

## Da obra própria ao aluguel

Para ter energia em casa você pode instalar um gerador (compra cara, manutenção sua, capacidade fixa) ou ligar-se à rede elétrica e pagar pelo consumo. Computação em nuvem é a segunda opção aplicada a servidores: em vez de comprar hardware para o pico do ano e deixá-lo ocioso o resto do tempo, você aluga capacidade e paga pelo uso.

- **CapEx** (despesa de capital): compra antecipada de ativos (servidores, datacenter).
- **OpEx** (despesa operacional): pagamento recorrente pelo uso.

A nuvem troca CapEx por OpEx e ganha **elasticidade**: capacidade que cresce e encolhe em minutos.

> `[TEORIA]` A pergunta de negócio que o Cloud Digital Leader cobra não é "qual serviço usar", e sim **por que** migrar: agilidade, custo variável, escala global, segurança gerenciada, inovação (dados e IA). Saiba argumentar o benefício, não só listar produtos.

## Benefícios e propriedades

| Propriedade | Significa | Exemplo no TrilhaShop |
|---|---|---|
| **Elasticidade** | Crescer **e encolher** automaticamente | API escala de 2 para 20 instâncias na Black Friday e volta a 2 |
| **Escalabilidade** | Poder crescer: vertical (máquina maior) ou horizontal (mais máquinas) | `e2-small` → `e2-standard-4`, ou 1 → 5 VMs |
| **Alta disponibilidade** | Continuar respondendo apesar de falhas | VMs em duas zonas |
| **Tolerância a falhas** | Sobreviver à queda de um componente | Disco replicado |
| **Pay-as-you-go** | Paga pelo uso, por segundo/minuto | Cloud Run cobra só enquanto atende requisições |

> `[ATENÇÃO]` Escalabilidade **não** é elasticidade. A primeira é *poder* crescer; a segunda é crescer **e encolher** com a demanda, automaticamente.

## Modelos de implantação

- **Nuvem pública**: infraestrutura do provedor, compartilhada logicamente (o Google Cloud).
- **Nuvem privada**: dedicada a uma organização, no seu datacenter ou hospedada.
- **Híbrida**: pública + privada conectadas. No GCP, **Anthos/GKE Enterprise** gerencia clusters em qualquer lugar.
- **Multicloud**: usar mais de um provedor, por exigência regulatória, preço ou evitar dependência.

## Modelos de serviço: o que você ainda administra

Pense em pizza: **IaaS** é comprar a massa e assar em casa (você cuida de quase tudo); **PaaS** é encomendar a pizza (você só traz o código); **SaaS** é ir à pizzaria (software pronto).

```
                    IaaS             PaaS/Serverless      SaaS
Aplicação           você             você                 Google
Dados               você             você                 você (*)
Runtime/SO          você             Google               Google
Virtualização       Google           Google               Google
Hardware/Rede       Google           Google               Google
(*) dados e identidades são sempre sua responsabilidade.
```

Exemplos no GCP: **Compute Engine** (IaaS), **App Engine/Cloud Run/Cloud Functions** (PaaS/serverless), **Google Workspace** (SaaS). **Serverless** significa que você não gerencia servidor nenhum: escreve código ou entrega um container e o Google escala e cobra por uso.

## Responsabilidade compartilhada

O Google cuida da segurança **da** nuvem (datacenters, hardware, rede, host); você cuida da segurança **na** nuvem (dados, identidades, configuração, acessos). Quanto mais perto do SaaS, mais o Google assume. Em qualquer modelo, **dados, identidades e configuração de acesso são seus**.

> `[ATENÇÃO]` "Está no Google Cloud" não significa "o Google garante que ninguém acesse meus dados". Um bucket aberto por engano é erro **seu**. O Módulo 04 trata de IAM.

Referência: https://cloud.google.com/architecture/framework/security/shared-responsibility-shared-fate

## Estratégias de modernização (os "Rs")

Migrar não é uma coisa só. O Google Cloud Adoption Framework e o exame descrevem opções, do menor ao maior esforço:

| Estratégia | O que é | Quando |
|---|---|---|
| **Rehost** (*lift and shift*) | Move a VM como está | Pressa, aplicação legada, ganha-se pouco |
| **Replatform** | Pequenos ajustes (banco gerenciado, por exemplo) | Equilíbrio custo-benefício |
| **Refactor/Rearchitect** | Reescreve para serviços nativos (containers, serverless) | Quer ganhar o máximo da nuvem |
| **Retire / Retain** | Desligar ou manter onde está | Sistema obsoleto ou com restrição |

> `[TEORIA]` Para a prova: *lift and shift* é rápido e barato no início, mas **não** aproveita elasticidade nem serviços gerenciados; refatorar custa mais agora e rende mais depois. A resposta certa depende do objetivo do cenário.

## O Google Cloud no mercado: diferenciais

O Google destaca: **infraestrutura global própria** (rede privada de fibra, Módulo 02), **dados e analytics** (BigQuery), **IA** (Vertex AI, Gemini), **Kubernetes nativo** (o Google criou o Kubernetes), **segurança por padrão** (criptografia em repouso e em trânsito automática) e **sustentabilidade** (metas de energia livre de carbono). Conhecê-los ajuda nas perguntas de "por que Google Cloud".

## Práticas

### Prática isolada — IaaS x serverless

```bash
export PROJETO=$(gcloud config get project)
gcloud services enable compute.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# IaaS: uma VM. Você é responsável pelo SO (patches, firewall, serviços).
gcloud compute instances create vm-iaas --machine-type=e2-micro \
  --image-family=debian-12 --image-project=debian-cloud --labels=projeto=trilhashop

# Serverless: um container pronto no Cloud Run. O Google cuida de servidor e escala.
gcloud run deploy ola-run --image=us-docker.pkg.dev/cloudrun/container/hello \
  --region=southamerica-east1 --allow-unauthenticated --labels=projeto=trilhashop
```

Compare: na VM você precisa entrar por SSH, instalar runtime e aplicar patches; no Cloud Run só entrega a imagem e recebe uma URL com HTTPS. Anote 3 tarefas que seriam suas na VM e do Google no Cloud Run.

```bash
gcloud compute instances list --format="table(name,zone.basename(),machineType.basename(),status)"
gcloud run services list --format="table(metadata.name,status.url)"
```

![Terminal com a saída de `gcloud compute instances list` e `gcloud run services list`, mostrando a VM e o serviço Cloud Run criados](screenshots/01-conceitos-de-nuvem-e-transformacao-digital/01-iaas-vs-serverless.png)
> `[PRINT]` Passo a passo para capturar: rodar os dois comandos de listagem acima e capturar as saídas lado a lado.

**Limpeza:**

```bash
gcloud compute instances delete vm-iaas --zone=southamerica-east1-a --quiet
gcloud run services delete ola-run --region=southamerica-east1 --quiet
```

`[CUSTO]` Uma `e2-micro` por mês em regiões elegíveis está no Always Free (confira a região e as regras vigentes); em São Paulo, pode cobrar. Cloud Run tem cota gratuita mensal. Apague ao terminar.

### Contribuição ao projeto integrador

No `decisoes.md` do seu repositório de estudo, classifique cada peça do TrilhaShop e justifique:

| Peça | Modelo escolhido | Estratégia (rehost/replatform/refactor) | Por quê |
|---|---|---|---|
| Front estático | ? | ? | ? |
| API de catálogo | ? | ? | ? |
| Banco de dados | ? | ? | ? |
| Fila de pedidos | ? | ? | ? |

Não há resposta única: o objetivo é justificar a troca entre **controle** e **conveniência**.

## Erros comuns nesta fase

- Achar que "nuvem é sempre mais barata" (troca CapEx por OpEx e dá elasticidade; carga estável pode custar menos com compromisso, Módulo 16).
- Confundir escalabilidade e elasticidade.
- Achar que PaaS/SaaS tira toda a responsabilidade de segurança.
- Tratar migração como "uma única coisa" (lift and shift não é a única opção).

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| IaaS (VM) | Compute Engine — Módulo 08 |
| Serverless | Cloud Run e Functions — Módulo 10 |
| Responsabilidade compartilhada | IAM e segurança — Módulo 04 |
| CapEx x OpEx, modelo de consumo | Custos — Módulo 16 |

## `[REFERÊNCIA]`

- Google Cloud — *What is cloud computing?*: https://cloud.google.com/learn/what-is-cloud-computing
- Google Cloud — *Cloud Digital Leader: guia do exame*: https://cloud.google.com/learn/certification/guides/cloud-digital-leader
- Google Cloud — *Architecture Framework*: https://cloud.google.com/architecture/framework
- Google Cloud — *Compartilhamento de responsabilidade*: https://cloud.google.com/architecture/framework/security/shared-responsibility-shared-fate
- Google Cloud — *Migration to Google Cloud*: https://cloud.google.com/architecture/migration-to-gcp-getting-started
- Google Cloud Skills Boost: https://www.cloudskillsboost.google/

**Como aprofundar:** leia o *Google Cloud Adoption Framework* (https://cloud.google.com/adoption-framework) e o curso gratuito "Cloud Digital Leader" no Skills Boost.

## Checklist de saída

- [ ] Explicar CapEx x OpEx e por que a nuvem favorece OpEx.
- [ ] Diferenciar elasticidade de escalabilidade e escala vertical de horizontal.
- [ ] Explicar pública, privada, híbrida e multicloud.
- [ ] Preencher a tabela "quem administra o quê" em IaaS, PaaS/serverless e SaaS.
- [ ] Dizer o que é sempre responsabilidade do cliente.
- [ ] Comparar rehost, replatform e refactor.
- [ ] Ter criado e apagado uma VM e um serviço Cloud Run e comparado o esforço.
