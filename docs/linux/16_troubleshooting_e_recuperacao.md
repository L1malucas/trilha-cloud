---
id: "16_troubleshooting_e_recuperacao"
title: "Módulo 16 — Troubleshooting e Recuperação"
sidebar_label: "16 · Troubleshooting e Recuperação"
sidebar_position: 16
---

# Módulo 16 — Troubleshooting e Recuperação

> **Objetivo**: diagnosticar e corrigir problemas reais com um método — hipótese, teste, isolamento — cobrindo serviço que não sobe, disco cheio, permissão negada, rede fora, processo travado, OOM, `fsck`, senha de root e falhas de boot.
>
> **Pré-requisitos**: módulos 02 a 13 (este módulo usa tudo).
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre "Troubleshooting" do **Linux+ (XK0-005)** (um dos domínios mais pesados) e os tópicos de recuperação do **LPIC-1/RHCSA**. Referência: https://www.brendangregg.com/blog/2024-03-24/linux-crisis-tools.html

---

## Detetive, não adivinho

Um bom administrador não "tenta coisas até funcionar": segue um método. Quando algo quebra, a pressa empurra para mexer em tudo ao mesmo tempo — e é assim que um problema vira três. O método:

1. **Defina o sintoma** com precisão: "o site está fora" ou "retorna 502 há 10 minutos, só para o endpoint `/api`"?
2. **O que mudou?** Deploy, atualização, configuração, disco enchendo, certificado vencendo. A maioria dos incidentes tem uma mudança recente.
3. **Formule uma hipótese** e **teste uma coisa de cada vez**.
4. **Isole** a camada: aplicação, serviço, SO, rede, disco, hardware.
5. **Corrija** e **verifique** que o sintoma sumiu.
6. **Documente** (causa raiz e correção) num *runbook* — para a próxima vez ser mais rápida.

> `[TEORIA]` Uma escada de camadas ajuda a não se perder: **serviço rodando?** → **escutando na porta?** → **firewall deixa passar?** → **rede/DNS ok?** → **disco/memória/CPU ok?** → **permissões e configuração?** → **logs** (sempre!). Os logs (Módulo 12) respondem à maioria das perguntas.

## A caixa de ferramentas de crise

Tenha estes comandos na ponta dos dedos:

```bash
systemctl status <servico>           journalctl -xeu <servico>     # serviço e seu log
journalctl -p err -b                 dmesg -T | tail -30            # erros do boot / kernel
df -h && df -i                       du -xh / 2>/dev/null | sort -h | tail   # disco e inodes
free -h; uptime; top -bn1 | head -15                                # recursos
ss -tulpn                            curl -v http://localhost:PORTA          # portas e serviço
ip a; ip r; dig exemplo.com                                         # rede
sudo lsof -p <PID>                   strace -p <PID>                         # o que o processo faz
```

## Cenário 1 — O serviço não sobe

Sintoma: `systemctl start nginx` falha.

```bash
systemctl status nginx                       # "failed"? veja a última linha
journalctl -xeu nginx --no-pager | tail -30  # a razão costuma estar aqui
sudo nginx -t                                # muitos serviços têm teste de configuração
ss -tlnp | grep ':80 '                       # porta já em uso por outro processo?
ls -l /etc/nginx/nginx.conf                  # permissões/arquivo existe?
```

Causas típicas: erro de sintaxe na config, **porta em uso**, permissão em arquivo/diretório, caminho inexistente, dependência (`After=`) não pronta, disco cheio.

> `[ATENÇÃO]` Leia a **mensagem de erro inteira** antes de agir: "Address already in use" e "Permission denied" têm causas totalmente diferentes, e a resposta estava escrita no log.

## Cenário 2 — Disco cheio

```bash
df -h                                  # qual filesystem está a 100%?
df -i                                  # ou são os INODES?
sudo du -xh /var 2>/dev/null | sort -h | tail -10    # quem ocupa? (-x não atravessa filesystems)
sudo lsof +L1 | head                   # arquivos APAGADOS mas ainda abertos (ocupam espaço)
journalctl --disk-usage; sudo journalctl --vacuum-size=200M
sudo apt clean; sudo apt autoremove
```

Dois "disco cheio" enganosos: **inodes esgotados** (muitos arquivos pequenos) e **arquivo apagado ainda aberto** por um processo (reinicie-o para liberar).

## Cenário 3 — Permissão negada

