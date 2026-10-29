---
id: "07_instalacao_e_gerenciamento_de_pacotes"
title: "Módulo 07 — Instalação e Gerenciamento de Pacotes"
sidebar_label: "07 · Pacotes"
sidebar_position: 7
---

# Módulo 07 — Instalação e Gerenciamento de Pacotes

> **Objetivo**: instalar, atualizar, consultar e remover software com `apt`/`dpkg` (Debian/Ubuntu) e `dnf`/`rpm` (Red Hat), gerenciar repositórios e chaves GPG, travar versões e compilar a partir do código-fonte.
>
> **Pré-requisitos**: módulos 02, 03 e 05 (`sudo`).
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre os tópicos 102.4, 102.5 e 102.6 do **LPIC-1 101** e "Software management" do **Linux+**. Referência: https://www.debian.org/doc/manuals/debian-reference/ch02.en.html

---

## Loja de aplicativos com garantia de procedência

Instalar software baixando um `.exe` de qualquer site é como comprar remédio de camelô. No Linux, a norma é o **gerenciador de pacotes**: uma "loja" central (o **repositório**) com software **assinado**, que resolve **dependências** automaticamente (instalar A traz B e C de que ele precisa) e permite atualizar e remover tudo de forma limpa.

Duas camadas, em cada família:

| | Camada baixa (arquivo único, **não** resolve dependências) | Camada alta (repositórios + dependências) |
|---|---|---|
| **Debian/Ubuntu** | `dpkg` (`.deb`) | `apt` |
| **Red Hat/Rocky/Fedora** | `rpm` (`.rpm`) | `dnf` (sucessor do `yum`) |
| **SUSE** | `rpm` | `zypper` |

> `[TEORIA]` Pense assim: `dpkg`/`rpm` são o **instalador de um arquivo**; `apt`/`dnf` são o **gerente de loja** que busca, resolve a árvore de dependências e chama o instalador de baixo. Na dúvida, use a camada alta.

## apt: o dia a dia no Ubuntu/Debian

```bash
sudo apt update                       # ATUALIZA A LISTA de pacotes disponíveis (não instala nada)
sudo apt upgrade -y                   # instala as atualizações pendentes
sudo apt full-upgrade                 # idem, podendo remover/instalar pacotes para resolver
apt search nginx | head               # procura por nome/descrição
apt show nginx                        # detalhes: versão, dependências, tamanho
apt policy nginx                      # versão instalada x candidata e de qual repositório
sudo apt install -y nginx htop curl   # instala (vários de uma vez)
sudo apt remove nginx                 # remove o programa, mantém configuração
sudo apt purge nginx                  # remove programa E configuração
sudo apt autoremove                   # remove dependências órfãs
apt list --installed | wc -l          # quantos pacotes instalados
apt list --upgradable                 # o que pode atualizar
```

> `[ATENÇÃO]` `apt update` **não atualiza programas**: só atualiza o *catálogo*. É `apt upgrade` que instala as versões novas. Confusão clássica. E `remove` mantém arquivos de configuração em `/etc`; para reinstalar "limpo", use `purge`.

### dpkg: a camada baixa

```bash
dpkg -l | grep nginx                  # pacotes instalados
dpkg -L nginx | head                  # arquivos que o pacote instalou
dpkg -S /usr/bin/ss                   # a qual pacote pertence um arquivo
dpkg -s nginx                         # status
sudo dpkg -i pacote.deb               # instala um .deb local (não resolve dependências)
sudo apt -f install                   # conserta dependências quebradas depois do dpkg -i
```

## dnf/rpm: a mesma ideia em outra família

Disponível no WSL via container (`docker run -it rockylinux:9`) ou numa VM Rocky/Alma. Compare os comandos:

