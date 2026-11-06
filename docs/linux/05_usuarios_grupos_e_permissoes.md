---
id: "05_usuarios_grupos_e_permissoes"
title: "Módulo 05 — Usuários, Grupos e Permissões"
sidebar_label: "05 · Usuários, Grupos e Permissões"
sidebar_position: 5
---

# Módulo 05 — Usuários, Grupos e Permissões

> **Objetivo**: controlar quem acessa o quê — criar usuários e grupos, entender `/etc/passwd`, usar `sudo`, ler e definir permissões (`chmod`, `chown`, `umask`), bits especiais (SUID/SGID/sticky) e ACLs.
>
> **Pré-requisitos**: módulos 02 e 03.
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre os tópicos 107.1 e 104.5 do **LPIC-1** e "Users and groups / Permissions" do **Linux+**. É a base de segurança do Linux. Referência: https://man7.org/linux/man-pages/man7/credentials.7.html

---

## Cada processo age em nome de alguém

Linux é multiusuário desde o nascimento. Cada processo roda com a identidade de um **usuário** (UID) e de **grupos** (GID), e toda decisão de acesso do kernel é: "esta identidade pode fazer isto neste arquivo?". Pense num prédio de escritórios: cada pessoa tem um crachá (UID), pertence a departamentos (grupos), e cada porta tem uma regra de quem entra.

- **root** (UID 0): o "síndico" com acesso a tudo. Por segurança, não se usa root no dia a dia.
- **Usuários de sistema** (UID baixo, ex.: `www-data`, `postgres`): contas para serviços, sem login.
- **Usuários comuns** (UID ≥ 1000): pessoas.

```bash
id                         # seu UID, GID e grupos
whoami                     # só o nome
groups                     # seus grupos
id root                    # identidade de outro usuário
who                        # quem está logado
last | head -5             # últimos logins
```

> `[TENTE VOCÊ]` Compare o seu crachá com o de uma conta de serviço: `id -u`, `id -u nobody` e `getent passwd root | cut -d: -f3,7`. Resposta: o seu UID é `1000` (primeiro usuário comum), o do `nobody` é `65534` (conta de sistema sem privilégios) e o do root é `0:/bin/bash`. Raciocínio: o kernel não conhece nomes, só números — o nome é conveniência vinda do `/etc/passwd`. Quem tem UID 0 é root, não importa como a conta se chame.

## Onde mora a identidade: os arquivos de contas

| Arquivo | Conteúdo |
|---|---|
| `/etc/passwd` | Um usuário por linha: `nome:x:UID:GID:comentário:home:shell` |
| `/etc/shadow` | Hashes de senha e validade (legível só por root) |
| `/etc/group` | Grupos e seus membros |
| `/etc/sudoers` | Quem pode usar `sudo` e como |

```bash
head -3 /etc/passwd
# root:x:0:0:root:/root:/bin/bash
cut -d: -f1,3,7 /etc/passwd | head          # nome, UID, shell
getent passwd $USER                          # forma portável de consultar
sudo head -3 /etc/shadow                     # só root enxerga
```

O `x` no segundo campo do `passwd` significa "a senha está no `shadow`". Por isso `passwd` é legível por todos (precisa listar nomes), mas `shadow` não.

> `[TENTE VOCÊ]` Veja por que a senha mora num arquivo à parte: `ls -l /etc/passwd /etc/shadow`. Resposta: o `passwd` é `-rw-r--r--` (644, todo mundo lê) e o `shadow` é `-rw-r-----` (640, grupo `shadow`). O `passwd` precisa ser público porque `ls` e outros programas traduzem UID em nome; os hashes ficam isolados no `shadow` para ninguém tentar quebrá-los offline.

## Criar e gerenciar usuários e grupos

```bash
sudo useradd -m -s /bin/bash -G sudo ana     # -m cria home, -s shell, -G grupos extras
sudo passwd ana                              # define a senha
sudo usermod -aG docker ana                  # ADICIONA ao grupo (-a é essencial)
sudo usermod -L ana                          # bloqueia a conta
sudo userdel -r ana                          # remove usuário e home

sudo groupadd devs
sudo gpasswd -a ana devs                     # adiciona ao grupo
sudo chage -l ana                            # política de validade de senha
sudo chage -M 90 ana                         # senha expira a cada 90 dias
```

