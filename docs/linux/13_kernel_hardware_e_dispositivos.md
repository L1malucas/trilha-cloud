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

> `[TENTE VOCÊ]` Qual é a linha de comando exata do seu shell, lida direto do kernel? Raciocínio: `/proc/$$` é a pasta do processo cujo PID é o do seu shell, e o kernel guarda `cmdline` com os argumentos separados por bytes nulos, por isso o `tr` troca o nulo por espaço. Rode `tr '\0' ' ' < /proc/$$/cmdline; echo` e `readlink /proc/$$/exe`. Resposta: algo como `-bash` (ou `bash`) e `/usr/bin/bash`. Nada disso foi gravado em disco: o kernel montou a resposta na hora em que você leu.

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

> `[TENTE VOCÊ]` Quantos módulos o seu kernel tem carregados? Raciocínio: `lsmod` nada mais é que uma formatação bonita de `/proc/modules`, então `lsmod | wc -l` e `wc -l < /proc/modules` devem concordar (o primeiro tem uma linha a mais, o cabeçalho). Resposta: no WSL costuma ser um número minúsculo ou zero, porque o kernel da Microsoft embute quase tudo; numa VM Ubuntu comum são dezenas. Número baixo aqui não é defeito.

> `[ATENÇÃO]` `modprobe` só encontra módulos que existem em `/lib/modules/$(uname -r)/`. Se `ls /lib/modules/$(uname -r)/` falha ou vem vazio, o erro `Module not found` não é digitação sua: o kernel simplesmente não traz aquele módulo. Antes de culpar o comando, confira o diretório.

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

> `[TENTE VOCÊ]` O `sysctl` e o `/proc/sys` mostram o mesmo valor? Raciocínio: o nome do parâmetro é o caminho com pontos no lugar de barras, então `vm.swappiness` vira `/proc/sys/vm/swappiness`. Rode `sysctl -n vm.swappiness` e `cat /proc/sys/vm/swappiness`. Resposta: os dois imprimem o mesmo número (60 no padrão do Ubuntu, ou 10 se você aplicou o `99-lab.conf` acima). Ler pelo `sysctl` ou pelo arquivo é equivalente; escrever também.

> `[ATENÇÃO]` O `sysctl --system` lê os arquivos em ordem alfabética e **o último a definir uma chave vence**. Por isso o laboratório usa `99-`: ele ganha de qualquer `10-` ou `50-` do sistema. Se o valor "volta sozinho", procure outro arquivo com a mesma chave com `grep -r swappiness /etc/sysctl.d /usr/lib/sysctl.d`.

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

> `[TENTE VOCÊ]` Quantas linhas o buffer do kernel tem agora e quantas são erros? Raciocínio: o `dmesg` imprime o ring buffer, então contar linhas dá o tamanho do histórico e o filtro de nível separa o joio do trigo. Rode `sudo dmesg | wc -l` e `sudo dmesg -l err | wc -l`. Resposta: a primeira é um número de centenas de linhas; a segunda é bem menor, e no WSL costuma ser 0 a poucas. Zero erros é o estado saudável, não um sinal de comando quebrado.

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

### Lab 4 — Impressão digital de um processo
Cenário: alguém pergunta "o que esse processo está fazendo?" e você não tem `ps` por perto, só o kernel. Use o `/proc` como fonte da verdade.
```bash
sleep 600 &
PID=$!
grep -E '^(Name|State|VmRSS)' /proc/$PID/status      # nome, estado e memória residente
tr '\0' ' ' < /proc/$PID/cmdline; echo               # comando completo
readlink /proc/$PID/cwd                              # diretório de trabalho
ls -l /proc/$PID/fd                                  # descritores abertos (0,1,2 do terminal)
kill $PID
```
Compare o `State` com a coluna `STAT` de `ps -o pid,stat,cmd -p $PID` antes do `kill`: devem concordar (`S`, dormindo). O `ps` é só um leitor de `/proc` com boa apresentação.

### Lab 5 — Ajuste persistente e reversível
Cenário: o time de banco pede `vm.swappiness = 10` num servidor, e você precisa garantir que sobrevive ao reboot e que dá para voltar atrás.
```bash
sysctl -n vm.swappiness                                          # anote o valor original
echo "vm.swappiness = 10" | sudo tee /etc/sysctl.d/98-banco.conf
sudo sysctl --system | grep -i swappiness                        # mostra de qual arquivo veio
cat /proc/sys/vm/swappiness                                      # 10
sudo rm /etc/sysctl.d/98-banco.conf                              # rollback do arquivo
sudo sysctl -w vm.swappiness=60                                  # rollback do valor em execução
```
O `rm` sozinho **não** desfaz o valor em memória; só impede que ele volte no próximo boot. Por isso o rollback tem dois passos.

