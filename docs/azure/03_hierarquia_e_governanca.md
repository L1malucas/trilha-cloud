---
id: "03_hierarquia_e_governanca"
title: "Módulo 03 — Hierarquia e Governança"
sidebar_label: "03 · Hierarquia e Governança"
sidebar_position: 3
---

# Módulo 03 — Hierarquia e Governança

> **Objetivo**: entender como o Azure organiza recursos (management groups → subscriptions → resource groups → resources) e usar as ferramentas de governança — tags, Azure Policy, locks e RBAC — para impedir erro e bagunça antes que aconteçam.
>
> **Pré-requisitos**: módulos 00 a 02.
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre **Describe Azure management and governance** (AZ-900) e **Manage Azure identities and governance** (AZ-104): https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104

---

## A árvore de pastas da empresa

Imagine o sistema de arquivos de uma empresa grande: pastas dentro de pastas, e permissões que descem da raiz. O Azure faz o mesmo com quatro níveis de **escopo**:

```
Management Group (agrupa subscriptions, até 6 níveis)
  └─ Subscription (limite de cobrança e de cota)
       └─ Resource Group (gaveta lógica de recursos)
            └─ Resource (VM, disco, rede, banco...)
```

O princípio-chave é a **herança**: uma permissão, política ou lock aplicado em um nível vale para tudo abaixo. Por isso governança se desenha de cima para baixo.

- **Management group**: organiza várias assinaturas (ex.: `mg-producao`, `mg-desenvolvimento`) para aplicar política e acesso em lote.
- **Subscription**: unidade de cobrança e de limites. É comum separar por ambiente ou por área.
- **Resource group**: todos os recursos de uma mesma aplicação e ciclo de vida. Apagar o grupo apaga tudo dentro.

> `[ATENÇÃO]` Um recurso vive em **um único** resource group, mas pode se conectar a recursos de outros grupos. E o grupo tem uma localização só para guardar seus metadados; os recursos dentro podem estar em outras regiões.

## Azure Resource Manager (ARM)

Todo pedido de criação, alteração ou exclusão passa pelo ARM, que autentica, autoriza e aplica as regras (RBAC, Policy, locks) antes de entregar ao serviço. É por isso que governança funciona igual no Portal, na CLI e em IaC.

## Tags: etiquetas para achar e cobrar

**Tags** são pares chave-valor em recursos e grupos (`ambiente=prod`, `centro-custo=ti`). Servem a inventário, automação e **alocação de custos**.

```bash
az group update -n rg-trilhashop-dev --set tags.dono=lucas tags.ambiente=dev
az tag list --resource-id $(az group show -n rg-trilhashop-dev --query id -o tsv)
az resource list --tag projeto=trilhashop -o table
```

> `[ATENÇÃO]` Tags **não** são herdadas automaticamente do resource group pelos recursos. Para forçar, use Azure Policy (modo *Inherit a tag from the resource group*), a seguir.

## Azure Policy: regras que o ambiente aplica sozinho

Uma **policy** avalia recursos contra uma regra e pode *auditar* (marcar não conforme), *negar* (impedir a criação) ou *corrigir* (modificar). Pense numa portaria: em vez de pedir a cada morador que não deixe a porta aberta, a portaria barra quem tenta.

Exemplos de regras úteis: permitir só certas regiões, exigir uma tag, bloquear SKUs caros. Um conjunto de policies agrupadas forma uma **initiative**.

```bash
# Listar definições embutidas sobre tags
az policy definition list --query "[?contains(displayName,'Require a tag')].{nome:displayName,id:name}" -o table

# Atribuir "Require a tag on resource groups" ao nosso RG (efeito Deny)
az policy assignment create \
  --name exigir-tag-projeto \
  --display-name "Exigir tag projeto" \
  --policy "96670d01-0a4d-4649-9c89-2d3abc0a5025" \
  --params '{"tagName":{"value":"projeto"}}' \
  --scope $(az group show -n rg-trilhashop-dev --query id -o tsv)

az policy state list --resource-group rg-trilhashop-dev -o table   # conformidade
```

> `[ATENÇÃO]` O ID da definição built-in acima é o de "Require a tag on resource groups" na data desta escrita; confirme na saída de `az policy definition list` antes de usar. Política de *Deny* só afeta **novos** recursos; os existentes aparecem como não conformes, sem serem apagados.

## Locks: o cadeado contra o dedo gordo

**Locks** impedem exclusão (`CanNotDelete`) ou qualquer alteração (`ReadOnly`), valendo até para quem é Owner.

```bash
az lock create --name nao-apagar --lock-type CanNotDelete --resource-group rg-trilhashop-prod
az lock list -o table
az lock delete --name nao-apagar --resource-group rg-trilhashop-prod   # para poder remover
```

> `[TENTE VOCÊ]` Aplique `CanNotDelete` no `rg-lab-governanca`, tente `az group delete` e leia o erro. Depois remova o lock. Resposta esperada: erro `ScopeLocked`.

## RBAC: quem pode fazer o quê

