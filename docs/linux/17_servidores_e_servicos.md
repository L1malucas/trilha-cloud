---
id: "17_servidores_e_servicos"
title: "Módulo 17 — Servidores e Serviços"
sidebar_label: "17 · Servidores e Serviços"
sidebar_position: 17
---

# Módulo 17 — Servidores e Serviços

> **Objetivo**: colocar serviços reais no ar — Nginx (web e proxy reverso), TLS com `openssl`, DNS com dnsmasq/BIND, compartilhamento NFS/Samba, e banco de dados (PostgreSQL) com backup — e subir a stack "site + API + banco" gerenciada pelo systemd.
>
> **Pré-requisitos**: módulos 05, 06, 09 e 10.
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre os tópicos de serviços de rede dos **LPIC-1/Linux+** (HTTP, DNS, NFS/Samba, e-mail básico) e a base de infra que o AZ-104/ACE assumem. Documentação: https://nginx.org/en/docs/

---

## Um servidor é um serviço escutando numa porta

"Servidor" quase sempre significa: **um processo (daemon) escutando numa porta TCP/UDP**, respondendo a clientes. Para colocar um serviço no ar, o roteiro é sempre o mesmo, e você já domina cada peça:

1. **Instalar** o pacote (Módulo 07).
2. **Configurar** o arquivo em `/etc` (Módulo 03/04).
3. **Habilitar e iniciar** no systemd (Módulo 06).
4. **Liberar a porta** no firewall (Módulo 10).
5. **Testar** com `curl`/`ss` e **olhar o log** (Módulos 09 e 12).

> `[TEORIA]` Decore esse roteiro de 5 passos: ele serve para Nginx, PostgreSQL, Samba ou qualquer outro serviço. Mudam só o pacote e o arquivo de configuração.

## Nginx: servidor web e proxy reverso

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
curl -I http://localhost                      # 200 OK
ls /etc/nginx/ /etc/nginx/sites-available /var/www/html
sudo nginx -t                                 # SEMPRE teste antes de recarregar
sudo systemctl reload nginx
```

### Um site estático (virtual host)

```bash
sudo mkdir -p /var/www/meusite && echo "<h1>Meu site no Nginx</h1>" | sudo tee /var/www/meusite/index.html

sudo tee /etc/nginx/sites-available/meusite >/dev/null <<'EOF'
server {
    listen 80;
    server_name meusite.lab;
    root /var/www/meusite;
    index index.html;
    access_log /var/log/nginx/meusite.access.log;
}
EOF
sudo ln -s /etc/nginx/sites-available/meusite /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
echo "127.0.0.1 meusite.lab" | sudo tee -a /etc/hosts
curl http://meusite.lab
```

Cada `server { }` é um **virtual host**: o Nginx escolhe qual atende pelo cabeçalho `Host`. `sites-available` guarda configurações; `sites-enabled` tem links para as ativas.

> `[TENTE VOCÊ]` Como o Nginx escolhe o virtual host? Raciocínio: ele compara o cabeçalho `Host` da requisição com os `server_name`; o IP e a porta são iguais para todos. Então dá para testar sem mexer no `/etc/hosts`: rode `curl -s -H "Host: meusite.lab" http://127.0.0.1` e depois `curl -sI http://127.0.0.1 | head -1`. Resposta: o primeiro devolve `<h1>Meu site no Nginx</h1>` (casou com o `server_name`); o segundo responde `HTTP/1.1 200 OK` com a página padrão do Nginx, porque sem `Host` conhecido a requisição cai no servidor *default*.

> `[ATENÇÃO]` Se o seu site novo "não aparece" e você vê a página de boas-vindas do Nginx, o suspeito número um é o `sites-enabled/default` capturando a requisição (ou um `server_name` com erro de digitação). Confira com `sudo nginx -T | grep -E "server_name|listen"`, que despeja a configuração **efetiva** já carregada.

### Proxy reverso: o porteiro na frente da aplicação

Um **proxy reverso** recebe as requisições e as encaminha para uma aplicação interna. É a peça mais usada em produção: termina TLS, faz balanceamento, cache e protege a aplicação.

```bash
# Suba uma "API" fake na 5000
mkdir -p ~/lab/api && cd ~/lab/api && echo '{"status":"ok"}' > health.json
python3 -m http.server 5000 &

sudo tee /etc/nginx/sites-available/api >/dev/null <<'EOF'
upstream backend {
    server 127.0.0.1:5000;
}
server {
    listen 80;
    server_name api.lab;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
echo "127.0.0.1 api.lab" | sudo tee -a /etc/hosts
curl http://api.lab/health.json
```