> `[ATENÇÃO]` `usermod -G grupo` **substitui** todos os grupos secundários. Use sempre **`-aG`** (append). Esquecer o `-a` remove o usuário dos outros grupos, incluindo `sudo`. E a mudança de grupos só vale em **novo login**.

Em distribuições Debian/Ubuntu, `adduser` é um assistente mais amigável que `useradd`.

## sudo: poder emprestado e auditado

`sudo` executa **um comando** como outro usuário (por padrão, root), registrando quem fez o quê. É melhor que logar como root, porque deixa trilha de auditoria e dá poder pontual.

```bash
sudo apt update                    # um comando como root
sudo -i                            # shell de root (use com cuidado)
sudo -u ana ls /home/ana           # como outro usuário
sudo -l                            # o que EU posso fazer com sudo
sudo visudo                        # edita /etc/sudoers com validação de sintaxe
echo 'ana ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx' | sudo tee /etc/sudoers.d/ana
sudo visudo -cf /etc/sudoers.d/ana   # valida o arquivo
```

> `[ATENÇÃO]` **Nunca edite `/etc/sudoers` com um editor comum**: um erro de sintaxe pode trancar todo mundo fora do sudo. Use `visudo`, e prefira arquivos pequenos em `/etc/sudoers.d/`. Dê o **menor privilégio**: um comando específico, não `ALL`.

> `[TENTE VOCÊ]` Rode um comando como outra identidade: `sudo -u nobody id`. Resposta: `uid=65534(nobody) gid=65534(nogroup) groups=65534(nogroup)`. O `sudo -u` não dá "poder de root", ele troca a identidade do processo; é a forma de testar, sem criar usuário, "o que um serviço sem privilégios enxergaria?". Combine com `ls`/`cat` para validar permissões de verdade.

## Permissões: rwx para três públicos

Toda arquivo ou diretório tem permissões para **três públicos**: **u**ser (dono), **g**roup (grupo do arquivo) e **o**thers (todo o resto).

```bash
ls -l ~/lab/gera-lab.sh
# -rwxr-xr-x 1 lucas lucas 1234 jan 10 10:00 gera-lab.sh
#  │└┬┘└┬┘└┬┘   └─dono └─grupo
#  │ │  │  └─ outros: r-x
#  │ │  └─ grupo:  r-x
#  │ └─ dono:  rwx
#  └─ tipo (- arquivo, d diretório, l link)
```

O significado muda entre arquivo e diretório — ponto que mais cai em prova:

| | Arquivo | Diretório |
|---|---|---|
| **r** (4) | Ler o conteúdo | **Listar** os nomes dentro |
| **w** (2) | Alterar o conteúdo | **Criar/apagar/renomear** itens dentro |
| **x** (1) | **Executar** (script/programa) | **Entrar** (`cd`) e acessar itens |

Cada permissão vale um número (r=4, w=2, x=1), e a soma por público dá o modo **octal**: `rwx`=7, `rw-`=6, `r-x`=5, `r--`=4. Então `chmod 755` = `rwxr-xr-x`, `644` = `rw-r--r--`, `600` = `rw-------`.

```bash
chmod 755 script.sh             # octal
chmod u+x script.sh             # simbólico: dono ganha x
chmod g-w,o-rwx arquivo         # tira w do grupo e tudo de outros
chmod -R 750 pasta/             # recursivo
chown ana arquivo               # muda dono
chown ana:devs arquivo          # dono e grupo
chown -R ana:devs pasta/
chgrp devs arquivo              # só o grupo
```

> `[TENTE VOCÊ]` Qual o modo octal de `rwxr-x---`? Resposta: `750` (7 para dono, 5 para grupo, 0 para outros).

> `[ATENÇÃO]` Dar `chmod 777` "para resolver" é abrir a porta para todo o prédio. Descubra a permissão **mínima** necessária. Um diretório sem `x` não pode ser acessado mesmo tendo `r`.

