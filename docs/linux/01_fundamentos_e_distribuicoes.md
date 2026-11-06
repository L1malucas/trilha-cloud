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

> `[TENTE VOCÊ]` Separe o motor do carro no seu WSL. Rode `uname -r` e depois `ls /usr/bin | wc -l`. Resposta: o primeiro mostra **uma** versão de kernel (algo como `6.6.x-microsoft-standard-WSL2`); o segundo conta centenas de programas de userland que rodam em cima dele. Raciocínio: você poderia trocar o kernel sem mexer nesses programas, e poderia trocar de distro mantendo o mesmo kernel — é por isso que um container Alpine e um Ubuntu compartilham o kernel do host (Módulo 14).

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

> `[TENTE VOCÊ]` Descubra a licença de um programa que você usa todo dia. Rode `grep -m1 -i 'GPL' /usr/share/doc/bash/copyright`. Resposta: a linha que aparece cita a GPL — o bash é copyleft forte. Todo pacote Debian/Ubuntu traz um arquivo `/usr/share/doc/<pacote>/copyright`; é ali que você olha antes de embutir um software no seu produto, porque a licença decide o que você é obrigado a devolver à comunidade.

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

> `[TENTE VOCÊ]` Prove que "tudo é arquivo" lendo o hardware como se fosse texto: `grep -m1 'model name' /proc/cpuinfo` e `cat /proc/uptime`. Resposta: a primeira linha mostra o modelo da sua CPU e o segundo comando mostra os segundos desde que o WSL subiu. Nenhum dos dois é um programa de "informar CPU" — é só leitura de arquivo, e o kernel fabrica o conteúdo na hora que você lê.

> `[ATENÇÃO]` Rode `ls -l /proc/cpuinfo`: o tamanho aparece como `0`, mas o `cat` mostra várias linhas. Arquivos em `/proc` e `/sys` são **virtuais** — não ocupam disco e o tamanho `0` não significa "vazio". Por isso `du -sh /proc` não serve para saber nada sobre uso de disco.

> `[TENTE VOCÊ]` Confira o que a tabela do FHS disse sobre `/bin`: `ls -ld /bin` e `readlink -f /bin`. Resposta: `/bin` é um link simbólico (`->`) para `usr/bin`, e o `readlink -f` mostra `/usr/bin`. Isso é o *merged-usr*: no Ubuntu moderno `/bin`, `/sbin` e `/lib` viraram atalhos para dentro de `/usr`, então os dois caminhos chegam ao mesmo programa — e scripts antigos com `#!/bin/bash` continuam funcionando.

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

### Lab 4 — Ficha de uma máquina herdada

Cenário: você assumiu um servidor sem documentação e o chefe pergunta "que máquina é essa?". Em vez de abrir dez comandos soltos, monte uma ficha de uma vez só:

```bash
{
  echo "== Ficha de $(hostname) em $(date +%F) =="
  . /etc/os-release
  echo "Distro : $PRETTY_NAME (família: ${ID_LIKE:-$ID})"
  echo "Kernel : $(uname -r)"
  echo "CPUs   : $(nproc)"
  echo "Memória: $(free -h | awk '/^Mem/ {print $2}')"
  echo "Disco /: $(df -h / | awk 'NR==2 {print $3 " usados de " $2}')"
} > ~/lab/ficha.txt
cat ~/lab/ficha.txt
```

Leia o raciocínio: as chaves `{ ...; }` juntam todos os `echo` para que **uma única** saída seja redirecionada para o arquivo. `ID_LIKE` diz de quem a distro descende (no Ubuntu é `debian`), e é por ele que você decide se vale `apt` ou `dnf`.

### Lab 5 — De qual pacote veio esse comando?

Cenário: um colega pergunta "o `ss` vem de qual pacote? Preciso instalar em outro servidor". Descobrir o dono de um arquivo é rotina de quem administra:

```bash
type -a ss                                  # onde está o executável
dpkg -S "$(readlink -f "$(which ss)")"       # qual pacote é dono do arquivo
dpkg -L iproute2 | head -5                   # o que mais esse pacote instalou
ls -lh /var/log/dpkg.log                     # histórico de instalações (Debian/Ubuntu)
du -sh /usr /var /etc 2>/dev/null            # quem ocupa mais espaço no FHS
```