| Tarefa | apt (Debian) | dnf (Red Hat) |
|---|---|---|
| Atualizar catálogo | `apt update` | (automático; `dnf makecache`) |
| Atualizar tudo | `apt upgrade` | `dnf upgrade` |
| Instalar | `apt install X` | `dnf install X` |
| Remover | `apt remove X` | `dnf remove X` |
| Buscar | `apt search X` | `dnf search X` |
| Info | `apt show X` | `dnf info X` |
| Quem fornece o arquivo? | `dpkg -S /caminho` | `dnf provides /caminho` ou `rpm -qf /caminho` |
| Listar arquivos do pacote | `dpkg -L X` | `rpm -ql X` |

```bash
dnf provides /usr/sbin/ss             # qual pacote entrega 'ss'
rpm -qa | wc -l                       # pacotes instalados
rpm -qi bash                          # informações
rpm -ql bash | head                   # arquivos
dnf history                           # histórico de transações (e dnf history undo N)
dnf group list                        # grupos de pacotes
sudo dnf install -y epel-release      # repositório extra (EPEL) em RHEL-like
```

`zypper` (SUSE): `zypper refresh`, `zypper install X`, `zypper search X`, `zypper se -i`.

## Repositórios e chaves GPG

Um repositório é um servidor com pacotes e um **índice assinado**. A assinatura (chave GPG) garante que o pacote não foi adulterado. Para adicionar um repositório de terceiros, você registra a **fonte** e a **chave**:

```bash
# Debian/Ubuntu: repositórios ficam em /etc/apt/sources.list e /etc/apt/sources.list.d/
ls /etc/apt/sources.list.d/
cat /etc/apt/sources.list.d/*.sources 2>/dev/null | head -10

# Exemplo (padrão moderno): chave em /etc/apt/keyrings + fonte assinada
sudo install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://exemplo.com/chave.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/exemplo.gpg
echo "deb [signed-by=/etc/apt/keyrings/exemplo.gpg] https://exemplo.com/apt stable main" \
  | sudo tee /etc/apt/sources.list.d/exemplo.list
sudo apt update
```

> `[ATENÇÃO]` Só adicione repositórios e chaves de fontes em que **confia**: um repositório de terceiros pode substituir qualquer pacote do sistema. Prefira `signed-by=` com a chave **restrita ao repositório**, em vez de confiar a chave globalmente (o antigo `apt-key` está obsoleto). Em RHEL-like: arquivos `.repo` em `/etc/yum.repos.d/`.

## Segurar e fixar versões

```bash
sudo apt-mark hold nginx              # impede de atualizar
apt-mark showhold
sudo apt-mark unhold nginx
sudo apt install nginx=1.24.0-2ubuntu7     # versão específica
```

No dnf: `sudo dnf versionlock add nginx` (plugin) ou `exclude=` no `.repo`.

## Outros formatos: snap, flatpak e AppImage

Pacotes "universais" empacotam o programa **com** suas dependências, independente da distro: **snap** (Canonical), **flatpak** (desktop), **AppImage** (arquivo único). Trocam tamanho e isolamento por portabilidade. No servidor, prefira os pacotes nativos.

## Compilar do código-fonte

Quando não há pacote, ou você precisa de uma opção específica, compila-se. O ciclo clássico:

```bash
sudo apt install -y build-essential          # compilador, make, bibliotecas básicas
cd /tmp
curl -LO https://ftp.gnu.org/gnu/hello/hello-2.12.tar.gz
tar -xzf hello-2.12.tar.gz && cd hello-2.12
./configure --prefix=$HOME/.local            # verifica dependências e gera o Makefile
make -j"$(nproc)"                            # compila (-j usa todos os núcleos)
make check                                   # (opcional) testes
make install                                 # instala em --prefix
~/.local/bin/hello
```

`--prefix=$HOME/.local` instala **sem root** e fora do sistema. Para instalar como pacote gerenciável e remover depois, use `checkinstall` (cria um `.deb` do resultado do `make install`).

> `[TEORIA]` Compilar do fonte dá controle, mas você passa a ser o responsável pelas atualizações de segurança desse software. Use só quando necessário.

