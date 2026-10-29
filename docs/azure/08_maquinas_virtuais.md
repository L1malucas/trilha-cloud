---
id: "08_maquinas_virtuais"
title: "Módulo 08 — Máquinas Virtuais"
sidebar_label: "08 · Máquinas Virtuais"
sidebar_position: 8
---

# Módulo 08 — Máquinas Virtuais

> **Objetivo**: criar, acessar, dimensionar e proteger máquinas virtuais do Azure; entender tamanhos, discos, zonas, Scale Sets, backup e modelos de compra; e subir a API do TrilhaShop com `cloud-init`.
>
> **Pré-requisitos**: módulos 05, 06 e 07 (NSG, VNet, Load Balancer).
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre **Deploy and manage Azure compute resources** (AZ-104). Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104

---

## O servidor que você aluga por hora

Uma **VM** é um computador inteiro (SO incluso) rodando no hardware da Microsoft. É IaaS (Módulo 01): você cuida do SO para cima. Cada VM é, na verdade, um conjunto de recursos separados: a **VM** em si, o **disco de SO**, a **NIC** (placa de rede), o **IP público** (opcional) e o **NSG**. Por isso `az vm delete` **não** apaga o disco, a NIC e o IP — um clássico de custo esquecido.

### Tamanhos: o nome carrega a especificação

`Standard_D2s_v5` se lê: família **D** (uso geral), **2** vCPUs, **s** = suporta Premium SSD, **v5** = geração. Famílias principais: **B** (burstable, baratas, ótimas para laboratório), **D** (uso geral), **E** (memória), **F** (computação), **L** (armazenamento), **N** (GPU).

```bash
az vm list-sizes -l brazilsouth --query "[?numberOfCores<=2].{nome:name, cpu:numberOfCores, ram_mb:memoryInMb}" -o table
az vm list-skus -l brazilsouth --size Standard_B --zone -o table | head
```

### Discos

| Tipo | Quando |
|---|---|
| Standard HDD | Backup, acesso raro |
| Standard SSD | Web, dev/teste |
| Premium SSD | Produção, bancos |
| Ultra Disk | I/O extremo |

Todos são **managed disks**: o Azure cuida do armazenamento. O disco de SO é efêmero ou persistente; discos de dados anexam à VM e sobrevivem a ela.

## Criando e acessando uma VM

```bash
RG=rg-trilhashop-dev
az vm create -g $RG -n vm-api-1 \
  --image Ubuntu2204 --size Standard_B1s \
  --vnet-name vnet-trilhashop --subnet snet-app \
  --admin-username azureuser --generate-ssh-keys \
  --public-ip-address "" --nsg "" \
  --zone 1

az vm show -g $RG -n vm-api-1 -d --query "{estado:powerState, ipPrivado:privateIps}" -o json
```

`--public-ip-address ""` cria a VM **sem IP público** (a melhor prática: acesso via bastion, VPN ou Load Balancer). Para um lab rápido, retire essa opção e use `--public-ip-sku Standard`.

```bash
ssh azureuser@$(az vm show -g $RG -n vm-api-1 -d --query publicIps -o tsv)

# Alternativa sem abrir SSH: executar comando remotamente pelo agente
az vm run-command invoke -g $RG -n vm-api-1 --command-id RunShellScript \
  --scripts "uname -a && df -h"
```

> `[ATENÇÃO]` O `--generate-ssh-keys` cria `~/.ssh/id_rsa` **se não existir** e a reutiliza. Faça backup da chave: sem ela (e sem senha), você perde o acesso à VM.

![Lista de VMs no portal com a vm-api-1 em estado Running, tamanho Standard_B1s e zona 1](screenshots/08-maquinas-virtuais/01-lista-de-vms.png)
> `[PRINT]` Passo a passo para capturar: portal → Virtual machines. Capturar a lista com nome, estado, tamanho e zona.

## Cloud-init: a VM nasce configurada

Como o *user data* da AWS, o **cloud-init** roda um arquivo de configuração no primeiro boot. Isso permite subir uma VM já com a aplicação, sem entrar manualmente.

```yaml
# cloud-init.yaml
#cloud-config
package_update: true
packages: [nginx, python3-pip]
write_files:
  - path: /var/www/html/saude
    content: "ok"
runcmd:
  - systemctl enable --now nginx
```

```bash
az vm create -g $RG -n vm-api-2 --image Ubuntu2204 --size Standard_B1s \
  --vnet-name vnet-trilhashop --subnet snet-app \
  --custom-data cloud-init.yaml --admin-username azureuser --generate-ssh-keys
```

Depois de criada, confira se o cloud-init terminou: `ssh ... cloud-init status --wait`.

## Disponibilidade: Availability Set, Zonas e Scale Sets

| Recurso | Protege contra | Observação |
|---|---|---|
| **Availability Set** | Falha de rack/manutenção no mesmo datacenter | Domínios de falha e de atualização |
| **Availability Zones** | Queda de um datacenter inteiro | VMs em zonas 1/2/3; SLA maior |
| **VM Scale Set (VMSS)** | Falta de capacidade e de elasticidade | Conjunto de VMs idênticas com **autoscale** |

> `[TEORIA]` SLA de VMs na prova: instância única com Premium SSD (99,9%), Availability Set (99,95%), Availability Zones (99,99%). Confirme sempre os valores atuais no SLA oficial: https://azure.microsoft.com/support/legal/sla/virtual-machines/