O **RBAC (Role-Based Access Control)** do Azure autoriza ações sobre recursos. Um *role assignment* junta três coisas: **quem** (usuário, grupo, service principal, managed identity), **o quê** (role definition: um conjunto de permissões) e **onde** (escopo). Roles básicos: **Owner** (tudo, inclusive dar acesso), **Contributor** (cria e altera, mas não concede acesso), **Reader** (só lê), além de dezenas de roles específicos.

```bash
az role definition list --query "[?roleName=='Contributor'].{nome:roleName, desc:description}" -o table
az role assignment list --resource-group rg-trilhashop-dev -o table
az role assignment create --assignee "<usuario-ou-grupo-id>" --role Reader \
  --scope $(az group show -n rg-trilhashop-dev --query id -o tsv)
```

Princípio do **menor privilégio**: dê o role mais restrito, no escopo mais baixo que resolve. Identidades e o Entra ID (de onde vêm usuários e grupos) são o assunto do Módulo 04.

## Práticas

### Prática isolada

```bash
RG=rg-lab-governanca
az group create -n $RG -l brazilsouth --tags projeto=lab

# 1. Policy: exigir tag 'projeto' em grupos
az policy assignment create --name exigir-tag-lab \
  --policy "96670d01-0a4d-4649-9c89-2d3abc0a5025" \
  --params '{"tagName":{"value":"projeto"}}' \
  --scope /subscriptions/$(az account show --query id -o tsv)

# 2. Provar o Deny: este comando deve FALHAR (grupo sem tag)
az group create -n rg-sem-tag -l brazilsouth

# 3. Lock e teste de exclusão
az lock create -n nao-apagar --lock-type CanNotDelete -g $RG
az group delete -n $RG --yes        # deve falhar com ScopeLocked
```

![Terminal mostrando o erro RequestDisallowedByPolicy ao criar um resource group sem a tag exigida](screenshots/03-hierarquia-e-governanca/01-policy-deny.png)
> `[PRINT]` Passo a passo para capturar: capturar a saída do passo 2, com a mensagem `RequestDisallowedByPolicy` visível.

**Limpeza** (ordem importa: tire o lock antes, e remova a policy da assinatura):

```bash
az lock delete -n nao-apagar -g $RG
az policy assignment delete --name exigir-tag-lab --scope /subscriptions/$(az account show --query id -o tsv)
az group delete -n $RG --yes --no-wait
```

> `[ATENÇÃO]` Deixar a policy de Deny ativa na assinatura bloqueia suas próprias criações nos módulos seguintes. Remova ao fim do lab.

### Contribuição ao projeto integrador

Crie a base de governança do TrilhaShop:

1. Resource groups `rg-trilhashop-dev` e `rg-trilhashop-prod` com tags `projeto`, `ambiente`, `dono`.
2. Lock `CanNotDelete` no `rg-trilhashop-prod`.
3. Policy de *allowed locations* restringindo a `brazilsouth` e `southcentralus` no escopo do grupo.
4. Role `Reader` para um colega/usuário de teste (se não tiver, aguarde o Módulo 04).

`[CUSTO]` Tags, policies, locks e RBAC são gratuitos.

## Erros comuns nesta fase

- Aplicar política na assinatura inteira durante estudo e se bloquear.
- Dar `Owner` "porque é mais fácil". Prefira `Contributor` no escopo do grupo.
- Esperar que tags desçam do grupo para os recursos sem uma policy que faça isso.
- Esquecer de remover o lock antes de tentar apagar o grupo.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Role assignment e escopos | Entra ID, Managed Identity — Módulo 04 |
| Policy e Defender | Segurança — Módulo 05 |
| Tags | Custos por tag — Módulo 16 |
| Resource group e ARM | IaC (Bicep/Terraform) — Módulo 14 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Azure Policy overview*: https://learn.microsoft.com/azure/governance/policy/overview
- Microsoft Learn — *Management groups*: https://learn.microsoft.com/azure/governance/management-groups/overview
- Microsoft Learn — *Lock resources*: https://learn.microsoft.com/azure/azure-resource-manager/management/lock-resources
- Microsoft Learn — *Azure RBAC*: https://learn.microsoft.com/azure/role-based-access-control/overview
- Microsoft Learn — *Tag resources*: https://learn.microsoft.com/azure/azure-resource-manager/management/tag-resources
- Cloud Adoption Framework — *Landing zones*: https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/

**Como aprofundar:** estude as policies built-in "Allowed locations" e "Inherit a tag from the resource group" e leia sobre *initiatives* no portal em Policy → Definitions.

## Checklist de saída

- [ ] Desenhar de memória a hierarquia de escopos e explicar a herança.
- [ ] Explicar o que o ARM faz e por que governança vale em Portal, CLI e IaC.
- [ ] Criar e consultar tags, e explicar por que não são herdadas por padrão.
- [ ] Diferenciar Policy (o que *pode existir*) de RBAC (quem *pode agir*) e de Lock (proteção contra remoção).
- [ ] Atribuir um role com `az role assignment create` no menor escopo possível.
- [ ] Ter provado o Deny de uma policy e o bloqueio de um lock, e limpado depois.
- [ ] Ter montado a base de governança do TrilhaShop.
