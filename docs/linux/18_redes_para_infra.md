---
id: "18_redes_para_infra"
title: "Módulo 18 — Redes para Infra"
sidebar_label: "18 · Redes para Infra"
sidebar_position: 18
---

# Módulo 18 — Redes para Infra

> **Objetivo**: consolidar a teoria de redes que todo profissional de infraestrutura precisa — OSI/TCP-IP, sub-redes (CIDR), DNS, DHCP, HTTP/HTTPS, TLS e certificados, NAT, VLAN, roteamento, VPN, proxy reverso e balanceadores — e praticar com ferramentas e *network namespaces*.
>
> **Pré-requisitos**: módulos 09 (redes no Linux), 10 e 17.
>
> **Tempo de referência (não prazo)**: duas a três semanas.
>
> Alinha-se a **CompTIA Network+** e **CCNA** (introdução) e é a base de VNet (Azure), VPC (GCP) e Kubernetes. Material gratuito: https://www.cloudflare.com/learning/

---

## O que torna redes difícil (e como organizar)

Redes envolvem muitos protocolos empilhados, e a confusão nasce de misturá-los. O truque é pensar em **camadas**: cada uma só conversa com a de cima e a de baixo, e resolve um problema só.

### Modelo OSI x TCP/IP

| # | OSI | TCP/IP | O que faz | Exemplos | PDU |
|---|---|---|---|---|---|
| 7 | Aplicação | Aplicação | Protocolos que o usuário usa | HTTP, DNS, SSH, SMTP | Dados |
| 6 | Apresentação | | Formato/criptografia | TLS | |
| 5 | Sessão | | Controle de sessão | | |
| 4 | Transporte | Transporte | Entrega fim a fim, portas | **TCP**, **UDP** | Segmento |
| 3 | Rede | Internet | Endereçamento e roteamento | **IP**, ICMP | Pacote |
| 2 | Enlace | Acesso à rede | Entrega no mesmo segmento | Ethernet, **MAC**, ARP, VLAN | Quadro |
| 1 | Física | | Bits no meio | Cabo, Wi-Fi | Bits |

> `[TEORIA]` Quando alguém diz "problema de camada 3", é de IP/rota; "camada 7", é de aplicação (HTTP/DNS). Um **switch** opera na camada 2 (MACs), um **roteador** na 3 (IPs), um **balanceador L7** na 7. O diagnóstico do Módulo 09 ("escada") é exatamente subir essas camadas.

**TCP x UDP**: TCP é **confiável** (handshake de 3 vias *SYN → SYN-ACK → ACK*, retransmissão, ordem) — web, SSH, e-mail. UDP é **rápido e sem garantia** — DNS, streaming, VoIP, jogos.

## Endereçamento e sub-redes (CIDR)

Um IPv4 é 4 bytes (32 bits). A máscara define quantos bits são **rede** e quantos **host**. Em CIDR, `/24` = 24 bits de rede, 8 de host.

| CIDR | Máscara | Hosts úteis | Uso típico |
|---|---|---|---|
| `/8` | 255.0.0.0 | 16.777.214 | Rede enorme (10.0.0.0/8) |
| `/16` | 255.255.0.0 | 65.534 | VNet/VPC |
| `/24` | 255.255.255.0 | 254 | Sub-rede comum |
| `/28` | 255.255.255.240 | 14 | Sub-rede pequena |
| `/30` | 255.255.255.252 | 2 | Link ponto a ponto |

Fórmula: **hosts úteis = 2^(32 − prefixo) − 2** (menos endereço de rede e de broadcast; em nuvem, descontam-se ainda alguns reservados, como visto no Módulo 06 do Azure).

**Passo a passo — dividir `10.10.0.0/16` em sub-redes `/24`:** de 16 para 24 bits são 8 bits a mais → 2^8 = **256** sub-redes: `10.10.0.0/24`, `10.10.1.0/24`, ... `10.10.255.0/24`, cada uma com 254 hosts. Em **VLSM** você usa tamanhos diferentes conforme a necessidade (ex.: `/24` para servidores, `/28` para gerência).

