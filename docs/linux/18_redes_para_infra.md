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

> `[TENTE VOCÊ]` O host `10.10.3.77` pertence à rede `10.10.2.0/23`? Raciocínio: um `/23` tem 9 bits de host (2^9 = 512 endereços), ou seja, ocupa **dois** blocos de 256 seguidos: do terceiro octeto `2` ao `3`, indo de `10.10.2.0` a `10.10.3.255`. Como `3.77` está dentro dessa faixa, a resposta é sim. Confirme: `python3 -c "import ipaddress as i; print(i.ip_address('10.10.3.77') in i.ip_network('10.10.2.0/23'))"` imprime `True`. Para ver o tamanho de um bloco qualquer: `python3 -c "import ipaddress as i; print(i.ip_network('10.0.5.0/27').num_addresses - 2)"` imprime `30`.

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

> `[TENTE VOCÊ]` O que diferencia um 404 de um "connection refused"? Raciocínio: o 404 é a resposta de um servidor vivo (camada 7 funcionando); o *refused* acontece antes, na camada 4, quando ninguém escuta na porta. Rode `python3 -m http.server 8123 --directory /tmp & SP=$!; sleep 1; curl -s -o /dev/null -w "%{http_code}\n" localhost:8123/x; kill $SP; sleep 1; curl -sS localhost:8123/ 2>&1 | head -1`. Resposta: `404` (servidor vivo, caminho errado) e depois `curl: (7) Failed to connect to localhost port 8123 ...: Connection refused` (servidor morto).

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

> `[TENTE VOCÊ]` O certificado da sua CA assina a si mesmo? Raciocínio: numa CA raiz o *subject* (quem é) e o *issuer* (quem assinou) são o mesmo, porque ninguém acima dela assina; é por isso que a raiz precisa ser instalada como "confiável" manualmente. Rode `openssl x509 -in ~/lab/ca/ca.crt -noout -subject -issuer`. Resposta: duas linhas iguais, `subject=CN = Minha CA do Lab` e `issuer=CN = Minha CA do Lab`. Rode o mesmo para `servidor.crt` e o *issuer* passa a ser a CA.

> `[ATENÇÃO]` Sem o SAN, o certificado "funciona" no `openssl verify` e **falha** no navegador e no `curl`. Se você esquecer o `-extfile ext.cnf` no passo de assinatura, o erro aparecerá só na hora de usar (`certificate subject name 'app.lab' does not match target host name`), longe de onde nasceu. Confira sempre com `openssl x509 -in servidor.crt -noout -ext subjectAltName`.

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

> `[ATENÇÃO]` Ligar `ip_forward=1` **não** faz NAT: o kernel passa a encaminhar pacotes, mas eles sairão com o IP privado de origem e a resposta nunca volta. Para a rede privada navegar, falta a regra `masquerade` do `nft`. E o contrário também vale: `masquerade` sem `ip_forward` não encaminha nada. São duas peças separadas, uma de roteamento e uma de tradução.

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

> `[ATENÇÃO]` Nas chaves do WireGuard, `AllowedIPs` faz **duas** coisas: filtra de quais IPs aceita tráfego do par e define para quais destinos o tráfego é enviado a ele (é uma tabela de roteamento). Um `AllowedIPs` errado dá o sintoma "o túnel sobe (`wg show` mostra handshake), mas o ping não passa".

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

### Lab 5 — Detector de sobreposição de redes
Cenário: o time de nuvem vai conectar quatro redes e precisa saber, antes de criar o peering, se há faixas que colidem. Use o que já sabe de Python (Módulo 11) e CIDR.
```bash
python3 - <<'PY'
import ipaddress as ip
redes = ["10.10.0.0/16", "10.20.0.0/16", "10.10.5.0/24", "192.168.1.0/24"]
nets = [ip.ip_network(r) for r in redes]
for i, a in enumerate(nets):
    for b in nets[i+1:]:
        if a.overlaps(b):
            print(f"SOBREPOSTA: {a} x {b}")
PY
```
Resposta esperada: uma única linha, `SOBREPOSTA: 10.10.0.0/16 x 10.10.5.0/24` (a segunda está dentro da primeira). Troque a lista pelas faixas do seu planejamento do Lab 1.

### Lab 6 — Recusado ou silêncio? Dois defeitos, dois sintomas
Cenário: o chamado diz "não conecta". Você precisa distinguir *quem está fora* de *quem está bloqueado*, e a mensagem de erro é a pista.
```bash
sudo apt install -y netcat-openbsd
python3 -m http.server 8001 --directory /tmp & SP=$!; sleep 1
nc -zv 127.0.0.1 8001                          # succeeded! (alguém escuta)
kill $SP; sleep 1
nc -zv 127.0.0.1 8001                          # Connection refused (ninguém escuta, o RST volta na hora)
nc -zv -w 2 203.0.113.1 80                     # timed out (o pacote some no caminho; faixa de documentação RFC 5737)
```
*Refused* = a máquina respondeu "não tem ninguém aqui" (serviço parado ou porta errada). *Timed out* = silêncio (firewall descartando, rota inexistente, host desligado). A diferença muda completamente o próximo passo.

