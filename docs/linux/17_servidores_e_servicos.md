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

## DNS: dnsmasq e BIND (conceito)

Um servidor DNS responde "qual o IP deste nome?". Para laboratório e redes pequenas, **dnsmasq** é leve (DNS + DHCP); em redes grandes, **BIND9** (`named`).

```bash
sudo apt install -y dnsmasq
echo "address=/intranet.lab/10.10.10.10" | sudo tee /etc/dnsmasq.d/lab.conf
sudo systemctl restart dnsmasq
dig @127.0.0.1 intranet.lab +short            # 10.10.10.10
```

Conceitos para a prova: **zona**, **registros** (A, AAAA, CNAME, MX, NS, TXT, PTR), **servidor autoritativo** x **recursivo/cache**, TTL.

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

### Desafios

- **Desafio 1:** a stack completa "site + API + banco" funcionando e **sobrevivendo a `kill -9` da API** (graças ao `Restart=`) e a um `reboot` da distro (`enable`).
- **Desafio 2:** configure o Nginx com `upstream` de **duas** instâncias da API e prove o balanceamento olhando os logs de acesso.
- **Desafio 3:** escreva um script que verifica a validade dos certificados (`openssl x509 -enddate`) e avisa se faltar menos de 30 dias.

## Erros comuns nesta fase

- Recarregar o Nginx sem `nginx -t`.
- Esquecer de liberar a porta no firewall (e no Security Group, em nuvem).
- Banco escutando em todas as interfaces sem restrição.
- Backup nunca testado.
- Chave privada com permissão aberta ou versionada.
- Esquecer o `enable` e perder o serviço no reboot.

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
