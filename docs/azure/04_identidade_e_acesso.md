---
id: "04_identidade_e_acesso"
title: "Módulo 04 — Identidade e Acesso"
sidebar_label: "04 · Identidade e Acesso"
sidebar_position: 4
---

# Módulo 04 — Identidade e Acesso

> **Objetivo**: entender quem pode entrar no Azure e como provar quem é — Microsoft Entra ID, usuários e grupos, MFA, Conditional Access, service principals e Managed Identities — e eliminar segredos do código usando identidades gerenciadas.
>
> **Pré-requisitos**: módulo 03 (RBAC e escopos).
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre **Describe Azure identity, access, and security** (AZ-900) e **Manage Azure identities and governance** (AZ-104). Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104

---

## Autenticação x autorização: crachá e catraca

Duas perguntas diferentes, sempre nessa ordem:

- **Autenticação (AuthN)** — *quem é você?* É o crachá sendo conferido na portaria. No Azure, quem responde é o **Microsoft Entra ID** (antigo Azure Active Directory).
- **Autorização (AuthZ)** — *o que você pode fazer?* É a catraca que libera ou não cada andar. No Azure, é o **RBAC** que você viu no Módulo 03.

> `[ATENÇÃO]` Entra ID e Active Directory Domain Services (o AD de servidor Windows) **não são a mesma coisa**. O Entra ID é um serviço de identidade em nuvem, usa HTTP/OAuth/SAML e não tem OUs nem GPOs. Se você vem de infra on-premises, essa é a confusão mais comum.

## Microsoft Entra ID

O Entra ID é o serviço de identidade na nuvem da Microsoft. O seu espaço dedicado se chama **tenant** (um diretório). Dele saem:

- **Usuários** (humanos), **grupos** (para dar permissão em lote — prefira sempre dar roles a grupos, não a pessoas) e **aplicações / service principals** (identidades de software).
- **SSO (single sign-on)**: um login, vários sistemas.
- **MFA (autenticação multifator)**: algo que você sabe + algo que você tem. Bloqueia a vasta maioria dos ataques por senha vazada.
- **Conditional Access**: regras "se... então...". *Se* o login vem de fora do país *ou* de um dispositivo não gerenciado, *então* exija MFA ou bloqueie. (Requer licença Entra ID P1.)
- **PIM (Privileged Identity Management)**: acesso privilegiado *sob demanda e com prazo* (just-in-time), em vez de Owner permanente. (Requer P2.)

```bash
# Usuários e grupos no Entra ID
az ad user list --query "[].{nome:displayName, upn:userPrincipalName}" -o table
az ad group create --display-name "trilhashop-devs" --mail-nickname "trilhashop-devs"
az ad group member add --group "trilhashop-devs" --member-id "<object-id-do-usuario>"
az ad group member list --group "trilhashop-devs" -o table
```

> `[ATENÇÃO]` Criar usuários exige permissão no tenant (por exemplo, o papel *User Administrator* do Entra, que é diferente dos roles de RBAC do Azure). Em conta pessoal nova, você é Global Administrator do seu tenant padrão e consegue. Em tenant corporativo, provavelmente não.

![Portal do Microsoft Entra ID, tela de Visão geral do tenant com o nome do diretório e o domínio principal](screenshots/04-identidade-e-acesso/01-entra-id-visao-geral.png)
> `[PRINT]` Passo a passo para capturar: portal.azure.com → pesquisar "Microsoft Entra ID" → Overview. Capturar nome do tenant, tenant ID e domínio (ocultar o ID se for compartilhar).

## Identidades de software: service principal e Managed Identity

Aplicações também precisam entrar. Há três jeitos, do pior ao melhor:

1. **Senha/chave dentro do código** — nunca. Vaza no Git.
2. **Service principal com segredo ou certificado**: uma identidade de aplicação no Entra ID. Funciona, mas o segredo expira e alguém precisa guardá-lo.
3. **Managed Identity**: o Azure cria e rotaciona a credencial sozinho e a entrega só ao recurso (VM, App Service, Function). **Não existe segredo para vazar.**

Tipos de Managed Identity: **system-assigned** (nasce e morre com o recurso) e **user-assigned** (recurso independente, reutilizável por vários).

```bash
# Service principal (para pipelines/CI) — guarde o resultado com cuidado
az ad sp create-for-rbac --name sp-trilhashop-ci --role Contributor \
  --scopes $(az group show -n rg-trilhashop-dev --query id -o tsv)

# Managed Identity user-assigned
az identity create -g rg-trilhashop-dev -n id-trilhashop-api
az identity show -g rg-trilhashop-dev -n id-trilhashop-api --query "{clientId:clientId, principalId:principalId}" -o json

# Dar a uma VM uma identidade gerenciada do sistema
az vm identity assign -g rg-trilhashop-dev -n vm-api

# Conceder um role à identidade (menor privilégio, escopo baixo)
az role assignment create --assignee <principalId> --role "Storage Blob Data Reader" \
  --scope $(az storage account show -g rg-trilhashop-dev -n <conta> --query id -o tsv)
```

