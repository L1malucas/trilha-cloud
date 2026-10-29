---
id: "02_infraestrutura_global_do_gcp"
title: "Módulo 02 — Infraestrutura Global do GCP"
sidebar_label: "02 · Infraestrutura Global"
sidebar_position: 2
---

# Módulo 02 — Infraestrutura Global do GCP

> **Objetivo**: entender onde, fisicamente, o seu recurso mora — regiões, zonas, pontos de presença (edge) e a rede global do Google — e escolher a região de um projeto com critério, consultando tudo pela CLI.
>
> **Pré-requisitos**: módulos 00 e 01.
>
> **Tempo de referência (não prazo)**: poucos dias.
>
> Cobre infraestrutura global do **Cloud Digital Leader** e a escolha de região/zona do **Associate Cloud Engineer**. Referência: https://cloud.google.com/about/locations

---

## Da cidade ao rack

Pense numa rede de lojas: o **país**, as **cidades** onde ficam as lojas e, dentro de uma cidade, **prédios independentes**, cada um com energia e refrigeração próprias. O GCP usa a mesma lógica:

- **Região**: uma localização geográfica independente (ex.: `southamerica-east1`, São Paulo; `us-central1`, Iowa). Tem **três ou mais zonas**.
- **Zona**: um ou mais datacenters isolados dentro da região (ex.: `southamerica-east1-a`). É a unidade de **falha**: se uma zona cai, as outras da região continuam.
- **Multirregião** (ex.: `US`, `EU`, `ASIA`): para serviços que replicam dados por várias regiões (Cloud Storage, BigQuery).
- **Pontos de presença (edge/PoPs)**: locais da rede do Google perto dos usuários, usados por Cloud CDN, Cloud DNS e pelo tráfego de entrada.

> `[TEORIA]` Por que existem zonas? Uma falha de energia derruba um datacenter. Com VMs em **zonas diferentes**, a aplicação continua. Resiliência a falha de **zona** = distribuir entre zonas; a falha de uma **região** inteira exige multirregião ou DR em outra região.

![Mapa de regiões e zonas do Google Cloud com São Paulo (southamerica-east1) em destaque](screenshots/02-infraestrutura-global-do-gcp/01-mapa-regioes.png)
> `[PRINT]` Passo a passo para capturar: abrir https://cloud.google.com/about/locations e capturar o mapa com `southamerica-east1` visível.

## A rede privada global do Google

Diferente de provedores que entregam tráfego à internet pública logo na saída, o Google leva seu tráfego pela **própria rede de fibra**, entrando pelo ponto de presença mais próximo do usuário. Dois efeitos:

- **Latência menor e mais estável** entre regiões e para usuários finais.
- A **VPC é global** (Módulo 05): uma única rede abrange todas as regiões, ao contrário de um modelo "uma rede por região".

O **Network Service Tiers** permite escolher: **Premium** (rede global do Google, padrão) ou **Standard** (sai para a internet pública mais cedo, mais barato, menor desempenho).

## Como escolher a região

Critérios, por ordem de peso típica:

1. **Conformidade e residência de dados**: LGPD ou contrato exigem dado no Brasil? Então `southamerica-east1`.
2. **Latência**: perto dos usuários.
3. **Disponibilidade de serviços e tipos de máquina**: nem tudo existe em toda região.
4. **Preço**: o mesmo recurso custa diferente por região.
5. **Sustentabilidade**: o Google publica o indicador de baixo carbono (CFE%) por região.

> `[ATENÇÃO]` Nem todo serviço ou tipo de máquina existe em todas as regiões/zonas. Verifique **antes** de desenhar, não no dia de implantar.

## Consultando a infraestrutura pela CLI

```bash
gcloud compute regions list --format="table(name,status,zones.basename())"
gcloud compute zones list --filter="region~southamerica-east1" --format="table(name,status)"
gcloud compute regions describe southamerica-east1 --format="yaml(name,status,quotas[0:3])"
gcloud compute machine-types list --zones=southamerica-east1-a --filter="name~^e2-" --format="table(name,guestCpus,memoryMb)"
gcloud compute accelerator-types list --filter="zone~southamerica-east1"      # GPUs disponíveis
gcloud config get compute/region compute/zone
```