Acrescente mais linhas `server` no `upstream` para **balancear** entre várias instâncias.

> `[ATENÇÃO]` Em proxy reverso, a aplicação enxerga o IP do **Nginx**, e não o do cliente. Por isso se repassam `X-Real-IP`/`X-Forwarded-For`, e a aplicação precisa ser configurada para confiar neles.

> `[TENTE VOCÊ]` O proxy reverso passa o erro da aplicação ou inventa o seu? Raciocínio: com a API de pé, um caminho inexistente é problema do cliente (4xx) e vem da aplicação; com a API fora, o Nginx não tem a quem perguntar, e o erro é dele (5xx). Rode `curl -s -o /dev/null -w "%{http_code}\n" http://api.lab/inexistente`, depois `pkill -f "http.server 5000"` e repita o `curl`. Resposta: primeiro `404` (veio do Python), depois `502` (Bad Gateway: o Nginx funciona, o *upstream* não). Em produção, **502 = olhe a aplicação, não o Nginx**.

## TLS/HTTPS com openssl

**TLS** criptografa a conexão e prova a identidade do servidor por um **certificado**, assinado por uma Autoridade Certificadora (CA). Para estudo, geramos um certificado **autoassinado**:

```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/meusite.key -out /etc/nginx/ssl/meusite.crt \
  -subj "/CN=meusite.lab"
openssl x509 -in /etc/nginx/ssl/meusite.crt -noout -subject -dates     # inspeciona

sudo tee /etc/nginx/sites-available/meusite >/dev/null <<'EOF'
server {
    listen 443 ssl;
    server_name meusite.lab;
    ssl_certificate     /etc/nginx/ssl/meusite.crt;
    ssl_certificate_key /etc/nginx/ssl/meusite.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    root /var/www/meusite;
}
server { listen 80; server_name meusite.lab; return 301 https://$host$request_uri; }
EOF
sudo nginx -t && sudo systemctl reload nginx
curl -k https://meusite.lab                    # -k aceita o certificado autoassinado
openssl s_client -connect meusite.lab:443 -servername meusite.lab </dev/null | head -20
```

Em produção, use **Let's Encrypt** (`certbot`, gratuito e automático) em vez de autoassinado: https://letsencrypt.org/getting-started/

> `[ATENÇÃO]` A **chave privada** (`.key`) deve ter permissão `600` e nunca ser versionada. Certificado **expirado** derruba serviços em produção silenciosamente: monitore a validade (`openssl x509 -enddate`).

> `[TENTE VOCÊ]` Quando o certificado vence? Raciocínio: `-checkend N` pergunta ao `openssl` se o certificado ainda estará válido daqui a N segundos, e a resposta vem no texto e no código de saída (ótimo para scripts de monitoramento). Rode `openssl x509 -in /etc/nginx/ssl/meusite.crt -noout -checkend $((30*86400)); echo $?`. Resposta: `Certificate will not expire` e `0` (o seu vale 365 dias). Troque por `$((400*86400))` e verá `Certificate will expire` e `1`.

## DNS: dnsmasq e BIND (conceito)

Um servidor DNS responde "qual o IP deste nome?". Para laboratório e redes pequenas, **dnsmasq** é leve (DNS + DHCP); em redes grandes, **BIND9** (`named`).

```bash
sudo apt install -y dnsmasq
echo "address=/intranet.lab/10.10.10.10" | sudo tee /etc/dnsmasq.d/lab.conf
sudo systemctl restart dnsmasq
dig @127.0.0.1 intranet.lab +short            # 10.10.10.10
```

Conceitos para a prova: **zona**, **registros** (A, AAAA, CNAME, MX, NS, TXT, PTR), **servidor autoritativo** x **recursivo/cache**, TTL.

> `[TENTE VOCÊ]` O `address=/intranet.lab/...` vale só para o nome exato? Raciocínio: no dnsmasq essa diretiva cobre o domínio **e todos os subdomínios**, o que é prático para um laboratório. Rode `dig @127.0.0.1 qualquer.coisa.intranet.lab +short` e `dig @127.0.0.1 outrodominio.lab +short`. Resposta: o primeiro devolve `10.10.10.10`; o segundo vem vazio (ou é encaminhado ao DNS upstream), porque não casa com a regra.

## NFS e Samba: compartilhar arquivos