> `[TEORIA]` Para a prova: quando o cenário diz "o aplicativo precisa acessar Key Vault/Storage **sem armazenar credenciais**", a resposta é **Managed Identity**. Referência: https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview

> `[ATENÇÃO]` O JSON de `az ad sp create-for-rbac` mostra o `password` **uma única vez**. Salve no cofre (Módulo 05), nunca em arquivo versionado.

## Entra ID x RBAC: dois sistemas de permissão

| | Roles do Entra ID | Roles de RBAC do Azure |
|---|---|---|
| Controla | O próprio diretório (usuários, grupos, apps) | Recursos do Azure (VMs, storage…) |
| Exemplos | Global Administrator, User Administrator | Owner, Contributor, Reader |
| Escopo | Tenant | Management group, subscription, RG, recurso |

Um Global Administrator **não** tem automaticamente acesso aos recursos da assinatura; pode, porém, elevar o próprio acesso. Entender essa separação evita muita confusão no AZ-104.

## Práticas

### Prática isolada

```bash
RG=rg-lab-identidade
az group create -n $RG -l brazilsouth

# 1. Grupo e membro
az ad group create --display-name "lab-leitores" --mail-nickname "lab-leitores"
# 2. Role Reader do grupo no RG
GID=$(az ad group show --group "lab-leitores" --query id -o tsv)
az role assignment create --assignee-object-id $GID --assignee-principal-type Group \
  --role Reader --scope $(az group show -n $RG --query id -o tsv)
# 3. Auditar quem tem o quê
az role assignment list --resource-group $RG --include-inherited -o table
```

![Tela "Access control (IAM)" do resource group com a aba Role assignments listando o grupo com o role Reader](screenshots/04-identidade-e-acesso/02-iam-role-assignments.png)
> `[PRINT]` Passo a passo para capturar: portal → o resource group → Access control (IAM) → Role assignments. Capturar a linha do grupo `lab-leitores` como Reader.

**Limpeza:**

```bash
az ad group delete --group "lab-leitores"
az group delete -n $RG --yes --no-wait
```

### Contribuição ao projeto integrador

Dê identidade à API do TrilhaShop *sem nenhum segredo*:

1. Crie a identidade `id-trilhashop-api` (user-assigned).
2. Crie o grupo `trilhashop-devs` com Contributor no `rg-trilhashop-dev`.
3. Deixe anotado: a identidade receberá acesso de leitura ao Key Vault (Módulo 05) e ao Storage (Módulo 10). Essa conexão é o *desafio do Módulo 05*.

`[CUSTO]` Entra ID Free, grupos, RBAC e Managed Identities não custam nada. Conditional Access e PIM exigem licenças pagas (P1/P2).

## Erros comuns nesta fase

- Atribuir roles a usuários individuais em vez de grupos.
- Confundir os roles do Entra ID com os de RBAC.
- Usar service principal com segredo onde Managed Identity resolveria.
- Esquecer que a propagação de um role pode levar alguns minutos.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Managed Identity | Key Vault — Módulo 05; Storage — Módulo 10; Functions — Módulo 12 |
| Service principal | CI/CD e Terraform — Módulo 14 e trilha Linux |
| Grupos e RBAC | Todos os módulos de operação |
| Conditional Access, PIM | Segurança — Módulo 05 |

## `[REFERÊNCIA]`

- Microsoft Learn — *What is Microsoft Entra ID?*: https://learn.microsoft.com/entra/fundamentals/whatis
- Microsoft Learn — *Managed identities for Azure resources*: https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview
- Microsoft Learn — *Conditional Access*: https://learn.microsoft.com/entra/identity/conditional-access/overview
- Microsoft Learn — *Privileged Identity Management*: https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-configure
- Microsoft Learn — *Azure RBAC best practices*: https://learn.microsoft.com/azure/role-based-access-control/best-practices

**Como aprofundar:** treine no AZ-104 o tópico "Manage Azure identities and governance" e leia as best practices de RBAC e de contas de acesso de emergência (*break glass*).

## Checklist de saída

- [ ] Explicar autenticação x autorização e quem faz cada papel no Azure.
- [ ] Explicar a diferença entre Entra ID e AD DS.
- [ ] Descrever MFA, SSO, Conditional Access e PIM com exemplo de uso de cada.
- [ ] Escolher entre senha no código, service principal e Managed Identity, justificando.
- [ ] Diferenciar system-assigned e user-assigned.
- [ ] Diferenciar roles do Entra ID de roles de RBAC.
- [ ] Ter criado um grupo, atribuído role e criado a identidade da API do TrilhaShop.
