---
id: "08_compute_engine"
title: "Módulo 08 — Compute Engine"
sidebar_label: "08 · Compute Engine"
sidebar_position: 8
---

# Módulo 08 — Compute Engine

> **Objetivo**: criar, acessar, dimensionar e proteger VMs no Compute Engine; entender famílias de máquina, discos, imagens, instance templates, MIGs com autoscaling, Spot e descontos; e subir a API do TrilhaShop com *startup script*, atrás do balanceador do Módulo 06.
>
> **Pré-requisitos**: módulos 04, 05 e 06 (IAM, VPC, balanceador).
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre "Planning and implementing compute resources" do **Associate Cloud Engineer**. Referência: https://cloud.google.com/compute/docs

---

## O servidor que você aluga por segundo

O **Compute Engine** é o IaaS do GCP: você recebe uma **VM** e cuida do SO para cima (Módulo 01). A VM é um conjunto de recursos: a instância, o **disco de boot**, a(s) **NIC(s)**, IPs e as regras de firewall que a alcançam. Cobrança **por segundo** (mínimo de 1 minuto) enquanto a VM está **em execução**.

### Tipos de máquina: o nome carrega a especificação

`e2-standard-4` = família **e2**, perfil **standard**, **4** vCPUs. As famílias principais:

| Família | Foco | Exemplos |
|---|---|---|
| **E2** | Custo-benefício, uso geral | Web, dev/teste |
| **N2 / N2D / N4** | Uso geral, mais desempenho | Aplicações em produção |
| **C3 / C2** | Computação intensiva | Jogos, HPC, análise |
| **M3 / M2** | Memória extra | Bancos em memória, SAP HANA |
| **A3 / A2 / G2** | GPU | Treino e inferência de ML |
| **T2A** | Processadores Arm | Cargas escaláveis com custo menor |

Além dos tipos **predefinidos**, há **custom machine types** (você escolhe vCPU e memória) e as **VMs compartilhadas** (`e2-micro`, `e2-small`, `e2-medium`, com CPU "burstable").

```bash
gcloud compute machine-types list --zones=southamerica-east1-a --filter="name~^e2-" \
  --format="table(name,guestCpus,memoryMb)"
```

### Discos

| Tipo | Quando |
|---|---|
| **Standard (pd-standard)** | HDD barato, acesso sequencial |
| **Balanced (pd-balanced)** | SSD equilibrado — **padrão** da maioria |
| **SSD (pd-ssd)** | Alto desempenho/baixa latência |
| **Hyperdisk** | Desempenho ajustável independente do tamanho |
| **Local SSD** | Muito rápido, **efêmero** (some ao parar/apagar a VM) |

Discos persistentes existem **independentes da VM** (podem ser desanexados e reanexados), são **zonais** (ou regionais, replicados entre duas zonas) e redimensionáveis a quente (só crescem).

## Criando e acessando uma VM

```bash
PROJETO=$(gcloud config get project)
ZONA=southamerica-east1-a
SA=sa-trilhashop-api@$PROJETO.iam.gserviceaccount.com

gcloud compute instances create vm-api-1 \
  --zone=$ZONA --machine-type=e2-small \
  --network=vpc-trilhashop --subnet=snet-app --no-address \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=20GB --boot-disk-type=pd-balanced \
  --service-account=$SA --scopes=cloud-platform \
  --tags=app --labels=projeto=trilhashop,ambiente=dev

gcloud compute instances list --format="table(name,zone.basename(),machineType.basename(),status,networkInterfaces[0].networkIP)"
gcloud compute instances describe vm-api-1 --zone=$ZONA --format="yaml(status,machineType,disks[0].diskSizeGb)"
```

`--no-address` cria a VM **sem IP público** (melhor prática). Acesse por **IAP** (Módulo 05), que usa sua identidade em vez de abrir a porta 22:

```bash
gcloud compute ssh vm-api-1 --zone=$ZONA --tunnel-through-iap
# Alternativa para laboratório rápido: crie a VM COM IP público e use apenas:
gcloud compute ssh vm-api-1 --zone=$ZONA
```

`gcloud compute ssh` gera e gerencia a chave SSH para você (via metadados do projeto ou **OS Login**, que usa IAM para autorizar SSH — recomendado).

> `[ATENÇÃO]` Sem IP público, a VM precisa de **Cloud NAT** para baixar pacotes (Módulo 05) e de **Private Google Access** para falar com as APIs do Google. Se `apt update` trava, olhe o NAT primeiro.

![Console do Compute Engine com a lista de VMs mostrando vm-api-1 em execução, tipo e2-small, zona southamerica-east1-a e IP interno](screenshots/08-compute-engine/01-lista-de-vms.png)
> `[PRINT]` Passo a passo para capturar: Console → Compute Engine → Instâncias de VM. Capturar a lista com nome, zona, tipo e IP interno.