### Lab 6 — Percentual de memória disponível
Cenário: um alerta precisa disparar quando a memória *disponível* (não a "livre") ficar abaixo de 10%.
```bash
awk '/^MemTotal/{t=$2} /^MemAvailable/{a=$2} END{printf "disponivel: %.1f%%\n", a*100/t}' /proc/meminfo
```
Explique, com suas palavras, por que `MemAvailable` é a métrica correta e `MemFree` engana (o cache de arquivos é devolvido quando alguém precisa).

### Desafios

- **Desafio 1:** mapa "onde cada informação de hardware mora": para CPU, memória, discos, rede e PCI, indique o comando **e** o arquivo em `/proc` ou `/sys` equivalente.
- **Desafio 2:** explique o que é o OOM killer, como achá-lo no `dmesg`/`journalctl -k` e como provocar (e depois ver) um em laboratório controlado.
- **Desafio 3:** numa VM Linux real (ou container privilegiado), carregue o módulo `dummy`, crie a interface `dummy0` com `ip link add` e remova.
- **Desafio 4:** crie `/etc/sysctl.d/97-desafio.conf` com `vm.swappiness = 15` e `net.ipv4.ip_forward = 1`, aplique **sem reiniciar** e prove os dois valores direto em `/proc/sys`, depois desfaça tudo (arquivo e valores em execução). **Verifique:** `sysctl -n vm.swappiness net.ipv4.ip_forward` deve imprimir `15` e `1` (um por linha) antes do desfazer; depois do desfazer, `ls /etc/sysctl.d/97-desafio.conf` deve responder `No such file or directory`.

## Erros comuns nesta fase

- Esperar hardware real no WSL (PCI/USB aparecem vazios).
- Usar `insmod` em vez de `modprobe` (sem resolver dependências).
- Alterar `sysctl -w` e esperar que persista após reboot.
- Editar `/proc/sys` na mão sem entender o efeito.
- Ler `free` e `/proc/meminfo` ignorando cache/available.
- Usar `MemFree` como "memória livre": o cache é devolvido sob demanda, então o número que importa é `MemAvailable`.
- Testar `modprobe` no WSL, ver falha e concluir que o comando está quebrado (o kernel é da Microsoft e quase não tem módulos externos).

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 01 — "tudo é arquivo" | `/proc` e `/sys` são o exemplo mais puro da ideia: o estado do kernel lido com `cat` |
| Módulo 03 — `ls`, `cat`, `readlink` | Navegar em `/proc/<PID>/` e `/sys/class/` com as mesmas ferramentas de arquivo |
| Módulo 04 — `grep`, `awk`, `cut` | Extrair `MemAvailable`, filtrar `dmesg` e contar erros |
| Módulo 06 — PIDs, `ps`, systemd | Cada processo tem uma pasta em `/proc`; o OOM killer escolhe vítimas entre eles |
| Módulo 12 — `journalctl` | `journalctl -k` é o `dmesg` com filtros de tempo e prioridade |

### Lab 7 — Relatório de saúde do kernel (integrador)
Cenário: você precisa de um relatório de 6 linhas que o time de plantão cole num chamado. Ele junta `/proc` (13), `awk` e `grep` (04), `ps` (06), `journalctl`/`dmesg` (12) e shell script (11).
```bash
mkdir -p ~/lab/scripts
cat > ~/lab/scripts/saude-kernel.sh <<'EOF'
#!/usr/bin/env bash
# Relatório de saúde baseado em /proc, dmesg e ps
set -u
echo "== Kernel: $(uname -r)"
echo "== CPUs: $(nproc) | load (1/5/15 min): $(cut -d' ' -f1-3 /proc/loadavg)"
awk '/^MemTotal/{t=$2} /^MemAvailable/{a=$2} END{printf "== Memoria disponivel: %.1f%%\n", a*100/t}' /proc/meminfo
echo "== Erros no dmesg: $(sudo dmesg -l err 2>/dev/null | wc -l)"
echo "== Mensagens de OOM: $(sudo dmesg 2>/dev/null | grep -ci 'out of memory')"
echo "== Top 3 processos por memoria (PID, RSS em KB, nome):"
ps -eo pid,rss,comm --sort=-rss | head -4
EOF
chmod +x ~/lab/scripts/saude-kernel.sh && ~/lab/scripts/saude-kernel.sh
```
Regra de bolso para ler o resultado: se o *load* de 1 minuto passa do número de CPUs por muito tempo, a máquina está saturada; se `Mensagens de OOM` não for 0, vá direto ao Módulo 16.

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
