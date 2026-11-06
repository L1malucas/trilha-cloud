---
id: "10_firewall_e_seguranca"
title: "Módulo 10 — Firewall e Segurança"
sidebar_label: "10 · Firewall e Segurança"
sidebar_position: 10
---

# Módulo 10 — Firewall e Segurança

> **Objetivo**: proteger um servidor Linux — firewall (nftables/iptables/ufw/firewalld), endurecimento do SSH, `fail2ban`, SELinux/AppArmor, criptografia com GPG e auditoria básica (`lynis`, `auditd`) — com mentalidade de menor privilégio.
>
> **Pré-requisitos**: módulos 05, 06 e 09.
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre os tópicos 110.1 a 110.3 do **LPIC-1 102** e "Security" do **Linux+**, além de bases do RHCSA (firewalld, SELinux). Referência de hardening: https://www.cisecurity.org/cis-benchmarks

---

## Segurança é camadas e menor privilégio

Um servidor exposto à internet é testado por robôs em **minutos**. A defesa não é uma ferramenta única, e sim camadas que se complementam:

1. **Reduzir a superfície**: instale só o necessário; desligue serviços sem uso.
2. **Controlar a rede**: firewall abrindo só as portas necessárias.
3. **Autenticar bem**: SSH por chave, sem senha, sem root.
4. **Limitar o dano**: usuários sem privilégio, SELinux/AppArmor, permissões mínimas.
5. **Atualizar**: patches de segurança aplicados.
6. **Observar**: logs e auditoria (Módulo 12).

> `[TEORIA]` Princípio do **menor privilégio**: cada usuário, processo e regra de firewall recebe *apenas* o que precisa para funcionar. Se o serviço só precisa da porta 443, as outras ficam fechadas.

## Firewall: o porteiro de pacotes

Um firewall decide, para cada pacote, **aceitar, rejeitar ou descartar**, com base em origem, destino, porta e estado da conexão. No kernel Linux isso é feito pelo **netfilter**; você o controla por ferramentas de níveis diferentes:

| Ferramenta | Camada | Quem usa |
|---|---|---|
| **nftables** (`nft`) | Moderno, substitui o iptables | Base em todas as distros atuais |
| **iptables** | Legado (ainda cobrado em prova) | Scripts antigos |
| **ufw** | Frontend simples | Ubuntu/Debian |
| **firewalld** (`firewall-cmd`) | Frontend por *zonas* | RHEL/Rocky/Fedora |

A política mais segura é **negar por padrão** e liberar o necessário.

### ufw (o mais simples)

```bash
sudo apt install -y ufw
sudo ufw default deny incoming            # nega entrada por padrão
sudo ufw default allow outgoing
sudo ufw allow 22/tcp                     # LIBERE O SSH ANTES de habilitar
sudo ufw allow 80,443/tcp
sudo ufw allow from 10.0.0.0/24 to any port 5432     # só uma rede acessa o banco
sudo ufw enable
sudo ufw status verbose
sudo ufw delete allow 80/tcp
```

> `[ATENÇÃO]` **Libere a porta do SSH antes de `ufw enable`** ao configurar um servidor remoto; senão você se tranca para fora. Em nuvem, lembre também dos *Security Groups/NSG* (camada externa ao SO).

### nftables na prática

```bash
sudo nft list ruleset
sudo nft add table inet filtro
sudo nft add chain inet filtro entrada '{ type filter hook input priority 0; policy drop; }'
sudo nft add rule inet filtro entrada ct state established,related accept
sudo nft add rule inet filtro entrada iif lo accept
sudo nft add rule inet filtro entrada tcp dport { 22, 80, 443 } accept
sudo nft list table inet filtro
```

Leia: tabela → **chain** (gancho `input`, política `drop`) → regras na ordem. `ct state established,related accept` deixa passar as respostas de conexões que você iniciou; sem ela, nada volta.