- **NFS**: compartilhamento nativo Unix/Linux.
- **Samba**: protocolo SMB/CIFS, interoperável com Windows.

```bash
# NFS (servidor)
sudo apt install -y nfs-kernel-server
sudo mkdir -p /srv/nfs/dados && sudo chown nobody:nogroup /srv/nfs/dados
echo "/srv/nfs/dados 127.0.0.1(rw,sync,no_subtree_check)" | sudo tee -a /etc/exports
sudo exportfs -ra && sudo exportfs -v
# NFS (cliente)
sudo apt install -y nfs-common
sudo mkdir -p /mnt/nfs && sudo mount -t nfs 127.0.0.1:/srv/nfs/dados /mnt/nfs
df -hT | grep nfs

# Samba (resumo)
sudo apt install -y samba
sudo tee -a /etc/samba/smb.conf <<'EOF'
[compartilhado]
   path = /srv/samba
   read only = no
   valid users = @smbusers
EOF
sudo testparm -s
```

> `[WSL]` NFS server no kernel do WSL pode não funcionar. Se `exportfs` falhar, pratique o NFS entre duas VMs/containers e estude o conceito; o resto (Samba, Nginx, DNS) roda normalmente.

## E-mail (visão geral)

O e-mail combina: **MTA** (envia/recebe: Postfix), **MDA** (entrega na caixa: Dovecot/procmail) e protocolos **SMTP** (envio), **IMAP/POP3** (leitura). Domínios dependem de registros **MX**, **SPF**, **DKIM** e **DMARC** no DNS. Para a prova, conheça os papéis; implantar um servidor de e-mail do zero é raramente recomendado hoje (usa-se serviço gerenciado).

## PostgreSQL: o banco de dados

```bash
sudo apt install -y postgresql
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "SELECT version();"

sudo -u postgres psql <<'EOF'
CREATE USER app WITH PASSWORD 'troque-esta-senha';
CREATE DATABASE catalogo OWNER app;
\c catalogo
CREATE TABLE produtos (id serial PRIMARY KEY, nome text NOT NULL, preco numeric(10,2));
INSERT INTO produtos (nome, preco) VALUES ('Camiseta', 59.90), ('Caneca', 29.90);
SELECT * FROM produtos;
EOF

PGPASSWORD='troque-esta-senha' psql -h localhost -U app -d catalogo -c "SELECT count(*) FROM produtos;"
```

Backup e restauração:

```bash
sudo -u postgres pg_dump catalogo > ~/lab/catalogo.sql           # dump lógico
sudo -u postgres createdb catalogo_copia
sudo -u postgres psql catalogo_copia < ~/lab/catalogo.sql        # restaura
sudo -u postgres psql -d catalogo_copia -c "SELECT count(*) FROM produtos;"
```

Configuração: `/etc/postgresql/<versão>/main/postgresql.conf` (escutar em outra interface: `listen_addresses`) e `pg_hba.conf` (**quem** pode conectar e como). **Um backup que nunca foi restaurado não é um backup**: teste a restauração.

> `[ATENÇÃO]` Nunca coloque senhas em linha de comando ou scripts versionados; use `~/.pgpass`, variáveis de ambiente ou um cofre de segredos (Módulo 25). E não exponha o banco em `0.0.0.0` sem firewall e `pg_hba.conf` restritivo.

> `[TENTE VOCÊ]` Quanto custa o catálogo todo? Raciocínio: em vez de baixar as linhas e somar no shell, deixe o banco agregar. Rode `sudo -u postgres psql -d catalogo -c "SELECT sum(preco) FROM produtos;"`. Resposta: uma tabela de uma linha com `89.80` (59,90 da Camiseta + 29,90 da Caneca). O mesmo princípio dos pipes do Módulo 04: processe perto de onde o dado mora.

![Navegador/terminal exibindo a resposta do Nginx servindo o site via HTTPS e o proxy reverso para a API](screenshots/17-servidores-e-servicos/01-nginx-https-proxy.png)
> `[PRINT]` Passo a passo para capturar: rodar `curl -k https://meusite.lab` e `curl http://api.lab/health.json`. Capturar as duas respostas.

## Projeto: stack "site + API + banco" gerenciada pelo systemd

Monte, no mesmo host, os três componentes ligados e sob o systemd:

1. **Banco**: PostgreSQL com o banco `catalogo` (acima).
2. **API**: um serviço Python simples (`systemd`, `Restart=on-failure`) que lê produtos do banco e serve JSON na porta 5000.
3. **Site/Proxy**: Nginx servindo o estático em `/` e fazendo proxy de `/api/` para a API.

