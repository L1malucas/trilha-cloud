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

### umask: as permissões padrão

Quando você cria um arquivo, o sistema parte de `666` (arquivos) ou `777` (diretórios) e **subtrai** a **umask**. Com `umask 022` (padrão comum), arquivos nascem `644` e diretórios `755`.

```bash
umask                  # 0022
umask 077              # novos arquivos só para você (600), diretórios 700
touch a && mkdir d && ls -ld a d
```

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

### Desafios

- **Desafio 1:** monte `/srv/projeto` onde `dev` escreve, `qa` só lê e `ops` não acessa — **sem** nenhuma permissão para "outros" (`o`).
- **Desafio 2:** permita que `ana` reinicie **somente** o nginx com `sudo`, sem senha, e prove que ela não consegue rodar outros comandos como root.
- **Desafio 3:** explique por que o `passwd` precisa de SUID e o que aconteceria sem ele.

**Limpeza:** `sudo userdel -r ana bruno carla; sudo groupdel dev qa ops; sudo rm -rf /srv/projeto /srv/publico`.

## Erros comuns nesta fase

- `usermod -G` sem `-a`, removendo grupos.
- `chmod 777` como solução de tudo.
- Esquecer o `x` em diretórios.
- Editar `sudoers` sem `visudo`.
- Esperar que a mudança de grupo valha na sessão atual (precisa novo login: `newgrp` ou relogar).
- Dar `NOPASSWD: ALL` por comodidade.

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
