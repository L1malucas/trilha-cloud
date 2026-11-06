---
id: "14_containers_e_virtualizacao"
title: "Módulo 14 — Containers e Virtualização (fundamentos)"
sidebar_label: "14 · Containers e Virtualização"
sidebar_position: 14
---

# Módulo 14 — Containers e Virtualização (fundamentos)

> **Objetivo**: entender o que um container realmente é — processos isolados por **namespaces** e limitados por **cgroups** — construir um "container caseiro" sem Docker, comparar com VMs (KVM/libvirt) e dar os primeiros passos com Docker/Podman.
>
> **Pré-requisitos**: módulos 06, 09 e 13.
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre os tópicos de virtualização e containers do **LPIC-1/Linux+ (XK0-005)** e prepara os módulos 20 (Docker) e 23 (Kubernetes). Este módulo é a **fundação**; a prática completa de Docker vem no Módulo 20.

---

## Duas formas de isolar

Compartilhar um servidor entre aplicações exige **isolamento**: uma não pode ler a memória nem derrubar a outra. Há duas estratégias:

| | **Máquina virtual (VM)** | **Container** |
|---|---|---|
| O que isola | Um **computador inteiro** emulado (hardware virtual + SO próprio) | **Processos** num mesmo kernel |
| Kernel | Cada VM tem o seu | **Compartilhado** com o host |
| Peso | GBs, boot em minutos | MBs, inicia em segundos |
| Isolamento | Forte (hipervisor) | Menor (mesmo kernel) |
| Exemplos | KVM, VMware, Hyper-V, VirtualBox | Docker, Podman, LXC |

Analogia: a VM é um **prédio separado**, com fundação e encanamento próprios; o container é um **apartamento**: portas e paredes independentes, mas o mesmo prédio (kernel) por baixo.

> `[TEORIA]` Um container **não é** uma coisa mágica nem uma "mini-VM": é um **processo Linux comum** com visão restrita do sistema (namespaces) e consumo limitado (cgroups). Entender isso tira o mistério de Docker e Kubernetes.

## Namespaces: o que o processo *enxerga*

Um **namespace** dá a um processo uma visão própria de um recurso global:

| Namespace | Isola |
|---|---|
| `pid` | Árvore de processos (o primeiro vira PID 1) |
| `net` | Interfaces, rotas e portas |
| `mnt` | Pontos de montagem / sistema de arquivos |
| `uts` | Hostname |
| `ipc` | Memória compartilhada e filas |
| `user` | Mapeamento de usuários (root dentro ≠ root fora) |
| `cgroup` | Visão dos cgroups |

```bash
lsns                                       # namespaces existentes
ls -l /proc/$$/ns                          # os namespaces do seu shell

# Um shell com PID e hostname isolados
sudo unshare --pid --fork --mount-proc --uts bash
hostname container-teste
hostname                                   # mudou só aqui dentro
ps aux                                     # só enxerga os processos DESTE namespace; bash é PID 1
exit
hostname                                   # intacto fora
```

> `[TENTE VOCÊ]` O seu shell e um processo isolado enxergam o mesmo namespace de PID? Raciocínio: cada namespace tem um número de identificação (inode) e dois processos no mesmo namespace mostram o mesmo número. Rode `readlink /proc/$$/ns/pid` e depois `sudo unshare --pid --fork --mount-proc readlink /proc/self/ns/pid`. Resposta: dois valores do tipo `pid:[4026531836]` com números **diferentes**; o segundo `readlink` já nasceu dentro de um namespace novo. Para ver o isolamento de outro ângulo: `sudo unshare --pid --fork --mount-proc ps -e` lista uma única linha, o próprio `ps` como PID 1.

> `[ATENÇÃO]` Sem `--fork`, o `unshare --pid` costuma falhar com `Cannot allocate memory` ou `fork: Cannot allocate memory` no segundo comando: o processo que chama `unshare` não entra no namespace novo, só os seus **filhos** entram. Sem filho, não há PID 1 e o kernel recusa. O `--mount-proc` é o que faz o `ps` enxergar o `/proc` do namespace novo, e não o do host.

## cgroups: quanto o processo *pode usar*

