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

### Desafios

- **Desafio 1:** servidor que aceita só SSH (por chave) e HTTP; prove com `nmap` a partir de outra distro/namespace que as demais portas aparecem *filtered*.
- **Desafio 2:** escreva uma regra nftables que limite novas conexões SSH a 5 por minuto por IP.
- **Desafio 3:** explique, com um exemplo, o que SELinux impede mesmo para um processo rodando como root.

## Erros comuns nesta fase

- Habilitar firewall sem liberar o SSH antes.
- Desligar a senha do SSH sem testar a chave.
- Desativar SELinux/AppArmor em vez de corrigir a política.
- Regras de firewall "temporárias" (esquecer `--permanent`/persistência) ou, ao contrário, não saber que não persistem.
- Confiar só no firewall do SO e ignorar o da nuvem (Security Group/NSG).
- Deixar contas e serviços padrão ativos.

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
