---
id: "00_preparando_o_ambiente"
title: "Módulo 00 — Preparando o ambiente"
sidebar_label: "00 · Preparando o ambiente"
sidebar_position: 0
---

# Módulo 00 — Preparando o ambiente

> **Objetivo**: deixar tudo pronto antes do primeiro conceito — conta Google Cloud com crédito, `gcloud` instalado no WSL, login feito, um **projeto** criado com faturamento e uma configuração nomeada para a trilha.
>
> **Pré-requisitos**: nenhum de GCP. Para o terminal, WSL2 instalado (Módulo 00 da trilha Linux) — ou use o **Cloud Shell** e volte ao WSL depois.
>
> **Tempo de referência (não prazo)**: meio dia.
>
> Este módulo não cai em prova, mas todos os laboratórios dependem dele. Referência: https://cloud.google.com/sdk/docs

---

## Quatro portas para o mesmo prédio

O Google Cloud tem uma **API única** por trás de tudo. O que muda é a porta de entrada:

| Porta | O que é | Quando usar |
|---|---|---|
| **Console** (console.cloud.google.com) | Interface web | Explorar e entender cada serviço |
| **`gcloud`** (Google Cloud SDK) | CLI principal | Scripts, automação, esta trilha |
| **Cloud Shell** | Terminal no navegador, já logado, com `gcloud`, `kubectl`, `terraform` | Começar sem instalar nada |
| **APIs/SDKs/Terraform** | Código | Integração e IaC (Módulo 14) |

Por isso um recurso criado por clique no Console aparece idêntico em `gcloud ... list`. A trilha ensina o conceito pelo Console e a prática pela CLI.

> `[TEORIA]` Regra prática (a mesma da AWS e do Azure): Console para explorar; CLI/API para repetir; IaC para reproduzir.

## Conta e crédito gratuito