### Lab 7 — Round-robin contado e failover
Cenário: o HAProxy do Lab 4 precisa de prova numérica de que distribui igualmente e de que tira o backend morto de rotação. Dê a cada backend uma identidade:
```bash
mkdir -p ~/lab/api1 ~/lab/api2
echo servidor-1 > ~/lab/api1/index.html && echo servidor-2 > ~/lab/api2/index.html
for i in $(seq 1 100); do curl -s localhost:8080; done | sort | uniq -c      # 50 servidor-1 e 50 servidor-2
pkill -f "http.server 8001"; sleep 7                                         # o health check precisa de alguns ciclos
for i in $(seq 1 100); do curl -s localhost:8080; done | sort | uniq -c      # 100 servidor-2
```
O `sleep 7` não é decoração: o HAProxy só marca o backend como fora depois de algumas verificações consecutivas com falha. Antes disso, algumas requisições voltam `503`. É a razão de calibrar `inter`, `fall` e `rise` em produção.

### Desafios

- **Desafio 1:** rede de **3 segmentos** com namespaces (`lan1`, `lan2`, `router`), roteador Linux (`ip_forward`) e **NAT** com `nft` para uma "saída para a internet" simulada.
- **Desafio 2:** túnel **WireGuard** entre dois namespaces; prove com `tcpdump` que o tráfego no meio está cifrado.
- **Desafio 3:** explique, camada por camada, tudo que acontece quando você digita `https://exemplo.com` no navegador (DNS, TCP, TLS, HTTP).
- **Desafio 4:** emita, com a CA do Lab 3, um certificado válido para **dois** nomes (`app.lab` e `www.app.lab`) e prove que o `curl` aceita os dois nomes apontando para o seu Nginx (use `--resolve` ou entradas no `/etc/hosts`), mas rejeita um terceiro nome (`outro.lab`). **Verifique:** `openssl x509 -in ~/lab/ca/servidor.crt -noout -ext subjectAltName` mostra `DNS:app.lab, DNS:www.app.lab`; `curl --cacert ~/lab/ca/ca.crt https://www.app.lab/` responde normalmente e, com o terceiro nome, termina com `curl: (60) SSL: no alternative certificate subject name matches target host name 'outro.lab'`.

### Desafio avançado — Dois provedores, uma saída por política

**Nível:** avançado — leva de 1 a 3 horas

- **Cenário:** a empresa contratou dois links de internet (ISP A, barato, e ISP B, mais caro e com melhor rota para HTTPS alternativo). Regra de negócio: o tráfego comum sai pelo ISP A, e o serviço na porta `8443` **sempre** pelo ISP B. Se um provedor ficar "de pé, mas sem entregar", o tráfego dele deve migrar para o outro automaticamente. Antes de mexer no roteador real, você prova tudo com namespaces.
- **Requisitos:**
  1. Quatro namespaces: `cli`, `rtr`, `ispa`, `ispb`. Endereçamento fixo: `cli`-`rtr` em `10.50.0.0/24` (cli `.2`, rtr `.1`); `rtr`-`ispa` em `100.64.1.0/30` (rtr `.1`, isp `.2`); `rtr`-`ispb` em `100.64.2.0/30` (rtr `.1`, isp `.2`).
  2. A "internet" é o endereço `192.0.2.10/32`, configurado no `lo` de **ambos** os ISPs. Em cada um, um servidor responde nas portas `80` e `8443` com `isp-a <IP-do-cliente>` ou `isp-b <IP-do-cliente>`.
  3. O `rtr` encaminha e faz NAT (masquerade) em cada uplink, só com `nft`. O ISP precisa ver o IP do uplink do `rtr`, nunca `10.50.0.2`.
  4. **Roteamento por política:** pacotes do `cli` com destino à porta `8443` saem pelo ISP B; todo o resto sai pelo ISP A. Isso deve ser feito com marcação de pacote (`nft`) e tabelas de roteamento separadas (`ip rule`), sem `iptables`.
  5. `failover.sh` (idempotente): sonda de verdade a alcançabilidade de `192.0.2.10` por cada uplink (e não só o estado do link) e ajusta a política para que, se um ISP não entregar, **todo** o tráfego use o outro; quando ele voltar, a política original é restaurada.
  6. `teardown.sh` remove tudo (namespaces, regras) e pode ser rodado duas vezes seguidas sem erro.
- **Restrições:** sem `iptables`, sem instalar pacotes além do que o Ubuntu 24.04 já tem, e nenhuma rota estática "para o servidor específico" no `cli` (a decisão é do `rtr`).
- **Onde pesquisar:** `man ip-rule`, `man ip-route` (tabelas, `fwmark`), `nft` (wiki oficial, hooks `prerouting` e `meta mark set`), `man curl` (`--interface`) e o parâmetro `rp_filter` em `ip-sysctl` do kernel.
- **Verifique:**

