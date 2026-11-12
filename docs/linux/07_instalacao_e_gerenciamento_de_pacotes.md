---
id: '07_instalacao_e_gerenciamento_de_pacotes'
title: 'Módulo 07 — Instalação e Gerenciamento de Pacotes'
sidebar_label: '07 · Pacotes'
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

|                          | Camada baixa (arquivo único, **não** resolve dependências) | Camada alta (repositórios + dependências) |
| ------------------------ | ---------------------------------------------------------- | ----------------------------------------- |
| **Debian/Ubuntu**        | `dpkg` (`.deb`)                                            | `apt`                                     |
| **Red Hat/Rocky/Fedora** | `rpm` (`.rpm`)                                             | `dnf` (sucessor do `yum`)                 |
| **SUSE**                 | `rpm`                                                      | `zypper`                                  |

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

> `[ATENÇÃO]` `apt update` **não atualiza programas**: só atualiza o _catálogo_. É `apt upgrade` que instala as versões novas. Confusão clássica. E `remove` mantém arquivos de configuração em `/etc`; para reinstalar "limpo", use `purge`.

> `[TENTE VOCÊ]` Ensaie uma instalação sem instalar nada. Rode `apt-get -s install tree | grep -E '^(Inst|Conf)'`. Resposta: aparecem linhas como `Inst tree (2.1.1-2ubuntu3 Ubuntu:24.04/noble [amd64])` e `Conf tree ...`. Raciocínio: `-s` (simulate) executa o resolvedor de dependências e mostra o plano — `Inst` é "vou desempacotar", `Conf` é "vou configurar" — sem tocar no disco e sem exigir `sudo`. É o jeito de saber o impacto de um `install` antes de apertar Enter em produção.

> `[ATENÇÃO]` Rode `apt update` sem `sudo`. Você verá `Could not open lock file /var/lib/apt/lists/lock ... Permission denied`. Não é bug do apt: o catálogo é do root. Em scripts, prefira `apt-get` (interface estável) a `apt` (feita para humanos e com saída que pode mudar).

### dpkg: a camada baixa

```bash
dpkg -l | grep nginx                  # pacotes instalados
dpkg -L nginx | head                  # arquivos que o pacote instalou
dpkg -S /usr/bin/ss                   # a qual pacote pertence um arquivo
dpkg -s nginx                         # status
sudo dpkg -i pacote.deb               # instala um .deb local (não resolve dependências)
sudo apt -f install                   # conserta dependências quebradas depois do dpkg -i
```

> `[TENTE VOCÊ]` Descubra a quem pertence um comando e de que ele depende. Rode `dpkg -S /usr/bin/ss` e `apt-cache depends iproute2 | head -5`. Resposta: o primeiro imprime `iproute2: /usr/bin/ss`; o segundo lista `Depends:` do pacote (libs como `libc6`, `libbpf1`). Raciocínio: `dpkg -S` vai do arquivo para o pacote; `apt-cache depends` vai do pacote para o que ele puxa. Juntos, respondem "de onde veio isso?" e "o que quebra se eu remover?".

## dnf/rpm: a mesma ideia em outra família

Disponível no WSL via container (`docker run -it rockylinux:9`) ou numa VM Rocky/Alma. Compare os comandos:

| Tarefa                    | apt (Debian)       | dnf (Red Hat)                                 |
| ------------------------- | ------------------ | --------------------------------------------- |
| Atualizar catálogo        | `apt update`       | (automático; `dnf makecache`)                 |
| Atualizar tudo            | `apt upgrade`      | `dnf upgrade`                                 |
| Instalar                  | `apt install X`    | `dnf install X`                               |
| Remover                   | `apt remove X`     | `dnf remove X`                                |
| Buscar                    | `apt search X`     | `dnf search X`                                |
| Info                      | `apt show X`       | `dnf info X`                                  |
| Quem fornece o arquivo?   | `dpkg -S /caminho` | `dnf provides /caminho` ou `rpm -qf /caminho` |
| Listar arquivos do pacote | `dpkg -L X`        | `rpm -ql X`                                   |

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

