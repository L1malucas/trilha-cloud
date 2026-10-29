---
id: "05_redes_vpc"
title: "Módulo 05 — Redes VPC"
sidebar_label: "05 · Redes VPC"
sidebar_position: 5
---

# Módulo 05 — Redes VPC

> **Objetivo**: construir a rede do TrilhaShop — VPC global, sub-redes regionais, regras de firewall, Cloud NAT, Cloud DNS, peering e conectividade híbrida — entendendo por que cada peça existe e testando a conectividade pelo terminal.
>
> **Pré-requisitos**: módulos 02 e 04. Ajuda ter visto CIDR (trilha Linux, Módulos 09 e 18).
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre "Planning and configuring network resources" do **Associate Cloud Engineer** e redes do **Cloud Digital Leader**. Referência: https://cloud.google.com/vpc/docs/overview

---

## Seu loteamento privado — e global

Uma **VPC (Virtual Private Cloud)** é a sua rede privada no Google Cloud, isolada das demais. A grande diferença de outros provedores: **a VPC do GCP é global** — uma única VPC abrange **todas as regiões**, e as **sub-redes** (*subnets*) é que são **regionais**, cada uma com uma faixa de IPs. Duas VMs em regiões diferentes, na mesma VPC, se falam por IP interno pela rede do Google, sem VPN.

```
VPC "vpc-trilhashop" (global)
 ├─ sub-rede snet-web    10.10.1.0/24  (southamerica-east1)
 ├─ sub-rede snet-app    10.10.2.0/24  (southamerica-east1)
 └─ sub-rede snet-dados  10.10.3.0/24  (southamerica-east1)
```

Dois modos: **auto** (cria uma sub-rede por região, faixas predefinidas — bom só para teste) e **custom** (você define as sub-redes — o recomendado). Planeje o CIDR antes: **sobreposição** de faixas impede peering e VPN.

```bash
gcloud services enable compute.googleapis.com
gcloud compute networks create vpc-trilhashop --subnet-mode=custom --bgp-routing-mode=global

for s in "web 10.10.1.0/24" "app 10.10.2.0/24" "dados 10.10.3.0/24"; do
  set -- $s
  gcloud compute networks subnets create snet-$1 --network=vpc-trilhashop \
    --region=southamerica-east1 --range=$2 --enable-private-ip-google-access
done

gcloud compute networks list
gcloud compute networks subnets list --network=vpc-trilhashop \
  --format="table(name,region.basename(),ipCidrRange,privateIpGoogleAccess)"
```

`--enable-private-ip-google-access` permite que VMs **sem IP público** acessem APIs do Google (Storage, BigQuery) por IP interno — essencial para manter a camada de dados fechada.

> `[ATENÇÃO]` A rede `default` (modo auto) existe em projetos novos, com regras de firewall permissivas (SSH/RDP/ICMP abertos). Em ambientes reais, **crie VPC custom e apague a `default`**.

![Console de VPC networks com a vpc-trilhashop e suas três sub-redes na região southamerica-east1](screenshots/05-redes-vpc/01-vpc-subnets.png)
> `[PRINT]` Passo a passo para capturar: Console → Rede da VPC → Redes VPC → `vpc-trilhashop`. Capturar a aba de sub-redes.

## Firewall: regras na VPC, não na VM

As **firewall rules** do GCP são aplicadas à **VPC** e escolhem as VMs-alvo por **tag de rede** ou por **service account**. Características importantes:

- **Stateful**: a resposta ao tráfego permitido volta sozinha.
- Direção **ingress** (entrada) ou **egress** (saída), ação **allow** ou **deny**, **prioridade** de 0 a 65535 (**menor número vence**).
- Regras implícitas: **negar toda entrada** e **permitir toda saída** (prioridade mais baixa, 65535).

