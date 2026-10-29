---
id: "14_infraestrutura_como_codigo"
title: "Módulo 14 — Infraestrutura como Código"
sidebar_label: "14 · Infraestrutura como Código"
sidebar_position: 14
---

# Módulo 14 — Infraestrutura como Código

> **Objetivo**: descrever a infraestrutura em arquivos versionáveis com **Terraform** (e conhecer Infrastructure Manager, Config Connector e Deployment Manager), usar `plan` antes de aplicar, guardar o state em um bucket e reproduzir o TrilhaShop com um único comando.
>
> **Pré-requisitos**: módulo 07 (scripts) e os recursos dos módulos 05–12. Terraform em profundidade: trilha Linux, Módulo 21.
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre "Infrastructure as code" do **Associate Cloud Engineer** (Terraform é a ferramenta recomendada pelo Google). Referência: https://cloud.google.com/docs/terraform

---

## Receita em vez de improviso

O script do Módulo 07 é **imperativo** ("faça isto, depois aquilo"): você precisa programar cada verificação de "já existe?". A IaC **declarativa** inverte: você descreve o **estado desejado** e a ferramenta calcula como chegar lá. Ganhos: **repetível**, **versionável** no Git, **auditável** e protegida contra **deriva** (*drift*).

| Ferramenta | Natureza | Observação |
|---|---|---|
| **Terraform** (e OpenTofu) | Declarativa, multi-cloud, com *state* | **Padrão da indústria e recomendado pelo Google** |
| **Infrastructure Manager** | Serviço gerenciado do Google que executa Terraform | Sucessor do Deployment Manager |
| **Deployment Manager** | Templates YAML/Python do Google | Em descontinuação — conheça, não adote |
| **Config Connector** | Gerencia recursos GCP por manifestos Kubernetes | Para quem já vive em K8s/GitOps |

> `[TEORIA]` O ACE tende a cobrar "qual ferramenta usar para IaC": **Terraform**. Deployment Manager aparece por história; o Google orienta migrar para Terraform/Infrastructure Manager.

## Terraform para GCP

O **provider `google`** traduz seus recursos em chamadas de API. O ciclo é `init → plan → apply → destroy`. Autenticação por **ADC** (Módulo 07): `gcloud auth application-default login`.

```bash
gcloud auth application-default login
mkdir -p ~/lab/tf-trilhashop && cd ~/lab/tf-trilhashop
```

```hcl
# main.tf
terraform {
  required_version = ">= 1.6"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 6.0" }
  }
}

variable "projeto" { type = string }
variable "regiao" {
  type    = string
  default = "southamerica-east1"
}
variable "ambiente" {
  type    = string
  default = "dev"
}

provider "google" {
  project = var.projeto
  region  = var.regiao
}

locals {
  labels = { projeto = "trilhashop", ambiente = var.ambiente }
}

resource "google_compute_network" "vpc" {
  name                    = "vpc-trilhashop-${var.ambiente}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "app" {
  name                     = "snet-app"
  network                  = google_compute_network.vpc.id
  region                   = var.regiao
  ip_cidr_range            = "10.10.2.0/24"
  private_ip_google_access = true
}

resource "google_compute_firewall" "web_para_app" {
  name    = "allow-web-to-app-${var.ambiente}"
  network = google_compute_network.vpc.name
  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }
  source_ranges = ["10.10.1.0/24"]
  target_tags   = ["app"]
}

resource "google_storage_bucket" "site" {
  name                        = "trilhashop-site-${var.projeto}"
  location                    = var.regiao
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = local.labels
}

output "vpc_id" { value = google_compute_network.vpc.id }
```

```bash
terraform init
terraform fmt && terraform validate
terraform plan  -var projeto=$(gcloud config get project)
terraform apply -var projeto=$(gcloud config get project)       # revise o plano e digite 'yes'
terraform plan  -var projeto=$(gcloud config get project)       # "No changes": idempotência
terraform state list
```

Leia o `plan`: `+` criar, `~` alterar, `-` apagar, `-/+` **recriar**. **Sempre leia o plano** antes de aplicar, principalmente os `-` e `-/+`.

> `[ATENÇÃO]` Para criar recursos, o Terraform usa as permissões da **sua** identidade (ADC): você precisa de roles suficientes no projeto. E as **APIs precisam estar habilitadas** — gerencie isso também por código com `google_project_service` para o `plan` ser reproduzível:
> ```hcl
> resource "google_project_service" "compute" {
>   service            = "compute.googleapis.com"
>   disable_on_destroy = false
> }
> ```

## State remoto: a memória compartilhada

O *state* (`terraform.tfstate`) mapeia seu código aos recursos reais e **contém dados sensíveis**. Em equipe, use um **backend remoto com bloqueio** num bucket do GCS (versionado):

```bash
gcloud storage buckets create gs://tfstate-$(gcloud config get project) --location=southamerica-east1 \
  --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets update gs://tfstate-$(gcloud config get project) --versioning
```

```hcl
terraform {
  backend "gcs" {
    bucket = "tfstate-<SEU-PROJETO>"
    prefix = "trilhashop"
  }
}
```

`terraform init -migrate-state` move o state local para o bucket (o GCS faz o *locking*). **Nunca** versione `*.tfstate` no Git.

## Módulos, variáveis e ambientes

Um **módulo** empacota um padrão reutilizável (a rede, o serviço Cloud Run). Use o mesmo módulo para `dev` e `prod` com **variáveis** diferentes (`terraform.tfvars` por ambiente, ou *workspaces*). O Google mantém módulos oficiais ("Cloud Foundation Toolkit"): https://github.com/terraform-google-modules.