- `regions list` mostra todas as regiões e as zonas de cada uma.
- `machine-types list --zones=` responde "este tipo de máquina existe nesta zona?".
- `regions describe` traz as cotas da região (limites de CPU, IPs...), importante para planejar.

> `[TENTE VOCÊ]` Em quantas zonas a região `southamerica-east1` está disponível? Resposta: `gcloud compute zones list --filter="region~southamerica-east1" --format="value(name)" | wc -l` (normalmente 3).

![Saída de `gcloud compute zones list` para a região southamerica-east1, com as zonas a, b e c](screenshots/02-infraestrutura-global-do-gcp/02-zones-list.png)
> `[PRINT]` Passo a passo para capturar: rodar o segundo comando do bloco acima e capturar a tabela com as zonas e o status.

## Zonal, regional e global: o escopo dos recursos

Todo recurso do GCP tem um **escopo**, e isso aparece nos comandos (`--zone`, `--region` ou nenhum):

| Escopo | Exemplos | Consequência |
|---|---|---|
| **Zonal** | VM, disco persistente zonal, cluster GKE zonal | Cai com a zona |
| **Regional** | Sub-rede, IP externo regional, MIG regional, Cloud Run | Atravessa as zonas da região |
| **Global** | VPC, firewall rules, imagens, IP global, balanceador HTTP(S) | Vale em todas as regiões |

> `[ATENÇÃO]` Disco e VM precisam estar na **mesma zona** para anexar. Um erro clássico ao mover ou recriar recursos é esquecer a zona do disco.

## Práticas

### Prática isolada

1. Liste as regiões e identifique a de São Paulo e as três zonas dela.
2. Compare a existência do tipo `n2-standard-2` em `southamerica-east1-a` e em `us-central1-a`.
3. Veja as cotas de CPUs da região (`gcloud compute regions describe southamerica-east1`) e anote o limite.
4. Defina os padrões da trilha:
   ```bash
   gcloud config set compute/region southamerica-east1
   gcloud config set compute/zone southamerica-east1-a
   ```

Não cria recursos, então não há custo nem limpeza.

### Contribuição ao projeto integrador

No `decisoes.md`, registre a **decisão de região** do TrilhaShop usando os critérios acima: região primária `southamerica-east1` (LGPD/latência), região de DR (por exemplo `us-east1` ou `us-central1`), justificativa e o resultado das checagens de tipos de máquina e cotas.

## Erros comuns nesta fase

- Escolher a região só pelo preço e violar residência de dados.
- Assumir que todo serviço existe em todas as regiões.
- Confundir região com zona.
- Esquecer o escopo do recurso (zonal x regional x global).

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| VPC global | Redes VPC — Módulo 05 |
| Zonas e MIGs regionais | Compute Engine — Módulo 08 |
| Multirregião | Armazenamento — Módulo 11; BigQuery — Módulo 13 |
| Edge e CDN | Load Balancing e CDN — Módulo 06 |
| Preço por região | Custos — Módulo 16 |

## `[REFERÊNCIA]`

- Google Cloud — *Geography and regions*: https://cloud.google.com/docs/geography-and-regions
- Google Cloud — *Locations*: https://cloud.google.com/about/locations
- Google Cloud — *Regions and zones (Compute Engine)*: https://cloud.google.com/compute/docs/regions-zones
- Google Cloud — *Global, regional and zonal resources*: https://cloud.google.com/compute/docs/regions-zones/global-regional-zonal-resources
- Google Cloud — *Network Service Tiers*: https://cloud.google.com/network-tiers/docs/overview
- Google Cloud — *Região e baixo carbono*: https://cloud.google.com/sustainability/region-carbon

**Como aprofundar:** estude a tabela de "serviços por região" (https://cloud.google.com/about/locations#region) e o guia *Best practices for Compute Engine region selection*.

## Checklist de saída

- [ ] Explicar região, zona, multirregião e edge.
- [ ] Explicar por que o Google tem uma rede privada global e o que é a VPC global.
- [ ] Citar os critérios de escolha de região.
- [ ] Diferenciar recursos zonais, regionais e globais.
- [ ] Consultar regiões, zonas e tipos de máquina via `gcloud`.
- [ ] Ter registrado a decisão de região do TrilhaShop.