```bash
# Web: HTTP/HTTPS da internet para VMs com a tag "web"
gcloud compute firewall-rules create allow-web --network=vpc-trilhashop \
  --direction=INGRESS --action=ALLOW --rules=tcp:80,tcp:443 \
  --source-ranges=0.0.0.0/0 --target-tags=web --priority=1000

# App: só a sub-rede web alcança a porta 8080 das VMs "app"
gcloud compute firewall-rules create allow-web-to-app --network=vpc-trilhashop \
  --direction=INGRESS --action=ALLOW --rules=tcp:8080 \
  --source-ranges=10.10.1.0/24 --target-tags=app

# Dados: só a camada app alcança o PostgreSQL
gcloud compute firewall-rules create allow-app-to-dados --network=vpc-trilhashop \
  --direction=INGRESS --action=ALLOW --rules=tcp:5432 \
  --source-tags=app --target-tags=dados

# SSH só pelo IAP (sem expor a porta 22 à internet)
gcloud compute firewall-rules create allow-iap-ssh --network=vpc-trilhashop \
  --direction=INGRESS --action=ALLOW --rules=tcp:22 --source-ranges=35.235.240.0/20

gcloud compute firewall-rules list --filter="network~vpc-trilhashop" \
  --format="table(name,direction,priority,sourceRanges.list(),allowed[].map().firewall_rule().list())"
```

O **IAP (Identity-Aware Proxy)** tunela SSH por identidade (`gcloud compute ssh --tunnel-through-iap`), então VMs não precisam de IP público nem de porta 22 aberta ao mundo.

> `[ATENÇÃO]` Regra com `--source-ranges=0.0.0.0/0` para SSH/RDP ou bancos é uma das falhas mais comuns (e o SCC a sinaliza). Use **tags/SAs** como origem e alvo, e IAP para administração.

Para depurar "por que não conecta?", o **Connectivity Tests** simula o caminho:

```bash
PROJETO=$(gcloud config get project)
gcloud network-management connectivity-tests create teste-web-app \
  --source-instance=projects/$PROJETO/zones/southamerica-east1-a/instances/vm-web \
  --destination-instance=projects/$PROJETO/zones/southamerica-east1-a/instances/vm-app \
  --destination-port=8080 --protocol=TCP
```

## Cloud NAT: saída para a internet sem IP público

VMs sem IP externo ainda precisam baixar pacotes. O **Cloud NAT** (gerenciado, sobre um **Cloud Router**) dá **saída** para a internet, mas **não permite entrada** iniciada de fora — ótimo para segurança.

```bash
gcloud compute routers create rtr-trilhashop --network=vpc-trilhashop --region=southamerica-east1
gcloud compute routers nats create nat-trilhashop --router=rtr-trilhashop --region=southamerica-east1 \
  --auto-allocate-nat-external-ips --nat-all-subnet-ip-ranges
gcloud compute routers nats describe nat-trilhashop --router=rtr-trilhashop --region=southamerica-east1
```

## Rotas, DNS e peering

- **Rotas**: toda VPC tem rotas de sistema (entre sub-redes, e `0.0.0.0/0` para a internet). Rotas customizadas: `gcloud compute routes create ... --next-hop-...`.
- **Cloud DNS**: zonas **públicas** e **privadas** (resolução só dentro da VPC).
- **VPC Peering**: liga duas VPCs (do mesmo ou de outro projeto) por IP interno. **Não é transitivo** e exige criar nos **dois lados**.
- **Shared VPC**: um projeto "host" compartilha suas sub-redes com projetos "service" — separa quem administra a rede de quem opera as aplicações (modelo corporativo).

```bash
gcloud services enable dns.googleapis.com
gcloud dns managed-zones create zona-privada --dns-name="trilhashop.interno." \
  --description="DNS privado" --visibility=private --networks=vpc-trilhashop
gcloud dns record-sets create api.trilhashop.interno. --zone=zona-privada \
  --type=A --ttl=300 --rrdatas=10.10.2.10

gcloud compute networks peerings create peer-a-b --network=vpc-trilhashop \
  --peer-network=vpc-outra --peer-project=<OUTRO-PROJETO>      # repita no outro lado
```

## Conectividade híbrida

- **Cloud VPN**: túnel IPsec cifrado pela internet (**HA VPN** tem SLA de 99,99%).
- **Cloud Interconnect**: link físico dedicado (**Dedicated**) ou por parceiro (**Partner**), sem passar pela internet.
- **Cloud Router** troca rotas por **BGP** nos dois casos.

> `[TEORIA]` Prova: VPN = barato e rápido de configurar, passa pela internet, cifrado; Interconnect = alta largura de banda e baixa latência, linha dedicada, mais caro e demorado. Escolha pela necessidade de banda/latência/SLA.

## Testando conectividade do terminal

Com VMs nas sub-redes (Módulo 08):

