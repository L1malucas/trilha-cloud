---
id: "13_kernel_hardware_e_dispositivos"
title: "Módulo 13 — Kernel, Hardware e Dispositivos"
sidebar_label: "13 · Kernel, Hardware e Dispositivos"
sidebar_position: 13
---

# Módulo 13 — Kernel, Hardware e Dispositivos

> **Objetivo**: conhecer o hardware e o kernel do ponto de vista do administrador — inventariar CPU, memória, PCI e USB, entender módulos do kernel, `/proc`, `/sys`, `udev` e `sysctl`, e ler as mensagens do `dmesg`.
>
> **Pré-requisitos**: módulos 01, 03 e 06.
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre os tópicos 101.1 e 102.x do **LPIC-1** e "Hardware and kernel" do **Linux+**. Referência: https://docs.kernel.org/

---

## O kernel como intérprete entre programas e hardware

Programas não falam com a placa de rede ou o disco; pedem ao **kernel**, que usa **drivers** para conversar com cada dispositivo. Quem mora no kernel: gerenciamento de processos e memória, sistemas de arquivos, pilha de rede e drivers. Para o administrador, a pergunta é: *o que o kernel enxerga e como inspecioná-lo?* A resposta está em ferramentas e em **dois sistemas de arquivos virtuais**:

- **`/proc`**: informações sobre processos e o estado do kernel (`/proc/cpuinfo`, `/proc/meminfo`, `/proc/<PID>/`).
- **`/sys`**: o modelo de dispositivos e drivers do kernel (`/sys/class/net`, `/sys/block`).

Eles não ocupam disco: são *janelas* do kernel apresentadas como arquivos (lembra do "tudo é arquivo", Módulo 01).

```bash
uname -r                        # versão do kernel
cat /proc/version
cat /proc/cmdline               # parâmetros com que o kernel iniciou
```

> `[WSL]` O WSL2 usa um **kernel mantido pela Microsoft**, com a palavra "microsoft" em `uname -r`. Quase tudo de `/proc` e `/sys` funciona; porém hardware real (PCI, USB, módulos) é limitado, porque o kernel roda numa VM leve. Onde o resultado vier vazio, o comportamento é esperado.

## Inventário de hardware

```bash
lscpu                           # CPU: modelo, núcleos, threads, cache, virtualização
nproc                           # número de CPUs
free -h && cat /proc/meminfo | head -5       # memória
lsmem                           # blocos de memória
lsblk                           # discos
lspci                           # barramento PCI (placas) — sudo apt install pciutils
lsusb                           # dispositivos USB — sudo apt install usbutils
sudo lshw -short                # inventário geral — sudo apt install lshw
sudo dmidecode -t system        # dados da BIOS/placa (em VMs, o virtualizador)
cat /proc/cpuinfo | grep "model name" | head -1
```

> `[TENTE VOCÊ]` Quantos núcleos e quanta RAM tem a sua máquina WSL? Resposta: `nproc` e `free -h` (valores dependem do `.wslconfig` do Módulo 00).

## Módulos do kernel

O kernel é **modular**: em vez de carregar todos os drivers sempre, carrega **módulos** (`.ko`) sob demanda. Um módulo é um pedaço de código que se encaixa no kernel em execução.

```bash
lsmod | head                         # módulos carregados
modinfo ext4                         # descrição, autor, parâmetros, dependências
sudo modprobe dummy                  # carrega um módulo (resolve dependências)
lsmod | grep dummy
sudo modprobe -r dummy               # descarrega
ls /lib/modules/$(uname -r)/         # módulos disponíveis para este kernel
```

- `modprobe` é preferido a `insmod`/`rmmod` porque resolve **dependências**.
- Para carregar no boot: arquivo em `/etc/modules-load.d/`. Para **bloquear** um módulo: `blacklist nome` em `/etc/modprobe.d/`.

> `[WSL]` O kernel do WSL pode não trazer módulos externos (`/lib/modules` vazio) e `modprobe` falhar. É esperado. Os conceitos são cobrados em prova e funcionam numa VM ou servidor real.

## sysctl: ajustando o kernel em execução

Parâmetros do kernel ficam em `/proc/sys/` e são lidos/escritos com `sysctl`:

```bash
sysctl -a | head
sysctl net.ipv4.ip_forward                 # consultar
sudo sysctl -w net.ipv4.ip_forward=1       # alterar AGORA (temporário)
sudo tee /etc/sysctl.d/99-lab.conf <<'EOF'
net.ipv4.ip_forward = 1
vm.swappiness = 10
EOF
sudo sysctl --system                       # relê todos os arquivos (persistente)
cat /proc/sys/vm/swappiness
```

Exemplos clássicos: `ip_forward` (rotear pacotes entre interfaces — necessário em roteador/NAT), `vm.swappiness` (quão cedo usar swap), `fs.file-max` (limite de arquivos abertos).

## udev e os dispositivos em /dev

O **udev** reage a eventos de hardware (plugou um pendrive, um disco apareceu), cria os arquivos em `/dev` e aplica regras (nomes, permissões, scripts).

