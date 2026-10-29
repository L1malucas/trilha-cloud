---
id: "03_hierarquia_de_recursos_e_organizacao"
title: "Módulo 03 — Hierarquia de Recursos e Organização"
sidebar_label: "03 · Hierarquia de Recursos"
sidebar_position: 3
---

# Módulo 03 — Hierarquia de Recursos e Organização

> **Objetivo**: entender como o GCP organiza recursos — Organization, Folders, Projects e Resources —, a conta de faturamento, a herança de políticas, as Org Policies e os **labels**, e aplicar isso ao projeto do TrilhaShop.
>
> **Pré-requisitos**: módulos 00 a 02.
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre "Setting up a cloud solution environment" do **Associate Cloud Engineer** e governança do **Cloud Digital Leader**. Referência: https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy

---

## A árvore de pastas da empresa

Imagine o sistema de arquivos de uma empresa: pastas dentro de pastas, com permissões que descem da raiz. O GCP tem quatro níveis:

```
Organization  (a empresa; vinculada a um domínio Google Workspace/Cloud Identity)
  └─ Folder   (departamento, time, ambiente; podem aninhar)
       └─ Project   (fronteira de recursos, permissões e faturamento)
            └─ Resource   (VM, bucket, banco, topic...)
```

O princípio-chave é a **herança**: uma política IAM ou Org Policy definida num nível vale **para tudo abaixo** dele. Governança se desenha de cima para baixo. **Não é possível remover** a permissão herdada por um nível mais baixo (apenas negá-la com *deny policies*): por isso, dê acesso no menor escopo possível.

- **Project**: o nível onde os recursos de fato vivem. Tem **ID** (único, imutável), **nome** (livre) e **número** (gerado). Habilitar APIs, IAM e faturamento são por projeto.
- **Folder**: agrupa projetos (ex.: `producao`, `desenvolvimento`) para aplicar política em lote.
- **Organization**: o nó raiz; sem ela (contas pessoais), os projetos ficam "soltos", sem pastas nem Org Policies.

> `[ATENÇÃO]` Contas Gmail pessoais **não têm Organization**. Os exemplos de pastas e Org Policies abaixo exigem uma conta Google Workspace ou Cloud Identity (gratuito). Sem ela, pratique projetos, labels e IAM e **leia** a parte de Organization como conceito.

## Faturamento: a conta que paga

O **Billing Account** é separado da hierarquia de recursos: um projeto é **vinculado** a uma conta de faturamento, e é ela que paga. Vários projetos podem usar a mesma conta; um projeto sem conta ativa **não pode** usar serviços pagos.

```bash
gcloud billing accounts list
gcloud billing projects describe $(gcloud config get project) --format="value(billingAccountName,billingEnabled)"
gcloud billing projects link <PROJETO> --billing-account=<ID-DA-CONTA>
gcloud billing projects unlink <PROJETO>           # desliga o faturamento (serviços pagos param)
```

## Criando e organizando projetos

```bash
export ORG_ID=$(gcloud organizations list --format="value(ID)")      # vazio se não houver Organization
gcloud resource-manager folders create --display-name="producao" --organization=$ORG_ID
gcloud resource-manager folders list --organization=$ORG_ID

gcloud projects create trilhashop-dev-$RANDOM --name="TrilhaShop Dev" --folder=<ID-DA-PASTA>
gcloud projects list --format="table(projectId,name,parent.id)"
gcloud projects describe $(gcloud config get project)
gcloud projects move <PROJETO> --folder=<ID-DA-PASTA>
```

Padrão comum: **um projeto por ambiente e por aplicação** (`trilhashop-dev`, `trilhashop-prod`). Isso isola permissões, cotas e custos e limita o raio de impacto de um erro.

> `[ATENÇÃO]` `gcloud projects delete` **não apaga na hora**: o projeto entra em "pending deletion" por 30 dias, durante os quais pode ser restaurado (`gcloud projects undelete`). Depois disso, some de vez, com todos os recursos.

## Labels: etiquetas para achar e cobrar

**Labels** são pares chave-valor em recursos e projetos (`ambiente=prod`, `projeto=trilhashop`). Servem a inventário, automação e **alocação de custos** (aparecem na exportação de billing, Módulo 16).

```bash
gcloud projects update $(gcloud config get project) --update-labels=projeto=trilhashop,ambiente=dev
gcloud projects describe $(gcloud config get project) --format="value(labels)"
gcloud compute instances list --filter="labels.projeto=trilhashop" --format="table(name,labels)"
gcloud compute instances add-labels vm-api --labels=ambiente=dev --zone=southamerica-east1-a
```

> `[TEORIA]` Não confunda **labels** (metadados livres para organização e custo) com **tags de rede** (Módulo 05, usadas em firewall) e com **Resource Manager Tags** (tags com política e herança, mais novas). Em prova de ACE, "labels" quase sempre quer dizer organização e billing.

## Org Policies: guarda-corpos para toda a organização

Uma **Organization Policy** restringe **o que** pode ser feito, para todos, não importa a permissão IAM: IAM diz *quem* pode; Org Policy diz *o quê* é permitido. Pense numa portaria: mesmo o dono não passa com um objeto proibido.