> `[ATENÇÃO]` Prefira ensaiar regras com `policy drop` dentro de um **namespace de rede** (Lab 5 abaixo) em vez de no host: um erro no host pode derrubar sua própria conexão. No namespace, o estrago fica confinado e o `sudo ip netns del` desfaz tudo. Outro erro clássico: a **ordem** importa — o `nft add rule` acrescenta no fim, e uma regra `drop` anterior vence qualquer `accept` posterior. Para colocar no topo, use `nft insert rule`.

### iptables (legado, cobrado em prova)

```bash
sudo iptables -L -n -v --line-numbers
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -P INPUT DROP                  # política padrão: descartar
```

### firewalld (RHEL-like) — conhecer os conceitos

```bash
sudo firewall-cmd --state
sudo firewall-cmd --get-active-zones
sudo firewall-cmd --zone=public --add-service=http --permanent
sudo firewall-cmd --zone=public --add-port=8080/tcp --permanent
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

`--permanent` grava para o próximo boot; sem ele a regra vale só até o `--reload`.

> `[WSL]` O WSL pode não ter todos os módulos do netfilter. Se `nft`/`ufw` reclamarem, pratique num container `--privileged` ou numa VM. Os conceitos permanecem idênticos.

> `[TENTE VOCÊ]` Veja por que o `passwd` é perigoso e necessário ao mesmo tempo. Rode `ls -l /usr/bin/passwd` e `find /usr/bin -perm -4000 -type f | head -5`. Resposta: `-rwsr-xr-x 1 root root ... /usr/bin/passwd` e uma lista de binários com o `s` no lugar do `x` do dono. Raciocínio: o bit **SUID** (`4000`) faz o programa rodar com a identidade do **dono** (root), não de quem o executou — é assim que um usuário comum troca a própria senha em `/etc/shadow`, que só o root escreve. Por isso cada SUID é uma porta de escalada de privilégio em potencial e entra em toda auditoria.

## SSH endurecido

Edite `/etc/ssh/sshd_config` (ou um arquivo em `/etc/ssh/sshd_config.d/`):

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy ana
MaxAuthTries 3
ClientAliveInterval 300
```

```bash
sudo sshd -t                       # TESTA a sintaxe antes de aplicar
sudo systemctl reload ssh          # aplica sem derrubar sessões
```

> `[ATENÇÃO]` Antes de desligar a senha, **confirme em outra janela** que o login por chave funciona. Se errar com a única sessão aberta, perde o acesso. Teste com `sshd -t` e mantenha uma sessão ativa até validar.

> `[TENTE VOCÊ]` Teste sua configuração do SSH sem aplicá-la (com `openssh-server` instalado, Módulo 09). Rode `sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|maxauthtries) '`. Resposta: algo como `permitrootlogin without-password` (ou `prohibit-password`), `passwordauthentication yes` e `maxauthtries 6`. Raciocínio: `-T` imprime a configuração **efetiva**, já somando padrões, `sshd_config` e `sshd_config.d/`. É a prova de que o que você escreveu é o que o daemon vai usar — e permite comparar antes/depois do endurecimento.

## fail2ban: bloquear quem insiste

O **fail2ban** lê logs e **bane por tempo** IPs com muitas falhas de autenticação.

```bash
sudo apt install -y fail2ban
sudo tee /etc/fail2ban/jail.local >/dev/null <<'EOF'
[sshd]
enabled  = true
maxretry = 4
findtime = 10m
bantime  = 1h
EOF
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd          # IPs banidos
sudo fail2ban-client set sshd unbanip 1.2.3.4
```

## SELinux e AppArmor: controle obrigatório de acesso

As permissões normais (Módulo 05) são **DAC** (o dono decide). **SELinux** (RHEL) e **AppArmor** (Ubuntu/SUSE) adicionam **MAC**: um processo só faz o que a *política* permite, mesmo rodando como root. Se um `nginx` for invadido, a política o impede de ler `/etc/shadow`.

SELinux (RHEL-like) tem os modos **Enforcing** (aplica), **Permissive** (só registra) e **Disabled**:

```bash
getenforce                         # Enforcing | Permissive | Disabled
sudo setenforce 0                  # temporário: Permissive
sestatus
ls -Z /var/www/html                # contexto de segurança dos arquivos
sudo ausearch -m avc -ts recent    # negações recentes
sudo restorecon -Rv /var/www/html  # restaura os contextos corretos
```

AppArmor (Ubuntu):

```bash
sudo aa-status
sudo aa-complain /usr/sbin/nginx   # modo de aprendizado
sudo aa-enforce  /usr/sbin/nginx
```

> `[ATENÇÃO]` Não **desative** SELinux para "resolver" um erro. Veja a negação (`ausearch`/`audit2why`) e ajuste o contexto ou o *boolean*. Desligá-lo é a solução preguiçosa e perigosa.

## GPG: assinar e criptografar

```bash
gpg --full-generate-key                            # gera par de chaves
gpg --list-keys
gpg -c segredo.txt                                 # criptografa com senha (gera segredo.txt.gpg)
gpg -d segredo.txt.gpg                             # descriptografa
gpg --encrypt -r destinatario@exemplo.com arquivo  # chave pública do destinatário
gpg --sign arquivo && gpg --verify arquivo.gpg
sha256sum arquivo > arquivo.sha256 && sha256sum -c arquivo.sha256   # integridade
```

> `[TENTE VOCÊ]` Garanta que um arquivo não mudou. Rode `cd ~/lab && echo ola > a.txt && sha256sum a.txt > a.sha256 && sha256sum -c a.sha256; echo x >> a.txt; sha256sum -c a.sha256`. Resposta: `a.txt: OK` e depois `a.txt: FAILED` seguido de `WARNING: 1 computed checksum did NOT match`. Raciocínio: o hash é uma "impressão digital" do conteúdo; qualquer byte alterado muda tudo. É assim que você valida um download ou detecta adulteração em arquivos de configuração.

> `[TENTE VOCÊ]` Criptografe e descriptografe um arquivo com senha. Rode `echo "senha do banco" > ~/lab/segredo.txt; gpg --batch --yes --pinentry-mode loopback --passphrase 'lab123' -c ~/lab/segredo.txt; ls ~/lab/segredo.txt.gpg; gpg --batch --pinentry-mode loopback --passphrase 'lab123' -d ~/lab/segredo.txt.gpg`. Resposta: o `.gpg` é criado e o último comando imprime `senha do banco`. Raciocínio: `-c` é criptografia simétrica (mesma senha cifra e decifra). Veja o conteúdo cifrado com `cat ~/lab/segredo.txt.gpg | head -c 40 | xxd | head -2`: ilegível.

> `[ATENÇÃO]` Passar a senha com `--passphrase` na linha de comando é aceitável só neste treino: ela fica visível no `ps` e no histórico do shell. Em uso real, deixe o `gpg` pedir a senha interativamente ou use um agente/gerenciador de segredos (Módulo 25).

## Auditoria rápida

```bash
sudo apt install -y lynis
sudo lynis audit system                          # relatório com sugestões
sudo ss -tulpn                                   # o que está escutando?
find / -perm -4000 -type f 2>/dev/null           # binários SUID
sudo last -n 10; sudo lastb | head               # logins e falhas
sudo apt install -y unattended-upgrades          # atualizações de segurança automáticas
```

O **auditd** registra eventos de sistema (acesso a arquivos, comandos): `sudo auditctl -w /etc/passwd -p wa -k passwd_mudou`, depois `sudo ausearch -k passwd_mudou`.

![Saída do `ufw status verbose` com política padrão "deny (incoming)" e as portas 22, 80 e 443 liberadas](screenshots/10-firewall-e-seguranca/01-ufw-status-verbose.png)
> `[PRINT]` Passo a passo para capturar: após configurar o ufw, rodar `sudo ufw status verbose`. Capturar a política padrão e as regras.

## Laboratórios

