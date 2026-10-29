---
id: "05_seguranca_na_nuvem"
title: "Módulo 05 — Segurança na Nuvem"
sidebar_label: "05 · Segurança na Nuvem"
sidebar_position: 5
---

# Módulo 05 — Segurança na Nuvem

> **Objetivo**: aplicar segurança em camadas no Azure — defesa em profundidade, Zero Trust, Key Vault para segredos, NSG como firewall de rede, Azure Firewall/DDoS e Defender for Cloud para medir a postura — e fechar o ciclo "API sem segredos" iniciado no Módulo 04.
>
> **Pré-requisitos**: módulos 03 e 04.
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre **Describe Azure identity, access, and security** (AZ-900) e partes de **Implement and manage virtual networking** (AZ-104). Guias: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900

---

## Castelo, não cerca

Um castelo medieval não tinha só um muro: tinha fosso, muralha, portão, guardas, torre e cofre. Se um invasor passa por uma camada, esbarra na seguinte. Isso é **defesa em profundidade**, e no Azure as camadas, de fora para dentro, são:

1. **Física** — datacenters (responsabilidade da Microsoft).
2. **Identidade e acesso** — Entra ID, MFA, RBAC (Módulo 04).
3. **Perímetro** — proteção contra DDoS, firewall.
4. **Rede** — segmentação, NSG, sem exposição desnecessária.
5. **Computação** — patching, endurecimento da VM.
6. **Aplicação** — código seguro, segredos fora do código.
7. **Dados** — criptografia em repouso e em trânsito.

> `[TEORIA]` **Zero Trust** troca "confie em quem está dentro da rede" por três princípios: *verifique sempre explicitamente*, *dê o menor privilégio* e *assuma que houve violação*. É o motivo de identidade ter virado o novo perímetro.

## Key Vault: o cofre de segredos

O **Azure Key Vault** guarda **segredos** (senhas, strings de conexão), **chaves** de criptografia e **certificados**, com controle de acesso, log de auditoria e rotação. A aplicação lê o segredo em tempo de execução, usando a Managed Identity do Módulo 04 — nada de senha em arquivo `.env` ou no Git.

```bash
KV=kv-trilhashop-$RANDOM       # nome globalmente único
az keyvault create -g rg-trilhashop-dev -n $KV -l brazilsouth --enable-rbac-authorization true

# Quem administra o cofre (você) precisa de role para gravar segredos
az role assignment create --assignee $(az ad signed-in-user show --query id -o tsv) \
  --role "Key Vault Secrets Officer" --scope $(az keyvault show -n $KV --query id -o tsv)

az keyvault secret set --vault-name $KV --name db-connection --value "Host=...;Password=..."
az keyvault secret show --vault-name $KV --name db-connection --query value -o tsv
```

> `[ATENÇÃO]` Com `--enable-rbac-authorization true`, quem vê/gera segredos é definido por **roles de RBAC** (Secrets Officer para gravar, Secrets User para ler), e não pelas antigas *access policies*. Sem o role, o comando devolve `Forbidden` mesmo sendo Owner da assinatura.

Dar leitura à identidade da API (a ponte que faltava do Módulo 04):

```bash
PID=$(az identity show -g rg-trilhashop-dev -n id-trilhashop-api --query principalId -o tsv)
az role assignment create --assignee-object-id $PID --assignee-principal-type ServicePrincipal \
  --role "Key Vault Secrets User" --scope $(az keyvault show -n $KV --query id -o tsv)
```

Também ligue a proteção contra exclusão acidental:

```bash
az keyvault update -n $KV --enable-purge-protection true
```

![Key Vault no portal, aba Secrets com o segredo db-connection e sua versão atual](screenshots/05-seguranca-na-nuvem/01-key-vault-secrets.png)
> `[PRINT]` Passo a passo para capturar: portal → Key Vaults → o cofre → Objects → Secrets. Capturar a lista com `db-connection` (sem exibir o valor).

## NSG: o firewall de sub-rede e NIC

Um **Network Security Group** é uma lista de regras de entrada e saída, avaliadas por **prioridade** (número menor primeiro), que permitem ou negam tráfego por origem, destino, porta e protocolo. Por padrão, tráfego da internet para dentro é negado e tráfego dentro da VNet é permitido.

```bash
az network nsg create -g rg-trilhashop-dev -n nsg-web
az network nsg rule create -g rg-trilhashop-dev --nsg-name nsg-web -n permitir-https \
  --priority 100 --access Allow --direction Inbound --protocol Tcp \
  --destination-port-ranges 443 --source-address-prefixes Internet
az network nsg rule list -g rg-trilhashop-dev --nsg-name nsg-web -o table
```

> `[ATENÇÃO]` Regras são avaliadas por prioridade, **e a primeira que casa vence**. Uma regra `Deny` com prioridade 100 vence uma `Allow` com prioridade 200 para o mesmo tráfego. O Módulo 06 usa NSGs dentro de VNets.