```bash
gcloud compute ssh vm-web --zone=southamerica-east1-a --tunnel-through-iap
# dentro da VM:
nc -zv 10.10.2.10 8080           # web -> app deve conectar
nc -zv 10.10.3.10 5432           # web -> dados deve FALHAR (firewall)
dig +short api.trilhashop.interno
curl -s ifconfig.me              # VM sem IP público: com Cloud NAT retorna o IP do NAT
```

## Práticas

### Prática isolada

1. Crie a VPC custom `vpc-lab` com duas sub-redes em regiões diferentes e confirme que uma VM em cada uma se comunica por IP interno (`ping`).
2. Escreva uma regra de firewall que permita só `tcp:8080` vindo da outra sub-rede e prove a negação para outras portas.
3. Crie o Cloud NAT e prove: VM sem IP público consegue `apt update`.
4. Apague a rede `default` do projeto de laboratório (depois de apagar suas regras): `gcloud compute networks delete default`.

**Limpeza:** apague VMs, NAT, router, firewall rules, sub-redes e VPC (nessa ordem), ou o projeto de laboratório.

### Contribuição ao projeto integrador

Monte a rede do TrilhaShop: `vpc-trilhashop` (custom, `10.10.0.0/16`) com `snet-web`, `snet-app` e `snet-dados`, as regras `allow-web`, `allow-web-to-app`, `allow-app-to-dados`, `allow-iap-ssh`, e o Cloud NAT. A camada de dados **não** terá IP público (acesso privado ao Cloud SQL é configurado no Módulo 12).

`[CUSTO]` VPC, sub-redes, firewall e peering têm custo desprezível; **Cloud NAT, Cloud VPN, Interconnect e IPs externos reservados e ociosos cobram por hora** — apague ao terminar.

## Erros comuns nesta fase

- Faixas de CIDR sobrepostas (impede peering/VPN).
- Manter a rede `default` e suas regras abertas.
- Abrir SSH/RDP/banco para `0.0.0.0/0`.
- Achar que peering é transitivo ou criá-lo só de um lado.
- Esquecer o Private Google Access e ficar sem acesso às APIs em VMs sem IP externo.
- Confundir prioridade (menor número = maior prioridade).

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Sub-redes e firewall | VMs e MIGs — Módulo 08; GKE — Módulo 09 |
| Cloud NAT, sem IP público | Cloud SQL privado — Módulo 12 |
| Cloud DNS | Load balancer e domínios — Módulo 06 |
| CIDR, DNS, VPN (teoria) | Trilha Linux, Módulos 09 e 18 |
| VNet no Azure | Azure, Módulo 06 |

## `[REFERÊNCIA]`

- Google Cloud — *VPC overview*: https://cloud.google.com/vpc/docs/overview
- Google Cloud — *VPC firewall rules*: https://cloud.google.com/firewall/docs/firewalls
- Google Cloud — *Cloud NAT*: https://cloud.google.com/nat/docs/overview
- Google Cloud — *VPC Network Peering*: https://cloud.google.com/vpc/docs/vpc-peering
- Google Cloud — *Shared VPC*: https://cloud.google.com/vpc/docs/shared-vpc
- Google Cloud — *Cloud VPN* e *Interconnect*: https://cloud.google.com/network-connectivity/docs/vpn/concepts/overview
- Google Cloud — *IAP TCP forwarding*: https://cloud.google.com/iap/docs/using-tcp-forwarding
- Google Cloud — *Connectivity Tests*: https://cloud.google.com/network-intelligence-center/docs/connectivity-tests/concepts/overview

**Como aprofundar:** estude o *Private Service Connect* (acesso privado a serviços) e as *hierarchical firewall policies* (regras no nível de pasta/organização).

## Checklist de saída

- [ ] Explicar por que a VPC do GCP é global e as sub-redes são regionais.
- [ ] Diferenciar modo auto e custom e justificar o custom.
- [ ] Escrever firewall rules por tag/SA, com prioridade, para um desenho de três camadas.
- [ ] Explicar IAP para SSH sem IP público.
- [ ] Explicar Cloud NAT e Private Google Access.
- [ ] Diferenciar VPC Peering, Shared VPC, Cloud VPN e Interconnect.
- [ ] Ter criado a `vpc-trilhashop` do TrilhaShop com as regras por camada.