```bash
sudo apt install -y ipcalc sipcalc
ipcalc 10.10.1.0/24                  # rede, broadcast, faixa de hosts
sipcalc 10.10.0.0/16 -s 24 | head    # divide em /24
python3 -c "import ipaddress as i; n=i.ip_network('10.10.0.0/16'); print(list(n.subnets(new_prefix=24))[:3])"
```

> `[TENTE VOCÊ]` Quantos hosts úteis tem `192.168.10.0/26`? Resposta: 2^(32−26) − 2 = 2^6 − 2 = **62**.

Faixas **privadas** (RFC 1918): `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. **Sobreposição** de faixas impede conectar redes (peering/VPN) — por isso planeja-se o endereçamento antes de criar VNets/VPCs.

## DNS e DHCP

- **DNS**: resolve nomes → IPs. Hierarquia: **raiz** → **TLD** (`.com`, `.br`) → **autoritativo**; resolvedores recursivos fazem cache pelo **TTL**. Registros: A, AAAA, CNAME, MX, NS, TXT, PTR, SRV.
- **DHCP**: entrega **automaticamente** IP, máscara, gateway e DNS a quem entra na rede (processo DORA: *Discover, Offer, Request, Acknowledge*).

```bash
dig +trace exemplo.com.br
dig exemplo.com MX +short
dig -x 8.8.8.8 +short                 # DNS reverso (PTR)
sudo dhclient -v eth0                  # (em máquina com DHCP) pedir/renovar lease
```

## HTTP e HTTPS

HTTP é o protocolo da web: requisição (método + caminho + cabeçalhos) → resposta (código + cabeçalhos + corpo).

| Método | Uso | Códigos de resposta |
|---|---|---|
| GET | Ler | **2xx** sucesso (200, 201, 204) |
| POST | Criar | **3xx** redirecionamento (301, 302) |
| PUT/PATCH | Atualizar | **4xx** erro do cliente (400, 401, 403, 404) |
| DELETE | Remover | **5xx** erro do servidor (500, 502, 503, 504) |

```bash
curl -v https://exemplo.com 2>&1 | head -30       # mostra handshake TLS, requisição e resposta
curl -sS -o /dev/null -w "%{http_code} dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} total=%{time_total}\n" https://exemplo.com
```

A segunda linha mostra **onde o tempo vai** (DNS, TCP, TLS, total) — ótima para diagnosticar lentidão.

## TLS e certificados

O **TLS** garante **confidencialidade** (criptografa), **integridade** e **autenticidade** (prova quem é o servidor). O servidor apresenta um **certificado** assinado por uma **CA** (Autoridade Certificadora) que o cliente já confia; certificados formam uma **cadeia** (raiz → intermediária → folha).

```bash
openssl s_client -connect exemplo.com:443 -servername exemplo.com </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

Campos que importam: **CN/SAN** (a quais nomes vale), **Issuer** (quem assinou), **validade**. Erros clássicos: certificado **expirado**, **nome não confere** (SAN), **cadeia incompleta**, relógio errado.

**Laboratório — sua própria CA:**

```bash
mkdir -p ~/lab/ca && cd ~/lab/ca
openssl genrsa -out ca.key 4096
openssl req -x509 -new -key ca.key -days 365 -subj "/CN=Minha CA do Lab" -out ca.crt
openssl genrsa -out servidor.key 2048
openssl req -new -key servidor.key -subj "/CN=app.lab" -out servidor.csr
printf "subjectAltName=DNS:app.lab" > ext.cnf
openssl x509 -req -in servidor.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 90 -extfile ext.cnf -out servidor.crt
openssl verify -CAfile ca.crt servidor.crt          # servidor.crt: OK
```

Você acaba de reproduzir o que o Let's Encrypt faz em escala: um cliente gera a chave e um **CSR**, a CA valida e **assina**.

## NAT, roteamento e VLAN