Esse é o modelo que o **TrilhaShop** assume nas trilhas de nuvem (VNet → app → banco): aqui você o constrói à mão para entender cada camada.

## Laboratórios

### Lab 1 — Nginx
Virtual host estático + proxy reverso para uma API local + redirecionamento HTTP→HTTPS com certificado autoassinado.

### Lab 2 — DNS local
Resolva `*.lab` com dnsmasq e teste com `dig @127.0.0.1`.

### Lab 3 — PostgreSQL
Crie usuário, banco e tabela; faça `pg_dump`, destrua o banco e **restaure**, provando o conteúdo.

### Lab 4 — Compartilhamento
Exporte um diretório por NFS (ou Samba) e monte-o noutro ponto, gravando um arquivo pelo ponto montado.

### Lab 5 — Lendo o access log do Nginx
Cenário: o time de produto jura que "ninguém acessa `/nao-existe`", e você vai provar com o log. Com a API do `api.lab` de pé (se a matou no teste do `502`, suba-a de novo: `cd ~/lab/api && python3 -m http.server 5000 &`):
```bash
for i in $(seq 1 20); do curl -s -o /dev/null http://api.lab/health.json; done
for i in 1 2 3; do curl -s -o /dev/null http://api.lab/nao-existe; done
sudo awk '$7 ~ /nao-existe/ {print $9}' /var/log/nginx/access.log | sort | uniq -c       # 3 404
sudo awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -3    # ranking de status
```
O formato padrão do Nginx tem o mesmo desenho do `access.log` do laboratório (campo 7 = caminho, campo 9 = status), então os `awk` do Módulo 04 funcionam sem mudança. Se rodar duas vezes, a contagem acumula.

### Lab 6 — Backup do PostgreSQL com rotação e teste de restauração
Cenário: backup que ninguém testou é uma aposta. Escreva um script que gera, valida e rotaciona, e depois teste a restauração.
```bash
cat > ~/lab/scripts/backup-pg.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
DEST="$HOME/lab/backups"; mkdir -p "$DEST"
ARQ="$DEST/catalogo-$(date +%F-%H%M%S).sql.gz"
sudo -u postgres pg_dump catalogo | gzip > "$ARQ"
gzip -t "$ARQ"                                                    # arquivo íntegro?
find "$DEST" -name 'catalogo-*.sql.gz' -mtime +7 -delete         # mantém 7 dias
echo "backup ok: $ARQ"
EOF
chmod +x ~/lab/scripts/backup-pg.sh && ~/lab/scripts/backup-pg.sh
sudo -u postgres createdb teste_restore
zcat "$(ls -t ~/lab/backups/*.sql.gz | head -1)" | sudo -u postgres psql -q teste_restore
sudo -u postgres psql -d teste_restore -tc "SELECT count(*) FROM produtos;"      # 2
sudo -u postgres dropdb teste_restore
```
Para agendar, use o `cron` ou um *timer* do systemd (Módulo 11).

### Lab 7 — Painel de saúde da stack
Cenário: antes de dizer "está tudo no ar", confira serviços **e** portas, porque um serviço `active` pode não estar escutando.
```bash
for s in nginx postgresql dnsmasq; do printf '%-12s %s\n' "$s" "$(systemctl is-active $s)"; done
for p in 80 443 5432 53; do ss -tln | grep -q ":$p " && echo "porta $p: escutando" || echo "porta $p: FECHADA"; done
```
Resposta esperada: `active` para os instalados e `escutando` para as portas ativas. Um serviço que você não instalou aparece como `inactive`, e `FECHADA` para a porta dele é o resultado correto.

### Desafios

- **Desafio 1:** a stack completa "site + API + banco" funcionando e **sobrevivendo a `kill -9` da API** (graças ao `Restart=`) e a um `reboot` da distro (`enable`).
- **Desafio 2:** configure o Nginx com `upstream` de **duas** instâncias da API e prove o balanceamento olhando os logs de acesso.
- **Desafio 3:** escreva um script que verifica a validade dos certificados (`openssl x509 -enddate`) e avisa se faltar menos de 30 dias.
- **Desafio 4:** no banco `catalogo`, crie o usuário `leitor`, que só consegue **ler** a tabela `produtos` (nada de `INSERT`, `UPDATE` ou `DELETE`), e conecte-se como ele por TCP. Pense em `GRANT` e em quais privilégios o usuário precisa (conectar no banco, ver o schema, ler a tabela). **Verifique:** `PGPASSWORD='senha-do-leitor' psql -h localhost -U leitor -d catalogo -c "SELECT count(*) FROM produtos;"` imprime a contagem (`2`), e o mesmo comando com `-c "INSERT INTO produtos (nome) VALUES ('x');"` imprime `ERROR:  permission denied for table produtos`.