> `[TENTE VOCÊ]` Separe o que você instalou do que veio de carona. Rode `apt-mark showmanual | wc -l` e `apt-mark showauto | wc -l`. Resposta: dois números; o de `auto` costuma ser bem maior. Raciocínio: `manual` são os pacotes que você (ou o instalador) pediu; `auto` são dependências. O `apt autoremove` só remove `auto` que ninguém mais precisa — por isso instalar com `apt install` e depois "marcar manual" (`apt-mark manual X`) salva um pacote de ser varrido.

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

### Lab 5 — Detectando um binário adulterado

Cenário: um auditor pergunta se os pacotes do servidor ainda têm os arquivos originais. O `dpkg` guarda o MD5 de cada arquivo instalado.

1. `sudo apt install -y tree` e `dpkg -V tree` (sem saída = tudo íntegro).
2. Adultere de leve: `sudo cp /usr/bin/tree /tmp/tree.bak && echo x | sudo tee -a /usr/bin/tree >/dev/null`.
3. `dpkg -V tree` agora imprime algo como `??5??????  /usr/bin/tree` (o `5` sinaliza MD5 diferente).
4. Restaure sem apagar nada à mão: `sudo apt install --reinstall -y tree` e confirme que `dpkg -V tree` voltou a ficar mudo.

### Lab 6 — Construindo seu primeiro .deb

Cenário: sua equipe distribui um script interno e quer instalá-lo, listá-lo e removê-lo como qualquer pacote.

```bash
mkdir -p ~/lab/pkg/ola-lab/DEBIAN ~/lab/pkg/ola-lab/usr/local/bin
cat > ~/lab/pkg/ola-lab/usr/local/bin/ola-lab <<'EOF'
#!/usr/bin/env bash
echo "Olá do pacote ola-lab 1.0"
EOF
chmod 755 ~/lab/pkg/ola-lab/usr/local/bin/ola-lab
cat > ~/lab/pkg/ola-lab/DEBIAN/control <<'EOF'
Package: ola-lab
Version: 1.0
Architecture: all
Maintainer: Aluno <aluno@exemplo.com>
Description: Pacote de treino da trilha
EOF
dpkg-deb --root-owner-group --build ~/lab/pkg/ola-lab ~/lab/pkg/ola-lab_1.0_all.deb
sudo dpkg -i ~/lab/pkg/ola-lab_1.0_all.deb
ola-lab
dpkg -L ola-lab
dpkg -S /usr/local/bin/ola-lab
sudo apt remove -y ola-lab
```

Esperado: o comando imprime a mensagem, `dpkg -L` mostra o caminho do script e `dpkg -S` responde `ola-lab: /usr/local/bin/ola-lab`. Depois do `remove`, `which ola-lab` não retorna nada.

### Lab 7 — Instalação idempotente (a base do Ansible)

Cenário: você precisa de um comando que garanta pacotes sem reinstalar o que já existe, e que rode igual 10 vezes seguidas.

```bash
cat > ~/lab/garante-pacotes.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
for p in "$@"; do
  if dpkg -s "$p" >/dev/null 2>&1; then
    echo "ok       $p"
  else
    echo "instalando $p"
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "$p" >/dev/null
  fi
done
EOF
chmod +x ~/lab/garante-pacotes.sh
~/lab/garante-pacotes.sh curl tree jq
~/lab/garante-pacotes.sh curl tree jq
```

Na segunda execução todas as linhas devem começar com `ok`. Essa propriedade — rodar de novo sem efeito colateral — chama-se **idempotência** e é o que o Ansible (Módulo 21) e o Dockerfile (Módulo 20) automatizam.

### Desafios

