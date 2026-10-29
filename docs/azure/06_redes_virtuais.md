---
id: "06_redes_virtuais"
title: "Módulo 06 — Redes Virtuais"
sidebar_label: "06 · Redes Virtuais"
sidebar_position: 6
---

# Módulo 06 — Redes Virtuais

> **Objetivo**: construir a rede do TrilhaShop — VNet, sub-redes por camada, NSGs, rotas, peering, DNS e acesso privado a serviços PaaS (Private Endpoint) — entendendo por que cada peça existe e testando a conectividade pelo terminal.
>
> **Pré-requisitos**: módulo 05 (NSG). Ajuda ter noção de IP e máscara (trilha Linux, Módulo 09/18).
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre **Describe Azure networking services** (AZ-900) e **Implement and manage virtual networking** (AZ-104), um dos domínios mais pesados da prova: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104

---

## Seu loteamento privado na nuvem

Uma **Virtual Network (VNet)** é o seu loteamento privado dentro do Azure: um espaço de endereços IP isolado, só seu. Você o divide em **sub-redes** (quadras), uma por função — assim aplica regras diferentes a cada quadra. A VNet vive numa região e abrange todas as AZs dela.

Endereçamento usa **CIDR**: `10.0.0.0/16` significa 65.536 endereços (os 16 primeiros bits são a rede). Uma sub-rede `10.0.1.0/24` tem 256 endereços — mas o Azure reserva **5** em cada sub-rede (rede, gateway padrão, 2 de DNS e broadcast), restando 251 utilizáveis.

> `[ATENÇÃO]` Planeje o espaço de endereços **antes**. Duas VNets com faixas que se sobrepõem **não podem** fazer peering nem se conectar por VPN. Reserve faixas diferentes por ambiente (`10.10.0.0/16` dev, `10.20.0.0/16` prod).

```bash
az network vnet create -g rg-trilhashop-dev -n vnet-trilhashop \
  --address-prefixes 10.10.0.0/16 \
  --subnet-name snet-web --subnet-prefixes 10.10.1.0/24

az network vnet subnet create -g rg-trilhashop-dev --vnet-name vnet-trilhashop \
  -n snet-app --address-prefixes 10.10.2.0/24
az network vnet subnet create -g rg-trilhashop-dev --vnet-name vnet-trilhashop \
  -n snet-dados --address-prefixes 10.10.3.0/24

az network vnet subnet list -g rg-trilhashop-dev --vnet-name vnet-trilhashop \
  --query "[].{nome:name, faixa:addressPrefix}" -o table
```

![VNet no portal mostrando as sub-redes web, app e dados com suas faixas de endereço](screenshots/06-redes-virtuais/01-vnet-subnets.png)
> `[PRINT]` Passo a passo para capturar: portal → Virtual networks → `vnet-trilhashop` → Subnets. Capturar as três sub-redes e as faixas.

## Segmentação com NSG e ASG

Cada sub-rede ganha um NSG (Módulo 05). O desenho de **três camadas** do TrilhaShop:

| Sub-rede | Recebe de | Porta |
|---|---|---|
| `snet-web` | Internet | 443 |
| `snet-app` | Somente `snet-web` | 8080 |
| `snet-dados` | Somente `snet-app` | 5432 (PostgreSQL) |

```bash
az network nsg create -g rg-trilhashop-dev -n nsg-app
az network nsg rule create -g rg-trilhashop-dev --nsg-name nsg-app -n permitir-web \
  --priority 100 --access Allow --direction Inbound --protocol Tcp \
  --source-address-prefixes 10.10.1.0/24 --destination-port-ranges 8080
az network vnet subnet update -g rg-trilhashop-dev --vnet-name vnet-trilhashop \
  -n snet-app --network-security-group nsg-app
```

**ASG (Application Security Group)** permite escrever regras por *função* ("servidores de app") em vez de por IP, útil quando as VMs mudam.

## Como o tráfego escolhe o caminho

Todo tráfego dentro da VNet usa **rotas de sistema** automáticas (inclusive entre sub-redes). Para forçar um desvio (ex.: tudo para um firewall virtual), crie uma **UDR (User-Defined Route)** numa *route table* e associe à sub-rede.

```bash
az network route-table create -g rg-trilhashop-dev -n rt-app
az network route-table route create -g rg-trilhashop-dev --route-table-name rt-app \
  -n tudo-pelo-firewall --address-prefix 0.0.0.0/0 \
  --next-hop-type VirtualAppliance --next-hop-ip-address 10.10.0.4
```

## Conectando redes: peering e híbrido

- **VNet peering**: liga duas VNets pela rede da Microsoft, com baixa latência, como se fossem uma. **Não é transitivo**: A↔B e B↔C não implica A↔C.
- **VPN Gateway**: túnel criptografado pela internet (site-to-site ou point-to-site).
- **ExpressRoute**: link privado dedicado entre seu datacenter e o Azure, sem passar pela internet.

```bash
az network vnet peering create -g rg-trilhashop-dev -n dev-para-hub \
  --vnet-name vnet-trilhashop --remote-vnet vnet-hub --allow-vnet-access
```