### Desafio avançado — Voltar no tempo no PostgreSQL

**Nível:** avançado — leva de 1 a 3 horas

- **Cenário:** às 14h07 alguém rodou `DROP TABLE produtos` no banco `catalogo` em produção. O `pg_dump` noturno (Lab 6) perde quase um dia de pedidos, e o negócio quer tudo até o segundo anterior ao `DROP`. Você vai preparar o cluster para isso, simular o acidente e recuperar **sem tocar no cluster original**, subindo a cópia restaurada numa porta separada.
- **Requisitos:**
  1. O cluster principal passa a **arquivar WAL** continuamente para um diretório que só o usuário `postgres` lê e escreve.
  2. Você faz um *base backup* físico do cluster em funcionamento (sem parar o serviço).
  3. Depois do backup, insira mais duas linhas em `produtos`, force o arquivamento do segmento atual de WAL, marque o ponto exato antes do desastre **com um nome** (e não por horário) e só então apague a tabela.
  4. Crie um segundo cluster (`pitr`, porta `5433`) a partir do base backup, configurado para recuperar o WAL arquivado **até o ponto nomeado** e depois abrir para escrita.
  5. No `pitr`, `produtos` existe com as 4 linhas (2 originais e 2 posteriores ao backup); no cluster original, a tabela continua apagada (a restauração não mexeu nele).
  6. Todo o processo de restauração vira um script `restaura-pitr.sh`, que pode ser executado de novo (recria o `pitr` do zero) sem quebrar.
- **Restrições:** sem `pg_dump`, sem instalar extensões ou ferramentas como pgBackRest/Barman, e sem alterar o `pg_hba.conf` do cluster principal.
- **Onde pesquisar:** documentação do PostgreSQL, capítulo *Continuous Archiving and Point-in-Time Recovery (PITR)*; `man pg_basebackup`; `man pg_createcluster` (pacote `postgresql-common`, e `pg_lsclusters`); funções `pg_create_restore_point` e `pg_switch_wal`.
- **Verifique:**

```bash
sudo -u postgres psql -tc "SHOW archive_mode;"                         # on
sudo ls /var/backups/pg-wal | wc -l                                    # > 0 (ou o diretório que você escolheu)
pg_lsclusters                                                          # main (5432) e pitr (5433), ambos online
sudo -u postgres psql -p 5433 -d catalogo -tc "SELECT count(*) FROM produtos;"      # 4
sudo -u postgres psql -p 5433 -tc "SELECT pg_is_in_recovery();"        # f (já abriu para escrita)
sudo -u postgres psql -p 5432 -d catalogo -tc "SELECT to_regclass('produtos');"     # vazio (continua apagada)
```

  Teste de borda: rode o `restaura-pitr.sh` de novo, com o nome do ponto trocado por um inexistente. O cluster `pitr` **não** deve abrir (`pg_lsclusters` mostra `down`, e o log em `/var/log/postgresql/` explica que o recovery terminou antes de alcançar o alvo); com o nome certo de volta, o script termina com `produtos` de novo com 4 linhas.

## Erros comuns nesta fase

- Recarregar o Nginx sem `nginx -t`.
- Esquecer de liberar a porta no firewall (e no Security Group, em nuvem).
- Banco escutando em todas as interfaces sem restrição.
- Backup nunca testado.
- Chave privada com permissão aberta ou versionada.
- Esquecer o `enable` e perder o serviço no reboot.
- Subir a "API" com `&` ou `nohup` e achar que é um serviço: sem systemd não há `Restart=`, nem log no journal, nem início no boot.
- Testar o Nginx só por `127.0.0.1` e esquecer que o site de verdade é escolhido pelo cabeçalho `Host` (e, em HTTPS, pelo SNI).
- Ler `502 Bad Gateway` como defeito do Nginx, quando quase sempre é o *upstream* fora do ar ou na porta errada.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 04 — `awk`, `sort`, `uniq` | Ler o `access.log` do Nginx e contar status |
| Módulo 05 — permissões e donos | Chave TLS `600`, diretório do NFS, usuário `User=` do serviço |
| Módulo 06 — systemd | Unidades, `enable --now`, `Restart=`, `reset-failed` |
| Módulo 07 — `apt` | O passo 1 do roteiro de 5 passos para todo serviço |
| Módulo 09 — `ss`, `curl`, `dig`, `/etc/hosts` | Testar porta, nome e resposta de cada serviço |
| Módulo 10 — firewall | O passo 4: liberar só a porta necessária (e em nuvem, o NSG/Security Group) |
| Módulo 12 — `journalctl` e logs | Primeiro lugar para olhar quando o serviço não sobe |