### Lab 1 — Firewall
Configure o ufw com política de negar, libere SSH e HTTP, suba `python3 -m http.server 8080` e prove que `8080` não acessa de fora/da outra distro até você liberar.

### Lab 2 — SSH endurecido
Desative a senha e o login de root, valide `sshd -t`, e teste o acesso por chave **antes** de encerrar a sessão original.

### Lab 3 — fail2ban
Instale o fail2ban, provoque 5 falhas de SSH (com senha errada, em `localhost`) e confirme o ban em `fail2ban-client status sshd`.

### Lab 4 — Auditoria
Rode `lynis audit system`, escolha 3 sugestões, aplique e rode de novo para comparar a pontuação.

### Lab 5 — Firewall nftables num namespace (sem risco para o WSL)
Cenário: um servidor interno expõe a aplicação (8080) e uma ferramenta administrativa (9090) que **não** deve ser alcançável. Você aplica "negar por padrão" e libera só o necessário, tudo dentro de namespaces.
> `[WSL]` Se `nft` reclamar de módulo ausente, rode `wsl --update`; persistindo, faça o lab numa VM. Os conceitos são idênticos.
1. Monte o cenário (cliente `fw-cli` e servidor `fw-srv`):
```bash
sudo ip netns add fw-srv; sudo ip netns add fw-cli
sudo ip link add s-c type veth peer name c-s
sudo ip link set s-c netns fw-srv; sudo ip link set c-s netns fw-cli
sudo ip -n fw-srv addr add 10.5.0.1/24 dev s-c
sudo ip -n fw-cli addr add 10.5.0.2/24 dev c-s
sudo ip -n fw-srv link set s-c up; sudo ip -n fw-cli link set c-s up
sudo ip -n fw-srv link set lo up;  sudo ip -n fw-cli link set lo up
sudo ip netns exec fw-srv python3 -m http.server 8080 --bind 0.0.0.0 >/dev/null 2>&1 &
sudo ip netns exec fw-srv python3 -m http.server 9090 --bind 0.0.0.0 >/dev/null 2>&1 &
sleep 1
for p in 8080 9090; do sudo ip netns exec fw-cli curl -s -m 3 -o /dev/null -w "$p -> %{http_code}\n" http://10.5.0.1:$p/; done
```
Esperado: as duas portas respondem `200` (ainda sem firewall).
2. Aplique a política de negar por padrão no servidor:
```bash
sudo ip netns exec fw-srv nft add table inet filtro
sudo ip netns exec fw-srv nft add chain inet filtro entrada '{ type filter hook input priority 0; policy drop; }'
sudo ip netns exec fw-srv nft add rule inet filtro entrada ct state established,related accept
sudo ip netns exec fw-srv nft add rule inet filtro entrada iif lo accept
sudo ip netns exec fw-srv nft add rule inet filtro entrada tcp dport 8080 accept
for p in 8080 9090; do sudo ip netns exec fw-cli curl -s -m 3 -o /dev/null -w "$p -> %{http_code}\n" http://10.5.0.1:$p/; done
```
Esperado: `8080 -> 200` e `9090 -> 000` depois de 3 s (timeout: o pacote foi **descartado**).
3. Troque o silêncio por recusa explícita: `sudo ip netns exec fw-srv nft insert rule inet filtro entrada tcp dport 9090 reject with tcp reset` e repita o `curl` na 9090: agora responde na hora com `000` e `curl` falha com "Connection refused". Compare com o passo anterior: `drop` esconde a existência da porta; `reject` avisa que ela está fechada.
4. Limpeza: `sudo pkill -f "[h]ttp.server 90"; sudo pkill -f "[h]ttp.server 8080"; sudo ip netns del fw-srv; sudo ip netns del fw-cli`.