Exemplos clássicos: restringir **regiões** (`constraints/gcp.resourceLocations`), bloquear IP público em VMs (`constraints/compute.vmExternalIpAccess`), proibir criação de chaves de service account (`constraints/iam.disableServiceAccountKeyCreation`), exigir login do SO.

```bash
gcloud org-policies list --project=$(gcloud config get project)
gcloud org-policies describe constraints/gcp.resourceLocations --project=$(gcloud config get project) --effective

cat > politica-regioes.yaml <<'EOF'
name: projects/<PROJETO>/policies/gcp.resourceLocations
spec:
  rules:
    - values:
        allowedValues:
          - in:southamerica-east1-locations
          - in:us-central1-locations
EOF
gcloud org-policies set-policy politica-regioes.yaml
```

(Constraints e valores como `in:southamerica-east1-locations` são *value groups*; consulte a lista atual em https://cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints.) Algumas políticas só funcionam por Organization.

> `[ATENÇÃO]` Uma Org Policy errada pode **bloquear você mesmo** (ex.: restringir regiões sem incluir a sua). Teste em projeto de laboratório, e prefira `dryRunSpec` quando disponível.

![Console de Resource Manager com a hierarquia Organization, Folders e Projects](screenshots/03-hierarquia-de-recursos-e-organizacao/01-resource-manager-hierarquia.png)
> `[PRINT]` Passo a passo para capturar: Console → IAM e administrador → Gerenciar recursos. Capturar a árvore com pastas e projetos (ou só os projetos, se não houver organização).

## Práticas

### Prática isolada

```bash
# 1. Um projeto de laboratório separado
export LAB=trilhashop-lab-$RANDOM
gcloud projects create $LAB --name="Lab Governanca" --labels=projeto=trilhashop,ambiente=lab
gcloud billing projects link $LAB --billing-account=<ID-DA-CONTA>

# 2. Labels e consulta
gcloud projects update $LAB --update-labels=dono=$USER
gcloud projects list --filter="labels.projeto=trilhashop" --format="table(projectId,labels)"

# 3. (Com Organization) Org Policy de regiões permitidas e teste
gcloud org-policies set-policy politica-regioes.yaml --project=$LAB
gcloud compute instances create vm-bloqueada --zone=europe-west1-b --project=$LAB    # deve FALHAR
```

**Limpeza:** `gcloud projects delete $LAB` (e confirme que não quer mais).

### Contribuição ao projeto integrador

Crie a base de governança do TrilhaShop:

1. Projetos `trilhashop-dev` e `trilhashop-prod` (em pastas, se houver Organization), ambos com a conta de faturamento.
2. Labels `projeto=trilhashop` e `ambiente=dev|prod` em ambos.
3. Org Policy restringindo as regiões a `southamerica-east1` e à região de DR (se a conta permitir).
4. No `decisoes.md`, desenhe a hierarquia escolhida e explique por que separou por ambiente.

`[CUSTO]` Projetos, pastas, labels e Org Policies são gratuitos.

## Erros comuns nesta fase

- Colocar tudo num único projeto "porque é mais fácil".
- Dar permissão no nível da Organization onde bastava o projeto.
- Esquecer que o ID do projeto é imutável e globalmente único.
- Apagar um projeto sem perceber que o faturamento e os recursos somem junto (há 30 dias para desfazer).
- Aplicar Org Policy sem testar e se bloquear.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Herança de políticas | IAM — Módulo 04 |
| Projeto como fronteira | VPC compartilhada, billing — Módulos 05 e 16 |
| Labels | Custos por label — Módulo 16 |
| Org Policies | Segurança e hardening — Módulo 04 |
| Hierarquia | Azure: Módulo 03 (management groups → subscriptions) |

## `[REFERÊNCIA]`

- Google Cloud — *Resource hierarchy*: https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy
- Google Cloud — *Creating and managing projects*: https://cloud.google.com/resource-manager/docs/creating-managing-projects
- Google Cloud — *Organization Policy Service*: https://cloud.google.com/resource-manager/docs/organization-policy/overview
- Google Cloud — *Constraints*: https://cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints
- Google Cloud — *Creating and managing labels*: https://cloud.google.com/resource-manager/docs/creating-managing-labels
- Google Cloud — *Landing zone design*: https://cloud.google.com/architecture/landing-zones

**Como aprofundar:** o guia *Decide a resource hierarchy for your Google Cloud landing zone* mostra padrões usados por empresas reais.

## Checklist de saída

- [ ] Desenhar de memória a hierarquia Organization → Folder → Project → Resource.
- [ ] Explicar a herança e por que se dá acesso no menor escopo.
- [ ] Explicar a relação entre projeto e conta de faturamento.
- [ ] Diferenciar ID, nome e número do projeto.
- [ ] Diferenciar IAM (quem) de Org Policy (o quê).
- [ ] Usar labels para organizar e filtrar recursos.
- [ ] Ter montado a base de governança do TrilhaShop.
