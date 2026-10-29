---
id: "08_armazenamento_e_sistemas_de_arquivos"
title: "Módulo 08 — Armazenamento e Sistemas de Arquivos"
sidebar_label: "08 · Armazenamento"
sidebar_position: 8
---

# Módulo 08 — Armazenamento e Sistemas de Arquivos

> **Objetivo**: entender discos, partições e sistemas de arquivos — MBR x GPT, `fdisk`, `mkfs`, `mount`, `fstab`, LVM, RAID, swap e quotas — praticando com **arquivos de imagem em loop**, sem precisar de disco físico.
>
> **Pré-requisitos**: módulos 03 e 05. Faça este módulo na distro `ubuntu-lab` (snapshot do Módulo 00): vamos mexer em dispositivos.
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre os tópicos 104.1 a 104.3 e 102.1 do **LPIC-1** e "Storage" do **Linux+**. Referência: https://man7.org/linux/man-pages/man8/lvm.8.html

---

## Do disco ao arquivo: as camadas

Uma analogia: um terreno (**disco**) é dividido em lotes (**partições**); em cada lote você constrói e organiza uma casa, com cômodos e prateleiras (**sistema de arquivos**); e a porta da casa é ligada à rua principal (**ponto de montagem**). Cada camada tem sua ferramenta:

```
Disco físico /dev/sda          (lsblk)
 └─ Partição /dev/sda1         (fdisk, parted)
     └─ Sistema de arquivos ext4/xfs   (mkfs)
         └─ Montado em /dados          (mount, /etc/fstab)
```

Os dispositivos de bloco aparecem em `/dev`: `/dev/sda`, `/dev/sdb` (SATA/USB/virtuais), `/dev/nvme0n1` (NVMe), `/dev/vda` (virtio). Partições levam número: `sda1`, `nvme0n1p1`.

```bash
lsblk                      # árvore de discos e partições
lsblk -f                   # + tipo de sistema de arquivos, UUID e ponto de montagem
blkid                      # UUID e tipo
df -hT                     # espaço e tipo dos montados
findmnt                    # árvore de montagens
```

## Tabela de partições: MBR x GPT

| | **MBR** (antigo) | **GPT** (moderno) |
|---|---|---|
| Limite de disco | 2 TB | 9,4 ZB (na prática, sem limite) |
| Partições | 4 primárias (ou 3 + 1 estendida com lógicas) | 128 por padrão |
| Boot | BIOS | UEFI (e BIOS com adaptação) |
| Resiliência | Uma cópia da tabela | Cópia de backup no fim do disco |

Prefira **GPT** em qualquer disco novo.

## Sistemas de arquivos

| FS | Característica | Uso típico |
|---|---|---|
| **ext4** | Maduro, estável, journal | Padrão em Debian/Ubuntu |
| **xfs** | Alto desempenho com arquivos grandes, **não reduz** | Padrão em RHEL |
| **btrfs** | Snapshots, compressão, RAID embutido | Fedora, SUSE |
| **vfat/exfat** | Compatível com Windows | Pendrives |
| **tmpfs** | Em RAM | `/tmp`, `/run` |
| **swap** | Memória virtual no disco | Paginação |

O **journal** registra a operação antes de aplicá-la; depois de uma queda de energia o sistema reaplica ou descarta o que estava pela metade em vez de "varrer" o disco todo.

## O laboratório sem disco físico: loop devices

No WSL não há discos extras para formatar, mas o Linux sabe tratar um **arquivo comum como se fosse um disco** — o dispositivo **loop**. É o jeito seguro de treinar tudo deste módulo.

```bash
mkdir -p ~/lab/discos && cd ~/lab/discos
dd if=/dev/zero of=disco1.img bs=1M count=512 status=progress   # arquivo de 512 MB "vazio"
sudo losetup -f --show disco1.img                                # liga a um /dev/loopN (anote o nome!)
lsblk | grep loop
```

> `[ATENÇÃO]` Todos os comandos destrutivos abaixo usam **o `/dev/loopN` que o `losetup` devolveu** (ex.: `/dev/loop20`). Jamais use `/dev/sda` ou outro dispositivo real do seu sistema. Confira com `lsblk` antes de cada `mkfs`/`fdisk`: formatar o dispositivo errado apaga os dados, sem volta.