## Startup script: a VM nasce configurada

Um **startup script** roda a cada boot (via metadados) e configura a VM sem login manual — o equivalente ao *user data* (AWS) e ao *cloud-init* (Azure).

```bash
cat > startup.sh <<'EOF'
#!/usr/bin/env bash
apt-get update -y && apt-get install -y nginx
HOST=$(hostname)
echo "TrilhaShop API em $HOST" > /var/www/html/index.html
echo "ok" > /var/www/html/saude
sed -i 's/listen 80 default_server;/listen 8080 default_server;/; s/listen \[::\]:80 default_server;/listen [::]:8080 default_server;/' /etc/nginx/sites-available/default
systemctl restart nginx
EOF

gcloud compute instances create vm-api-2 --zone=$ZONA --machine-type=e2-small \
  --network=vpc-trilhashop --subnet=snet-app --no-address --tags=app \
  --image-family=debian-12 --image-project=debian-cloud \
  --metadata-from-file=startup-script=startup.sh
gcloud compute instances get-serial-port-output vm-api-2 --zone=$ZONA | tail -20   # log do boot
```

## Imagens, snapshots e templates

- **Imagem**: molde de disco de boot. Públicas (Debian, Ubuntu, Windows) ou **customizadas** (a sua, criada a partir de um disco: `gcloud compute images create`). Use **famílias** (`--image-family`) para sempre pegar a mais recente.
- **Snapshot**: cópia do disco em um instante, para backup e restauração; **incrementais** e globais. Agende com **snapshot schedules**.
- **Instance template**: a "receita" da VM (tipo, imagem, rede, SA, script) usada para criar VMs idênticas e por **MIGs**.

```bash
gcloud compute disks snapshot vm-api-1 --zone=$ZONA --snapshot-names=snap-api-1
gcloud compute snapshots list
gcloud compute resource-policies create snapshot-schedule diario \
  --region=southamerica-east1 --daily-schedule --start-time=03:00 --max-retention-days=7
```

## MIG: grupos gerenciados com autoscaling

Um **Managed Instance Group (MIG)** mantém um conjunto de VMs idênticas a partir de um *template*, com:

- **Autoscaling** (por CPU, métricas, horário).
- **Autohealing**: recria VMs que falham no health check.
- **Rolling update**: troca o template aos poucos, sem downtime.
- **Regional** (várias zonas) ou zonal.

```bash
gcloud compute instance-templates create tpl-api \
  --machine-type=e2-small --network=vpc-trilhashop --subnet=snet-app --no-address \
  --region=southamerica-east1 --tags=app \
  --image-family=debian-12 --image-project=debian-cloud \
  --service-account=$SA --scopes=cloud-platform \
  --metadata-from-file=startup-script=startup.sh

gcloud compute instance-groups managed create mig-api \
  --region=southamerica-east1 --template=tpl-api --size=2

gcloud compute instance-groups managed set-named-ports mig-api --region=southamerica-east1 --named-ports=http:8080
gcloud compute instance-groups managed set-autoscaling mig-api --region=southamerica-east1 \
  --min-num-replicas=2 --max-num-replicas=6 --target-cpu-utilization=0.7 --cool-down-period=90
gcloud compute instance-groups managed update mig-api --region=southamerica-east1 \
  --health-check=hc-api --initial-delay=120          # autohealing (health check do Módulo 06)

gcloud compute instance-groups managed list-instances mig-api --region=southamerica-east1
```

> `[ATENÇÃO]` Autohealing com `--initial-delay` curto demais mata VMs que ainda estão subindo (o startup leva um tempo). Dê folga maior que o tempo real de boot da aplicação.

Atualização gradual de versão: crie um **novo template** e rode `gcloud compute instance-groups managed rolling-action start-update mig-api --version=template=tpl-api-v2 --region=southamerica-east1`.

## Modelos de compra e descontos

| Modelo | Como funciona | Quando |
|---|---|---|
| **On-demand** | Paga por segundo, sem compromisso | Cargas imprevisíveis |
| **Sustained use discount** | Desconto **automático** por usar muito no mês (algumas famílias) | Nada a fazer |
| **Committed use discounts (CUD)** | Compromisso de 1 ou 3 anos em vCPU/memória, grande desconto | Carga estável e previsível |
| **Spot VMs** | Capacidade ociosa até ~60–91% mais barata; **pode ser interrompida** a qualquer momento (sem limite de 24 h) | Batch, CI, cargas tolerantes a interrupção |

```bash
gcloud compute instances create vm-spot --zone=$ZONA --machine-type=e2-medium \
  --provisioning-model=SPOT --instance-termination-action=STOP
```