> `[ATENÇÃO]` O peering precisa ser criado **nos dois sentidos** (cada VNet aponta para a outra). Com um só lado, o estado fica `Initiated` e nada passa.

## DNS e acesso privado a serviços PaaS

- **Azure DNS**: hospeda zonas públicas e **privadas** (resolução de nomes só dentro da VNet).
- **Service Endpoint**: o tráfego da sub-rede para o serviço (ex.: Storage) vai pelo backbone da Microsoft, mas o serviço continua com IP público.
- **Private Endpoint**: o serviço PaaS ganha um **IP privado dentro da sua sub-rede** (via Private Link). O banco deixa de ter qualquer exposição pública.

```bash
az network private-endpoint create -g rg-trilhashop-dev -n pe-banco \
  --vnet-name vnet-trilhashop --subnet snet-dados \
  --private-connection-resource-id <id-do-servidor-postgres-ou-storage> \
  --group-id postgresqlServer --connection-name conexao-banco

az network private-dns zone create -g rg-trilhashop-dev -n privatelink.postgres.database.azure.com
```

> `[TEORIA]` Para a prova: Service Endpoint = "caminho seguro até o serviço, mas o serviço continua público"; Private Endpoint = "o serviço entra na minha VNet com IP privado". Se o cenário exige *nenhuma exposição pública*, é Private Endpoint.

## Testando conectividade do terminal

Dentro de uma VM da VNet (Módulo 08), valide cada regra:

```bash
nc -zv 10.10.2.4 8080     # web -> app deve conectar
nc -zv 10.10.3.4 5432     # web -> dados deve FALHAR (NSG)
dig +short banco.privatelink.postgres.database.azure.com
```

Do lado do `az`, o **Network Watcher** responde de fora:

```bash
az network watcher test-ip-flow -g rg-trilhashop-dev --vm vm-web --direction Inbound \
  --protocol TCP --local 10.10.1.4:443 --remote 1.2.3.4:50000 -o json
```

## Práticas

### Prática isolada

1. Crie `vnet-lab` (`10.50.0.0/16`) com duas sub-redes.
2. Crie um NSG que permita SSH somente do seu IP (`curl -s ifconfig.me`) e associe.
3. Crie uma segunda VNet `vnet-lab2` (`10.51.0.0/16`) e faça peering nos dois sentidos; confira `peeringState`:
   ```bash
   az network vnet peering list -g rg-lab-redes --vnet-name vnet-lab \
     --query "[].{nome:name, estado:peeringState}" -o table
   ```
4. Tente criar uma terceira VNet com faixa sobreposta e observe o erro no peering.

**Limpeza:** `az group delete -n rg-lab-redes --yes --no-wait`.

### Contribuição ao projeto integrador

Monte a rede `vnet-trilhashop` (`10.10.0.0/16`) com `snet-web`, `snet-app` e `snet-dados`, NSGs por camada conforme a tabela e o NSG `nsg-dados` aceitando 5432 só de `snet-app`. Deixe o Private Endpoint do banco para o Módulo 11, quando o banco existir.

`[CUSTO]` VNet, sub-redes, NSG e peering dentro da mesma região têm custo desprezível; **VPN Gateway, Azure Firewall e Private Endpoint cobram por hora** — não os crie em laboratório sem limpar.

## Erros comuns nesta fase

- Faixas sobrepostas entre VNets (impede peering e VPN).
- Peering em um só sentido.
- Achar que peering é transitivo.
- Esquecer que o Azure reserva 5 IPs por sub-rede e dimensionar sub-rede `/29` curta demais.
- Associar NSG negando tráfego do próprio Load Balancer (Módulo 07), derrubando probes de saúde.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Sub-redes e NSGs | VMs — Módulo 08; Application Gateway — Módulo 07 |
| Private Endpoint | Banco e Storage — Módulos 10 e 11 |
| Rotas/UDR, firewall | Segurança e hub-and-spoke — Módulo 15 |
| CIDR, DNS | Trilha Linux — Módulos 09 e 18 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Virtual networks overview*: https://learn.microsoft.com/azure/virtual-network/virtual-networks-overview
- Microsoft Learn — *Virtual network peering*: https://learn.microsoft.com/azure/virtual-network/virtual-network-peering-overview
- Microsoft Learn — *Private Endpoint*: https://learn.microsoft.com/azure/private-link/private-endpoint-overview
- Microsoft Learn — *Routing (UDR)*: https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview
- Microsoft Learn — *Hub-spoke topology*: https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke

**Como aprofundar:** pratique o cálculo de sub-redes (`ipcalc`/`sipcalc` no WSL) e leia a topologia hub-and-spoke da Azure Architecture Center.

## Checklist de saída

- [ ] Desenhar uma VNet com três sub-redes e justificar o CIDR.
- [ ] Explicar por que o Azure reserva 5 IPs por sub-rede.
- [ ] Escrever regras de NSG para um desenho de três camadas.
- [ ] Explicar por que peering não é transitivo e precisa dos dois lados.
- [ ] Diferenciar Service Endpoint e Private Endpoint.
- [ ] Diferenciar VPN Gateway e ExpressRoute.
- [ ] Ter criado a `vnet-trilhashop` com NSGs por camada.
