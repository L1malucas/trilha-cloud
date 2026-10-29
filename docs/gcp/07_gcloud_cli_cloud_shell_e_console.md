---
id: "07_gcloud_cli_cloud_shell_e_console"
title: "Módulo 07 — gcloud CLI, Cloud Shell e Console"
sidebar_label: "07 · gcloud, Cloud Shell e Console"
sidebar_position: 7
---

# Módulo 07 — gcloud CLI, Cloud Shell e Console

> **Objetivo**: consolidar o uso do `gcloud` como ferramenta de automação — configurações, APIs, `--format`/`--filter`, impersonação, `curl` na REST API, scripts idempotentes — conhecer o Cloud Shell e os outros utilitários do SDK (`gcloud storage`, `bq`, `kubectl`) e escrever o `provisiona.sh`/`limpa.sh` do TrilhaShop.
>
> **Pré-requisitos**: módulo 00 e as práticas dos módulos 03–06.
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre "Using the Google Cloud CLI, Cloud Shell and Console" do **Associate Cloud Engineer**. Referência: https://cloud.google.com/sdk/docs

---

## Todos os caminhos levam à mesma API

Console, `gcloud`, Cloud Shell e SDKs falam com as **mesmas APIs REST**. Este módulo transforma o `gcloud` de "comandos soltos" em ferramenta de engenharia: repetir, versionar e reproduzir.

| Ferramenta | Natureza | Ideal para |
|---|---|---|
| `gcloud` | CLI principal (muitos serviços) | Scripts, CI, dia a dia |
| `gcloud storage` | Cloud Storage (substitui o antigo `gsutil`) | Copiar, sincronizar, permissões de buckets |
| `bq` | BigQuery | Consultas e tabelas |
| `kubectl` | Kubernetes (GKE) | Operar clusters |
| **Cloud Shell** | Terminal no navegador, já autenticado | Começar sem instalar nada |
| REST/SDKs | API direta | Integração em código |

> `[TEORIA]` O ACE cobra o conhecimento de **qual ferramenta** usar: `gcloud` para a maioria, `gcloud storage`/`gsutil` para Storage, `bq` para BigQuery, `kubectl` para Kubernetes.

## Cloud Shell