> `[TENTE VOCÊ]` Veja o `x` de diretório em ação: `mkdir /tmp/p && echo oi > /tmp/p/a && chmod -x /tmp/p && cd /tmp/p; cat /tmp/p/a`. Resposta: os dois dão `Permission denied`, mesmo você sendo o dono e o arquivo `a` sendo legível. Sem `x` no diretório, você não "atravessa" a porta para chegar nos itens. Restaure com `chmod +x /tmp/p; cat /tmp/p/a` (imprime `oi`) e limpe com `rm -r /tmp/p`.

### umask: as permissões padrão

Quando você cria um arquivo, o sistema parte de `666` (arquivos) ou `777` (diretórios) e **subtrai** a **umask**. Com `umask 022` (padrão comum), arquivos nascem `644` e diretórios `755`.

```bash
umask                  # 0022
umask 077              # novos arquivos só para você (600), diretórios 700
touch a && mkdir d && ls -ld a d
```

> `[ATENÇÃO]` A umask só **tira** permissões, nunca adiciona o `x`. Rode `umask 022; touch /tmp/u; ls -l /tmp/u`: o arquivo nasce `-rw-r--r--` (666 menos 022 = 644) e **nunca** executável, por mais permissiva que seja a umask. Por isso todo script novo precisa de `chmod +x`. Cuidado: `umask 077` vale só para a sessão atual do terminal; para fixar, ponha no `~/.bashrc`.

## Bits especiais: SUID, SGID e sticky

| Bit | Em arquivo | Em diretório | Exemplo |
|---|---|---|---|
| **SUID** (4) | Executa como o **dono** do arquivo | — | `/usr/bin/passwd` (muda `shadow` como root) |
| **SGID** (2) | Executa como o **grupo** do arquivo | Novos arquivos herdam o **grupo** do diretório | Pasta de equipe |
| **Sticky** (1) | — | Só o dono do arquivo pode apagá-lo | `/tmp` |

```bash
ls -l /usr/bin/passwd           # note o 's' no lugar do x do dono: -rwsr-xr-x
ls -ld /tmp                     # note o 't' no final: drwxrwxrwt
chmod 2775 /srv/equipe          # SGID + rwxrwxr-x
chmod +t /srv/compartilhado     # sticky
find / -perm -4000 -type f 2>/dev/null     # lista binários SUID (auditoria de segurança!)
```

> `[TEORIA]` SUID em binários próprios é um risco clássico de escalonamento de privilégio. Em auditoria, liste os SUID do sistema e investigue os que você não reconhece.

## ACLs: permissões mais finas

As permissões u/g/o não dão conta de "a Ana pode ler, mas o Bruno não, e ele é de outro grupo". **ACLs** (*Access Control Lists*) permitem regras por usuário/grupo adicionais.

```bash
sudo apt install -y acl
setfacl -m u:ana:rx relatorio.txt        # Ana: leitura e execução
setfacl -m g:devs:rw relatorio.txt       # grupo devs: leitura e escrita
setfacl -d -m g:devs:rwx pasta/          # -d: padrão herdado por novos arquivos
getfacl relatorio.txt                    # mostra a ACL (o '+' em ls -l indica ACL)
setfacl -x u:ana relatorio.txt           # remove a regra
setfacl -b relatorio.txt                 # remove todas
```

## Atributos especiais: chattr

```bash
sudo chattr +i arquivo         # imutável: nem root apaga/altera (até remover o atributo)
lsattr arquivo
sudo chattr -i arquivo
```

## Laboratórios

### Lab 1 — Usuários e grupos
1. Crie os usuários `ana`, `bruno` e `carla` e os grupos `dev`, `qa`, `ops`.
2. Ponha `ana` em `dev`, `bruno` em `qa`, `carla` em `ops` (use `usermod -aG`).
3. Prove: `id ana`, `getent group dev`.

