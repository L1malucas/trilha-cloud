---
id: "09_redes"
title: "Módulo 09 — Redes no Linux"
sidebar_label: "09 · Redes no Linux"
sidebar_position: 9
---

# Módulo 09 — Redes no Linux

> **Objetivo**: configurar e diagnosticar a rede no Linux — endereços, rotas, DNS, portas, conectividade — e usar SSH, `scp`/`rsync`, `curl`, `tcpdump` e *network namespaces* para praticar sem equipamento.
>
> **Pré-requisitos**: módulos 02 a 04. Ajuda ter visto o conceito de IP e máscara (aprofundado no Módulo 18).
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre os tópicos 109.1 a 109.4 do **LPIC-1 102** e "Networking" do **Linux+**. Referência: https://man7.org/linux/man-pages/man8/ip.8.html

---

## A rede em quatro perguntas

Quando algo "não conecta", o diagnóstico segue uma escada, de baixo para cima. Cada degrau responde uma pergunta e tem seu comando:

| # | Pergunta | Comando |
|---|---|---|
| 1 | Minha interface está **ligada** e tem IP? | `ip a` |
| 2 | Sei chegar na **rede local** / no **gateway**? | `ip r`, `ping <gateway>` |
| 3 | Sei chegar na **internet** (por IP)? | `ping 1.1.1.1` |
| 4 | Sei **resolver nomes** (DNS)? | `dig`, `getent hosts` |
| 5 | O **serviço/porta** responde? | `ss`, `curl`, `nc` |

Percorrer essa escada, em ordem, resolve a maioria dos problemas sem adivinhação.

## Endereços e interfaces: `ip`

O comando `ip` (do pacote *iproute2*) substituiu o antigo `ifconfig`.

```bash
ip a                          # endereços de todas as interfaces (ip address)
ip -br a                      # formato resumido
ip -br link                   # estado das interfaces (UP/DOWN)
ip r                          # tabela de rotas (route)
ip r get 8.8.8.8              # por qual rota o kernel enviaria um pacote para esse IP
ip neigh                      # vizinhos ARP (IP -> MAC)
```

Leia `eth0: inet 172.20.10.5/20`: o endereço é `172.20.10.5`, e `/20` é a **máscara em CIDR** (20 bits de rede, restando 12 para hosts = 4096 endereços). A rota `default via 172.20.0.1` é o **gateway**: para onde vai todo tráfego que não é da rede local.

