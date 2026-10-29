---
id: "14_infraestrutura_como_codigo"
title: "Módulo 14 — Infraestrutura como Código"
sidebar_label: "14 · Infraestrutura como Código"
sidebar_position: 14
---

# Módulo 14 — Infraestrutura como Código

> **Objetivo**: descrever a infraestrutura em arquivos versionáveis — templates ARM e, principalmente, **Bicep** — usar `what-if` antes de aplicar, entender Terraform no Azure e reproduzir o TrilhaShop com um único comando.
>
> **Pré-requisitos**: módulo 13 (scripts), e os recursos dos módulos 06–12.
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre **Deploy and manage Azure compute resources → templates ARM e Bicep** (AZ-104) e **Describe management and governance** (AZ-900). Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104

---

## Receita em vez de improviso

O script do Módulo 13 é **imperativo**: "faça isto, depois aquilo". Se algo já existe, você precisa programar cada verificação. A infraestrutura como código **declarativa** inverte: você descreve **o estado desejado** ("quero esta VNet com estas sub-redes") e a ferramenta calcula o que fazer para chegar lá — criar, alterar ou nada.

Vantagens: **repetível** (mesmo resultado sempre), **versionável** no Git (revisão de código para infraestrutura), **auditável** e **à prova de deriva** (*drift*: o ambiente se afastando do que foi planejado).

> `[TEORIA]` Regra: imperativo (CLI) para exploração e tarefas pontuais; declarativo (Bicep/Terraform) para infraestrutura que precisa ser reproduzida. Para o AZ-104, saiba que **Bicep e templates ARM são equivalentes** — Bicep é compilado para ARM JSON.

## Bicep: a linguagem nativa do Azure

**Bicep** é uma linguagem declarativa, mais limpa que o JSON do ARM, com tipagem, módulos e suporte de editor. Não tem *state file* próprio: o ARM é a fonte de verdade.

```bash
az bicep install
az bicep version
```

Um exemplo: a rede do TrilhaShop em `rede.bicep`.

```bicep
@description('Região dos recursos')
param location string = resourceGroup().location

@description('Ambiente (dev ou prod)')
@allowed(['dev', 'prod'])
param ambiente string = 'dev'

var vnetNome = 'vnet-trilhashop-${ambiente}'

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: vnetNome
  location: location
  tags: { projeto: 'trilhashop', ambiente: ambiente }
  properties: {
    addressSpace: { addressPrefixes: ['10.10.0.0/16'] }
    subnets: [
      { name: 'snet-web',   properties: { addressPrefix: '10.10.1.0/24' } }
      { name: 'snet-app',   properties: { addressPrefix: '10.10.2.0/24' } }
      { name: 'snet-dados', properties: { addressPrefix: '10.10.3.0/24' } }
    ]
  }
}

output vnetId string = vnet.id
```

Leia assim: `param` são entradas, `var` são valores calculados, `resource` declara um recurso (tipo@versão-da-API), `output` devolve valores.

### O ciclo: validar, simular, aplicar

```bash
az bicep build --file rede.bicep                       # compila para ARM JSON (valida sintaxe)
az deployment group what-if -g rg-trilhashop-dev -f rede.bicep --parameters ambiente=dev
az deployment group create  -g rg-trilhashop-dev -f rede.bicep --parameters ambiente=dev
az deployment group show    -g rg-trilhashop-dev -n rede --query properties.provisioningState -o tsv
```

O **`what-if`** mostra o que *seria* criado (+), alterado (~) ou apagado (-), **sem aplicar**. É o seu "plano" antes de agir — nunca pule.

> `[ATENÇÃO]` O modo padrão de implantação é **Incremental**: recursos não descritos no template **permanecem**. O modo **Complete** apaga o que não está no template — poderoso e perigoso. Use `what-if` antes de qualquer `--mode Complete`.

![Resultado do comando `what-if` mostrando recursos a criar em verde e a alterar em roxo](screenshots/14-infraestrutura-como-codigo/01-bicep-what-if.png)
> `[PRINT]` Passo a passo para capturar: rodar `az deployment group what-if` com o `rede.bicep` num RG vazio e capturar o resumo "Resource changes".

### Módulos Bicep

Um módulo é um arquivo Bicep reutilizado por outro. Isso evita repetição:

```bicep
module rede './rede.bicep' = {
  name: 'rede'
  params: { ambiente: ambiente }
}
```

## Templates ARM, em uma olhada

O formato original é JSON (`$schema`, `parameters`, `resources`, `outputs`). Você **raramente escreverá** à mão, mas precisa reconhecê-lo: o Portal exporta qualquer recurso como template ARM, e o Bicep pode ler ARM com `az bicep decompile --file template.json`.

