---
id: "02_infraestrutura_global_do_azure"
title: "Módulo 02 — Infraestrutura Global do Azure"
sidebar_label: "02 · Infraestrutura Global"
sidebar_position: 2
---

# Módulo 02 — Infraestrutura Global do Azure

> **Objetivo**: entender onde, fisicamente, o seu recurso mora — geografias, regiões, pares de regiões e zonas de disponibilidade — e saber escolher a região de um projeto com critério, consultando tudo pela CLI.
>
> **Pré-requisitos**: módulos 00 e 01.
>
> **Tempo de referência (não prazo)**: poucos dias.
>
> Cobre o tópico **Describe Azure architecture and services → infraestrutura física** do AZ-900 e a base de resiliência cobrada no AZ-104. Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900

---

## Do mapa-múndi ao rack

Imagine uma rede de lojas. Há o **país** (regras locais, idioma), as **cidades** onde ficam as lojas e, dentro de uma cidade, **prédios independentes**, cada um com a sua energia e o seu ar-condicionado. O Azure usa a mesma lógica, de fora para dentro:

1. **Geografia** — um mercado com fronteira de dados e conformidade (ex.: Brasil, Estados Unidos). Garante *residência de dados*.
2. **Região** — um conjunto de datacenters ligados por rede de baixa latência numa área (ex.: **Brazil South**, em São Paulo).
3. **Zona de disponibilidade (AZ)** — datacenters fisicamente separados *dentro* da região, cada um com energia, refrigeração e rede próprias. Uma região com AZs tem no mínimo 3 zonas.
4. **Par de regiões** — duas regiões na mesma geografia, a centenas de quilômetros, projetadas para recuperação de desastre (Brazil South ↔ South Central US).

> `[TEORIA]` Por que existem as AZs? Uma falha de energia ou de resfriamento derruba um datacenter. Se suas VMs estão em zonas distintas, a aplicação continua de pé. É a diferença entre *tolerância a falha de datacenter* (AZ) e *tolerância a desastre regional* (par de regiões).

![Mapa oficial de regiões do Azure, com Brazil South destacada](screenshots/02-infraestrutura-global-do-azure/01-mapa-regioes.png)
> `[PRINT]` Passo a passo para capturar: abrir https://azure.microsoft.com/explore/global-infrastructure/geographies/ e capturar o mapa com Brazil South visível.

## Como escolher uma região

Quatro critérios, nessa ordem de peso típica:

1. **Conformidade e residência de dados** — a LGPD ou o contrato exigem dado no Brasil? Então Brazil South (ou Brazil Southeast).
2. **Latência** — fique perto dos usuários.
3. **Disponibilidade de serviços e tamanhos** — nem todo serviço ou SKU existe em toda região.
4. **Preço** — o mesmo recurso custa diferente por região.

> `[ATENÇÃO]` Nem toda região tem zonas de disponibilidade nem todos os serviços. Verifique *antes* de desenhar a arquitetura, não no dia de implantar.

## Zonal, zona-redundante e região-redundante

- **Zonal**: você escolhe a zona (ex.: VM na zona 1).
- **Zona-redundante**: o serviço se replica entre zonas sozinho (ex.: armazenamento ZRS).
- **Região-redundante**: replica para a região par (ex.: armazenamento GRS).

Cada passo acima compra mais resiliência e custa mais; o Módulo 10 aplica isso a storage e o 15 a DR.

## Consultando a infraestrutura pela CLI

```bash
az account list-locations -o table
az account list-locations --query "[?metadata.regionCategory=='Recommended'].{nome:name, exibicao:displayName}" -o table
az vm list-skus -l brazilsouth --resource-type virtualMachines --zone -o table | head
az provider list --query "[?registrationState=='Registered'].namespace" -o tsv
az provider show -n Microsoft.Compute --query "resourceTypes[?resourceType=='virtualMachines'].locations" -o json
```

- `list-locations` mostra todas as regiões; o campo `metadata` revela categoria e região-par.
- `vm list-skus --zone` mostra em que zonas cada tamanho existe.
- `az provider show` lista, por tipo de recurso, as regiões que o suportam — a resposta objetiva a "esse serviço existe nesta região?".

> `[TENTE VOCÊ]` Descubra a região par de `brazilsouth`. Resposta: `az account list-locations --query "[?name=='brazilsouth'].metadata.pairedRegion[0].name" -o tsv` (deve apontar para `southcentralus`).

![Saída de `az account list-locations -o table` filtrada para as regiões recomendadas](screenshots/02-infraestrutura-global-do-azure/02-list-locations.png)
> `[PRINT]` Passo a passo para capturar: rodar a segunda consulta acima e capturar a tabela resultante.

## Práticas

### Prática isolada

1. Liste as regiões recomendadas e localize Brazil South.
2. Descubra a região par com `--query`.
3. Verifique se o tamanho `Standard_D2s_v5` existe em `brazilsouth` e em quais zonas:
   ```bash
   az vm list-skus -l brazilsouth --size Standard_D2s_v5 --zone -o table
   ```
4. Compare com `eastus`: o tamanho aparece em quantas zonas? Anote a diferença.

Não cria nenhum recurso, então não há custo nem limpeza.

### Contribuição ao projeto integrador

No `decisoes.md`, registre a **decisão de região** do TrilhaShop com os quatro critérios: região primária `brazilsouth`, região de DR `southcentralus` (par), justificativa de LGPD/latência, e o resultado da checagem de SKUs/zonas. Defina o padrão para o resto da trilha:

```bash
az configure --defaults location=brazilsouth group=rg-trilhashop-dev
```

## Erros comuns nesta fase

- Escolher a região só pelo preço e ferir a residência de dados.
- Assumir que toda região tem AZs e todos os serviços.
- Confundir *zona de disponibilidade* (datacenters na mesma região) com *par de regiões* (regiões diferentes).

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Zonas de disponibilidade | VMs e Scale Sets — Módulo 08 |
| Redundância ZRS/GRS | Armazenamento — Módulo 10 |
| Par de regiões, DR | Resiliência — Módulo 15 |
| Preço por região | Custos — Módulo 16 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Describe Azure physical infrastructure*: https://learn.microsoft.com/training/modules/describe-azure-architecture-services/
- Microsoft Learn — *Azure regions*: https://learn.microsoft.com/azure/reliability/regions-overview
- Microsoft Learn — *Availability zones*: https://learn.microsoft.com/azure/reliability/availability-zones-overview
- Microsoft Learn — *Paired regions*: https://learn.microsoft.com/azure/reliability/regions-paired
- Infraestrutura global: https://azure.microsoft.com/explore/global-infrastructure/

**Como aprofundar:** a tabela "Azure products by region" (https://azure.microsoft.com/explore/global-infrastructure/products-by-region/) mostra o que existe em cada região.

## Checklist de saída

- [ ] Explicar geografia, região, zona e par de regiões, e que problema cada um resolve.
- [ ] Citar os critérios de escolha de região e dar um exemplo de cada.
- [ ] Diferenciar zonal, zona-redundante e região-redundante.
- [ ] Consultar regiões, par e zonas de um SKU via `az`.
- [ ] Ter registrado a decisão de região do TrilhaShop e configurado os padrões do `az`.