### Lab 6 — Salvar e restaurar regras, com contadores
Cenário: regras na memória somem no reboot; é preciso exportá-las e conseguir recarregá-las (é o papel do `/etc/nftables.conf`). Refaça o passo 2 do Lab 5 (os namespaces e as regras) e continue:
1. Adicione um contador no fim da cadeia, para ver o tráfego descartado: `sudo ip netns exec fw-srv nft add rule inet filtro entrada counter`. Faça um `curl -m 3` na 9090 e leia: `sudo ip netns exec fw-srv nft list chain inet filtro entrada`. O `counter packets N bytes M` na última regra deve ter `N` maior que 0.
2. Exporte e apague: `sudo ip netns exec fw-srv nft list ruleset > ~/lab/regras.nft; sudo ip netns exec fw-srv nft flush ruleset`. Agora a 9090 volta a responder (sem regras, sem firewall).
3. Restaure: `sudo ip netns exec fw-srv nft -f ~/lab/regras.nft` e confirme que a 9090 voltou a ser bloqueada. Em um servidor real você colocaria esse conteúdo em `/etc/nftables.conf` e faria `sudo systemctl enable --now nftables`.

### Lab 7 — Validando o SSH sem arriscar o acesso
Cenário: antes de aplicar um `sshd_config` novo em produção, você o valida num arquivo de teste. (Requer `openssh-server`, Módulo 09.)
```bash
cat > ~/lab/sshd_teste <<'EOF'
PermitRootLogn no
PasswordAuthentication no
EOF
sudo $(which sshd) -t -f ~/lab/sshd_teste; echo "exit=$?"
```
Esperado: `Bad configuration option: PermitRootLogn` e `exit=255`. Corrija o erro de digitação para `PermitRootLogin`, rode de novo (sem saída e `exit=0`) e inspecione o que valeria: `sudo $(which sshd) -T -f ~/lab/sshd_teste | grep -E '^(permitrootlogin|passwordauthentication) '` → `permitrootlogin no` e `passwordauthentication no`. Moral: o `sshd -t` é a rede de segurança que impede de se trancar para fora com um typo.

### Desafios

- **Desafio 1:** servidor que aceita só SSH (por chave) e HTTP; prove com `nmap` a partir de outra distro/namespace que as demais portas aparecem *filtered*.
- **Desafio 2:** escreva uma regra nftables que limite novas conexões SSH a 5 por minuto por IP.
- **Desafio 3:** explique, com um exemplo, o que SELinux impede mesmo para um processo rodando como root.
- **Desafio 4:** no cenário do Lab 5, bloqueie **apenas** o IP `10.5.0.2` na porta 8080 com uma regra posicionada antes do `accept` (use `insert`), mantendo todo o resto como estava. **Verifique:** `sudo ip netns exec fw-cli curl -s -m 3 -o /dev/null -w '%{http_code}\n' http://10.5.0.1:8080/` imprime `000` e `sudo ip netns exec fw-srv nft list chain inet filtro entrada | grep -c 'ip saddr 10.5.0.2'` imprime `1`.

## Erros comuns nesta fase

- Habilitar firewall sem liberar o SSH antes.
- Desligar a senha do SSH sem testar a chave.
- Desativar SELinux/AppArmor em vez de corrigir a política.
- Regras de firewall "temporárias" (esquecer `--permanent`/persistência) ou, ao contrário, não saber que não persistem.
- Confiar só no firewall do SO e ignorar o da nuvem (Security Group/NSG).
- Deixar contas e serviços padrão ativos.
- Testar regras de `policy drop` direto no host em vez de num namespace/VM: um passo errado derruba sua própria sessão.
- Esquecer a regra `ct state established,related accept` ao usar `policy drop`: o tráfego de ida passa, mas as respostas não voltam.
- Colocar um `accept` depois de um `drop` mais amplo na mesma cadeia: as regras são avaliadas em ordem e a primeira que casa vence.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 04 (`grep`, `awk`, `sort`, `uniq`, `comm`) | Comparar portas esperadas x escutando; contar tentativas de login em logs |
| Módulo 05 (permissões, SUID, `sudo`) | Auditar binários SUID; `chmod 600` em chaves e segredos |
| Módulo 06 (systemd, processos) | `systemctl reload ssh`, `fail2ban` como serviço, achar o processo dono de uma porta |
| Módulo 09 (`ss`, SSH, namespaces) | Descobrir o que escuta; testar firewall em namespaces; chaves SSH |