Os **cgroups** (control groups) limitam e contabilizam recursos (CPU, memória, I/O, nº de processos) por grupo de processos. Em sistemas modernos, o **cgroup v2** fica em `/sys/fs/cgroup`.

```bash
cat /sys/fs/cgroup/cgroup.controllers          # controladores disponíveis
mount | grep cgroup
systemd-cgls | head                            # árvore de cgroups do systemd
systemd-cgtop                                  # uso por cgroup (como top)

# Limitando via systemd (a forma segura):
sudo systemd-run --scope -p MemoryMax=100M -p CPUQuota=20% bash -c 'yes > /dev/null'
```

Resumo: **namespaces limitam o que se vê; cgroups limitam o que se gasta.**

> `[TENTE VOCÊ]` Dá para ver a qual cgroup um processo pertence e confirmar que o limite foi aplicado? Raciocínio: o `systemd-run --scope` cria uma unidade transitória e coloca o comando dentro dela; o caminho aparece em `/proc/self/cgroup`. Rode `sudo systemd-run --scope -p MemoryMax=100M cat /proc/self/cgroup`. Resposta: uma linha como `0::/system.slice/run-r1a2b3c.scope`, o nome da unidade criada na hora. Se o comando disser que não consegue conectar ao barramento, o systemd não está ativo na sua distro (revise o `/etc/wsl.conf` do Módulo 00).

## Um "container caseiro" sem Docker

Montamos o essencial à mão: um sistema de arquivos próprio (`chroot`) + namespaces. Precisa de um *rootfs* mínimo:

```bash
sudo apt install -y debootstrap
sudo debootstrap --variant=minbase stable ~/lab/rootfs   # baixa um Debian mínimo (~200MB)

sudo unshare --pid --fork --mount-proc --uts --net --ipc \
  chroot ~/lab/rootfs /bin/bash
# Dentro: hostname, ps aux, ip a (só o loopback), ls /
exit
```

O processo agora tem raiz, processos, rede e hostname próprios: **é** um container, só sem as facilidades (imagens, redes, volumes) que o Docker acrescenta.

> `[ATENÇÃO]` `chroot` sozinho **não é** isolamento de segurança: um root dentro do chroot pode escapar. Segurança real vem da combinação namespaces + cgroups + capabilities + seccomp + SELinux/AppArmor, que os runtimes aplicam por padrão.

![Terminal dentro do container caseiro mostrando `ps aux` com bash como PID 1 e `ip a` apenas com o loopback](screenshots/14-containers-e-virtualizacao/01-container-caseiro-ps-ip.png)
> `[PRINT]` Passo a passo para capturar: dentro do `unshare + chroot`, rodar `ps aux` e `ip a`. Capturar as duas saídas.

## Primeiros passos com Docker

O Docker empacota isso tudo: **imagem** (camadas somente leitura com o sistema de arquivos e o programa), **container** (instância em execução), **registry** (repositório de imagens).