### Lab 2 — Diretório de equipe com SGID
```bash
sudo mkdir -p /srv/projeto
sudo chgrp dev /srv/projeto
sudo chmod 2770 /srv/projeto
sudo -u ana touch /srv/projeto/ana.txt
ls -l /srv/projeto            # o arquivo herdou o grupo 'dev'
sudo -u bruno ls /srv/projeto # deve negar (bruno não é do grupo)
```

### Lab 3 — ACL e sticky
1. Dê leitura a `bruno` em `/srv/projeto` via `setfacl`.
2. Crie `/srv/publico` com sticky e confirme que um usuário não apaga arquivo de outro.
3. Liste todos os binários SUID do seu sistema.

### Lab 4 — Onboarding e offboarding de um dev

Cenário: chegou uma pessoa nova no time (`diana`) e semana que vem sai outra. Faça o ciclo completo, com senha forçada a trocar no primeiro login e desligamento sem apagar o histórico:

```bash
sudo groupadd -f dev
sudo useradd -m -s /bin/bash -G dev diana
sudo chage -d 0 diana                 # senha expira já: troca obrigatória no 1º login
sudo chage -l diana | head -3         # "Last password change: password must be changed"
id diana                              # confira o grupo dev

# offboarding: bloqueia sem apagar a home
sudo usermod -L -e 1 diana            # -L trava a senha, -e 1 expira a conta (1970-01-02)
sudo chage -l diana | grep 'Account expires'
sudo userdel -r diana                 # limpeza do lab
```

Raciocínio: em empresa real você raramente apaga na hora — bloqueia, espera o período de retenção/auditoria e só depois remove a home. O `-L` sozinho não impede login por chave SSH; o `-e 1` (conta expirada) impede.

### Lab 5 — Pasta de deploy para o servidor web

Cenário: o usuário `deploy` publica arquivos e o servidor web (`www-data`) só pode **ler**. Qualquer outra conta fica de fora:

```bash
sudo mkdir -p /srv/site
sudo useradd -r -s /usr/sbin/nologin deploy
sudo chown deploy:www-data /srv/site
sudo chmod 2750 /srv/site                       # SGID + dono rwx, grupo r-x, outros nada
sudo -u deploy touch /srv/site/index.html
ls -l /srv/site                                  # grupo www-data herdado pelo SGID
sudo -u www-data ls /srv/site                    # funciona: lista index.html
sudo -u nobody ls /srv/site                      # Permission denied
sudo rm -rf /srv/site && sudo userdel deploy     # limpeza do lab
```

Repare que `deploy` tem shell `nologin` (ninguém loga como ele) e mesmo assim o `sudo -u deploy` executa comandos — o `nologin` só impede *login*, não a troca de identidade por quem tem sudo.

### Lab 6 — Auditoria rápida de contas e permissões

Cenário: antes de entregar um servidor, você faz o checklist básico de higiene:

```bash
sudo awk -F: '$2=="" {print "SEM SENHA:", $1}' /etc/shadow      # contas com senha vazia (esperado: nada)
awk -F: '$3==0 {print "UID 0:", $1}' /etc/passwd                # só root deve aparecer
find /usr/bin -perm -4000 -type f 2>/dev/null | sort            # binários SUID conhecidos
sudo find / -xdev -type d -perm -0002 ! -perm -1000 2>/dev/null | head   # diretórios graváveis por todos SEM sticky
```

Esperado: a primeira consulta não imprime nada, a segunda só `UID 0: root`, a terceira lista programas como `passwd`, `sudo` e `su`, e a última deve vir vazia (ou só com itens que você reconhece). Qualquer surpresa vira item de investigação.

### Desafios

- **Desafio 1:** monte `/srv/projeto` onde `dev` escreve, `qa` só lê e `ops` não acessa — **sem** nenhuma permissão para "outros" (`o`).
- **Desafio 2:** permita que `ana` reinicie **somente** o nginx com `sudo`, sem senha, e prove que ela não consegue rodar outros comandos como root.
- **Desafio 3:** explique por que o `passwd` precisa de SUID e o que aconteceria sem ele.
- **Desafio 4:** crie o arquivo `/etc/sudoers.d/ops-lab` permitindo que o grupo `ops` rode, como root e sem senha, apenas `systemctl status *` e `journalctl` — **sem** permitir `restart`. Valide a sintaxe antes de confiar nele.
  **Verifique:** `sudo visudo -cf /etc/sudoers.d/ops-lab` deve imprimir `/etc/sudoers.d/ops-lab: parsed OK`. (Limpeza: `sudo rm /etc/sudoers.d/ops-lab`.)