Resultado esperado: o `dpkg -S` aponta `iproute2: /usr/bin/ss`. Repare no `readlink -f`: ele resolve o link do *merged-usr* para o caminho real que o `dpkg` conhece.

### Lab 6 — Tradutor de famílias

Cenário: sua empresa tem servidores Ubuntu e Rocky, e você vai ficar de plantão nos dois. Monte uma cola de equivalências e valide o lado Debian no seu WSL:

```bash
cat > ~/lab/cola-pacotes.txt <<'EOF'
tarefa            | Debian/Ubuntu          | Red Hat/Rocky
atualizar índice  | apt update             | dnf makecache
instalar          | apt install nginx      | dnf install nginx
remover           | apt remove nginx       | dnf remove nginx
buscar            | apt search nginx       | dnf search nginx
dono do arquivo   | dpkg -S /usr/bin/ss    | rpm -qf /usr/bin/ss
listar arquivos   | dpkg -L iproute2       | rpm -ql iproute
EOF
column -t -s'|' ~/lab/cola-pacotes.txt
apt-cache policy nginx | head -3            # consulta sem instalar nada
```

A ideia: os **conceitos** (índice, instalar, dono do arquivo) são os mesmos; só o nome do comando muda com a família. Quem sabe o conceito troca de distro em minutos.

### Desafio

Monte um arquivo `~/lab/distros.md` com uma tabela comparando Debian, RHEL e SUSE: formato de pacote, gerenciador, ciclo de vida, uso típico e **um comando** de cada um para instalar `nginx`. Consulte a documentação oficial para preencher.

Os próximos desafios seguem em dificuldade crescente (o de cima é o Desafio 1):

- **Desafio 2:** grave em `~/lab/familia.txt` a frase `Família: <valor>` lendo o valor de `ID_LIKE` direto do `/etc/os-release` (sem digitar `debian` à mão).
  **Verifique:** `cat ~/lab/familia.txt` deve mostrar `Família: debian`.
- **Desafio 3:** calcule o espaço ocupado por `/usr`, `/var` e `/etc` e grave, em `~/lab/fhs-uso.txt`, uma linha por diretório com o tamanho e o nome, ordenadas do maior para o menor.
  **Verifique:** `wc -l < ~/lab/fhs-uso.txt` deve mostrar `3`, e `head -1 ~/lab/fhs-uso.txt` deve ser a linha do `/usr`.
- **Desafio 4:** sem usar `nproc`, descubra quantos núcleos o Linux enxerga lendo só `/proc/cpuinfo`, e prove que o resultado bate com o `nproc`.
  **Verifique:** `[ "$(grep -c ^processor /proc/cpuinfo)" = "$(nproc)" ] && echo OK` deve imprimir `OK`.

### Desafio avançado — Auditoria de desvio da instalação
**Nível:** avançado — leva de 1 a 3 horas

- **Cenário:** uma máquina herdada "funcionava até alguém mexer em alguma coisa". Ninguém sabe quem editou o quê, e o time quer saber o que **diverge do que os pacotes instalaram**, sem depender da memória de ninguém. Você vai entregar um `~/lab/desvio.sh` que faça essa auditoria e possa ser rodado por um usuário comum.
- **Requisitos:**
  1. Saída em TSV, uma linha por arquivo, sem duplicatas e ordenada: `TIPO<TAB>caminho<TAB>pacote`.
  2. `MODIFICADO`: arquivo (de configuração em `/etc` ou de programa em `/usr`) cujo conteúdo difere do que o pacote declarou, com o pacote dono na terceira coluna.
  3. `AUSENTE`: arquivo que o pacote declara mas que não existe mais.
  4. `ORFAO`: arquivo regular em `/usr/local/bin`, `/usr/local/sbin` ou `/opt` que nenhum pacote reivindica (descoberto dinamicamente, sem lista fixa de nomes).
  5. Arquivos ilegíveis para o usuário comum não derrubam o script: stderr fica limpo e o exit code é 0.
  6. Roda em menos de 2 minutos no seu Ubuntu.