> `[TEORIA]` IPv4 tem 32 bits (`192.168.1.10`); IPv6, 128 bits (`2001:db8::1`). Faixas **privadas** (não roteadas na internet): `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. O NAT do roteador permite que elas saiam para a internet.

> `[TENTE VOCÊ]` Calcule uma rede sem papel. Rode `python3 -c "import ipaddress as i; n=i.ip_network('172.20.10.5/20', strict=False); print(n, n.num_addresses, n.netmask)"`. Resposta: `172.20.0.0/20 4096 255.255.240.0`. Raciocínio: `/20` fixa os 20 primeiros bits; os 12 restantes variam (2^12 = 4096). Como 20 não é múltiplo de 8, o terceiro octeto é "cortado no meio" (240 = 11110000), e por isso o endereço `172.20.10.5` pertence à rede que começa em `172.20.0.0`. Repita com `/24` e `/28` e veja o número de endereços cair.

Alterações temporárias (somem no reboot), úteis em laboratório:

```bash
sudo ip addr add 10.99.0.5/24 dev eth0
sudo ip addr del 10.99.0.5/24 dev eth0
sudo ip link set eth0 down && sudo ip link set eth0 up
```

> `[TENTE VOCÊ]` Pergunte ao kernel o caminho de um pacote. Rode `ip r get 8.8.8.8` e depois `ip r get 127.0.0.1`. Resposta: o primeiro mostra algo como `8.8.8.8 via 172.20.0.1 dev eth0 src 172.20.10.5` (saiu pelo gateway); o segundo, `local 127.0.0.1 dev lo`. Raciocínio: `via` indica que o destino está fora da sua rede e o pacote vai para o gateway; `local` indica que o destino é a própria máquina. É o primeiro comando a rodar quando alguém diz "não chego nesse IP".

Para **persistir** configuração: Ubuntu usa **Netplan** (`/etc/netplan/*.yaml`) ou **NetworkManager** (`nmcli`); RHEL usa NetworkManager (`nmcli`); Debian clássico usa `/etc/network/interfaces`. No WSL, a rede é gerida pelo Windows.

```bash
nmcli device status           # (se NetworkManager estiver presente)
```

## Nomes e DNS

O **DNS** traduz nomes em IPs. O caminho de resolução no Linux:

1. `/etc/nsswitch.conf` define a ordem (`hosts: files dns`).
2. `/etc/hosts` — mapeamentos locais fixos.
3. `/etc/resolv.conf` — qual servidor DNS consultar.

```bash
cat /etc/hosts
cat /etc/resolv.conf
getent hosts google.com                   # como o SISTEMA resolve (usa nsswitch)
dig google.com                            # consulta DNS completa
dig +short google.com                     # só a resposta
dig google.com MX                         # tipo de registro (A, AAAA, MX, TXT, NS, CNAME)
dig @1.1.1.1 google.com                   # consulta um servidor específico
dig +trace google.com                     # percorre a hierarquia raiz -> TLD -> autoritativo
nslookup google.com
hostname -I                               # seus IPs
```

> `[ATENÇÃO]` Se `ping 1.1.1.1` funciona mas `ping google.com` não, o problema é **DNS**, não a rede. Esse teste de dois passos separa os dois casos imediatamente.

## Conectividade e rota

```bash
ping -c 4 1.1.1.1                         # -c limita o número de pacotes
traceroute 1.1.1.1                        # sudo apt install traceroute; caminho salto a salto
mtr -rwc 10 1.1.1.1                       # traceroute + ping contínuo (sudo apt install mtr-tiny)
```

## Portas e conexões: `ss`

```bash
ss -tulpn                    # t TCP, u UDP, l escutando (listening), p processo, n numérico
ss -tn state established     # conexões estabelecidas
ss -s                        # resumo
sudo lsof -i :80             # quem usa a porta 80
```

Para treinar, suba um servidor web rápido e confira:

```bash
cd ~/lab && python3 -m http.server 8080 &
ss -tlnp | grep 8080
curl -I http://localhost:8080
kill %1
```

## curl, wget e nc: testando serviços

```bash
curl -I https://example.com                       # só os cabeçalhos
curl -s https://example.com | head                # corpo
curl -sS -o /dev/null -w "%{http_code} %{time_total}s\n" https://example.com   # status e tempo
curl -H "Accept: application/json" https://api.github.com/zen
curl -X POST -d '{"a":1}' -H "Content-Type: application/json" http://localhost:8080
wget -q https://example.com -O pagina.html
nc -zv example.com 443                            # a porta está aberta? (z varre, v verboso)
```

> `[TENTE VOCÊ]` Meça um serviço como um SRE. Rode `python3 -m http.server 8080 --directory ~/lab >/dev/null 2>&1 & sleep 1; for p in gera-lab.sh nao-existe; do curl -s -o /dev/null -w "$p -> %{http_code}\n" http://localhost:8080/$p; done; kill $!`. Resposta: `gera-lab.sh -> 200` e `nao-existe -> 404`. Raciocínio: o `-o /dev/null` descarta o corpo e o `-w` imprime só o que interessa (código e, se quiser, `%{time_total}`). Isso vira, quase sem mudança, um health check de monitoramento (Módulos 11 e 12).

> `[ATENÇÃO]` Dois erros parecidos, causas diferentes: `nc -zv localhost 9` responde `Connection refused` (a máquina respondeu "aqui não tem nada nessa porta" — serviço parado ou porta errada), enquanto uma porta bloqueada por firewall costuma só **demorar e dar timeout** (os pacotes são descartados em silêncio). Recusa rápida = alcançou o host; silêncio = algo no meio do caminho.

## SSH: acesso remoto seguro

O **SSH** cria um canal criptografado para executar comandos em outra máquina. Autenticar por **chave** é mais seguro que por senha: você guarda a chave **privada** (nunca sai da sua máquina) e instala a **pública** no servidor.

```bash
ssh-keygen -t ed25519 -C "meu-lab"             # gera par de chaves em ~/.ssh (use senha/passphrase)
ssh-copy-id usuario@servidor                    # instala a pública no servidor
ssh usuario@servidor                            # entra
ssh usuario@servidor 'uptime'                   # roda um comando e volta
ssh -i ~/.ssh/outra_chave -p 2222 usuario@host  # chave e porta específicas
```

Atalhos no `~/.ssh/config`:

```
Host web1
    HostName 10.0.0.10
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    Port 22
```

Depois: `ssh web1`.

> `[ATENÇÃO]` A chave **privada** (`id_ed25519`) nunca vai para Git, e-mail ou chat. As permissões importam: `chmod 700 ~/.ssh` e `chmod 600 ~/.ssh/id_ed25519`; o SSH recusa chaves abertas demais.

> `[TENTE VOCÊ]` Veja o SSH recusar uma chave frouxa. Rode `ssh-keygen -q -t ed25519 -N "" -f ~/lab/k_teste && chmod 644 ~/lab/k_teste && ssh -i ~/lab/k_teste -o BatchMode=yes localhost true 2>&1 | head -3`. Resposta: `WARNING: UNPROTECTED PRIVATE KEY FILE!` e `Permissions 0644 for ... are too open`. Corrija com `chmod 600 ~/lab/k_teste` e a reclamação some. Raciocínio: o SSH confere o modo do arquivo **antes** de qualquer conexão, e qualquer permissão para grupo/outros invalida a chave (Módulo 05 em ação). Apague com `rm ~/lab/k_teste*`.

### Túneis SSH

```bash
ssh -L 8080:localhost:80 usuario@servidor      # local: seu :8080 -> :80 do servidor
ssh -R 9000:localhost:3000 usuario@servidor    # remoto: :9000 do servidor -> seu :3000
ssh -D 1080 usuario@servidor                   # proxy SOCKS dinâmico
ssh -J bastion usuario@interno                 # salta por um bastion (jump host)
```

### Copiar arquivos: scp e rsync

```bash
scp arquivo.txt usuario@servidor:/tmp/                 # envia
scp usuario@servidor:/var/log/syslog .                 # baixa
scp -r pasta/ usuario@servidor:/tmp/
rsync -avz --progress pasta/ usuario@servidor:/backup/ # só envia o que mudou
rsync -avz --delete origem/ destino/                   # espelha (CUIDADO: apaga o que não existe na origem)
rsync -avzn origem/ destino/                           # -n: simulação (dry-run)
```

O `rsync` envia só as **diferenças**: muito mais eficiente que `scp` para backups repetidos. Cuidado com a barra final: `origem/` copia o **conteúdo**; `origem` copia a **pasta**.

## tcpdump: ver os pacotes

```bash
sudo apt install -y tcpdump
sudo tcpdump -i any -n port 8080 -c 10          # 10 pacotes da porta 8080
sudo tcpdump -i eth0 -n -w captura.pcap         # grava para abrir no Wireshark
sudo tcpdump -nn -A 'tcp port 80' -c 5          # mostra o conteúdo em ASCII
```

## Network namespaces: uma rede de verdade no seu WSL

Um **namespace de rede** é uma pilha de rede isolada (interfaces, rotas e firewall próprios) — a mesma tecnologia dos containers. Dá para montar "duas máquinas" ligadas por um cabo virtual (`veth`) sem nenhum hardware:

```bash
sudo ip netns add azul
sudo ip netns add verde
sudo ip link add veth-azul type veth peer name veth-verde
sudo ip link set veth-azul netns azul
sudo ip link set veth-verde netns verde

sudo ip -n azul  addr add 10.0.0.1/24 dev veth-azul
sudo ip -n verde addr add 10.0.0.2/24 dev veth-verde
sudo ip -n azul  link set veth-azul up
sudo ip -n verde link set veth-verde up
sudo ip -n azul link set lo up

sudo ip netns exec azul ping -c 2 10.0.0.2      # azul alcança verde
sudo ip netns exec azul ss -tulpn
```

![Dois namespaces de rede (azul e verde) conectados por um par veth, com o ping entre eles funcionando](screenshots/09-redes/01-namespaces-veth-ping.png)
> `[PRINT]` Passo a passo para capturar: executar o bloco acima e capturar a saída do `ping` de `azul` para `verde`.

**Limpeza:** `sudo ip netns del azul; sudo ip netns del verde`.

## Laboratórios

### Lab 1 — A escada do diagnóstico
Percorra os 5 degraus no seu WSL: `ip a`, `ip r`, `ping` do gateway, `ping 1.1.1.1`, `dig`, `curl`. Escreva o resultado de cada um.

### Lab 2 — DNS na mão
1. `dig +trace` de um domínio e identifique os servidores raiz, TLD e autoritativo.
2. Adicione uma entrada em `/etc/hosts` (`10.9.9.9 intranet.lab`) e confirme com `getent hosts intranet.lab`.
3. Pesquise os registros MX e TXT de um domínio.

### Lab 3 — SSH com chaves
1. Gere uma chave ed25519 e instale o `openssh-server` (`sudo apt install -y openssh-server; sudo systemctl enable --now ssh`).
2. Faça `ssh-copy-id` para o seu próprio usuário em `localhost` e entre sem senha.
3. Crie um alias no `~/.ssh/config` e teste um túnel local `-L`.

### Lab 4 — Duas "máquinas" com namespaces
Monte os namespaces `azul` e `verde`, suba um `python3 -m http.server` em um deles e acesse com `curl` a partir do outro.

### Lab 5 — Roteador entre duas redes
Cenário: duas redes (10.1.0.0/24 e 10.2.0.0/24) só se falam através de um roteador. Você monta o equivalente de uma VNet com duas sub-redes, só com namespaces.
```bash
for n in rede-a rede-b rot; do sudo ip netns add $n; done
sudo ip link add a-r type veth peer name r-a
sudo ip link add b-r type veth peer name r-b
sudo ip link set a-r netns rede-a; sudo ip link set r-a netns rot
sudo ip link set b-r netns rede-b; sudo ip link set r-b netns rot

sudo ip -n rede-a addr add 10.1.0.2/24 dev a-r
sudo ip -n rot    addr add 10.1.0.1/24 dev r-a
sudo ip -n rede-b addr add 10.2.0.2/24 dev b-r
sudo ip -n rot    addr add 10.2.0.1/24 dev r-b
for par in rede-a:a-r rot:r-a rede-b:b-r rot:r-b; do sudo ip -n ${par%%:*} link set ${par##*:} up; done
for n in rede-a rede-b rot; do sudo ip -n $n link set lo up; done

sudo ip -n rede-a route add default via 10.1.0.1
sudo ip -n rede-b route add default via 10.2.0.1

sudo ip netns exec rede-a ping -c 2 -W 1 10.2.0.2       # FALHA: o roteador ainda não encaminha
sudo ip netns exec rot sysctl -w net.ipv4.ip_forward=1
sudo ip netns exec rede-a ping -c 2 10.2.0.2            # agora funciona
```
Esperado: o primeiro `ping` termina com `100% packet loss`; o segundo, com `0% packet loss`. Moral: ter rota padrão nos dois lados não basta, o "roteador" precisa de `ip_forward=1` (é exatamente o que um gateway de nuvem faz por você). Para ver o caminho: `sudo ip netns exec rede-a ip r get 10.2.0.2`.

### Lab 6 — "Funciona na minha máquina": serviço só em localhost
Cenário: o time sobe a aplicação, o `curl` local funciona, mas o outro servidor não acessa. Use a topologia do Lab 5.
1. Suba um servidor preso ao loopback em `rede-b`:
```bash
sudo ip netns exec rede-b python3 -m http.server 8081 --bind 127.0.0.1 --directory ~/lab >/dev/null 2>&1 &
sleep 1
sudo ip netns exec rede-b ss -tln | grep 8081           # note: 127.0.0.1:8081
sudo ip netns exec rede-b curl -s -o /dev/null -w "local: %{http_code}\n" http://127.0.0.1:8081/
sudo ip netns exec rede-a curl -sS -m 3 http://10.2.0.2:8081/ 2>&1 | head -1
```
Esperado: local `200`; de `rede-a`, `curl: (7) Failed to connect ... Connection refused`.
2. Corrija: `sudo pkill -f "[h]ttp.server 8081"`, suba de novo com `--bind 0.0.0.0` e repita o `curl` a partir de `rede-a`: agora `200`. O `ss` mostra `0.0.0.0:8081` em vez de `127.0.0.1:8081`.
3. Lição: o endereço depois do `ss` (`127.0.0.1` x `0.0.0.0`) diz **quem** pode conectar.

### Lab 7 — Backup incremental com rsync
Cenário: copiar `~/lab/dados` para um destino de backup, enviando apenas o que mudou, e prever estragos antes de executar.
```bash
mkdir -p ~/lab/backup
rsync -avn ~/lab/dados/ ~/lab/backup/            # simulação: lista o que seria copiado
rsync -av  ~/lab/dados/ ~/lab/backup/            # copia
echo "nova linha" >> ~/lab/dados/app.log
rsync -a --stats ~/lab/dados/ ~/lab/backup/ | grep 'regular files transferred'
rm ~/lab/dados/usuarios.csv
rsync -avn --delete ~/lab/dados/ ~/lab/backup/ | grep deleting
```
Esperado: a segunda cópia transfere **1** arquivo (`Number of regular files transferred: 1`) e a simulação com `--delete` mostra `deleting usuarios.csv`. Restaure o CSV com `~/lab/gera-lab.sh` (ele recria todos os dados). Não rode o `--delete` sem o `-n` antes.

### Desafios

- **Desafio 1:** acesso a um "servidor interno" (segunda distro WSL, ou namespace) **via bastion** com `ssh -J`, sem expor a porta do servidor interno ao host.
- **Desafio 2:** capture com `tcpdump` um `curl` para `localhost:8080` e identifique o handshake TCP (SYN, SYN-ACK, ACK).
- **Desafio 3:** explique por que `ping google.com` pode falhar e `ping 142.250.x.x` funcionar, e como provar a causa.
- **Desafio 4:** monte no `~/.ssh/config` os hosts `bastion` (`HostName 127.0.0.1`, `User <seu usuário>`) e `interno` (`HostName 127.0.0.1`, `ProxyJump bastion`) e inspecione a configuração efetiva sem conectar. **Verifique:** `ssh -G interno | grep -E '^(proxyjump|hostname) '` deve imprimir `hostname 127.0.0.1` e `proxyjump bastion`.

## Erros comuns nesta fase

- Diagnosticar "a internet" sem separar rede de DNS.
- Esquecer o `-n` em `ss`/`tcpdump` (resolução de nomes lenta e confusa).
- Permissões frouxas em `~/.ssh`.
- `rsync --delete` na direção errada.
- Esquecer a barra final em `rsync origem/ destino/`.
- Achar que `ip addr add` persiste após o reboot.
- Subir o serviço com `--bind 127.0.0.1` (ou `localhost`) e esperar que outra máquina o acesse: confira o endereço de escuta no `ss -tln`.
- Confundir `Connection refused` (o host respondeu, não há serviço na porta) com timeout (pacotes descartados por firewall ou rota ausente): são diagnósticos diferentes.
- Montar namespaces/roteadores e esquecer a rota padrão nos clientes ou o `net.ipv4.ip_forward=1` no roteador.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 02 (pipes, redirecionamento, `&`) | `curl ... | head`, `servidor > log 2>&1 &`, `kill %1` |
| Módulo 04 (`grep`, `awk`, `sort`, `uniq -c`) | Analisar o log de acesso do servidor que você mesmo subiu |
| Módulo 05 (permissões) | `chmod 600` na chave SSH; `~/.ssh` com `700` |
| Módulo 06 (processos, sinais) | `ss -p` liga porta a PID; `pkill -f` para derrubar o servidor do namespace |

### Lab integrador — Quem está acessando o meu servidor?
Cenário: você publicou os dados do laboratório num servidor web interno (`rede-b`) e quer descobrir quem o consulta e com que resultado — o mesmo raciocínio de analisar um `access.log` do Módulo 04, só que agora com tráfego real. Use a topologia do Lab 5 (com `ip_forward=1`).
1. (Módulos 06 e 09) Suba o servidor gravando o log em arquivo:
```bash
sudo ip netns exec rede-b python3 -m http.server 8081 --bind 0.0.0.0 --directory $HOME/lab/dados > ~/lab/http.log 2>&1 &
sleep 1
sudo ip netns exec rede-b ss -tlnp | grep 8081          # quem escuta e qual PID
```
2. (Módulo 09) Gere tráfego a partir de `rede-a`, incluindo um erro:
```bash
for f in app.log usuarios.csv app.log nada.txt app.log; do
  sudo ip netns exec rede-a curl -s -o /dev/null http://10.2.0.2:8081/$f
done
```
3. (Módulo 04) Analise o log como se fosse produção:
```bash
grep '"GET' ~/lab/http.log | awk '{print $9}' | sort | uniq -c        # códigos de status
grep '"GET' ~/lab/http.log | awk '{print $7}' | sort | uniq -c | sort -rn   # arquivos mais pedidos
grep '"GET' ~/lab/http.log | awk '{print $1}' | sort -u               # IPs de origem
```
Esperado: `4 200` e `1 404`; `/app.log` com 3 pedidos; origem única `10.1.0.2` (o IP da `rede-a`, que o servidor enxerga atravessando o roteador).
4. (Módulos 05 e 06) Confira o dono do log (`ls -l ~/lab/http.log`: é você, pois o redirecionamento é feito pelo seu shell) e encerre o servidor com `sudo pkill -f "[h]ttp.server 8081"`.
5. Limpeza geral: `for n in rede-a rede-b rot; do sudo ip netns del $n; done`.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| SSH, chaves | Hardening — Módulo 10; Ansible — Módulo 21 |
| Portas, `ss` | Firewall — Módulo 10; serviços — Módulo 17 |
| Namespaces de rede | Containers — Módulos 14 e 20 |
| CIDR, DNS, rotas | Redes para infra — Módulo 18; VNet no Azure |
| `curl`, `tcpdump` | Troubleshooting — Módulo 16 |

## `[REFERÊNCIA]`

- `man7.org` — `ip(8)`, `ss(8)`, `ip-netns(8)`: https://man7.org/linux/man-pages/man8/ip.8.html
- OpenSSH — manual: https://www.openssh.com/manual.html
- Microsoft — *Redes no WSL*: https://learn.microsoft.com/windows/wsl/networking
- Cloudflare Learning Center (DNS, TCP/IP): https://www.cloudflare.com/learning/
- Julia Evans — zines sobre redes e DNS: https://jvns.ca/networking-zine.pdf
- `dig` — manual: https://linux.die.net/man/1/dig
- LPI — objetivos 109: https://www.lpi.org/our-certifications/exam-102-objectives/

**Como aprofundar:** estude os **netns** em profundidade (base dos containers) e o `iproute2` completo; depois siga para o Módulo 18, que consolida teoria de redes.

## Checklist de saída

- [ ] Percorrer a escada de diagnóstico de rede em ordem.
- [ ] Ler `ip a` e `ip r`, incluindo CIDR e gateway padrão.
- [ ] Explicar a ordem de resolução de nomes (`nsswitch`, `/etc/hosts`, `resolv.conf`).
- [ ] Usar `dig` com tipos de registro e `+trace`.
- [ ] Listar portas e processos com `ss -tulpn`.
- [ ] Gerar chaves SSH, configurar `~/.ssh/config` e criar túneis `-L`/`-R`/`-J`.
- [ ] Diferenciar `scp` de `rsync` e usar `--dry-run`.
- [ ] Montar e testar dois namespaces ligados por veth.