### Lab integrador — Auditoria de exposição
Cenário: você recebe um servidor e precisa provar que só as portas autorizadas estão abertas e quem pode ter privilégio de root.
1. (Módulo 09) Defina o que é permitido e crie uma exposição "esquecida":
```bash
printf '22\n8080\n' > ~/lab/permitidas.txt
python3 -m http.server 7777 --directory ~/lab >/dev/null 2>&1 &
sleep 1
```
2. (Módulo 04) Extraia as portas que realmente escutam e compare:
```bash
ss -tlnH | awk '{n=split($4,a,":"); print a[n]}' | sort -u > ~/lab/escutando.txt
comm -13 <(sort -u ~/lab/permitidas.txt) ~/lab/escutando.txt
```
Esperado: a saída inclui `7777` (e qualquer outra porta fora da lista, como a do `systemd-resolved`, normalmente `53`). Esse é o "achado" do relatório.
3. (Módulo 06) Descubra o dono da porta intrusa e derrube-o com sinal gentil:
```bash
ss -tlnp | grep 7777           # mostra users:(("python3",pid=...))
pkill -f "[h]ttp.server 7777"
```
4. (Módulo 05) Liste os SUID com dono e modo e conte os que não são do root:
```bash
find /usr/bin /usr/sbin -perm -4000 -type f -printf '%u %m %p\n' | sort | head
find /usr/bin /usr/sbin -perm -4000 -type f ! -user root | wc -l
```
Esperado: todos `root 4755`/`4750` e o contador `0`. Um SUID de outro dono seria um alerta imediato.
5. (Módulos 04 e 09) Provoque e conte tentativas inválidas no SSH (com `openssh-server` ativo):
```bash
ssh -o BatchMode=yes usuario_inexistente@localhost true 2>/dev/null
sudo journalctl -u ssh --no-pager --since "5 min ago" | grep -c "Invalid user usuario_inexistente"
```
Esperado: um número maior ou igual a `1`. É exatamente o padrão que o `fail2ban` observa no log.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Firewall, portas | Redes — Módulo 18; NSG no Azure |
| SSH endurecido | Ansible/Terraform — Módulo 21 |
| Auditoria e logs | Módulo 12 |
| Privilégio mínimo, MAC | Containers e Kubernetes — Módulos 20 e 23 |
| Segredos, GPG | DevSecOps — Módulo 25 |

## `[REFERÊNCIA]`

- netfilter/nftables: https://www.netfilter.org/ · https://wiki.nftables.org/
- Ubuntu — *Firewall (ufw)*: https://ubuntu.com/server/docs/firewalls
- Red Hat — *Using firewalls* e *Using SELinux*: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_firewalls_and_packet_filters/
- CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks
- `man sshd_config`, `man ufw`, `man nft`: https://man7.org/linux/man-pages/
- fail2ban: https://github.com/fail2ban/fail2ban
- Lynis: https://cisofy.com/lynis/
- LPI — objetivos 110: https://www.lpi.org/our-certifications/exam-102-objectives/

**Como aprofundar:** faça os guias "Securing SSH" do CIS e estude `auditd` e `AppArmor profiles`. Para RHCSA, treine SELinux booleans e contextos.

## Checklist de saída

- [ ] Explicar menor privilégio e segurança em camadas.
- [ ] Configurar ufw (e saber o equivalente em nftables/iptables/firewalld) com política "negar por padrão".
- [ ] Endurecer o SSH (sem root, sem senha) e validar com `sshd -t`.
- [ ] Configurar e consultar o fail2ban.
- [ ] Explicar DAC x MAC e os modos do SELinux.
- [ ] Criptografar e assinar com GPG e verificar integridade com `sha256sum`.
- [ ] Rodar uma auditoria (`lynis`) e listar binários SUID.