```bash
ls -ld /caminho /caminho/..               # permissões de CADA diretório do caminho (precisa de x)
namei -l /var/www/html/index.html         # mostra permissão de todo o caminho
id usuario                                # o usuário está no grupo certo?
getfacl arquivo                           # existe ACL?
ls -Z arquivo; getenforce                 # SELinux? (RHEL-like)
sudo -u usuario test -r arquivo && echo ok
```

`namei -l` é uma joia: ele revela **onde** do caminho a permissão falha.

## Cenário 4 — Rede fora

Percorra a escada do Módulo 09: `ip a` → `ip r` → `ping` gateway → `ping 1.1.1.1` → `dig` → `curl`. Em cada degrau, o ponto em que falha aponta a camada culpada (interface/rota/internet/DNS/serviço).

## Cenário 5 — Processo travado ou consumindo tudo

```bash
top -o %CPU   # ou htop: quem consome?
ps -eo pid,ppid,stat,pcpu,pmem,cmd --sort=-pcpu | head
ps aux | awk '$8 ~ /Z/'                 # zumbis (estado Z)
sudo strace -p <PID> -f -tt             # o que o processo faz (chamadas de sistema)
sudo kill -15 <PID>; sleep 5; sudo kill -9 <PID>   # termine com educação primeiro
```

## Cenário 6 — OOM killer (falta de memória)

```bash
sudo dmesg -T | grep -i -E "out of memory|killed process"
journalctl -k | grep -i oom
free -h; vmstat 1 5          # swap em uso alto (si/so) = pressão de memória
```

Quando a memória acaba, o kernel mata um processo (o "OOM killer"). Investigue **quem** consumia (`ps --sort=-rss`) e se faltou limite, vazamento ou capacidade.

## Cenário 7 — Sistema de arquivos corrompido: fsck

```bash
sudo umount /mnt/dados                  # fsck exige FS desmontado
sudo fsck -f /dev/loopNp1               # (ext4) verifica e pergunta antes de reparar
sudo fsck -fy /dev/loopNp1              # -y responde "sim" a tudo (use com consciência)
```

> `[ATENÇÃO]` Nunca rode `fsck` num sistema de arquivos **montado**: pode destruir dados. Se for o `/`, use o modo de recuperação ou um live CD. Para treinar com segurança, use a imagem em loop do Módulo 08.

## Cenário 8 — Esqueci a senha do root / usuário

No **WSL**, é trivial e seguro: do PowerShell,

```powershell
wsl -d Ubuntu-24.04 -u root
```

Dentro dele: `passwd usuario` define uma nova senha. Em **servidor real**, o roteiro clássico usa o GRUB:

1. No menu do GRUB, edite a entrada (`e`) e acrescente `init=/bin/bash` (ou `rd.break` no RHEL) à linha do kernel.
2. Boot (`Ctrl+X`), remonte a raiz: `mount -o remount,rw /`.
3. `passwd root` (no RHEL com SELinux: `touch /.autorelabel`).
4. Reinicie.

> `[WSL]` Boot, GRUB e `rescue.target` não existem no WSL. O roteiro acima deve ser praticado numa **VM** (Multipass/VirtualBox) quando você quiser sentir de verdade. Conheça os passos para a prova.

## Cenário 9 — Falhas de boot (conceito + simulação)

Quando o sistema não chega ao login:

| Sintoma | Causa provável | Ação |
|---|---|---|
| Parou no GRUB | Bootloader danificado | Live CD → `grub-install`/`update-grub` |
| *Kernel panic* | Kernel/initramfs ruim, disco | Boot com kernel anterior (menu GRUB) |
| *Emergency mode* | `fstab` com erro | Corrigir `/etc/fstab` (`nofail`) e `mount -a` |
| Serviço bloqueia o boot | Unit com falha de dependência | `systemctl --failed`, `systemd.unit=rescue.target` |

Alvos úteis: `systemctl rescue` (modo de resgate, monousuário) e `systemctl emergency`. **Simulação no WSL:** na distro `ubuntu-lab`, quebre o `/etc/fstab` com uma linha inválida (sem `nofail`), reinicie com `wsl --terminate` e observe o aviso/erro do `mount -a`, depois restaure.

## Laboratório: a caixa de quebras

Crie um script que **sabota** a distro `ubuntu-lab` de 6 formas, e você diagnostica cada uma usando **só o terminal**. Exemplo de `quebra.sh` (rode apenas na distro descartável):