- **NAT** (*Network Address Translation*): traduz IPs privados para um público na saída (e **PAT**/masquerade, que multiplexa por porta). É o que permite sua rede 192.168.x navegar com **um** IP público.
- **Roteamento**: cada roteador consulta sua **tabela de rotas** (prefixo mais específico vence — *longest prefix match*). Pode ser **estático** (você define) ou **dinâmico** (OSPF, BGP aprendem sozinhos; **BGP** é o protocolo da internet).
- **VLAN**: divide **logicamente** uma rede física em várias redes isoladas (tag 802.1Q), separando, por exemplo, servidores de convidados sem comprar outro switch.

Um **gateway/roteador Linux** de laboratório com namespaces (o desafio abaixo):

```bash
sudo sysctl -w net.ipv4.ip_forward=1
sudo nft add table ip nat
sudo nft add chain ip nat postrouting '{ type nat hook postrouting priority 100; }'
sudo nft add rule ip nat postrouting oifname "eth0" masquerade
```

## VPN, proxy reverso e balanceadores

- **VPN**: túnel criptografado entre redes/hosts. **IPsec** (site-to-site clássico) e **WireGuard** (moderno, simples e rápido).
- **Proxy direto** (forward) esconde **clientes**; **proxy reverso** (Módulo 17) esconde/protege **servidores**.
- **Balanceador**: **L4** (TCP/UDP, só vê IP e porta, rápido) x **L7** (entende HTTP: roteia por URL/cabeçalho, termina TLS). Algoritmos: round-robin, menos conexões, hash do IP. Sempre com **health checks**.

### WireGuard entre duas distros/namespaces

```bash
sudo apt install -y wireguard
wg genkey | tee a.key | wg pubkey > a.pub
wg genkey | tee b.key | wg pubkey > b.pub

# /etc/wireguard/wg0.conf (lado A)
# [Interface]
# PrivateKey = <conteúdo de a.key>
# Address = 10.200.0.1/24
# ListenPort = 51820
# [Peer]
# PublicKey = <conteúdo de b.pub>
# AllowedIPs = 10.200.0.2/32
sudo wg-quick up wg0 && sudo wg show
```

(O lado B é o espelho, com as chaves trocadas.) `ping 10.200.0.2` percorre o túnel.

### HAProxy balanceando dois backends

```bash
sudo apt install -y haproxy
python3 -m http.server 8001 --directory ~/lab/api1 &     # backend 1
python3 -m http.server 8002 --directory ~/lab/api2 &     # backend 2
sudo tee -a /etc/haproxy/haproxy.cfg <<'EOF'

frontend web
    bind *:8080
    default_backend apps
backend apps
    balance roundrobin
    option httpchk GET /
    server s1 127.0.0.1:8001 check
    server s2 127.0.0.1:8002 check
EOF
sudo haproxy -c -f /etc/haproxy/haproxy.cfg && sudo systemctl restart haproxy
for i in 1 2 3 4; do curl -s localhost:8080 | head -1; done
```

Derrube um backend e veja o HAProxy tirá-lo de rotação (health check).

## Ferramentas de diagnóstico: o que usar para cada pergunta

| Pergunta | Ferramenta |
|---|---|
| Chego lá? Qual o caminho? | `ping`, `traceroute`, `mtr` |
| O nome resolve? | `dig`, `nslookup` |
| A porta está aberta/escutando? | `nc -zv`, `ss -tulpn`, `nmap` |
| O que trafega? | `tcpdump`, **Wireshark** |
| O HTTP responde? Quanto demora? | `curl -v`, `-w` |
| Qual o caminho dos pacotes (kernel)? | `ip r get`, `conntrack -L` |
| O certificado é válido? | `openssl s_client` |

![Saída do `curl -w` mostrando os tempos de DNS, conexão TCP, handshake TLS e total de uma requisição HTTPS](screenshots/18-redes-para-infra/01-curl-tempos.png)
> `[PRINT]` Passo a passo para capturar: rodar o `curl -sS -o /dev/null -w "..."` do bloco de HTTP e capturar a linha de tempos.

