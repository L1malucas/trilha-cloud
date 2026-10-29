---
id: "01_fundamentos_e_distribuicoes"
title: "Módulo 01 — Fundamentos e Distribuições"
sidebar_label: "01 · Fundamentos e Distribuições"
sidebar_position: 1
---

# Módulo 01 — Fundamentos e Distribuições

> **Objetivo**: entender o que é Linux por dentro e por fora — Unix, GNU, kernel x userland, distribuições, licenças e a estrutura de diretórios — e explorar essa estrutura no seu WSL.
>
> **Pré-requisitos**: módulo 00 (WSL funcionando).
>
> **Tempo de referência (não prazo)**: três a cinco dias.
>
> Cobre os tópicos 1.x do **LPIC-1 101/102** e **Linux Essentials**, e o domínio de fundamentos do **CompTIA Linux+ (XK0-005)**. Objetivos LPIC-1: https://www.lpi.org/our-certifications/exam-101-objectives/

---

## Um carro, não um motor

Dizemos "Linux" para uma coisa que, a rigor, é só o **motor**. O **kernel Linux** (criado por Linus Torvalds em 1991) é o núcleo que conversa com o hardware: gerencia memória, processos, discos e rede. Um motor sozinho não leva ninguém a lugar nenhum; você precisa de volante, painel, rodas. Esse restante é o **userland**: shell, utilitários (`ls`, `grep`), bibliotecas, gerenciador de pacotes, interface gráfica. A maior parte do userland vem do projeto **GNU** (por isso o nome técnico "GNU/Linux").

Uma **distribuição** (distro) é o carro montado: kernel + userland + gerenciador de pacotes + configurações padrão + política de atualização.

```
 Aplicações (nginx, python, docker...)
 ───────────────────────────────────
 Userland: shell, coreutils, libc, systemd, apt/dnf
 ───────────────────────────────────
 Kernel Linux  (processos, memória, drivers, rede, arquivos)
 ───────────────────────────────────
 Hardware
```

> `[TEORIA]` Pergunta clássica: "Linux é um sistema operacional?" Tecnicamente, Linux é o **kernel**; o sistema operacional completo é a **distribuição**. Isso explica por que o mesmo kernel roda no Android, em servidores e na sua smart TV.

## De onde veio: Unix, GNU e open source

- **Unix** (anos 1970, Bell Labs): ideias que sobrevivem até hoje — tudo é arquivo, programas pequenos que fazem uma coisa bem e se combinam por pipes.
- **GNU** (Richard Stallman, 1983): construir um sistema Unix-like **livre**. Fez compilador (GCC), shell (bash), utilitários — faltava o kernel.
- **Linux** (1991): o kernel que faltava. GNU + Linux = sistema livre completo.

**Software livre** (free software) e **open source** são filosofias parentes: ambos dão acesso ao código-fonte; o primeiro enfatiza a liberdade do usuário, o segundo as vantagens práticas de desenvolvimento aberto.

### Licenças — o que posso fazer com o código?

| Licença | Tipo | Em uma frase |
|---|---|---|
| **GPL** (v2/v3) | *Copyleft* forte | Se você distribuir uma versão modificada, ela **também** precisa ser GPL (o kernel é GPLv2) |
| **LGPL** | Copyleft fraco | Permite usar a biblioteca em software proprietário |
| **MIT / BSD** | Permissivas | Faça quase tudo, mantendo o aviso de copyright |
| **Apache 2.0** | Permissiva | Como MIT, com concessão explícita de patentes |

> `[ATENÇÃO]` "Livre" não significa "grátis". Você pode vender software GPL; o que não pode é negar ao comprador o código-fonte e a liberdade de modificá-lo.

## Famílias de distribuições

Distribuições se agrupam por **família**, que define o formato de pacote e o gerenciador:

| Família | Pacote | Gerenciador | Exemplos | Perfil típico |
|---|---|---|---|---|
| **Debian** | `.deb` | `apt`, `dpkg` | Debian, **Ubuntu**, Mint | Servidores, desktop, nuvem |
| **Red Hat (RHEL)** | `.rpm` | `dnf`/`yum`, `rpm` | RHEL, Rocky, AlmaLinux, Fedora | Corporativo, certificação RHCSA |
| **SUSE** | `.rpm` | `zypper` | SLES, openSUSE | Corporativo (Europa, SAP) |
| **Arch** | `.pkg.tar` | `pacman` | Arch, Manjaro | Entusiastas, rolling release |
| **Alpine** | `.apk` | `apk` | Alpine | Containers (imagens minúsculas) |

Dois conceitos de ciclo de vida: **LTS** (*Long Term Support*, ex.: Ubuntu 24.04 tem 5 anos de suporte, ideal para servidor) e **rolling release** (atualização contínua, sem "versões", ex.: Arch).

Como escolher: para estudo e servidor, **Ubuntu LTS** ou **Debian**; para ambientes corporativos e prova RHCSA, **Rocky/AlmaLinux** (clones binários do RHEL, gratuitos).

## FHS: o mapa dos diretórios

O **Filesystem Hierarchy Standard** padroniza onde cada coisa mora — e por isso um admin consegue navegar em qualquer distro. Tudo parte da raiz `/`:

| Diretório | Conteúdo |
|---|---|
| `/bin`, `/sbin` | Comandos essenciais (hoje, links para `/usr/bin` e `/usr/sbin`) |
| `/etc` | **Configuração** do sistema (arquivos de texto) |
| `/home` | Diretórios dos usuários |
| `/root` | Diretório do usuário root |
| `/var` | Dados que **variam**: logs (`/var/log`), filas, caches |
| `/tmp` | Temporários (apagados no boot) |
| `/usr` | Programas e bibliotecas instalados |
| `/opt` | Software de terceiros isolado |
| `/dev` | Dispositivos (discos, terminais) como arquivos |
| `/proc`, `/sys` | Informações do kernel e hardware (virtuais) |
| `/mnt`, `/media` | Pontos de montagem |
| `/boot` | Kernel e GRUB |

> `[TEORIA]` Ideia central do Unix: **tudo é arquivo**. Um disco é `/dev/sda`, informação de CPU é `/proc/cpuinfo`, e um programa lê e escreve nesses "arquivos" com as mesmas ferramentas que usa para texto.

## Laboratórios

### Lab 1 — Quem sou eu, onde estou

```bash
cat /etc/os-release            # nome e versão da distro
uname -r                       # versão do kernel
uname -a                       # tudo de uma vez
hostnamectl                    # hostname, kernel, arquitetura
lscpu | head -5                # CPU
```

### Lab 2 — Percorrendo o FHS

```bash
ls /                           # raiz
ls -l /bin /sbin               # note: são links (->) para /usr/bin e /usr/sbin
ls /etc | head -20
ls /var/log
man hier                       # manual do padrão de hierarquia
du -sh /usr /var /etc 2>/dev/null   # quanto cada área ocupa
```

> `[TENTE VOCÊ]` Em qual diretório você esperaria encontrar o arquivo de configuração do SSH? E os logs de autenticação? Resposta: `/etc/ssh/sshd_config` e `/var/log/auth.log` (Debian/Ubuntu).

### Lab 3 — Duas famílias lado a lado

Docker será visto no Módulo 14/20, mas já serve para comparar famílias sem instalar outra distro. Se ainda não tiver Docker, pule e volte depois:

```bash
docker run --rm -it rockylinux:9 bash
cat /etc/os-release
dnf --version
exit
docker run --rm -it ubuntu:24.04 bash
apt --version
```

Compare: mesmos comandos básicos (`ls`, `cp`), gerenciadores de pacote diferentes.

![Terminal mostrando `cat /etc/os-release` do Ubuntu e `uname -a` com a palavra "microsoft" no kernel](screenshots/01-fundamentos-e-distribuicoes/01-os-release-uname.png)
> `[PRINT]` Passo a passo para capturar: no WSL, rodar `cat /etc/os-release` e `uname -a`. Capturar as duas saídas.

### Desafio

Monte um arquivo `~/lab/distros.md` com uma tabela comparando Debian, RHEL e SUSE: formato de pacote, gerenciador, ciclo de vida, uso típico e **um comando** de cada um para instalar `nginx`. Consulte a documentação oficial para preencher.

## Erros comuns nesta fase

- Chamar o kernel de "o Linux inteiro".
- Achar que "livre" quer dizer "grátis".
- Misturar comandos de famílias (`apt` numa distro Red Hat).
- Escolher uma distro rolling para servidor de produção sem pensar na estabilidade.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Tudo é arquivo | Módulos 03, 08 e 13 |
| FHS | Módulos 03 e 07 |
| Famílias e gerenciadores de pacote | Módulo 07 |
| Kernel x userland | Módulos 06, 13 e 14 (containers) |

## `[REFERÊNCIA]`

- Linux Foundation — *Filesystem Hierarchy Standard*: https://refspecs.linuxfoundation.org/fhs.shtml
- The Linux Kernel Archives: https://www.kernel.org/
- GNU — *What is free software?*: https://www.gnu.org/philosophy/free-sw.html
- Open Source Initiative — licenças: https://opensource.org/licenses
- DistroWatch: https://distrowatch.com/
- LPI — *Linux Essentials*: https://www.lpi.org/our-certifications/linux-essentials-overview/
- Ubuntu — ciclo de vida das versões: https://ubuntu.com/about/release-cycle

**Como aprofundar:** leia *The Linux Command Line* (William Shotts, gratuito em https://linuxcommand.org/tlcl.php), capítulos 1 a 4, e o `man hier`.

## Checklist de saída

- [ ] Explicar kernel x userland x distribuição.
- [ ] Citar o papel de Unix, GNU e Linux na história.
- [ ] Diferenciar GPL, LGPL, MIT/BSD e Apache em uma frase cada.
- [ ] Listar as famílias Debian, Red Hat e SUSE com formato de pacote e gerenciador.
- [ ] Diferenciar LTS de rolling release.
- [ ] Dizer onde mora cada tipo de arquivo segundo o FHS (`/etc`, `/var`, `/home`, `/dev`, `/proc`).
- [ ] Explicar "tudo é arquivo" com um exemplo.