```bash
udevadm info -a -n /dev/sda | head -20       # atributos de um dispositivo
udevadm monitor                              # eventos em tempo real (Ctrl+C sai)
ls /etc/udev/rules.d/ /usr/lib/udev/rules.d | head
```

Exemplo de regra (`/etc/udev/rules.d/99-meu.rules`):

```
KERNEL=="sdb1", SYMLINK+="meu-pendrive"
```

Recarregue com `sudo udevadm control --reload && sudo udevadm trigger`.

## dmesg: a mensagem do kernel

O **ring buffer** do kernel guarda mensagens de boot, drivers e erros de hardware.

```bash
sudo dmesg | tail -20
sudo dmesg -T | grep -i error        # -T: data legível
sudo dmesg -l err,warn               # só erros e avisos
journalctl -k -b                     # equivalente via journal
```

É o primeiro lugar onde olhar para: disco com erro de I/O, driver que não carregou, "Out of memory: Killed process" (OOM killer).

## Explorando /proc e /sys

```bash
cat /proc/loadavg
cat /proc/uptime
ls /proc/$$/                          # o processo do seu shell: cmdline, status, fd, environ
cat /proc/$$/status | head
ls -l /proc/$$/fd                     # arquivos abertos pelo shell
ls /sys/class/net/                    # interfaces de rede
cat /sys/class/net/eth0/mtu
ls /sys/block/
```

![Saída do lscpu e free -h na tela do WSL, mostrando núcleos, modelo da CPU e memória total](screenshots/13-kernel-hardware-e-dispositivos/01-lscpu-free.png)
> `[PRINT]` Passo a passo para capturar: rodar `lscpu | head -15` e `free -h`. Capturar a saída.

## Laboratórios

### Lab 1 — Ficha técnica da máquina
Monte um relatório `~/lab/ficha.md` com CPU (modelo, núcleos), memória total/disponível, discos e versão do kernel, extraídos **só por comandos** (`lscpu`, `free`, `lsblk`, `uname`).

### Lab 2 — /proc e /sys
1. Descubra, em `/proc/<PID>/`, a linha de comando e as variáveis de ambiente de um processo (`tr '\0' ' ' < /proc/$$/cmdline`).
2. Leia a MTU de uma interface em `/sys/class/net`.
3. Ative `ip_forward` com `sysctl -w`, depois torne-o persistente.

### Lab 3 — Mensagens do kernel
Procure no `dmesg` as linhas de boot sobre CPU, memória e rede; filtre por `err` e `warn`.

### Desafios

- **Desafio 1:** mapa "onde cada informação de hardware mora": para CPU, memória, discos, rede e PCI, indique o comando **e** o arquivo em `/proc` ou `/sys` equivalente.
- **Desafio 2:** explique o que é o OOM killer, como achá-lo no `dmesg`/`journalctl -k` e como provocar (e depois ver) um em laboratório controlado.
- **Desafio 3:** numa VM Linux real (ou container privilegiado), carregue o módulo `dummy`, crie a interface `dummy0` com `ip link add` e remova.

## Erros comuns nesta fase

- Esperar hardware real no WSL (PCI/USB aparecem vazios).
- Usar `insmod` em vez de `modprobe` (sem resolver dependências).
- Alterar `sysctl -w` e esperar que persista após reboot.
- Editar `/proc/sys` na mão sem entender o efeito.
- Ler `free` e `/proc/meminfo` ignorando cache/available.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| `/proc`, `/sys` | Processos — Módulo 06; containers/cgroups — Módulo 14 |
| `sysctl`, `ip_forward` | Redes — Módulo 18; Kubernetes — Módulo 23 |
| `dmesg`, OOM | Troubleshooting — Módulo 16 |
| Módulos do kernel | Firewall (netfilter) — Módulo 10 |

## `[REFERÊNCIA]`

- Linux kernel documentation: https://docs.kernel.org/
- `man7.org` — `proc(5)`, `sysctl(8)`, `modprobe(8)`, `udev(7)`: https://man7.org/linux/man-pages/man5/proc.5.html
- Microsoft — *WSL2 kernel*: https://github.com/microsoft/WSL2-Linux-Kernel
- Red Hat — *Managing kernel modules*: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/managing_monitoring_and_updating_the_kernel/
- ArchWiki — *Kernel modules*, *udev*: https://wiki.archlinux.org/title/Kernel_module
- LPI — objetivos 101.1, 102.x: https://www.lpi.org/our-certifications/exam-101-objectives/

**Como aprofundar:** leia `man 5 proc` com calma (é um mapa do Linux) e estude `perf` e `eBPF` (via `bpftrace`) para observabilidade avançada.

## Checklist de saída

- [ ] Explicar o papel do kernel, de drivers e de módulos.
- [ ] Inventariar hardware com `lscpu`, `free`, `lsblk`, `lspci`, `lsusb`, `lshw`.
- [ ] Explicar `/proc` e `/sys` e dar três exemplos de uso de cada.
- [ ] Carregar/descarregar módulos com `modprobe` e consultar com `modinfo`.
- [ ] Ajustar e persistir parâmetros com `sysctl`.
- [ ] Explicar a função do udev.
- [ ] Ler `dmesg` e achar erros e OOM.