## Laboratórios

### Lab 1 — Sub-redes na mão
Divida `10.20.0.0/16` em sub-redes para: 3 `/24` (web/app/dados), 1 `/28` (gerência) e 1 `/30` (link). Valide com `ipcalc` e escreva a tabela com rede, broadcast, faixa e nº de hosts.

### Lab 2 — Camadas na prática
Com `curl -v` e `tcpdump -nn -i any port 80 -c 20` ao mesmo tempo, identifique o handshake TCP, a requisição HTTP e a resposta.

### Lab 3 — Sua CA e TLS
Crie a CA do lab, assine um certificado para `app.lab` com SAN, instale no Nginx (Módulo 17) e valide com `curl --cacert ca.crt https://app.lab`.

### Lab 4 — Balanceamento
Suba o HAProxy com 2 backends, observe o round-robin e derrube um.

### Desafios

- **Desafio 1:** rede de **3 segmentos** com namespaces (`lan1`, `lan2`, `router`), roteador Linux (`ip_forward`) e **NAT** com `nft` para uma "saída para a internet" simulada.
- **Desafio 2:** túnel **WireGuard** entre dois namespaces; prove com `tcpdump` que o tráfego no meio está cifrado.
- **Desafio 3:** explique, camada por camada, tudo que acontece quando você digita `https://exemplo.com` no navegador (DNS, TCP, TLS, HTTP).

## Erros comuns nesta fase

- Esquecer de descontar rede/broadcast (e reservados da nuvem) no cálculo de hosts.
- Faixas de IP sobrepostas entre ambientes.
- Certificado sem SAN (navegadores modernos ignoram o CN).
- Diagnosticar só pelo `ping` (ICMP pode estar bloqueado e o serviço estar ok).
- Confundir NAT (tradução) com firewall (filtragem).
- Esquecer o health check no balanceador.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| CIDR, sub-redes | VNet/NSG no Azure (Módulo 06); VPC no GCP (Módulo 05) |
| LB L4/L7 | Load balancers do Azure (Módulo 07) e do GCP (Módulo 06) |
| TLS, certificados | cert-manager e Ingress — Módulo 23; segurança — Módulo 25 |
| Proxy reverso | Ingress NGINX — Módulo 23 |
| VPN | VPN Gateway/ExpressRoute — Módulos 06 (Azure) |

## `[REFERÊNCIA]`

- Cloudflare Learning Center: https://www.cloudflare.com/learning/
- Julia Evans — *Networking! ACK!* (zine): https://wizardzines.com/zines/networking/
- Professor Messer — *Network+ (vídeos gratuitos)*: https://www.professormesser.com/network-plus/
- RFC 1918 (faixas privadas): https://datatracker.ietf.org/doc/html/rfc1918
- WireGuard — quickstart: https://www.wireguard.com/quickstart/
- HAProxy — documentação: https://docs.haproxy.org/
- Let's Encrypt — como funciona: https://letsencrypt.org/how-it-works/
- Cisco — *CCNA* (visão geral do exame): https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html
- CompTIA Network+: https://www.comptia.org/certifications/network

**Como aprofundar:** faça o curso gratuito de Network+ do Professor Messer; para CCNA, use o Cisco Packet Tracer (gratuito).

## Checklist de saída

- [ ] Explicar OSI x TCP/IP e dizer em que camada cada protocolo/equipamento opera.
- [ ] Diferenciar TCP e UDP e descrever o handshake de 3 vias.
- [ ] Calcular hosts úteis e dividir redes em sub-redes (CIDR/VLSM).
- [ ] Descrever a resolução DNS e o processo DHCP (DORA).
- [ ] Explicar TLS, cadeia de certificados, SAN e erros comuns; criar uma CA de laboratório.
- [ ] Diferenciar NAT, roteamento (estático x dinâmico), VLAN e VPN.
- [ ] Diferenciar proxy direto e reverso, e balanceador L4 e L7.
- [ ] Escolher a ferramenta certa para cada sintoma de rede.