- **Desafio 1:** descubra de qual pacote vem `/usr/bin/ss` em **Debian** e em **RHEL**, e mostre a diferença de nome.
- **Desafio 2:** instale uma versão específica de um pacote, trave-a com `hold` e prove que `apt upgrade` não a altera.
- **Desafio 3:** adicione um repositório de terceiros (por exemplo, do Docker, seguindo a documentação oficial) usando chave em `/etc/apt/keyrings` com `signed-by`.
- **Desafio 4:** gere um arquivo `~/lab/pacotes-manuais.txt` com os pacotes marcados como manuais e prove que reinstalá-los seria um "não faz nada". **Verifique:** `apt-mark showmanual > ~/lab/pacotes-manuais.txt; xargs -a ~/lab/pacotes-manuais.txt apt-get -s --no-upgrade install | grep -c '^Inst'` deve imprimir `0`.

### Desafio avançado — Repositório APT privado e assinado

**Nível:** avançado — leva de 1 a 3 horas

- **Cenário:** sua empresa tem servidores sem saída para a internet e dois pacotes internos (`acme-core` e `acme-tools`, o segundo depende do primeiro). O time de segurança exige que só pacotes assinados pela chave da empresa sejam aceitos, e que um servidor possa ficar preso na versão antiga enquanto outro recebe a nova. Você vai montar o repositório inteiro do zero, num diretório local, e provar que o apt o trata como um repositório de verdade.
- **Requisitos:**
  1. Construir 2 versões (`1.0` e `2.0`) de `acme-core` e 1 versão de `acme-tools` com `Depends: acme-core (>= 1.0)`, todos `Architecture: all`.
  2. Gerar o índice do repositório (`Packages`, `Release`) por uma ferramenta própria para isso, sem escrever o índice à mão.
  3. Assinar o `Release` com uma chave GPG descartável criada num `GNUPGHOME` temporário (gerando `InRelease` e `Release.gpg`).
  4. Consumir o repositório via `file:` com `signed-by` apontando só para a chave exportada, sem tocar em `/etc/apt` nem em `/var/lib/apt`.
  5. Mostrar, em simulação, que `install acme-tools` puxa `acme-core` na versão `2.0` e que, com pinning, o mesmo comando escolhe a `1.0`.
  6. Provar que o apt rejeita o repositório quando a chave não é a esperada e rejeita um `.deb` adulterado depois da assinatura.
- **Restrições:** tudo roda como usuário comum (instalar de verdade fica fora; use simulação `-s`); sem rede; o script de montagem deve poder ser rodado duas vezes seguidas sem erro (idempotente).
- **Onde pesquisar:** `man apt-ftparchive`, `man apt.conf` (opções `Dir::`), `man apt_preferences`, `man sources.list` (`Trusted`, `Signed-By`), `man gpg` (`--export`, `--quick-generate-key`, `--clearsign`).
- **Verifique:**
  - `apt-cache` com as opções de diretório isoladas, `policy acme-core`, deve listar `2.0` como candidata e `1.0` também disponível.
  - `apt-get -s install acme-tools` (opções isoladas) deve imprimir duas linhas `Inst`, uma de `acme-core (2.0 ...)` e outra de `acme-tools`.
  - Com o arquivo de preferences fixando `acme-core` em `1.0`, o mesmo comando deve mostrar `acme-core (1.0 ...)`.
  - `gpg --no-default-keyring --keyring <seu-keyring> --verify <repo>/InRelease` deve dizer `Good signature`.
  - Teste de falha 1: trocar o `signed-by` por outro keyring e rodar `update` deve produzir erro de assinatura (`NO_PUBKEY` ou `not signed`) e o `policy` não deve listar o repositório.
  - Teste de falha 2: acrescentar um byte a um `.deb` do repositório sem regerar o índice e rodar `apt-get download acme-core` (com as opções isoladas) deve falhar com `Hash Sum mismatch` ou `File has unexpected size`.
  - Rodar o script de montagem 2 vezes: a segunda termina com status `0` e não duplica entradas no `Packages` (`grep -c '^Package: acme-core' Packages` mostra `2`).

## Erros comuns nesta fase