```bash
C='sudo ip netns exec cli curl -s --max-time 3'
$C http://192.0.2.10/                  # isp-a 100.64.1.1
$C http://192.0.2.10:8443/             # isp-b 100.64.2.1
sudo ip netns exec rtr ip rule show | grep -c fwmark    # >= 1
sudo ip netns exec rtr nft list ruleset | grep -c masquerade   # >= 2
# falha silenciosa do ISP A (link continua UP):
sudo ip -n ispa addr del 192.0.2.10/32 dev lo && sudo ./failover.sh
$C http://192.0.2.10/                  # isp-b 100.64.2.1
# recuperação:
sudo ip -n ispa addr add 192.0.2.10/32 dev lo && sudo ./failover.sh
$C http://192.0.2.10/                  # isp-a 100.64.1.1
sudo ./failover.sh; echo "saida=$?"    # idempotente: saida=0 sem mudar nada
sudo ./teardown.sh && sudo ./teardown.sh; echo "saida=$?"; ip netns list | wc -l   # saida=0 e 0
```

  Teste de borda: com **os dois** ISPs sem o endereço (`ip -n ispa addr del ...` e `ip -n ispb addr del ...`), o `failover.sh` deve sair com código diferente de zero e o `curl` deve terminar em *timeout* (e não ficar pendurado: lembre do `--max-time`).

## Erros comuns nesta fase

- Esquecer de descontar rede/broadcast (e reservados da nuvem) no cálculo de hosts.
- Faixas de IP sobrepostas entre ambientes.
- Certificado sem SAN (navegadores modernos ignoram o CN).
- Diagnosticar só pelo `ping` (ICMP pode estar bloqueado e o serviço estar ok).
- Confundir NAT (tradução) com firewall (filtragem).
- Esquecer o health check no balanceador.
- Confundir "connection refused" (ninguém escutando, resposta imediata) com "timed out" (pacote descartado no caminho): a causa e o próximo passo são opostos.
- Esquecer que `AllowedIPs` no WireGuard também é roteamento: túnel "de pé" não significa tráfego passando.
- Testar balanceador e proxy só por `localhost` e nunca pelo nome real que o cliente usa (o `Host` e o SNI mudam qual `server` responde).

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 09 — `ip`, `ss`, `dig`, `curl`, `tcpdump` | A "escada" de diagnóstico é a pilha OSI subindo, camada a camada |
| Módulo 10 — firewall (`nft`/`ufw`) | NAT e `masquerade` usam o mesmo `nft`; NAT traduz, firewall filtra |
| Módulo 11 — shell script e Python | Cálculo de CIDR, detector de sobreposição, laços de teste de carga |
| Módulo 12 — logs | Logs do Nginx e do HAProxy mostram o caminho real das requisições |
| Módulo 13 — `sysctl` | `net.ipv4.ip_forward` é o que transforma uma máquina Linux em roteador |
| Módulo 14 — network namespaces | O laboratório de redes (hosts, roteador, túnel) sem hardware algum |
| Módulo 17 — Nginx, TLS, DNS | Instalar o certificado da CA do lab, balancear e resolver nomes |

### Lab 8 — Seguindo uma requisição HTTPS de ponta a ponta (integrador)
Cenário: `https://app.lab` entra no Nginx com TLS (certificado da **sua** CA), é repassada ao HAProxy e cai em um dos dois backends. Você mede e enxerga cada camada. Pré-requisitos: a CA e o `servidor.crt` do Lab 3, o HAProxy com os dois backends (Labs 4 e 7) e o Nginx do Módulo 17.
```bash
sudo cp ~/lab/ca/servidor.crt /etc/nginx/ssl/app.crt
sudo cp ~/lab/ca/servidor.key /etc/nginx/ssl/app.key && sudo chmod 600 /etc/nginx/ssl/app.key
sudo tee /etc/nginx/sites-available/app >/dev/null <<'EOF'
server {
    listen 443 ssl;
    server_name app.lab;
    ssl_certificate     /etc/nginx/ssl/app.crt;
    ssl_certificate_key /etc/nginx/ssl/app.key;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
sudo nginx -t && sudo systemctl reload nginx
echo "127.0.0.1 app.lab" | sudo tee -a /etc/hosts
# suba os dois backends de novo se tiver derrubado um (Lab 7)
for i in 1 2 3 4; do curl -s --cacert ~/lab/ca/ca.crt https://app.lab/; done      # alterna servidor-1 / servidor-2
curl -sS --cacert ~/lab/ca/ca.crt -o /dev/null -w "http=%{http_code} dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} total=%{time_total}\n" https://app.lab/
curl -sS https://app.lab/                                                          # sem --cacert: erro de verificação
```
A leitura: `dns` quase zero (entrada no `/etc/hosts`, Módulo 09); `tcp` e `tls` pequenos (mesma máquina), mas o `tls` é bem maior que o `tcp` porque inclui o handshake com a sua CA; o último comando falha com `certificate verify failed` exatamente por não confiar na CA do lab. Passam por aqui camada 3 a 7: IP (127.0.0.1), TCP (handshake), TLS (CA e SAN), HTTP (Nginx -> HAProxy -> backend).

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