### Particionar

```bash
LOOP=$(sudo losetup -f --show disco1.img)       # ou use o nome já obtido
sudo fdisk $LOOP
#  g      -> nova tabela GPT
#  n      -> nova partição (Enter para os padrões, +200M no tamanho)
#  n      -> segunda partição (resto do disco)
#  p      -> imprime
#  w      -> grava e sai
sudo partprobe $LOOP
lsblk $LOOP
```

(`gdisk` é a versão focada em GPT, e `parted` aceita comandos de uma linha: `sudo parted $LOOP print`.)

### Formatar (criar o sistema de arquivos)

Como o loop foi criado sem partições escaneadas, o jeito mais simples de continuar é recriá-lo com `-P`:

```bash
sudo losetup -d $LOOP
LOOP=$(sudo losetup -fP --show disco1.img)      # -P: expõe as partições como loopNp1, loopNp2
lsblk $LOOP
sudo mkfs.ext4 -L DADOS ${LOOP}p1               # ext4 com rótulo
sudo mkfs.xfs  -L LOGS  ${LOOP}p2               # xfs
sudo blkid ${LOOP}p1 ${LOOP}p2
```

### Montar e desmontar

```bash
sudo mkdir -p /mnt/dados /mnt/logs
sudo mount ${LOOP}p1 /mnt/dados
sudo mount ${LOOP}p2 /mnt/logs
df -hT | grep -E 'dados|logs'
echo "olá disco" | sudo tee /mnt/dados/teste.txt
findmnt /mnt/dados
sudo umount /mnt/dados                          # "target is busy"? saia da pasta e feche arquivos
```

> `[ATENÇÃO]` `umount` falha com *target is busy* se **você mesmo** estiver dentro do diretório (`cd /mnt/dados`) ou se algum processo estiver usando-o. Descubra com `lsof +D /mnt/dados` ou `fuser -vm /mnt/dados`.

### /etc/fstab: montagem permanente

O `/etc/fstab` lista o que é montado no boot. Cada linha tem seis campos:

```
# <dispositivo>      <ponto>    <tipo> <opções>        <dump> <fsck>
UUID=1a2b-...        /dados     ext4   defaults,noatime  0      2
```

Use **UUID** (de `blkid`) em vez de `/dev/sdX`, porque os nomes `sdX` podem mudar entre boots.

```bash
UUID=$(sudo blkid -s UUID -o value ${LOOP}p1)
echo "UUID=$UUID /mnt/dados ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab
sudo umount /mnt/dados
sudo mount -a                                    # monta tudo do fstab: testa a sintaxe SEM reiniciar
findmnt /mnt/dados
```

> `[ATENÇÃO]` **Sempre teste o `fstab` com `sudo mount -a` antes de reiniciar.** Um erro de digitação pode impedir o boot ("emergency mode"). A opção `nofail` evita que um disco ausente trave o boot. (Num loop, o dispositivo some ao reiniciar o WSL; remova a linha ao fim do lab.)

### Verificar e reparar: fsck

```bash
sudo umount /mnt/dados                  # fsck exige FS DESMONTADO
sudo fsck.ext4 -f ${LOOP}p1             # verifica e repara
sudo xfs_repair ${LOOP}p2               # equivalente em xfs
```

> `[WSL]` LVM e RAID dependem de módulos do kernel (`dm`, `md`). O kernel do WSL2 muda com as versões e pode não incluir algum deles. Se `pvcreate`/`mdadm` reclamarem de dispositivo ou módulo ausente, atualize (`wsl --update`) e, persistindo, faça estes dois laboratórios numa VM (Multipass ou VirtualBox) ou numa distro com kernel próprio. O restante do módulo (loop, partições, `mkfs`, `mount`, `fstab`) funciona normalmente.

## LVM: discos elásticos

Redimensionar partições é arriscado e rígido. O **LVM (Logical Volume Manager)** acrescenta uma camada flexível entre os discos e o sistema de arquivos:

```
Discos/partições  →  PV (Physical Volume)  →  VG (Volume Group)  →  LV (Logical Volume)  →  FS
```