> `[TEORIA]` Prova: **Spot** ≠ **preemptible** (o modelo antigo, que durava no máximo 24 h). **CUD** exige compromisso e não é flexível quanto à máquina específica; **sustained use** é automático. Nunca use Spot para um banco de produção.

## Parar, iniciar e apagar (e o que cobra)

```bash
gcloud compute instances stop vm-api-1 --zone=$ZONA        # para a computação: NÃO cobra CPU/memória
gcloud compute instances start vm-api-1 --zone=$ZONA
gcloud compute instances set-machine-type vm-api-1 --zone=$ZONA --machine-type=e2-medium   # exige VM parada
gcloud compute instances delete vm-api-1 --zone=$ZONA --quiet
```

> `[ATENÇÃO]` **Parar** a VM encerra a cobrança de CPU/memória, mas **o disco continua cobrando** (e IPs externos estáticos reservados e ociosos também). Para zerar o custo, apague a VM e o disco (`--delete-disks=all`).

## Práticas

### Prática isolada

1. Crie uma `e2-small` com startup script instalando nginx e teste `curl` de dentro da VNet (via IAP).
2. Aumente o disco (`gcloud compute disks resize ... --size=30GB`) e o sistema de arquivos (`sudo resize2fs /dev/sda1` ou `growpart`).
3. Tire um snapshot, apague a VM e restaure um disco do snapshot.
4. Crie um instance template e um MIG com 2 instâncias; derrube uma e veja o **autohealing** recriá-la.
5. Gere carga (`stress-ng --cpu 2`) e veja o **autoscaler** adicionar instâncias.

**Limpeza:** apague o MIG, o template, as VMs, discos e snapshots do laboratório.

### Contribuição ao projeto integrador

Suba a API do TrilhaShop em **MIG regional**:

1. `startup.sh` servindo `/saude` na 8080 (a aplicação real entra no Módulo 10/09).
2. `tpl-api` + `mig-api` regional, 2 a 6 instâncias, autoscaling a 70% de CPU e autohealing com `hc-api`.
3. Conecte ao `lb-trilhashop` do Módulo 06 e prove com `curl` em loop no IP do LB que o serviço **não cai** quando você apaga uma instância.

`[CUSTO]` Duas `e2-small` 24/7 ultrapassam o Always Free. **Reduza o MIG a zero** (`gcloud compute instance-groups managed resize mig-api --size=0 --region=...`) entre as sessões e desligue o autoscaler se necessário.

## Erros comuns nesta fase

- Achar que "parar" a VM zera o custo (o disco segue cobrando).
- Deixar IP externo estático reservado e sem uso.
- Usar a SA padrão do Compute com role Editor.
- Autohealing agressivo demais (mata VM que ainda está subindo).
- Escolher o tipo de máquina sem conferir disponibilidade na zona.
- Esquecer o Cloud NAT para VMs sem IP público.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| MIG como backend | Balanceador — Módulo 06 |
| Startup script | Ansible/Terraform — trilha Linux, Módulo 21 |
| Snapshots e discos | Armazenamento — Módulo 11; trilha Linux, Módulo 08 |
| Spot, CUD | Custos — Módulo 16 |
| VM no Azure | Azure, Módulo 08 |

## `[REFERÊNCIA]`

- Google Cloud — *Compute Engine documentation*: https://cloud.google.com/compute/docs
- Google Cloud — *Machine families*: https://cloud.google.com/compute/docs/machine-resource
- Google Cloud — *Managed instance groups*: https://cloud.google.com/compute/docs/instance-groups#managed_instance_groups
- Google Cloud — *Autoscaling groups of instances*: https://cloud.google.com/compute/docs/autoscaler
- Google Cloud — *Spot VMs*: https://cloud.google.com/compute/docs/instances/spot
- Google Cloud — *Committed use discounts*: https://cloud.google.com/compute/docs/instances/signing-up-committed-use-discounts
- Google Cloud — *OS Login*: https://cloud.google.com/compute/docs/oslogin
- Google Cloud — *Pricing*: https://cloud.google.com/compute/all-pricing

**Como aprofundar:** pratique no Skills Boost os labs "Compute Engine" e leia as boas práticas de *Compute Engine best practices*.

## Checklist de saída

- [ ] Ler o nome de um tipo de máquina e dizer o que ele indica.
- [ ] Comparar os tipos de disco e dizer o que é persistente x efêmero.
- [ ] Criar uma VM sem IP público e acessá-la por IAP.
- [ ] Usar startup script, imagens, snapshots e instance templates.
- [ ] Explicar MIG, autoscaling, autohealing e rolling update.
- [ ] Diferenciar on-demand, sustained use, CUD e Spot.
- [ ] Explicar o que cobra quando a VM está parada.
- [ ] Ter subido o MIG da API do TrilhaShop atrás do `lb-trilhashop`.