```bash
az vmss create -g $RG -n vmss-api --image Ubuntu2204 --vm-sku Standard_B1s \
  --instance-count 2 --vnet-name vnet-trilhashop --subnet snet-app \
  --custom-data cloud-init.yaml --admin-username azureuser --generate-ssh-keys \
  --load-balancer lb-api --zones 1 2 3

az monitor autoscale create -g $RG --resource vmss-api --resource-type Microsoft.Compute/virtualMachineScaleSets \
  --name autoscale-api --min-count 2 --max-count 6 --count 2
az monitor autoscale rule create -g $RG --autoscale-name autoscale-api \
  --condition "Percentage CPU > 70 avg 5m" --scale out 1
```

## Dimensionar e economizar

```bash
az vm resize -g $RG -n vm-api-1 --size Standard_B2s      # escala vertical (reinicia)
az vm deallocate -g $RG -n vm-api-1                       # para e NÃO cobra computação
az vm start -g $RG -n vm-api-1
```

> `[ATENÇÃO]` **Stop dentro do SO** (`shutdown`) deixa a VM no estado *Stopped*, mas **continua cobrando computação**, porque o hardware segue reservado. Só `az vm deallocate` (estado *Deallocated*) para a cobrança. O disco continua cobrando em ambos.

**Modelos de compra:** *Pay-as-you-go* (por segundo, sem compromisso), *Reservations* (1/3 anos, grande desconto, carga estável), *Savings Plan for compute* (compromisso de gasto por hora, flexível), *Spot* (capacidade ociosa até ~90% mais barata, pode ser despejada — só cargas tolerantes a interrupção) e *Azure Hybrid Benefit* (reuse licenças de Windows/SQL).

## Backup e recuperação

- **Azure Backup**: cópias agendadas em um *Recovery Services vault*.
- **Azure Site Recovery**: replica VMs para outra região, para DR.

```bash
az backup vault create -g $RG -n rsv-trilhashop -l brazilsouth
az backup protection enable-for-vm -g $RG --vault-name rsv-trilhashop --vm vm-api-1 --policy-name DefaultPolicy
az backup job list -g $RG --vault-name rsv-trilhashop -o table
```

## Práticas

### Prática isolada

1. Crie uma VM `Standard_B1s` com cloud-init instalando nginx.
2. Teste `curl http://<ip>/saude` (libere a porta 80 no NSG) e depois execute `az vm run-command invoke` para ler o log do cloud-init (`/var/log/cloud-init-output.log`).
3. Aumente o tamanho para `B2s`, observe o reinício e anote o tempo de indisponibilidade.
4. Compare o custo dos estados *Stopped* e *Deallocated* na Cost Analysis no dia seguinte.

**Limpeza:** `az group delete -n rg-lab-vm --yes --no-wait` (apaga VM, disco, NIC, IP e NSG juntos).

### Contribuição ao projeto integrador

Suba a API do TrilhaShop em VMSS:

1. `cloud-init.yaml` com nginx servindo `/saude` (a aplicação real entra no Módulo 09).
2. `vmss-api` com 2 instâncias em `snet-app`, associadas ao `lb-api` do Módulo 07, em 3 zonas.
3. Autoscale 2–6 instâncias a 70% de CPU.
4. Derrube uma instância (`az vmss deallocate --instance-ids 0`) e prove, com `curl` em loop no IP do LB, que o serviço não cai.

`[CUSTO]` `B1s` em conta nova tem 750 h/mês grátis por 12 meses (uma VM); duas instâncias ligadas o mês inteiro estouram esse limite. Desaloque (`az vmss deallocate`) entre as sessões.

## Erros comuns nesta fase

- Achar que `az vm delete` apaga disco, NIC e IP (apaga só a VM).
- Parar a VM pelo SO e continuar pagando.
- Escolher o tamanho pelo nome, sem conferir disponibilidade na região/zona.
- Deixar SSH aberto para a internet em vez de restringir ao seu IP.
- Perder a chave SSH.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| VMSS e LB | Autoscale e monitoramento — Módulo 15 |
| Cloud-init | Ansible e Terraform — trilha Linux, Módulo 21 |
| Backup/Site Recovery | Resiliência e DR — Módulo 15 |
| Modelos de compra | Custos — Módulo 16 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Virtual machines overview*: https://learn.microsoft.com/azure/virtual-machines/overview
- Microsoft Learn — *Sizes for VMs*: https://learn.microsoft.com/azure/virtual-machines/sizes
- Microsoft Learn — *Virtual Machine Scale Sets*: https://learn.microsoft.com/azure/virtual-machine-scale-sets/overview
- Microsoft Learn — *cloud-init no Azure*: https://learn.microsoft.com/azure/virtual-machines/linux/using-cloud-init
- Microsoft Learn — *Azure Backup*: https://learn.microsoft.com/azure/backup/backup-overview
- Preços de VMs: https://azure.microsoft.com/pricing/details/virtual-machines/linux/

**Como aprofundar:** pratique no WSL o `az vm` com `--query` para listar tudo que sobra após deletar VMs (`az disk list --query "[?managedBy==null]"`) e ganhar o hábito de caçar recursos órfãos.

## Checklist de saída

- [ ] Ler o nome de um tamanho de VM e dizer o que ele indica.
- [ ] Explicar que a VM é um conjunto de recursos (VM, disco, NIC, IP, NSG).
- [ ] Diferenciar *Stopped* de *Deallocated* quanto a custo.
- [ ] Comparar Availability Set, Zonas e VMSS.
- [ ] Criar uma VM com cloud-init e verificar o resultado.
- [ ] Diferenciar PAYG, Reservation, Savings Plan e Spot.
- [ ] Ter subido o VMSS da API do TrilhaShop atrás do `lb-api`.