- **Restrições:** sem instalar `debsums` ou qualquer outro pacote; sem consultar a internet; não vale uma lista fixa de arquivos esperados.
- **Onde pesquisar:** `man dpkg` (opção `--verify`), `dpkg-query` (campo `Conffiles`), `/var/lib/dpkg/info/*.md5sums`, usrmerge no Ubuntu.
- **Verifique:**
  ```bash
  cd ~/lab && ./desvio.sh > base.tsv; echo "rc=$?"                       # rc=0
  echo '# teste' | sudo tee -a /etc/issue.net >/dev/null                 # MODIFICADO
  sudo mv /usr/bin/yes /usr/bin/yes.bak                                   # AUSENTE
  printf '#!/bin/sh\n' | sudo tee /usr/local/bin/orfao-lab >/dev/null     # ORFAO
  ./desvio.sh 2>erros.txt | diff base.tsv -                               # esperado: só 3 linhas novas (> ...)
  ./desvio.sh | awk -F'\t' '$1=="MODIFICADO" && $2=="/etc/issue.net" && $3=="base-files"' | wc -l   # 1
  ./desvio.sh | awk -F'\t' '$1=="AUSENTE" && $2=="/usr/bin/yes" && $3=="coreutils"' | wc -l         # 1
  ./desvio.sh | awk -F'\t' '$1=="ORFAO" && $2=="/usr/local/bin/orfao-lab"' | wc -l                  # 1
  wc -c < erros.txt; ./desvio.sh | sort | uniq -d | wc -l                 # 0 e 0
  # Limpeza
  sudo mv /usr/bin/yes.bak /usr/bin/yes; sudo rm /usr/local/bin/orfao-lab
  sudo sed -i '/^# teste$/d' /etc/issue.net
  ./desvio.sh | diff base.tsv - && echo "voltou ao baseline"
  ```

## Erros comuns nesta fase

- Chamar o kernel de "o Linux inteiro".
- Achar que "livre" quer dizer "grátis".
- Misturar comandos de famílias (`apt` numa distro Red Hat).
- Escolher uma distro rolling para servidor de produção sem pensar na estabilidade.
- Procurar a configuração de um serviço em `/usr` ou `/var` em vez de `/etc`.
- Guardar algo importante em `/tmp` e se surpreender quando sumir após reiniciar a distro.
- Achar que `/proc` e `/sys` ocupam disco só porque `ls` mostra arquivos neles.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 00 — WSL2 com kernel Linux real | O `uname -a` com "microsoft" é o exemplo vivo de kernel (motor) separado da distro (carro) |
| Módulo 00 — `sudo`, `apt`, `/etc/os-release` | Viram a prova de que você está na família Debian/Ubuntu |
| Módulo 00 — `~/lab` e `gera-lab.sh` | O `~/lab` é o `/home` do FHS na prática; `dados/` é o tipo de arquivo que viveria em `/var` |
| Módulo 00 — systemd habilitado | É o PID 1 da camada de userland do diagrama deste módulo |
| Módulo 00 — Git inicial em `~/lab` | Guarda a ficha do ambiente que você vai produzir abaixo |

### Lab integrador — Ficha do ambiente versionada

Reutilize o que o módulo 00 deixou pronto (`~/lab`, dados gerados, systemd, Git) para registrar o estado do seu ambiente:

```bash
cd ~/lab
{
  echo "# Ficha do ambiente — $(date +%F)"
  echo "Distro : $(. /etc/os-release; echo "$PRETTY_NAME")"
  echo "Kernel : $(uname -r)"
  echo "PID 1  : $(ps -p 1 -o comm=)"
  echo "Dados  : $(ls dados | tr '\n' ' ')"
} > ficha-ambiente.md
cat ficha-ambiente.md
git add ficha-ambiente.md && git commit -m "Ficha do ambiente"
git log --oneline | head -3
```

Esperado: `PID 1  : systemd`, a lista `access.log app.log usuarios.csv` e um commit novo no log. Se o `git commit` reclamar de repositório, volte à seção "Contribuição ao projeto de estudo" do módulo 00.

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