### Lab 8 — A API como serviço do systemd atrás do Nginx (integrador)
Cenário: no Módulo 17 você subiu a "API" com `&`, que morre ao fechar o terminal. Transforme-a em serviço de verdade e prove que sobrevive a `kill -9`. Reaproveita o `api.lab` e a pasta `~/lab/api` (recrie `health.json` se faltar).
```bash
pkill -f "http.server 5000" || true                      # libera a porta
mkdir -p ~/lab/api && echo '{"status":"ok"}' > ~/lab/api/health.json
sudo tee /etc/systemd/system/api-lab.service >/dev/null <<EOF
[Unit]
Description=API de laboratorio (python http.server)
After=network.target
[Service]
User=$USER
WorkingDirectory=$HOME/lab/api
ExecStart=/usr/bin/python3 -m http.server 5000 --bind 127.0.0.1
Restart=on-failure
RestartSec=1
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now api-lab
curl -s http://api.lab/health.json                                      # {"status":"ok"} via Nginx
sudo kill -9 "$(systemctl show -p MainPID --value api-lab)"; sleep 2
curl -s http://api.lab/health.json                                      # voltou sozinha
systemctl show api-lab -p NRestarts                                     # NRestarts=1
journalctl -u api-lab --no-pager | grep -E "killed|Scheduled restart" | tail -2
sudo ufw status                                                         # passo 4 do roteiro: firewall
```
Aqui se encontram `apt`/`systemctl` (06/07), `ss`/`curl`/`/etc/hosts` (09), firewall (10), `journalctl` (12) e o Nginx deste módulo: os cinco passos do roteiro, completos.
> `[WSL]` No WSL o `ufw` costuma estar `inactive` (o firewall real é o do Windows); a ideia do passo é decidir conscientemente, e não pular.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Proxy reverso e LB | Redes — Módulo 18; Ingress — Módulo 23 |
| Nginx, Postgres em container | Docker/Compose — Módulo 20 |
| Serviços via systemd | Ansible (roles de serviço) — Módulo 21 |
| TLS e certificados | Redes — Módulo 18; segurança — Módulo 25 |
| Stack site+API+banco | Projeto final — Módulo 27; TrilhaShop em Azure/GCP |

## `[REFERÊNCIA]`

- Nginx — documentação: https://nginx.org/en/docs/
- Mozilla — *SSL Configuration Generator*: https://ssl-config.mozilla.org/
- Let's Encrypt / Certbot: https://letsencrypt.org/docs/ · https://certbot.eff.org/
- PostgreSQL — documentação: https://www.postgresql.org/docs/
- dnsmasq: https://thekelleys.org.uk/dnsmasq/doc.html · BIND9: https://bind9.readthedocs.io/
- Samba: https://wiki.samba.org/ · NFS: https://man7.org/linux/man-pages/man5/exports.5.html
- Apache HTTP Server: https://httpd.apache.org/docs/
- LPI — objetivos 108/109/110: https://www.lpi.org/our-certifications/exam-102-objectives/

**Como aprofundar:** estude `HAProxy` (balanceamento L4/L7), `Apache` (para a prova) e `PgBouncer`/replicação do PostgreSQL.

## Checklist de saída

- [ ] Aplicar o roteiro de 5 passos (instalar, configurar, habilitar, firewall, testar).
- [ ] Configurar virtual hosts e proxy reverso no Nginx e testar com `nginx -t`.
- [ ] Gerar e inspecionar um certificado com `openssl` e servir HTTPS.
- [ ] Explicar zona, registros DNS e servidor autoritativo x recursivo.
- [ ] Compartilhar arquivos por NFS ou Samba.
- [ ] Criar banco, usuário e tabela no PostgreSQL e **restaurar** um backup.
- [ ] Ter montado a stack site + API + banco sob o systemd.