O **VG** é uma "piscina" de espaço feita com um ou mais PVs; dela você tira **LVs** do tamanho que quiser, e pode **aumentar** (e às vezes reduzir) depois, até a quente, juntando discos novos.

```bash
sudo apt install -y lvm2
# criar 2 discos-imagem e ligá-los em loop
for i in 2 3; do dd if=/dev/zero of=pv$i.img bs=1M count=400 status=none; done
L2=$(sudo losetup -f --show pv2.img); L3=$(sudo losetup -f --show pv3.img)

sudo pvcreate $L2 $L3                   # marca como PVs
sudo vgcreate vg_lab $L2 $L3            # piscina com os dois
sudo lvcreate -n lv_dados -L 300M vg_lab
sudo mkfs.ext4 /dev/vg_lab/lv_dados
sudo mkdir -p /mnt/lvm && sudo mount /dev/vg_lab/lv_dados /mnt/lvm
sudo pvs; sudo vgs; sudo lvs            # resumos

# CRESCER online: 300 MB -> 500 MB
sudo lvextend -L 500M /dev/vg_lab/lv_dados
sudo resize2fs /dev/vg_lab/lv_dados     # ext4; para xfs use: sudo xfs_growfs /mnt/lvm
df -h /mnt/lvm
# ou, tudo de uma vez:  sudo lvextend -r -L +100M /dev/vg_lab/lv_dados
```

> `[TEORIA]` Estender um LV tem **dois passos**: crescer o volume (`lvextend`) e crescer o sistema de arquivos dentro dele (`resize2fs`/`xfs_growfs`). O `-r` do `lvextend` faz os dois. Reduzir é mais perigoso (ext4 apenas, e xfs **não** reduz).

Snapshots: `sudo lvcreate -s -n snap1 -L 100M /dev/vg_lab/lv_dados` cria uma foto do volume (útil antes de mudanças).

![Saída de `lvs`, `vgs` e `pvs` mostrando o volume lv_dados dentro do vg_lab, com os dois PVs](screenshots/08-armazenamento-e-sistemas-de-arquivos/01-lvm-pvs-vgs-lvs.png)
> `[PRINT]` Passo a passo para capturar: depois de criar o LV, rodar `sudo pvs; sudo vgs; sudo lvs`. Capturar as três tabelas.

## RAID: redundância com mdadm

**RAID** combina discos para ganhar desempenho e/ou tolerância a falhas:

| Nível | Discos mín. | Característica |
|---|---|---|
| **0** | 2 | Divide dados (rápido, **sem** redundância: um disco cai, tudo se perde) |
| **1** | 2 | Espelho (cópia exata; tolera 1 disco) |
| **5** | 3 | Paridade distribuída (tolera 1 disco) |
| **10** | 4 | Espelho + divisão (rápido e tolerante) |

```bash
sudo apt install -y mdadm
for i in a b; do dd if=/dev/zero of=raid_$i.img bs=1M count=200 status=none; done
RA=$(sudo losetup -f --show raid_a.img); RB=$(sudo losetup -f --show raid_b.img)
sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 $RA $RB
cat /proc/mdstat
sudo mkfs.ext4 /dev/md0 && sudo mount /dev/md0 /mnt/raid

# Simular falha de um disco e reconstruir
sudo mdadm /dev/md0 --fail $RA
sudo mdadm /dev/md0 --remove $RA
sudo mdadm --detail /dev/md0             # estado "degraded", mas os dados continuam acessíveis
sudo mdadm /dev/md0 --add $RA            # re-adiciona e reconstrói
```

> `[ATENÇÃO]` **RAID não é backup.** Ele protege contra falha de disco; não protege de `rm` acidental, ransomware ou corrupção (o erro é espelhado). Mantenha backup separado.

## Swap e quotas

```bash
free -h                                  # memória e swap
sudo fallocate -l 256M /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
swapon --show
sudo swapoff /swapfile
```

**Quotas** limitam o espaço por usuário/grupo (`quota`, `edquota`, `quotacheck`); exigem montar o FS com `usrquota`/`grpquota`. Conhecer o conceito e os comandos é suficiente para a prova.

## Laboratórios