```hcl
module "rede" {
  source   = "./modulos/rede"
  ambiente = "prod"
  cidr     = "10.20.0.0/16"
}
```

## Infrastructure Manager e Config Connector (visão)

- **Infrastructure Manager**: você aponta para um repositório com Terraform e o Google executa `plan/apply` gerenciando o state e as permissões. Bom para padronizar sem que cada pessoa rode Terraform localmente.
  ```bash
  gcloud infra-manager deployments apply projects/$PROJETO/locations/southamerica-east1/deployments/trilhashop \
    --service-account=projects/$PROJETO/serviceAccounts/sa-terraform@$PROJETO.iam.gserviceaccount.com \
    --git-source-repo=<REPO> --git-source-directory=. --git-source-ref=main
  ```
- **Config Connector**: declara recursos GCP como objetos Kubernetes (`kind: StorageBucket`) e o cluster os reconcilia — útil com GitOps (Módulos 19/23 da trilha Linux).

## Boas práticas

- Código no **Git**; mudanças por **Pull Request** com `terraform plan` anexado.
- State remoto, versionado e com bloqueio; **nunca** segredos em `.tf` ou `.tfvars` versionados (use Secret Manager e `sensitive = true`).
- **Menor privilégio**: uma **service account dedicada** ao Terraform (em vez de seu usuário) com os roles necessários, preferencialmente via *impersonation* ou Workload Identity Federation no CI.
- `terraform plan` em PR, `apply` só após aprovação (Módulo 22 da trilha Linux).
- Rotule tudo (`labels`) para custo.

![Saída do `terraform plan` mostrando os recursos a serem criados (VPC, sub-rede, firewall e bucket) com o resumo "Plan: 4 to add"](screenshots/14-infraestrutura-como-codigo/01-terraform-plan.png)
> `[PRINT]` Passo a passo para capturar: rodar `terraform plan` no projeto vazio. Capturar a lista de recursos e a linha "Plan: N to add".

## Práticas

### Prática isolada

1. Escreva o `main.tf` acima, rode `init`, `plan` e `apply`.
2. Rode `plan` de novo: deve mostrar **nenhuma mudança**.
3. Mude a faixa CIDR da sub-rede e leia o plano (alteração x recriação).
4. Mude algo **manualmente** no Console (ex.: um label do bucket) e rode `terraform plan` para ver o *drift*.
5. Migre o state para o bucket GCS.

**Limpeza:** `terraform destroy -var projeto=...`.

### Contribuição ao projeto integrador

Reescreva o TrilhaShop em **Terraform**: VPC, sub-redes, firewall, Cloud NAT, SA, buckets, Pub/Sub, Cloud SQL (privado), Cloud Run. Estruture em módulos (`rede`, `dados`, `app`) e rode com variáveis de ambiente. Prove: `terraform destroy` + `terraform apply` recria o ambiente **igual**. Segredos entram pelo Secret Manager, nunca em `.tfvars` versionado.

`[CUSTO]` Terraform é gratuito; o que ele cria, não. Use `plan` para estimar e `destroy` ao fim.

## Erros comuns nesta fase

- Aplicar sem ler o `plan`.
- Versionar o state ou `.tfvars` com segredos.
- Misturar clique no Console e Terraform no mesmo recurso (gera *drift*).
- Esquecer de habilitar as APIs (ou de gerenciá-las por código).
- Rodar o Terraform com um usuário Owner em vez de uma SA dedicada.
- Escolher Deployment Manager para projetos novos.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Terraform em profundidade | Trilha Linux, Módulo 21 |
| `plan` em pipeline | Trilha Linux, Módulo 22 |
| Mesmo código para Azure | Azure, Módulo 14 (Bicep/Terraform) |
| Ambiente reproduzível | Projeto final — Módulo 18 |

## `[REFERÊNCIA]`

- Google Cloud — *Terraform on Google Cloud*: https://cloud.google.com/docs/terraform
- HashiCorp — *Google provider*: https://registry.terraform.io/providers/hashicorp/google/latest/docs
- Google Cloud — *Infrastructure Manager*: https://cloud.google.com/infrastructure-manager/docs
- Google Cloud — *Config Connector*: https://cloud.google.com/config-connector/docs/overview
- Google Cloud — *Terraform best practices*: https://cloud.google.com/docs/terraform/best-practices-for-terraform
- Cloud Foundation Toolkit (módulos): https://github.com/terraform-google-modules
- Google Cloud — *Deployment Manager (descontinuação)*: https://cloud.google.com/deployment-manager/docs

**Como aprofundar:** o *Terraform Associate* da HashiCorp (trilha Linux, Módulo 21) e os módulos oficiais do Cloud Foundation Toolkit.

## Checklist de saída

- [ ] Explicar imperativo x declarativo e dar um exemplo de cada.
- [ ] Escrever recursos GCP em Terraform e rodar `init`, `plan`, `apply`, `destroy`.
- [ ] Interpretar o plano (`+`, `~`, `-`, `-/+`).
- [ ] Explicar o state e configurar backend remoto no GCS.
- [ ] Explicar Infrastructure Manager, Config Connector e o status do Deployment Manager.
- [ ] Aplicar boas práticas (SA dedicada, sem segredos no código, PR com plan).
- [ ] Ter recriado o TrilhaShop a partir do código.
