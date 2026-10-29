---
id: "13_azure_cli_powershell_e_cloud_shell"
title: "Módulo 13 — Azure CLI, PowerShell e Cloud Shell"
sidebar_label: "13 · CLI, PowerShell e Cloud Shell"
sidebar_position: 13
---

# Módulo 13 — Azure CLI, PowerShell e Cloud Shell

> **Objetivo**: consolidar o uso do `az` como ferramenta de automação — scripts idempotentes, `--query`, `az rest`, extensões — comparar com Azure PowerShell e Cloud Shell, entender Azure Arc e escrever o `provisiona.sh`/`limpa.sh` do TrilhaShop.
>
> **Pré-requisitos**: módulo 00 e práticas dos módulos 03–12 (você já usou `az` bastante).
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre **Describe Azure management and governance** (AZ-900) e as ferramentas de gestão cobradas em todo o AZ-104. Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104

---

## Todos os caminhos levam ao ARM

Você já sabe (Módulo 00) que Portal, CLI, PowerShell e SDKs conversam com a **mesma API REST do ARM**. Este módulo transforma essa ideia em prática de engenharia: repetir, versionar e reproduzir. Regra: **Portal para explorar; CLI/PowerShell para repetir; IaC (Módulo 14) para reproduzir com estado**.

| Ferramenta | Natureza | Ideal para |
|---|---|---|
| `az` (CLI) | Comandos, saída JSON, sintaxe de shell | Bash/Linux/WSL, scripts curtos, CI |
| Azure PowerShell (`Az`) | Cmdlets que devolvem *objetos* | Quem já usa PowerShell/Windows; manipular objetos |
| Cloud Shell | Terminal no navegador, já logado, com az/pwsh/terraform/kubectl | Começar rápido, máquina de terceiros |
| REST / SDK | API direta | Integração em código |

## Cloud Shell

