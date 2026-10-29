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

### Provando que o container é um processo do host

```bash
docker run -d --name teste nginx
ps aux | grep "nginx: master"          # o processo do container aparece no host
docker inspect -f '{{.State.Pid}}' teste
sudo ls -l /proc/$(docker inspect -f '{{.State.Pid}}' teste)/ns     # seus namespaces
docker stats --no-stream               # uso (vem dos cgroups)
docker rm -f teste
```

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

### Desafios

- **Desafio 1:** container caseiro com **limite de memória** via cgroup (use `systemd-run -p MemoryMax=...` envolvendo o `unshare+chroot`).
- **Desafio 2:** explique, por escrito, por que um container "vaza" menos isolamento que uma VM e cite uma situação em que ainda assim prefere containers.
- **Desafio 3:** repita o `docker run nginx` com `podman` rootless e compare o dono do processo (`ps -o user,pid,cmd`).

## Erros comuns nesta fase

- Achar que container é uma mini-VM com seu próprio kernel.
- Tratar o `chroot` como isolamento de segurança.
- Rodar containers como root e com `--privileged` por comodidade.
- Esquecer o `--rm` e acumular containers parados.
- Confundir **imagem** (molde) com **container** (instância).

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