**Limpeza:** `sudo userdel -r ana bruno carla; sudo groupdel dev qa ops; sudo rm -rf /srv/projeto /srv/publico`.

### Desafio avançado — Porta 80 sem root e sem SUID
**Nível:** avançado — leva de 1 a 3 horas

- **Cenário:** o time quer servir uma página interna na porta 80, mas a política proíbe rodar o servidor como root e proíbe qualquer binário SUID novo no sistema. O Linux divide o poder do root em pedaços; você vai entregar o servidor com **exatamente o pedaço que ele precisa** e nenhum outro, e provar isso.
- **Requisitos:**
  1. Usuário de sistema `webapp`, sem shell de login, sem home interativo e fora de qualquer grupo privilegiado (`sudo`, `adm`).
  2. Um `python3 -m http.server 80` servindo `/srv/web-lab` (dono `root`, somente leitura para o `webapp`) roda como `webapp` e responde `200` em `localhost:80`.
  3. O processo tem como **única** capability efetiva a que permite abrir portas abaixo de 1024, comprovada em `/proc/<pid>/status` e decodificada para o nome.
  4. O `/usr/bin/python3` original **não** é alterado e continua falhando ao abrir a porta 80 como `webapp`; nenhum arquivo novo tem SUID ou SGID.
  5. Uma auditoria em um comando mostra que, nos diretórios do sistema que você escolher varrer, só o seu binário tem `cap_net_bind_service`.
  6. Remover o privilégio faz o servidor voltar a falhar com erro claro (`Permission denied`).
- **Restrições:** não use `sysctl net.ipv4.ip_unprivileged_port_start`, redirecionamento de porta (`iptables`/`nftables`) nem rode o servidor via `sudo` como root; não use SUID.
- **Onde pesquisar:** `man 7 capabilities`, `setcap`/`getcap`/`capsh --decode` (pacote `libcap2-bin`), `CapEff` em `/proc/<pid>/status`.
- **Verifique:**
  ```bash
  sudo getcap -r /opt /usr /srv 2>/dev/null | grep -c net_bind_service         # 1
  find /opt /srv -perm /6000 2>/dev/null | wc -l                               # 0
  sudo -u webapp /usr/bin/python3 -m http.server 80 --directory /srv/web-lab   # PermissionError, nunca sobe
  # suba o servidor como webapp usando o seu binário e, em outro terminal:
  curl -s -o /dev/null -w '%{http_code}\n' http://localhost:80/                # 200
  pid=$(pgrep -n -u webapp -f 'http.server 80'); ps -o user= -p "$pid"         # webapp
  grep CapEff /proc/$pid/status                                                # CapEff: 0000000000000400
  capsh --decode=0000000000000400                                              # ...=cap_net_bind_service
  id webapp | grep -Ec 'sudo|adm'                                              # 0
  # falha esperada: retire a capability e tente subir de novo
  sudo setcap -r <seu-binario>; sudo -u webapp <seu-binario> -m http.server 80 --directory /srv/web-lab   # Permission denied
  ```

## Erros comuns nesta fase