O **Azure Cloud Shell** (portal → ícone `>_`, ou https://shell.azure.com) oferece Bash ou PowerShell no navegador, autenticado como você. Ele guarda arquivos num Azure Files montado em `~/clouddrive` — esse armazenamento cobra centavos.

```bash
# Dentro do Cloud Shell
az account show -o table
ls ~/clouddrive
code .          # editor Monaco embutido
```

## Azure PowerShell: o mesmo, com objetos

```powershell
Connect-AzAccount
Get-AzSubscription
New-AzResourceGroup -Name rg-lab-ps -Location brazilsouth -Tag @{projeto="lab"}
Get-AzVM | Select-Object Name, Location, @{n='Tamanho';e={$_.HardwareProfile.VmSize}} | Format-Table
Remove-AzResourceGroup -Name rg-lab-ps -Force
```

No WSL você pode instalar o `pwsh` (`sudo snap install powershell --classic`) e o módulo (`Install-Module Az -Scope CurrentUser`). A diferença de estilo: no `az` você filtra texto/JSON com `--query`; no PowerShell, passa **objetos** por pipe (`| Where-Object`).

## Escrevendo scripts de verdade

Um bom script de infraestrutura tem quatro qualidades: **idempotente** (rodar duas vezes não quebra), **parametrizado**, **falha cedo** e **limpa depois**.

```bash
#!/usr/bin/env bash
set -euo pipefail

# --- parâmetros ---
PROJ=${PROJ:-trilhashop}
ENV=${ENV:-dev}
LOC=${LOC:-brazilsouth}
RG="rg-${PROJ}-${ENV}"

echo ">> Garantindo resource group $RG"
az group create -n "$RG" -l "$LOC" --tags projeto="$PROJ" ambiente="$ENV" -o none   # idempotente

# --- função utilitária: cria só se não existir ---
existe() { az "$@" -o none 2>/dev/null; }

VNET="vnet-${PROJ}"
if ! existe network vnet show -g "$RG" -n "$VNET"; then
  az network vnet create -g "$RG" -n "$VNET" --address-prefixes 10.10.0.0/16 \
     --subnet-name snet-web --subnet-prefixes 10.10.1.0/24 -o none
  echo "vnet criada"
else
  echo "vnet já existe, pulando"
fi
```

Boas práticas: `set -euo pipefail` (para na primeira falha), `-o none` (silencia saída), `--query ... -o tsv` para capturar valores em variáveis, e `az group create` (que já é idempotente) como base.

> `[ATENÇÃO]` `--no-wait` devolve imediatamente e o recurso continua sendo criado. Se o próximo passo depende dele, use `az <recurso> wait --created` ou `--no-wait` só na limpeza.

### `az rest`: quando não existe comando

`az rest` chama qualquer endpoint do ARM já autenticado, útil para recursos novos ou recursos sem comando dedicado:

```bash
SUB=$(az account show --query id -o tsv)
az rest --method get \
  --url "https://management.azure.com/subscriptions/$SUB/resourcegroups?api-version=2022-12-01" \
  --query "value[].name" -o tsv
```

### Extensões e descoberta

```bash
az extension list-available --query "[].name" -o tsv | head
az extension add --name containerapp
az interactive            # modo interativo com autocompletar
az config set defaults.location=brazilsouth core.output=table
```

## Azure Arc: o Azure estendido

O **Azure Arc** projeta servidores, clusters Kubernetes e bancos que estão **fora do Azure** (on-premises, outras nuvens) para dentro do ARM, onde recebem tags, Policy, RBAC, Defender e Monitor como se fossem recursos nativos. É a peça da **nuvem híbrida** que você viu no Módulo 01.

```bash
az connectedmachine list -o table     # servidores conectados via Arc (extensão connectedmachine)
```

## Práticas

### Prática isolada

1. Abra o Cloud Shell e rode `az account show`; compare com o seu WSL.
2. Reescreva em PowerShell a criação e remoção de um resource group com tags.
3. Escreva um script que liste as 5 VMs mais caras (por tamanho) de todas as assinaturas, usando `--query`.
4. Use `az rest` para listar os resource groups e compare com `az group list`.

### Contribuição ao projeto integrador

Crie `provisiona.sh` e `limpa.sh`:

- `provisiona.sh`: cria RG, VNet/sub-redes, NSGs, Key Vault, Storage e demais peças já feitas, **idempotente** e parametrizado por `ENV`.
- `limpa.sh`: apaga tudo marcado com a tag `projeto=trilhashop`:
  ```bash
  for rg in $(az group list --tag projeto=trilhashop --query "[].name" -o tsv); do
    az group delete -n "$rg" --yes --no-wait
  done
  ```
- Rode `provisiona.sh` duas vezes: a segunda deve terminar sem erro (prova de idempotência).

`[CUSTO]` Cloud Shell só cobra o armazenamento do `clouddrive`. Os scripts criam recursos reais: **sempre termine com `limpa.sh`**.

## Erros comuns nesta fase

- Scripts que falham na segunda execução (não idempotentes).
- Senhas e IDs fixos dentro do script versionado.
- `--no-wait` seguido de comandos que dependem do recurso.
- Esquecer de checar `az account show` e rodar em outra assinatura.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Scripts idempotentes | IaC declarativo (Bicep/Terraform) — Módulo 14 |
| `az` em pipelines | CI/CD — trilha Linux, Módulo 22 |
| Bash robusto | Shell Script — trilha Linux, Módulo 11 |
| Arc | Monitoramento e governança híbridos — Módulo 15 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Azure CLI documentation*: https://learn.microsoft.com/cli/azure/
- Microsoft Learn — *Azure PowerShell*: https://learn.microsoft.com/powershell/azure/
- Microsoft Learn — *Cloud Shell*: https://learn.microsoft.com/azure/cloud-shell/overview
- Microsoft Learn — *az rest*: https://learn.microsoft.com/cli/azure/reference-index#az-rest
- Microsoft Learn — *Azure Arc*: https://learn.microsoft.com/azure/azure-arc/overview
- Azure CLI no GitHub (issues e exemplos): https://github.com/Azure/azure-cli

**Como aprofundar:** leia o guia "Querying Azure CLI output using JMESPath" e treine 10 consultas de `--query` do mais simples ao mais complexo (filtros, projeções, `sort_by`).

## Checklist de saída

- [ ] Explicar por que Portal, CLI, PowerShell e REST são equivalentes.
- [ ] Escolher entre `az`, PowerShell e Cloud Shell para um cenário.
- [ ] Escrever um script idempotente com `set -euo pipefail`.
- [ ] Usar `--query` e `-o tsv` para alimentar variáveis.
- [ ] Usar `az rest` para um endpoint sem comando dedicado.
- [ ] Descrever o que o Azure Arc faz.
- [ ] Ter escrito e testado `provisiona.sh` e `limpa.sh`.