```bash
#!/usr/bin/env bash
# quebra.sh - SOMENTE na distro de laboratório (ubuntu-lab)
set -u
echo "1) serviço com config inválida"
sudo apt install -y nginx >/dev/null 2>&1
echo "isso_quebra;" | sudo tee -a /etc/nginx/nginx.conf >/dev/null
sudo systemctl restart nginx 2>/dev/null

echo "2) disco 'cheio' por arquivo apagado e aberto"
dd if=/dev/zero of=/tmp/gordo bs=1M count=200 status=none
( tail -f /tmp/gordo >/dev/null & ) ; rm /tmp/gordo

echo "3) permissão negada em diretório"
sudo mkdir -p /srv/app && echo ok | sudo tee /srv/app/dados.txt >/dev/null
sudo chmod 000 /srv/app

echo "4) porta já ocupada"
( python3 -m http.server 8080 >/dev/null 2>&1 & )

echo "5) DNS quebrado"
sudo cp /etc/resolv.conf /etc/resolv.conf.bak 2>/dev/null
echo "nameserver 203.0.113.1" | sudo tee /etc/resolv.conf >/dev/null

echo "6) processo consumindo CPU"
( yes >/dev/null & )
echo "Pronto. Diagnostique cada um e escreva o runbook."
```

Para cada item: **sintoma → hipótese → comandos → causa raiz → correção → verificação**. Depois, restaure com o snapshot (`wsl --import`) ou à mão.

![Saída do `namei -l` mostrando a permissão 000 no diretório /srv/app como ponto de falha do caminho](screenshots/16-troubleshooting-e-recuperacao/01-namei-permissao-negada.png)
> `[PRINT]` Passo a passo para capturar: no cenário 3, rodar `namei -l /srv/app/dados.txt` e `cat /srv/app/dados.txt`. Capturar o erro e a saída do `namei`.

### Desafios

- **Desafio 1:** resolva os 6 cenários da caixa de quebras e documente cada um num **runbook** em Markdown (formato: sintoma, diagnóstico, causa raiz, correção, prevenção).
- **Desafio 2:** corrompa uma imagem ext4 em loop (Módulo 08) e a recupere com `fsck`.
- **Desafio 3:** escreva um script `diagnostico.sh` que coleta (CPU, memória, disco, inodes, serviços falhados, últimos erros, portas) em um relatório para anexar a chamados.

## Erros comuns nesta fase

- Mudar várias coisas ao mesmo tempo (e não saber qual resolveu).
- Reiniciar o servidor **antes** de coletar evidências (logs, estado).
- Ler só a última linha do erro.
- Rodar `fsck` com o sistema montado.
- Desativar SELinux/firewall como "teste" e esquecer de religar.
- Não documentar a solução.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Método e runbooks | SRE e incidentes — Módulo 25 |
| `journalctl`, `dmesg` | Observabilidade — Módulo 24 |
| `kubectl describe/logs` (mesmo método) | Kubernetes — Módulo 23 |
| Diagnóstico em containers | Docker — Módulo 20 |

## `[REFERÊNCIA]`

- Brendan Gregg — *Linux Crisis Tools*: https://www.brendangregg.com/blog/2024-03-24/linux-crisis-tools.html
- Brendan Gregg — *USE Method*: https://www.brendangregg.com/usemethod.html
- Red Hat — *Troubleshooting and recovery*: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/managing_monitoring_and_updating_the_kernel/
- Google — *SRE Book, cap. "Effective Troubleshooting"*: https://sre.google/sre-book/effective-troubleshooting/
- `man7.org` — `strace(1)`, `namei(1)`: https://man7.org/linux/man-pages/
- ArchWiki — *Emergency mode e recuperação*: https://wiki.archlinux.org/title/Systemd
- Microsoft — *Solução de problemas do WSL*: https://learn.microsoft.com/windows/wsl/troubleshooting

**Como aprofundar:** leia o capítulo de troubleshooting do *SRE Book* e pratique em plataformas como "Sad Servers" (https://sadservers.com/), que entrega servidores quebrados para consertar.

## Checklist de saída

- [ ] Explicar o método (sintoma → o que mudou → hipótese → isolar → corrigir → documentar).
- [ ] Diagnosticar serviço que não sobe usando `status`, `journalctl` e teste de configuração.
- [ ] Distinguir disco cheio de inodes esgotados e de arquivo apagado ainda aberto.
- [ ] Usar `namei -l`, `id` e `getfacl` para resolver "permission denied".
- [ ] Identificar OOM killer e processos zumbis.
- [ ] Usar `fsck` com segurança e explicar o roteiro de recuperação de senha de root.
- [ ] Ter resolvido a caixa de quebras e escrito o runbook.