Instalação no WSL: o jeito recomendado é o **Docker Engine** dentro do Ubuntu (siga https://docs.docker.com/engine/install/ubuntu/) com systemd habilitado, ou o Docker Desktop com integração WSL.

```bash
docker version
docker run --rm hello-world
docker run --rm -it ubuntu:24.04 bash          # um Ubuntu descartável (--rm apaga ao sair)
docker run -d --name web -p 8080:80 nginx      # nginx em segundo plano, porta 8080 -> 80
curl -I localhost:8080
docker ps                                       # em execução (-a: todos)
docker logs web
docker exec -it web bash                        # entra num container rodando
docker stop web && docker rm web
docker images                                   # imagens locais
```

> `[ATENÇÃO]` Entrar no grupo `docker` equivale a ter acesso **root** na máquina (um container pode montar `/`). Use com a mesma cautela do `sudo` e, em ambientes compartilhados, prefira **Podman rootless** (a seguir).

> `[TENTE VOCÊ]` O hostname de dentro do container é o do seu WSL? Raciocínio: o container tem namespace `uts` próprio, então o hostname dele é independente, e o Docker usa o ID do container por padrão. Rode `docker run --rm alpine hostname` e compare com `hostname`. Resposta: um identificador hexadecimal de 12 caracteres (por exemplo `3f9c1a2b7d4e`), bem diferente do nome da sua máquina. Mesmo código de namespace do `unshare --uts` do início do módulo, só com embalagem.

### Provando que o container é um processo do host

```bash
docker run -d --name teste nginx
ps aux | grep "nginx: master"          # o processo do container aparece no host
docker inspect -f '{{.State.Pid}}' teste
sudo ls -l /proc/$(docker inspect -f '{{.State.Pid}}' teste)/ns     # seus namespaces
docker stats --no-stream               # uso (vem dos cgroups)
docker rm -f teste
```

> `[TENTE VOCÊ]` O limite que você pede ao Docker aparece mesmo no cgroup? Raciocínio: `--memory` é só uma tradução amigável; por baixo o Docker escreve o valor em `memory.max` do cgroup do container, e dentro do container o cgroup v2 é visível em `/sys/fs/cgroup`. Rode `docker run --rm --memory=64m alpine cat /sys/fs/cgroup/memory.max`. Resposta: `67108864` (64 x 1024 x 1024 bytes). Sem o `--memory`, o mesmo comando imprime `max`, que significa "sem limite".

## Podman: containers sem daemon e sem root

O **Podman** é compatível com a CLI do Docker (`alias docker=podman`), mas **não tem daemon** central e roda **rootless** por padrão, o que reduz a superfície de ataque. É o padrão em RHEL/Fedora.

```bash
sudo apt install -y podman
podman run --rm -it alpine sh
podman ps -a
```

## Virtualização: KVM e libvirt

**KVM** transforma o kernel Linux em hipervisor (usa as extensões de CPU VT-x/AMD-V). **libvirt** (`virsh`, `virt-manager`) é a camada de gerenciamento; **QEMU** emula o restante do hardware.

```bash
egrep -c '(vmx|svm)' /proc/cpuinfo      # >0: CPU suporta virtualização
lsmod | grep kvm                        # módulo carregado?
ls -l /dev/kvm                          # existe?
# num host com KVM:
# sudo apt install qemu-kvm libvirt-daemon-system virtinst
# virsh list --all
```

> `[WSL]` Em WSL2 recente, a *virtualização aninhada* pode permitir `/dev/kvm`, mas não é o caminho recomendado para estudo. Conheça os conceitos (hipervisor tipo 1 x tipo 2, KVM, libvirt, `virsh`) e pratique VMs com **Multipass** (`multipass launch`) ou VirtualBox/Hyper-V.

Tipos de hipervisor: **tipo 1** roda direto no hardware (KVM, ESXi, Hyper-V, Xen); **tipo 2** roda sobre um SO (VirtualBox, VMware Workstation).

## Laboratórios

### Lab 1 — Namespaces na mão
1. Com `unshare`, crie um shell com PID e hostname isolados e prove (`ps`, `hostname`).
2. Liste os namespaces do seu shell em `/proc/$$/ns`.

### Lab 2 — cgroups
Rode um processo com `systemd-run --scope -p MemoryMax=50M` e tente estourar a memória (`stress-ng --vm 1 --vm-bytes 200M`); veja o OOM atuando no `dmesg`/`journalctl`.

### Lab 3 — Container caseiro
Monte o *rootfs* com `debootstrap`, entre com `unshare + chroot`, instale algo dentro (`apt install -y curl`) e compare com o host.

### Lab 4 — Docker
Suba nginx na porta 8080, entre nele com `exec`, e mostre que o processo aparece no host com `ps` e em `/proc/<PID>/ns`.

### Lab 5 — Anatomia de um limite de cgroup
Cenário: o time de plataforma pergunta como o systemd limita um serviço. Você mostra o limite nascendo, no arquivo, e depois morrendo.
```bash
sudo -v                                                          # evita o prompt de senha em segundo plano
sudo systemd-run --scope --unit=meulab -p MemoryMax=100M sleep 120 &
sleep 1
systemctl show meulab.scope -p MemoryMax                         # MemoryMax=104857600
cat /sys/fs/cgroup/system.slice/meulab.scope/memory.max          # 104857600
cat /sys/fs/cgroup/system.slice/meulab.scope/cgroup.procs        # o PID do sleep
sudo systemctl stop meulab.scope                                 # a unidade e a pasta somem
ls /sys/fs/cgroup/system.slice/meulab.scope 2>&1 | head -1       # No such file or directory
```
A moral: um limite de recurso é só um **valor num arquivo** de uma pasta que o kernel cria. Kubernetes `limits` e Docker `--memory` escrevem nesses mesmos arquivos.

### Lab 6 — Rede isolada com network namespace
Cenário: você precisa de uma "mini-rede" com dois hosts conversando, sem VM e sem Docker. É o bloco de construção dos desafios do Módulo 18.
```bash
sudo ip netns add azul
sudo ip netns exec azul ip a                                     # só o loopback, desligado
sudo ip link add veth-host type veth peer name veth-azul         # um "cabo virtual" com duas pontas
sudo ip link set veth-azul netns azul                            # joga uma ponta dentro do namespace
sudo ip addr add 10.99.0.1/24 dev veth-host && sudo ip link set veth-host up
sudo ip netns exec azul ip addr add 10.99.0.2/24 dev veth-azul
sudo ip netns exec azul ip link set veth-azul up
sudo ip netns exec azul ip link set lo up
ping -c 2 10.99.0.2                                              # host -> namespace
sudo ip netns exec azul ping -c 2 10.99.0.1                      # namespace -> host
```
Não remova o namespace ainda: o laboratório integrador mais abaixo reaproveita o `azul`.
> `[WSL]` `ip netns` e `veth` funcionam no kernel do WSL2 (é o que o Docker usa). Se `ip link add ... type veth` reclamar de operação não suportada, o seu kernel não tem o módulo; atualize o WSL com `wsl --update`.

### Lab 7 — Imagem imutável, dados externos
Cenário: você quer processar o `access.log` do laboratório dentro de um container sem copiá-lo para a imagem e sem dar poder de escrita ao container.
```bash
docker run --rm -v ~/lab/dados:/dados:ro alpine sh -c 'wc -l /dados/access.log; touch /dados/x'
```
Resposta esperada: `5000 /dados/access.log` e depois `touch: /dados/x: Read-only file system`. O `:ro` é um *bind mount* somente leitura (namespace `mnt` + montagem do Módulo 08): a imagem fica intacta e os dados ficam no host.

### Desafios

- **Desafio 1:** container caseiro com **limite de memória** via cgroup (use `systemd-run -p MemoryMax=...` envolvendo o `unshare+chroot`).
- **Desafio 2:** explique, por escrito, por que um container "vaza" menos isolamento que uma VM e cite uma situação em que ainda assim prefere containers.
- **Desafio 3:** repita o `docker run nginx` com `podman` rootless e compare o dono do processo (`ps -o user,pid,cmd`).
- **Desafio 4:** suba um container Alpine com **três** limites ao mesmo tempo (memória 64 MB, 20 processos, meio núcleo de CPU) e prove os três valores lendo os arquivos do cgroup de dentro dele, sem usar `docker inspect`. **Verifique:** `docker run --rm --memory=64m --pids-limit=20 --cpus=0.5 alpine sh -c 'cat /sys/fs/cgroup/memory.max /sys/fs/cgroup/pids.max /sys/fs/cgroup/cpu.max'` deve imprimir `67108864`, `20` e `50000 100000` (o último é "cota de 50 ms a cada período de 100 ms").

## Erros comuns nesta fase

- Achar que container é uma mini-VM com seu próprio kernel.
- Tratar o `chroot` como isolamento de segurança.
- Rodar containers como root e com `--privileged` por comodidade.
- Esquecer o `--rm` e acumular containers parados.
- Confundir **imagem** (molde) com **container** (instância).
- Esquecer o `--fork` no `unshare --pid` e achar que o PID namespace "não funciona".
- Medir limite de memória só pelo `docker stats` e nunca conferir o `memory.max` no cgroup (o limite pode nem ter sido aplicado).
- Deixar `ip netns` e interfaces `veth` esquecidos no laboratório: limpe com `ip netns del` antes de seguir.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 05 — usuários e permissões | Entrar no grupo `docker` = root; `User=` e *user namespace* decidem quem é "root" dentro |
| Módulo 06 — processos e systemd | Container = processo; `systemd-run` cria cgroups; `kill`/`ps` valem igual |
| Módulo 08 — `mount`, loop, fstab | O *rootfs* do container é montado; volumes são *bind mounts* (`-v ...:ro`) |
| Módulo 09 — `ip`, `ss`, portas | `ip netns`, `veth` e `-p 8080:80` são o mesmo vocabulário de rede |
| Módulo 12 — `journalctl` | Serviço transitório do `systemd-run` loga no journal; `docker logs` é o equivalente |
| Módulo 13 — `/proc`, `/sys`, `sysctl` | `/proc/<PID>/ns` e `/sys/fs/cgroup` são onde namespaces e cgroups "moram" |

### Lab 8 — Serviço contido: rede própria + limite + log (integrador)
Cenário: rodar um servidor web numa rede isolada, com teto de memória e log no journal, **sem Docker**: tudo com o que você já aprendeu. Reaproveita o namespace `azul` do Lab 6 (se já removeu, repita os passos dele).
```bash
echo "ola de dentro do netns" > ~/lab/dados/oi.txt
sudo systemd-run --unit=websrv -p MemoryMax=50M -p NetworkNamespacePath=/run/netns/azul \
  python3 -m http.server 8000 --directory "$HOME/lab/dados"
sleep 1
curl -s http://10.99.0.2:8000/oi.txt                             # responde pelo IP do namespace
ss -tlnp | grep 8000 || echo "host: nada escutando na 8000"      # o host NÃO vê a porta
sudo ip netns exec azul ss -tlnp | grep 8000                     # o namespace vê
systemctl show websrv -p MemoryMax                               # MemoryMax=52428800
journalctl -u websrv --no-pager | tail -3                        # o GET do curl, via journal
sudo systemctl stop websrv && sudo ip netns del azul             # limpeza
```
Aqui estão juntos: namespace de rede (14), `ip`/`ss` (09), cgroup via systemd (06/14) e `journalctl` (12). É, em miniatura, o que Docker e Kubernetes fazem por você.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Namespaces de rede | Redes — Módulos 09 e 18 |
| Docker, imagens, Compose | Módulo 20 |
| cgroups, limites | Kubernetes (requests/limits) — Módulo 23 |
| Hipervisores, VMs | Contexto de infra — Módulo 26; VMs no Azure/GCP |
| Container em nuvem | App Service/ACI/Container Apps no Azure; Cloud Run no GCP |

## `[REFERÊNCIA]`

- `man7.org` — `namespaces(7)`, `cgroups(7)`: https://man7.org/linux/man-pages/man7/namespaces.7.html
- Kernel — *cgroup v2*: https://docs.kernel.org/admin-guide/cgroup-v2.html
- Docker — *Get started* e instalação no Ubuntu: https://docs.docker.com/get-started/
- Podman — documentação: https://docs.podman.io/
- Julia Evans — *How containers work* (zine): https://wizardzines.com/zines/containers/
- libvirt: https://libvirt.org/ · KVM: https://linux-kvm.org/
- Microsoft — *Docker no WSL 2*: https://learn.microsoft.com/windows/wsl/tutorials/wsl-containers

**Como aprofundar:** o artigo/palestra "Containers from scratch" (Liz Rice) constrói um container em Go passo a passo; e o *OCI Runtime Spec* mostra o contrato padrão dos runtimes.

## Checklist de saída

- [ ] Comparar VM e container (kernel, peso, isolamento).
- [ ] Explicar namespaces e cgroups e o que cada um controla.
- [ ] Criar um shell isolado com `unshare` e limitar recursos com `systemd-run`.
- [ ] Montar um container caseiro (`unshare` + `chroot`) e explicar por que não é seguro por si só.
- [ ] Diferenciar imagem, container e registry.
- [ ] Rodar containers com Docker e/ou Podman e provar que são processos do host.
- [ ] Explicar KVM, libvirt e hipervisor tipo 1 x tipo 2.