## Azure Firewall, DDoS e WAF

- **Azure Firewall**: firewall gerenciado, centralizado e com estado, que filtra por FQDN e inteligência de ameaças. Para rede em escala (hub-and-spoke).
- **DDoS Protection**: mitiga ataques volumétricos; o nível básico é automático e gratuito, o *Network/IP Protection* é pago.
- **WAF**: firewall de aplicação web (protege contra OWASP Top 10), embutido no Application Gateway e no Front Door (Módulo 07).

Quando usar o quê: NSG para filtragem simples por sub-rede; Azure Firewall para controle central e saída de internet; WAF para proteger sites HTTP.

## Defender for Cloud: o painel de saúde da segurança

O **Microsoft Defender for Cloud** avalia seus recursos contra boas práticas e entrega um **Secure Score** com recomendações priorizadas (CSPM), além de proteção de cargas de trabalho (CWPP) nos planos pagos.

```bash
az security pricing list -o table                       # planos Defender e seus níveis
az security assessment list --query "[?status.code=='Unhealthy'].displayName" -o tsv | head
az security secure-scores list -o table
```

## Criptografia

- **Em repouso**: discos, storage e SQL já vêm criptografados por padrão (chaves gerenciadas pela Microsoft); é possível usar chaves próprias (CMK) guardadas no Key Vault.
- **Em trânsito**: TLS. Exija HTTPS e TLS 1.2+ (`--min-tls-version`, `--https-only`).

## Práticas

### Prática isolada

1. Crie um Key Vault, grave o segredo `db-connection` e leia pela CLI.
2. Crie um NSG com uma regra que permita 443 e outra que negue 22 vindo da internet.
3. Liste as recomendações *Unhealthy* do Defender e escolha uma para entender.

```bash
az network nsg rule create -g rg-trilhashop-dev --nsg-name nsg-web -n negar-ssh-internet \
  --priority 200 --access Deny --direction Inbound --protocol Tcp \
  --destination-port-ranges 22 --source-address-prefixes Internet
```

**Limpeza:** se for um laboratório separado, apague o RG; Key Vault com *purge protection* fica 90 dias em soft-delete, então **não ative purge protection em cofres descartáveis** de teste.

### Contribuição ao projeto integrador

Conecte de ponta a ponta o que vem do Módulo 04:

1. Cofre `kv-trilhashop-*` com o segredo `db-connection` (valor falso por enquanto).
2. Role *Key Vault Secrets User* para `id-trilhashop-api` só neste cofre.
3. NSG `nsg-web` (443 liberado) e `nsg-app` (aceita só vindo da sub-rede web) criados — serão associados no Módulo 06.
4. Rode o diagnóstico: `az keyvault secret show` usando a identidade (a prova real vem quando a VM existir, no Módulo 08).

`[CUSTO]` Key Vault Standard cobra por operação (centavos por 10 mil). NSG é gratuito. O Defender CSPM básico é gratuito; planos de proteção de workload são pagos — não os ative em laboratório.

## Erros comuns nesta fase

- Gravar segredo no código/variável de ambiente "só por enquanto".
- Esquecer o role de acesso e atribuir culpa ao Key Vault.
- Abrir SSH/RDP para `Any` na internet (o Defender e o Azure Policy sinalizam).
- Ativar *purge protection* num cofre de teste e não conseguir recriar o mesmo nome.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| NSG | Redes virtuais — Módulo 06 |
| WAF, DDoS | Balanceamento — Módulo 07 |
| Key Vault + Managed Identity | VMs e App Service — Módulos 08/09; Functions — 12 |
| Defender, Secure Score | Monitoramento — Módulo 15 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Azure Key Vault overview*: https://learn.microsoft.com/azure/key-vault/general/overview
- Microsoft Learn — *Network security groups*: https://learn.microsoft.com/azure/virtual-network/network-security-groups-overview
- Microsoft Learn — *Defender for Cloud*: https://learn.microsoft.com/azure/defender-for-cloud/defender-for-cloud-introduction
- Microsoft Learn — *Zero Trust*: https://learn.microsoft.com/security/zero-trust/zero-trust-overview
- Microsoft Cloud Security Benchmark: https://learn.microsoft.com/security/benchmark/azure/overview

**Como aprofundar:** o Microsoft Cloud Security Benchmark é a lista de controles que o Defender usa; ler 2 ou 3 domínios dá noção do que cobrar de um ambiente real.

## Checklist de saída

- [ ] Listar as camadas da defesa em profundidade e dar exemplo de cada.
- [ ] Explicar os três princípios do Zero Trust.
- [ ] Guardar e ler um segredo no Key Vault usando RBAC.
- [ ] Explicar por que Managed Identity + Key Vault elimina segredos do código.
- [ ] Criar regras de NSG e explicar a ordem de avaliação por prioridade.
- [ ] Diferenciar NSG, Azure Firewall e WAF.
- [ ] Descrever o que o Defender for Cloud e o Secure Score entregam.