Uma conta nova (https://cloud.google.com/free) recebe, na data desta escrita, **US$300 de crédito por 90 dias**, mais o programa **Always Free** (cotas mensais gratuitas de alguns serviços, como pequenas VMs, Cloud Storage e Cloud Run). Confira valores e regras atuais na página oficial.

![Página do Google Cloud Free Program com o crédito inicial e os produtos Always Free](screenshots/00-preparando-o-ambiente/01-free-program.png)
> `[PRINT]` Passo a passo para capturar: abrir https://cloud.google.com/free e capturar a seção de crédito e Always Free (ocultar dados pessoais ao criar a conta).

> `[ATENÇÃO]` O cartão serve para verificação. Ao fim do crédito ou dos 90 dias a conta **não** vira paga sozinha: você precisa fazer upgrade manualmente. Mesmo assim, crie um *budget* (Módulo 16) e apague o que não usa.

## Instalando o `gcloud` no WSL

```bash
sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates gnupg curl
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list
sudo apt-get update && sudo apt-get install -y google-cloud-cli
gcloud version
```

(Confira o passo a passo atual em https://cloud.google.com/sdk/docs/install#deb; as instruções de repositório mudam.)

## Login e projeto

```bash
gcloud auth login --no-launch-browser         # no WSL: abre um link, você cola o código de volta
gcloud auth list                              # contas autenticadas (a ativa tem *)
gcloud config list
```

O **projeto** é a fronteira de tudo no GCP (equivale a assinatura + resource group): recursos, permissões e faturamento ficam ligados a ele. O **ID do projeto** é único no mundo e imutável.

```bash
export PROJETO=trilhashop-$RANDOM                      # ID único
gcloud projects create $PROJETO --name="TrilhaShop"
gcloud billing accounts list                           # descubra o ID da conta de faturamento
gcloud billing projects link $PROJETO --billing-account=<ID-DA-CONTA>
```

Sem faturamento vinculado, a maioria dos serviços não pode ser usada. Em seguida, uma **configuração nomeada** guarda projeto, região e zona e evita repetir flags:

```bash
gcloud config configurations create trilhashop
gcloud config set project $PROJETO
gcloud config set compute/region southamerica-east1     # São Paulo
gcloud config set compute/zone southamerica-east1-a
gcloud config configurations list
gcloud config list
```

> `[ATENÇÃO]` Configurações nomeadas evitam o erro mais comum em quem tem mais de um projeto: criar recurso no projeto errado. Antes de comandos que criam algo, confira `gcloud config list` (ou `gcloud config get project`).

![Saída de `gcloud config list` com o projeto, a região São Paulo e a zona definidos](screenshots/00-preparando-o-ambiente/02-gcloud-config-list.png)
> `[PRINT]` Passo a passo para capturar: no WSL, rodar `gcloud config list`. Capturar a saída (ocultar o ID do projeto, se for compartilhar).

## Ativando APIs

No GCP, cada serviço é uma **API** que precisa estar habilitada **no projeto** antes do uso:

```bash
gcloud services list --available --filter="name:compute" | head
gcloud services enable compute.googleapis.com
gcloud services list --enabled
```

Erros como `API [x] not enabled` significam exatamente isso: rode `gcloud services enable x.googleapis.com`.

## Lendo a saída: `--format` e `--filter`

```bash
gcloud projects list --format="table(projectId,name,projectNumber)"
gcloud projects list --format="value(projectId)"            # só os IDs, para scripts
gcloud projects list --format=json
gcloud compute regions list --filter="name~^southamerica" --format="table(name,status)"
gcloud compute instances list --format="json(name,status)"
```

- `--format=table(...)` escolhe colunas; `value(...)` devolve texto puro (ideal para variáveis); `json`/`yaml` mostram tudo.
- `--filter` filtra no servidor/cliente (`name~^south` = casa com expressão regular).
- `gcloud <grupo> --help` e `gcloud help` documentam qualquer comando.

> `[TENTE VOCÊ]` Liste só o nome das regiões em `up`. Resposta: `gcloud compute regions list --filter="status=UP" --format="value(name)"`.

## Práticas

### Prática isolada

1. Instale o `gcloud`, faça login e crie o projeto.
2. Crie a configuração `trilhashop` e confirme com `gcloud config list`.
3. Habilite a API do Compute e liste as zonas de São Paulo:
   ```bash
   gcloud compute zones list --filter="region~southamerica-east1" --format="table(name,status)"
   ```

### Contribuição ao projeto integrador

O **TrilhaShop** é o e-commerce fictício que a trilha constrói módulo a módulo. Deixe pronto o projeto `trilhashop-*` com faturamento e a configuração nomeada. Tudo o que for criado terá o label `projeto=trilhashop` (Módulo 03), para localizar e apagar depois.

`[CUSTO]` Criar projeto e habilitar APIs é gratuito. O custo começa nos recursos. Ao final da trilha, `gcloud projects delete $PROJETO` remove **tudo** de uma vez.

## Erros comuns nesta fase

- Criar recurso no projeto errado (cheque `gcloud config list`).
- Esquecer de vincular o faturamento.
- Esquecer de habilitar a API do serviço.
- Confundir **ID do projeto** (texto único), **nome** (livre) e **número** (numérico).

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Projeto | Hierarquia e IAM — Módulos 03 e 04 |
| `--format`/`--filter` | Todos os labs; scripts — Módulo 07 |
| APIs habilitadas | Todos os serviços |
| Região/zona | Infraestrutura global — Módulo 02 |

## `[REFERÊNCIA]`

- Google Cloud — *Instalar a CLI gcloud*: https://cloud.google.com/sdk/docs/install
- Google Cloud — *Initializing the gcloud CLI*: https://cloud.google.com/sdk/docs/initializing
- Google Cloud — *gcloud configurations*: https://cloud.google.com/sdk/docs/configurations
- Google Cloud — *Filtros, formatos e projeções*: https://cloud.google.com/sdk/gcloud/reference/topic/formats
- Google Cloud Free Program: https://cloud.google.com/free
- Referência completa da CLI: https://cloud.google.com/sdk/gcloud/reference

**Como aprofundar:** o *Google Cloud Skills Boost* (https://www.cloudskillsboost.google/) tem laboratórios guiados gratuitos de início; reproduza-os no seu `gcloud`.

## Checklist de saída

- [ ] Explicar por que Console, `gcloud` e Cloud Shell mostram os mesmos recursos.
- [ ] Ter feito login e criado um projeto com faturamento vinculado.
- [ ] Ter uma configuração nomeada com projeto, região e zona.
- [ ] Habilitar uma API com `gcloud services enable`.
- [ ] Usar `--format` e `--filter` para extrair só o que precisa.