- `usermod -G` sem `-a`, removendo grupos.
- `chmod 777` como solução de tudo.
- Esquecer o `x` em diretórios.
- Editar `sudoers` sem `visudo`.
- Esperar que a mudança de grupo valha na sessão atual (precisa novo login: `newgrp` ou relogar).
- Dar `NOPASSWD: ALL` por comodidade.
- Achar que `useradd -m` pede senha (ele não define nenhuma; a conta fica travada até o `passwd`).
- Confundir bloquear a senha (`usermod -L`) com expirar a conta (`-e`): chave SSH continua entrando no primeiro caso.
- Gravar relatórios com nomes de contas e SUID em arquivo legível por todos (esquecer o `chmod 600`).

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 00 — `sudo` e primeiro usuário | É o usuário que você agora entende como UID 1000 em `sudo`/grupo `sudo` |
| Módulo 01 — `/etc` e "tudo é arquivo" | `passwd`, `shadow`, `group` e `sudoers.d` são só arquivos de texto em `/etc` |
| Módulo 02 — pipes, `$?`, here-doc, `tee` | Montam consultas como `cut -d: -f1,3,7 /etc/passwd` e gravam `sudoers.d` com `sudo tee` |
| Módulo 03 — `ls -l`, `stat`, `find`, `chmod -R` | `find -perm` audita SUID; `ls -li` e `stat` mostram dono e modo |
| Módulo 04 — `awk -F:`, `sort`, `grep` | Filtram `/etc/passwd`, `/etc/group` e `/etc/shadow` em segundos |

### Lab integrador — Relatório de auditoria de contas

Combine `awk` e `cut` (04), `find` (03), redirecionamento em bloco (02) e permissões (05) para produzir um relatório que só você consegue ler:

```bash
cd ~/lab
{
  echo "== Contas com shell de login =="
  awk -F: '$7 !~ /(nologin|false)$/ {print $1, "uid=" $3, $7}' /etc/passwd
  echo
  echo "== Grupos com membros (qtde nome) =="
  awk -F: '$4 != "" {n = split($4, m, ","); print n, $1}' /etc/group | sort -rn | head -3
  echo
  echo "== SUID em /usr/bin =="
  find /usr/bin -perm -4000 -type f 2>/dev/null | sort
} > auditoria-contas.txt
chmod 600 auditoria-contas.txt
ls -l auditoria-contas.txt
wc -l auditoria-contas.txt
```

Esperado: `-rw-------` no `ls -l` (só você lê, pois o relatório lista contas do sistema), `root` e o seu usuário entre as contas com login, e uma lista de binários SUID. Dica extra: se o arquivo ficasse em `~/lab` com o Git do módulo 00, você deve adicioná-lo ao `.gitignore` antes de commitar.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| UID/GID de processos | Processos — Módulo 06 |
| Permissões de arquivos de serviço | Servidores — Módulo 17 |
| `sudo`, menor privilégio | Hardening — Módulo 10 |
| ACLs, SGID em diretórios compartilhados | NFS/Samba — Módulo 17 |
| Usuário não-root em containers | Docker — Módulo 20 |

## `[REFERÊNCIA]`

- `man7.org` — `credentials(7)`: https://man7.org/linux/man-pages/man7/credentials.7.html
- `man chmod`, `man 5 sudoers`, `man setfacl`: https://man7.org/linux/man-pages/
- sudo — documentação oficial: https://www.sudo.ws/docs/
- Debian Reference — gerência de contas: https://www.debian.org/doc/manuals/debian-reference/ch04.en.html
- Red Hat — *Managing users and groups*: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_basic_system_settings/managing-users-and-groups
- LPI — objetivos 107.1 e 104.5: https://www.lpi.org/our-certifications/exam-102-objectives/

**Como aprofundar:** `man 7 capabilities` (dividir o poder do root em pedaços) e o CIS Benchmark do Ubuntu sobre contas e permissões.

## Checklist de saída

- [ ] Explicar UID, GID, root e usuários de sistema.
- [ ] Ler o `/etc/passwd`, `/etc/shadow` e `/etc/group`.
- [ ] Criar usuários e grupos e usar `usermod -aG` corretamente.
- [ ] Usar `sudo` e `visudo` seguindo o menor privilégio.
- [ ] Ler `rwxr-xr--` e converter para octal e vice-versa.
- [ ] Explicar o que r, w e x significam em arquivos **e** em diretórios.
- [ ] Explicar umask e calcular o modo resultante.
- [ ] Distinguir SUID, SGID e sticky bit com exemplos.
- [ ] Usar ACLs (`setfacl`/`getfacl`) e `chattr +i`.