## Laboratórios

### Lab 1 — O ciclo apt
1. `apt update`, `apt policy nginx`, instale `nginx` e `htop`.
2. Veja os arquivos instalados (`dpkg -L nginx | head -20`) e a qual pacote pertence `/etc/nginx/nginx.conf` (`dpkg -S`).
3. `apt remove` vs `apt purge`: compare o que sobra em `/etc/nginx`.

### Lab 2 — Descobrindo pacotes
1. Descubra qual pacote fornece o comando `dig` (`apt-file` ou `dpkg -S $(which dig)`; instale `apt-file` e rode `apt-file search bin/dig`).
2. Liste os 10 maiores pacotes instalados: `dpkg-query -Wf '${Installed-Size}\t${Package}\n' | sort -rn | head`.

### Lab 3 — Compilando
Compile o `hello` do GNU como mostrado e rode-o. Depois apague `~/.local/bin/hello` e o código.

### Lab 4 — Segunda família
Em `docker run -it rockylinux:9`: `dnf install -y tree`, `rpm -qi tree`, `dnf provides /usr/bin/tree`.

### Desafios

- **Desafio 1:** descubra de qual pacote vem `/usr/bin/ss` em **Debian** e em **RHEL**, e mostre a diferença de nome.
- **Desafio 2:** instale uma versão específica de um pacote, trave-a com `hold` e prove que `apt upgrade` não a altera.
- **Desafio 3:** adicione um repositório de terceiros (por exemplo, do Docker, seguindo a documentação oficial) usando chave em `/etc/apt/keyrings` com `signed-by`.

## Erros comuns nesta fase

- Achar que `apt update` instala atualizações.
- Usar `dpkg -i` e ficar com dependências quebradas.
- Misturar repositórios de versões diferentes da distro (quebra o sistema).
- Adicionar chaves GPG globais sem critério.
- Baixar `.deb` aleatório da internet.
- Compilar como root fora de `/usr/local` e "sujar" o sistema.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Repositórios e chaves GPG | Hardening — Módulo 10 |
| `apt install` de serviços | Servidores — Módulo 17 |
| Compilar, `make` | Kernel e módulos — Módulo 13 |
| Instalação reproduzível | Ansible — Módulo 21; Dockerfile — Módulo 20 |

## `[REFERÊNCIA]`

- Debian — *Debian Reference, gerência de pacotes*: https://www.debian.org/doc/manuals/debian-reference/ch02.en.html
- Ubuntu — *Package management*: https://ubuntu.com/server/docs/package-management
- Fedora/RHEL — documentação do DNF: https://dnf.readthedocs.io/
- Red Hat — *Managing software with DNF*: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/managing_software_with_the_dnf_tool/
- `man apt`, `man dpkg`, `man rpm`: https://man7.org/linux/man-pages/
- GNU — *Build system* (`configure`/`make`): https://www.gnu.org/prep/standards/html_node/Managing-Releases.html
- LPI — objetivos 102.4 a 102.6: https://www.lpi.org/our-certifications/exam-102-objectives/

**Como aprofundar:** leia `man sources.list` e `man deb822` para entender o formato moderno de repositório; faça o mesmo com um `.repo` do dnf.

## Checklist de saída

- [ ] Explicar camada baixa (`dpkg`/`rpm`) x camada alta (`apt`/`dnf`).
- [ ] Explicar a diferença entre `apt update` e `apt upgrade`, e entre `remove` e `purge`.
- [ ] Achar a qual pacote pertence um arquivo (`dpkg -S`, `rpm -qf`, `dnf provides`).
- [ ] Explicar o papel das chaves GPG e do `signed-by`.
- [ ] Segurar uma versão com `apt-mark hold`.
- [ ] Compilar um programa com `./configure && make && make install` num prefixo próprio.
- [ ] Traduzir um comando `apt` para o equivalente `dnf`.