O **Cloud Shell** (ícone `>_` no Console, ou https://shell.cloud.google.com) é uma VM Debian efêmera e gratuita com `gcloud`, `kubectl`, `terraform`, editor (Cloud Shell Editor, baseado em Code OSS) e **5 GB de disco persistente** em `$HOME`. Já vem autenticado como você, com o projeto da sessão.

```bash
gcloud config list                # no Cloud Shell: projeto já definido
pwd; df -h $HOME
cloudshell edit arquivo.sh        # abre no editor
```

> `[ATENÇÃO]` Só o `$HOME` persiste; o resto da VM é reciclado. Instalações fora de `$HOME` somem após a sessão.

## Configurações e propriedades

```bash
gcloud config list                                   # propriedades ativas
gcloud config set project <ID>
gcloud config set compute/region southamerica-east1
gcloud config set compute/zone southamerica-east1-a
gcloud config unset compute/zone
gcloud config configurations list                    # várias configurações (trilhashop, trabalho, ...)
gcloud config configurations activate trilhashop
gcloud --configuration=trilhashop compute instances list     # usa outra configuração só neste comando
gcloud components list                               # componentes do SDK (kubectl, alpha, beta...)
gcloud components update                             # (se instalou via instalador padrão)
gcloud topic configurations                          # ajuda conceitual
```

Há também **variáveis de ambiente** (`CLOUDSDK_CORE_PROJECT`) e a flag `--project` em cada comando, que têm precedência.

## APIs: habilitar e consultar

```bash
gcloud services list --available --filter="name:run" --format="value(name)"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
gcloud services list --enabled --format="value(config.name)"
gcloud services disable run.googleapis.com
```

## Formatação e filtros: o que torna o `gcloud` scriptável

```bash
gcloud compute instances list --format=json | jq '.[] | {nome:.name, ip:.networkInterfaces[0].networkIP}'
gcloud compute instances list --format="value(name,zone.basename(),status)"
gcloud compute instances list --filter="status=RUNNING AND labels.projeto=trilhashop" --format="table(name,machineType.basename())"
gcloud compute instances list --sort-by=~creationTimestamp --limit=3 --format="table(name,creationTimestamp)"
gcloud projects list --format="csv(projectId,name)"
gcloud compute disks list --format="table(name,sizeGb,type.basename(),users.basename())"
```

- `--format`: `table(...)`, `value(...)`, `csv(...)`, `json`, `yaml`, `json(campos)`. Em `table(...)`, funções como `basename()` encurtam URLs de recursos.
- `--filter`: expressões como `status=RUNNING AND labels.env=prod`, `name~^api-`, `creationTimestamp<'2026-01-01'`.
- `--sort-by` (`~` inverte), `--limit`.

> `[TENTE VOCÊ]` Liste só os nomes das VMs paradas (`TERMINATED`). Resposta: `gcloud compute instances list --filter="status=TERMINATED" --format="value(name)"`.

## Descobrindo comandos e ajuda

```bash
gcloud help                                          # visão geral
gcloud compute instances create --help               # ajuda completa (setas, / busca, q sai)
gcloud compute instances create -h                   # resumo
gcloud beta compute ...  /  gcloud alpha ...         # comandos em beta/alfa (podem mudar)
gcloud interactive                                   # modo interativo com autocompletar e ajuda
gcloud feedback
```

## Identidade: impersonar e chamar a REST API

```bash
# Atuar como uma service account (sem chave) para testar permissões
gcloud compute instances list --impersonate-service-account=sa-trilhashop-api@$PROJETO.iam.gserviceaccount.com

# Chamar a API REST diretamente, com o token da sua conta
TOKEN=$(gcloud auth print-access-token)
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://compute.googleapis.com/compute/v1/projects/$PROJETO/zones/southamerica-east1-a/instances" | jq '.items[]?.name'

# Credenciais para bibliotecas/SDKs rodando localmente (Application Default Credentials)
gcloud auth application-default login
```

> `[ATENÇÃO]` Há **duas** autenticações: `gcloud auth login` (para o próprio `gcloud`) e `gcloud auth application-default login` (ADC, usada por SDKs e Terraform). Confundi-las é a causa mais comum de "o gcloud funciona, mas o meu código/Terraform não".

## Scripts: idempotentes, parametrizados, seguros

Um bom script de infra é **idempotente** (rodar duas vezes não quebra), **parametrizado**, **falha cedo** e **limpa depois**:

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJ=${PROJ:-$(gcloud config get project)}
REGIAO=${REGIAO:-southamerica-east1}
REDE=vpc-trilhashop

echo ">> Projeto: $PROJ  Região: $REGIAO"

# helper: cria só se ainda não existir
existe() { gcloud "$@" --project="$PROJ" >/dev/null 2>&1; }

if ! existe compute networks describe "$REDE"; then
  gcloud compute networks create "$REDE" --subnet-mode=custom --project="$PROJ"
  echo "rede criada"
else
  echo "rede já existe, pulando"
fi

if ! existe compute networks subnets describe snet-app --region="$REGIAO"; then
  gcloud compute networks subnets create snet-app --network="$REDE" \
    --region="$REGIAO" --range=10.10.2.0/24 --project="$PROJ"
fi
```

Boas práticas: `set -euo pipefail`; `--quiet` (sem prompts) em automação; `--format=value(...)` para capturar valores; `describe` antes de `create`; e `--project` explícito.

## Cloud Storage com `gcloud storage` (e o `gsutil` legado)

```bash
gcloud storage buckets create gs://trilhashop-$RANDOM --location=southamerica-east1
gcloud storage cp arquivo.txt gs://<BUCKET>/
gcloud storage cp -r ./pasta gs://<BUCKET>/pasta
gcloud storage ls gs://<BUCKET> --long
gcloud storage rsync ./site gs://<BUCKET>/site --recursive
gcloud storage rm -r gs://<BUCKET>
```

`gsutil` ainda aparece em provas e documentação antiga (`gsutil cp`, `gsutil ls`); a recomendação atual é migrar para `gcloud storage`, que é mais rápido.

## Práticas

### Prática isolada

1. Abra o Cloud Shell e rode `gcloud config list`; compare com o seu WSL.
2. Liste as VMs/discos com 3 formatos diferentes (`table`, `value`, `json | jq`).
3. Use `--filter` para listar só recursos com o label `projeto=trilhashop`.
4. Chame a API REST de Compute com `curl` e o token e compare com `gcloud compute instances list`.
5. Rode o script idempotente **duas vezes**: a segunda deve terminar sem erro e sem recriar nada.

### Contribuição ao projeto integrador

Crie **`provisiona.sh`** e **`limpa.sh`** do TrilhaShop:

- `provisiona.sh`: cria VPC, sub-redes, firewall rules, Cloud NAT, SA, segredo e demais peças já feitas, idempotente e parametrizado por `PROJ`/`REGIAO`.
- `limpa.sh`: remove, em ordem inversa (dependências primeiro), tudo marcado com o label `projeto=trilhashop`, ou apaga o projeto de laboratório.
  ```bash
  # exemplo: apagar VMs e discos com o label
  gcloud compute instances list --filter="labels.projeto=trilhashop" --format="value(name,zone.basename())" |
  while read -r nome zona; do gcloud compute instances delete "$nome" --zone="$zona" --quiet; done
  ```
- Rode `provisiona.sh` duas vezes (prova de idempotência).

`[CUSTO]` O Cloud Shell é gratuito (com cotas semanais de uso). Os scripts criam recursos reais: **sempre termine com `limpa.sh`**.

## Erros comuns nesta fase

- Scripts que falham na segunda execução (não idempotentes).
- Confundir `gcloud auth login` com `application-default login`.
- Operar no projeto errado (cheque `gcloud config list`).
- Apagar recursos em ordem errada (dependências: VM antes do disco/NAT/rede).
- Dados sensíveis em scripts versionados.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Scripts idempotentes | IaC (Terraform) — Módulo 14 |
| `--format`/`--filter` | Todos os labs; custos — Módulo 16 |
| ADC e impersonação | Terraform, SDKs — Módulos 14 e 17 |
| Bash robusto | Trilha Linux, Módulo 11 |
| CLI do Azure | Azure, Módulos 00 e 13 |

## `[REFERÊNCIA]`

- Google Cloud — *gcloud CLI overview*: https://cloud.google.com/sdk/gcloud
- Google Cloud — *Referência do gcloud*: https://cloud.google.com/sdk/gcloud/reference
- Google Cloud — *Cloud Shell*: https://cloud.google.com/shell/docs
- Google Cloud — *Filters, formats, projections*: https://cloud.google.com/sdk/gcloud/reference/topic/formats
- Google Cloud — *`gcloud storage`*: https://cloud.google.com/storage/docs/discover-object-storage-gcloud
- Google Cloud — *Authentication (ADC)*: https://cloud.google.com/docs/authentication/application-default-credentials
- Google Cloud — *Best practices for scripting*: https://cloud.google.com/sdk/docs/scripting-gcloud

**Como aprofundar:** o guia *Scripting gcloud commands* e treinar 10 combinações de `--filter`/`--format` do mais simples ao mais complexo.

## Checklist de saída

- [ ] Explicar que Console, gcloud, Cloud Shell e REST usam as mesmas APIs.
- [ ] Gerenciar configurações nomeadas e propriedades do `gcloud`.
- [ ] Habilitar/desabilitar APIs e entender os erros de "API not enabled".
- [ ] Usar `--format`, `--filter`, `--sort-by` para alimentar scripts.
- [ ] Diferenciar `auth login` de `application-default login`.
- [ ] Chamar a API REST com `curl` e token.
- [ ] Escrever um script idempotente com `set -euo pipefail`.
- [ ] Ter escrito e testado `provisiona.sh` e `limpa.sh`.