- Achar que `apt update` instala atualizações.
- Usar `dpkg -i` e ficar com dependências quebradas.
- Misturar repositórios de versões diferentes da distro (quebra o sistema).
- Adicionar chaves GPG globais sem critério.
- Baixar `.deb` aleatório da internet.
- Compilar como root fora de `/usr/local` e "sujar" o sistema.
- Usar `apt` (e não `apt-get`) dentro de scripts: a saída do `apt` não é estável e ele avisa sobre isso; além disso, esquecer `-y` ou `DEBIAN_FRONTEND=noninteractive` trava automações esperando resposta.
- Rodar `apt install` depois de muito tempo sem `apt update` e tomar `404 Not Found`: o catálogo local aponta para versões que já saíram do repositório.

## Ponte com módulos anteriores

| Vem de                                    | Como reaparece aqui                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Módulo 03 (`find`, `stat`, caminhos)      | `dpkg -L`/`dpkg -S` ligam arquivo e pacote; `/usr/local` e `~/.local` como destinos de `--prefix` |
| Módulo 04 (`grep`, `awk`, `sort`, `uniq`) | Analisar `/var/log/dpkg.log` e a saída de `dpkg-query`                                            |
| Módulo 05 (`sudo`, dono e modo)           | Só root altera o catálogo; chaves em `/etc/apt/keyrings` devem ser `0644` e do root               |
| Módulo 06 (processos e serviços)          | Pacote de servidor instala uma unit; `apt` trava com o lock de outro processo                     |

### Lab integrador — Auditoria de pacotes do servidor

Cenário: antes de uma auditoria você precisa responder: o que foi instalado e quando, quais são os maiores pacotes, e quem é dono das chaves de confiança.

1. (Módulo 04) Instalações por dia, a partir do log do dpkg:

```bash
awk '$3=="install"{print $1}' /var/log/dpkg.log | sort | uniq -c
```

Esperado: uma linha por dia com a quantidade de pacotes novos (ex.: `  3 2026-01-10`). 2. (Módulos 04 e 07) Os 5 maiores pacotes, em MB:

```bash
dpkg-query -Wf '${Installed-Size}\t${Package}\n' | sort -rn | head -5 | awk '{printf "%.1f MB  %s\n", $1/1024, $2}'
```

3. (Módulo 05) Dono e modo da chave de confiança do Ubuntu, e dos diretórios de chaves:

```bash
stat -c '%a %U:%G %n' /usr/share/keyrings/ubuntu-archive-keyring.gpg /etc/apt/keyrings
```

Esperado: `644 root:root` para a chave e `755 root:root` para o diretório. Se uma chave tivesse permissão de escrita para outros, qualquer usuário poderia trocar a "assinatura" em que o apt confia. 4. (Módulos 03 e 06) Quais pacotes instalados trouxeram uma unit do systemd? `dpkg -S /usr/lib/systemd/system/*.service 2>/dev/null | cut -d: -f1 | sort -u | head`. Compare com `systemctl list-unit-files --type=service | wc -l`.

## Conexão com os módulos seguintes

| Conceito deste módulo     | Aparece novamente em                        |
| ------------------------- | ------------------------------------------- |
| Repositórios e chaves GPG | Hardening — Módulo 10                       |
| `apt install` de serviços | Servidores — Módulo 17                      |
| Compilar, `make`          | Kernel e módulos — Módulo 13                |
| Instalação reproduzível   | Ansible — Módulo 21; Dockerfile — Módulo 20 |

## `[REFERÊNCIA]`

- Debian — _Debian Reference, gerência de pacotes_: https://www.debian.org/doc/manuals/debian-reference/ch02.en.html
- Ubuntu — _Package management_: https://ubuntu.com/server/docs/package-management
- Fedora/RHEL — documentação do DNF: https://dnf.readthedocs.io/
- Red Hat — _Managing software with DNF_: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/managing_software_with_the_dnf_tool/
- `man apt`, `man dpkg`, `man rpm`: https://man7.org/linux/man-pages/
- GNU — _Build system_ (`configure`/`make`): https://www.gnu.org/prep/standards/html_node/Managing-Releases.html
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