### Lab 1 — Do zero ao montado
Crie `disco1.img` (512 MB), em loop, tabela GPT com 2 partições, `ext4` e `xfs`, monte ambas, grave arquivos, desmonte.

### Lab 2 — fstab sem medo
Coloque a partição ext4 no `fstab` (com UUID e `nofail`), teste com `mount -a` e prove que o `findmnt` a mostra.

### Lab 3 — LVM elástico
Monte `vg_lab` com 2 PVs, crie um LV de 300 MB, grave dados e **cresça para 500 MB com o volume montado**, conferindo com `df -h` antes e depois.

### Lab 4 — RAID 1
Crie o RAID1 com duas imagens, grave um arquivo, **falhe** um disco, confirme que o arquivo continua legível e reconstrua.

### Desafios

- **Desafio 1:** LV de 300 MB crescendo para 500 MB **sem desmontar**, depois adicionando um *terceiro* PV ao VG e crescendo mais.
- **Desafio 2:** corrompa de propósito um ext4 numa imagem (`dd if=/dev/urandom of=img bs=1k seek=100 count=50 conv=notrunc`) e recupere com `fsck`.
- **Desafio 3:** crie um swap file, ative-o, e explique a diferença entre swap em partição e em arquivo.

**Limpeza (importante):**

```bash
sudo umount /mnt/dados /mnt/logs /mnt/lvm /mnt/raid 2>/dev/null
sudo lvremove -y vg_lab; sudo vgremove -y vg_lab; sudo pvremove -y $L2 $L3
sudo mdadm --stop /dev/md0
sudo losetup -D                          # desfaz todos os loops
sudo sed -i '/\/mnt\/dados/d' /etc/fstab # remove a linha de teste
rm -f ~/lab/discos/*.img
```

## Erros comuns nesta fase

- Formatar o dispositivo errado (sempre confira com `lsblk`).
- Editar `fstab` sem testar com `mount -a`.
- Usar `/dev/sdX` no `fstab` em vez de UUID.
- Esquecer de crescer o sistema de arquivos depois do `lvextend`.
- Tratar RAID como backup.
- Tentar `fsck` em sistema de arquivos montado.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| `fstab`, UUID, `mount` | Troubleshooting de boot — Módulo 16 |
| LVM e discos em nuvem | Discos gerenciados do Azure/GCP; EBS na AWS |
| `lsblk`, dispositivos | Hardware — Módulo 13 |
| Volumes | Docker volumes — Módulo 20; PV/PVC — Módulo 23 |
| NFS/Samba | Servidores — Módulo 17 |

## `[REFERÊNCIA]`

- Red Hat — *Configuring and managing logical volumes*: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_and_managing_logical_volumes/
- Linux RAID wiki: https://raid.wiki.kernel.org/
- `man7.org` — `fstab(5)`, `lvm(8)`, `mdadm(8)`: https://man7.org/linux/man-pages/
- Microsoft — *Montar um disco no WSL 2*: https://learn.microsoft.com/windows/wsl/wsl2-mount-disk
- ArchWiki — *LVM*, *fstab*, *RAID* (excelente para entender): https://wiki.archlinux.org/title/LVM
- LPI — objetivos 104.1 a 104.3: https://www.lpi.org/our-certifications/exam-101-objectives/

**Como aprofundar:** estude `btrfs` (snapshots e subvolumes) e `ZFS`; e, em nuvem, compare LVM com discos gerenciados dos Módulos 08 (Azure) e do GCP.

## Checklist de saída

- [ ] Descrever as camadas disco → partição → sistema de arquivos → montagem.
- [ ] Comparar MBR e GPT; ext4, xfs e btrfs.
- [ ] Usar `lsblk`, `blkid`, `fdisk`, `mkfs`, `mount` e `umount`.
- [ ] Escrever uma linha de `fstab` com UUID e testar com `mount -a`.
- [ ] Explicar PV, VG e LV e os dois passos para estender um volume.
- [ ] Criar e reconstruir um RAID 1 e dizer por que RAID não é backup.
- [ ] Criar um swap file e usar `fsck` corretamente.
- [ ] Ter desfeito todos os loops, VGs e entradas de fstab no fim.