## Terraform no Azure

**Terraform** (HashiCorp/IBM, ou o fork OpenTofu) é a IaC **multi-cloud**: a mesma linguagem (HCL) para Azure, AWS e GCP, com **providers** para cada serviço e um **state file** que registra o que existe. O `terraform plan` equivale ao `what-if`.

```hcl
terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 4.0" }
  }
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "sttfstate12345"
    container_name       = "tfstate"
    key                  = "trilhashop.tfstate"
  }
}
provider "azurerm" {
  features {}
}

resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-trilhashop"
  location            = "brazilsouth"
  resource_group_name = "rg-trilhashop-dev"
  address_space       = ["10.10.0.0/16"]
}
```

```bash
terraform init      # baixa providers e configura o backend
terraform plan      # mostra o que mudaria
terraform apply     # aplica
terraform destroy   # remove tudo que o state gerencia
```

> `[ATENÇÃO]` O **state** contém informações sensíveis e é a verdade do Terraform. Guarde-o em backend remoto com bloqueio (Storage Account, como acima), nunca no Git. A trilha Linux aprofunda Terraform no Módulo 21.

**Bicep ou Terraform?** Bicep: só Azure, sem state para gerir, suporte imediato a novos recursos. Terraform: multi-cloud, ecossistema enorme, mas exige gerir o state. Em empresas multi-cloud, Terraform; só Azure, Bicep costuma bastar.

## Práticas

### Prática isolada

1. Escreva `rede.bicep` conforme o exemplo e rode `build`, `what-if` e `create`.
2. Rode `create` uma segunda vez: o `what-if` deve mostrar **nenhuma mudança** (idempotência declarativa).
3. Altere um prefixo de sub-rede e veja o `what-if` mostrar a modificação.
4. Exporte um recurso criado no Portal como template ARM e converta com `az bicep decompile`.

**Limpeza:** `az group delete -n rg-lab-iac --yes --no-wait`.

### Contribuição ao projeto integrador

Reescreva o TrilhaShop em Bicep (`main.bicep` + módulos `rede`, `seguranca`, `dados`, `app`) reproduzível por:

```bash
az deployment group create -g rg-trilhashop-dev -f main.bicep --parameters ambiente=dev
```

Teste o ciclo completo: apague o grupo, recrie a partir do template e confirme que o ambiente volta igual. Segredos entram por `@secure()` + Key Vault, **nunca em arquivo de parâmetros versionado**.

`[CUSTO]` Bicep e Terraform não cobram; o que eles criam, sim. Use `what-if`/`plan` para estimar e `limpa.sh` ao fim.

## Erros comuns nesta fase

- Aplicar sem `what-if`.
- Usar `--mode Complete` sem entender que apaga o resto do grupo.
- Versionar o state do Terraform ou parâmetros com segredo.
- Misturar clique no Portal e IaC no mesmo recurso (gera *drift*).
- Reaproveitar versões de API muito antigas sem checar.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| IaC declarativa | Terraform + Ansible — trilha Linux, Módulo 21 |
| Pipelines de deploy | CI/CD — trilha Linux, Módulo 22 |
| Reprodução de ambiente | DR e resiliência — Módulo 15 |
| Tags e Policy | Governança — Módulo 03 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Bicep documentation*: https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview
- Microsoft Learn — *Deployment what-if*: https://learn.microsoft.com/azure/azure-resource-manager/templates/deploy-what-if
- Microsoft Learn — *ARM templates*: https://learn.microsoft.com/azure/azure-resource-manager/templates/overview
- Microsoft Learn — *Terraform on Azure*: https://learn.microsoft.com/azure/developer/terraform/
- Bicep resource reference: https://learn.microsoft.com/azure/templates/
- Terraform `azurerm` provider: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs

**Como aprofundar:** os *Azure Verified Modules* (https://azure.github.io/Azure-Verified-Modules/) mostram como organizações padronizam módulos Bicep/Terraform.

## Checklist de saída

- [ ] Explicar imperativo x declarativo e dar um exemplo de cada.
- [ ] Ler e escrever um arquivo Bicep com `param`, `var`, `resource` e `output`.
- [ ] Usar `what-if` antes de aplicar e interpretar o resultado.
- [ ] Explicar modo Incremental x Complete.
- [ ] Explicar o que é o state do Terraform e por que guardá-lo remotamente.
- [ ] Escolher entre Bicep e Terraform para um cenário.
- [ ] Ter recriado o TrilhaShop a partir do template.
