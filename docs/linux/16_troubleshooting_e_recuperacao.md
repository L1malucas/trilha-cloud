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

> `[TENTE VOCÊ]` Reproduza o erro mais comum de "serviço não sobe" em dois comandos. Raciocínio: duas instâncias não podem escutar na mesma porta; o kernel entrega a porta à primeira e recusa a segunda. Rode `python3 -m http.server 9000 &` e, logo depois, `python3 -m http.server 9000`. Resposta: a segunda termina com `OSError: [Errno 98] Address already in use`. Confirme o dono com `ss -tlnp | grep 9000` (mostra o PID da primeira) e limpe com `kill %1`. É exatamente o que o `journalctl -xeu nginx` mostraria se outro processo ocupasse a 80.

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

> `[TENTE VOCÊ]` Provoque um "permission denied" e ache **onde** do caminho ele nasce. Raciocínio: para entrar num diretório é preciso a permissão `x` em *todos* os níveis; basta um nível fechado para o resto ficar inacessível. Rode (como usuário comum, root ignora permissões) `mkdir -p ~/lab/t/a/b && chmod 000 ~/lab/t/a && ls ~/lab/t/a/b`, depois `namei -l ~/lab/t/a/b`. Resposta: `ls` dá `Permission denied`, e o `namei -l` mostra a linha `d--------- seu_usuario seu_usuario a`: o ponto de falha é `a`, e não `b`. Restaure com `chmod 755 ~/lab/t/a && rm -r ~/lab/t`.

## Cenário 4 — Rede fora

Percorra a escada do Módulo 09: `ip a` → `ip r` → `ping` gateway → `ping 1.1.1.1` → `dig` → `curl`. Em cada degrau, o ponto em que falha aponta a camada culpada (interface/rota/internet/DNS/serviço).

> `[ATENÇÃO]` `ping` falhando **não prova** que a rede está fora: muitos firewalls e provedores bloqueiam ICMP. Teste a camada que importa para o sintoma, com `curl -sS -o /dev/null -w "%{http_code}\n" http://alvo` ou `nc -zv alvo 443`. E o inverso também vale: `ping` funcionando não garante que a porta do serviço esteja aberta.

## Cenário 5 — Processo travado ou consumindo tudo

```bash
top -o %CPU   # ou htop: quem consome?
ps -eo pid,ppid,stat,pcpu,pmem,cmd --sort=-pcpu | head
ps aux | awk '$8 ~ /Z/'                 # zumbis (estado Z)
sudo strace -p <PID> -f -tt             # o que o processo faz (chamadas de sistema)
sudo kill -15 <PID>; sleep 5; sudo kill -9 <PID>   # termine com educação primeiro
```

> `[TENTE VOCÊ]` Como ler o estado de um processo para saber se ele está "travado"? Raciocínio: a coluna `STAT` do `ps` resume o estado do kernel (`S` dormindo, `R` rodando, `T` parado, `Z` zumbi). Rode `sleep 300 & kill -STOP $!; ps -o pid,stat,cmd -p $!`, depois `kill -CONT $!; ps -o stat= -p $!`. Resposta: primeiro `T` (parado por sinal, e não por defeito), depois `S` (dormindo, normal para um `sleep`). Encerre com `kill $!`. Um processo em `T` ou `D` (espera de I/O) não adianta "reiniciar o serviço" sem entender por quê.

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

## Cenário 10 — "No space left" com espaço sobrando (inodes)

Sintoma: `touch: cannot touch 'arq': No space left on device`, mas `df -h` mostra espaço livre. Reproduza com uma imagem minúscula e poucos inodes (técnica do Módulo 08):

```bash
truncate -s 20M ~/lab/pequeno.img
mkfs.ext4 -F -q -N 128 ~/lab/pequeno.img          # só ~128 inodes
sudo mkdir -p /mnt/pequeno && sudo mount -o loop ~/lab/pequeno.img /mnt/pequeno
sudo chown $USER /mnt/pequeno
for i in $(seq 1 200); do touch /mnt/pequeno/f$i 2>/dev/null || { echo "parou no arquivo $i"; break; }; done
df -h /mnt/pequeno          # sobra espaço em bytes
df -i /mnt/pequeno          # IUse% = 100%
```

Diagnóstico: `df -i` entrega a causa raiz. Correção: apagar os arquivos pequenos (`rm /mnt/pequeno/f*`) ou recriar o sistema de arquivos com mais inodes (`mkfs.ext4 -i` define bytes por inode). Verificação: `touch /mnt/pequeno/novo && echo ok`. Limpeza: `sudo umount /mnt/pequeno && rm ~/lab/pequeno.img`.

## Cenário 11 — O serviço que reinicia em loop

Sintoma: `systemctl status` alterna entre `activating (auto-restart)` e `failed`, e depois some com `start-limit-hit`. Reproduza:

```bash
sudo tee /etc/systemd/system/quebrado.service >/dev/null <<'EOF'
[Unit]
Description=Servico quebrado de proposito
[Service]
ExecStart=/usr/local/bin/app-fantasma
Restart=on-failure
RestartSec=1
EOF
sudo systemctl daemon-reload && sudo systemctl start quebrado
sleep 6; systemctl status quebrado --no-pager | head -8
journalctl -u quebrado --no-pager | tail -5
```

Diagnóstico: o status traz `status=203/EXEC` e o journal diz que não conseguiu executar o binário (não existe). Hipótese confirmada com `ls -l /usr/local/bin/app-fantasma`. Correção:

```bash
printf '#!/bin/sh\nexec sleep infinity\n' | sudo tee /usr/local/bin/app-fantasma >/dev/null
sudo chmod +x /usr/local/bin/app-fantasma
sudo systemctl reset-failed quebrado && sudo systemctl restart quebrado
systemctl is-active quebrado         # active
```

> `[ATENÇÃO]` `Restart=on-failure` esconde o problema: o serviço parece "vivo e morrendo" em vez de "fora do ar". Depois de corrigir a causa, é preciso `reset-failed`, senão o limite de tentativas (`start-limit-hit`) continua bloqueando. Limpeza: `sudo systemctl disable --now quebrado; sudo rm /etc/systemd/system/quebrado.service /usr/local/bin/app-fantasma; sudo systemctl daemon-reload`.

## Cenário 12 — O script que "não existe" (CRLF)

Sintoma: o script tem permissão `x`, o arquivo existe, e mesmo assim `./relatorio.sh` responde `No such file or directory`. É clássico de arquivo editado no Windows. Reproduza:

```bash
printf '#!/usr/bin/env bash\r\necho oi\r\n' > ~/lab/crlf.sh && chmod +x ~/lab/crlf.sh
~/lab/crlf.sh                                  # /usr/bin/env: 'bash\r': No such file or directory
head -1 ~/lab/crlf.sh | od -c | head -2        # o \r aparece no fim da primeira linha
```

Diagnóstico: o kernel lê a primeira linha (*shebang*) literalmente e procura um interpretador chamado `bash\r`. Correção: `sed -i 's/\r$//' ~/lab/crlf.sh` e rode de novo (imprime `oi`). Prevenção: `git config --global core.autocrlf input` e um editor configurado para fim de linha LF.

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
- **Desafio 4 (quebre e recupere: módulos 05, 11 e 15):** crie o repositório `~/lab/runbook-demo` com um `relatorio.sh` que imprime `linhas ERROR: N` contando com `grep -c ERROR ~/lab/dados/app.log`, e faça o commit inicial. Depois sabote o script de **três formas, uma de cada vez**: remova o bit `x`, converta para CRLF e faça `chmod 000` no `app.log`. Para cada falha, aplique o método (sintoma, hipótese, teste, correção) e faça um commit com a correção. **Verifique:** `cd ~/lab/runbook-demo && ./relatorio.sh | grep -c 'linhas ERROR:'` deve imprimir `1`, e `git log --oneline | wc -l` deve imprimir `4`.
- **Desafio 5 (quebre e recupere: módulos 03, 08 e 12):** faça `sudo cp /etc/fstab /etc/fstab.bak` na distro **de laboratório**, acrescente a linha `/dev/sdz9 /mnt/fantasma ext4 defaults 0 2` ao `/etc/fstab` e rode `sudo mount -a`. Leia o erro inteiro, descubra pelo `journalctl` ou `dmesg` o que o sistema registrou, e recupere de **duas** maneiras: restaurando o backup e, noutra rodada, mantendo a linha mas tornando-a inofensiva com `nofail`. **Verifique:** `sudo mount -a; echo $?` deve imprimir `0` ao final de cada uma das duas rodadas (e diferente de zero, tipicamente `32`, antes de corrigir).

## Erros comuns nesta fase

- Mudar várias coisas ao mesmo tempo (e não saber qual resolveu).
- Reiniciar o servidor **antes** de coletar evidências (logs, estado).
- Ler só a última linha do erro.
- Rodar `fsck` com o sistema montado.
- Desativar SELinux/firewall como "teste" e esquecer de religar.
- Não documentar a solução.
- Corrigir o sintoma (reiniciar o serviço) sem achar a causa raiz: o problema volta, geralmente na pior hora.
- Editar `/etc/fstab`, `sudoers` ou `sshd_config` sem backup e sem validar antes de sair (`mount -a`, `visudo -c`, `sshd -t`).
- Concluir "a rede caiu" só porque o `ping` falhou, ou "o arquivo sumiu" só porque a API devolveu 404: o código mostra o efeito, e não a causa.

## Ponte com módulos anteriores

Este módulo é o "módulo de todos os módulos": cada ferramenta abaixo já foi apresentada e agora vira instrumento de diagnóstico.

| Vem de | Como reaparece aqui |
|---|---|
| Módulos 02 e 04 — shell, `grep`, `awk` | Filtrar logs e saídas gigantes até sobrar a linha que explica o erro |
| Módulo 03 — caminhos e permissões | `ls -ld`, `namei -l` e o bit `x` nos diretórios do caminho |
| Módulo 05 — usuários e grupos | `id`, `sudo -u`, `getfacl` para responder "esse usuário pode ler isto?" |
| Módulo 06 — processos e systemd | `status`, `reset-failed`, estados do `ps`, sinais |
| Módulo 08 — discos e `fstab` | `df -i`, `fsck`, `mount -a` e as imagens em loop como cobaia |
| Módulo 09 — redes | A escada `ip` -> `ping` -> `dig` -> `curl` |
| Módulo 12 — logs | `journalctl -u`, `dmesg`, `logger` para deixar evidência |
| Módulo 13 — `/proc` e kernel | OOM, estado de processo, parâmetros do `sysctl` |
| Módulo 15 — Git | Versionar o runbook e as correções; `git diff` mostra "o que mudou" |

### Cenário 13 — Incidente integrador: "o arquivo existe, mas a API devolve 404"
Cenário: um serviço Python serve os arquivos de `~/lab/dados`, e de repente `app.log` passa a dar 404. O 404 sugere "arquivo não existe", mas a causa é outra, e você vai achá-la só com o método. Monte o ambiente:
```bash
sudo -v
sudo systemd-run --unit=api-lab -p User=$USER python3 -m http.server 5000 --directory "$HOME/lab/dados"
sleep 1
curl -sI localhost:5000/app.log | head -1            # HTTP/1.0 200 OK
chmod 000 ~/lab/dados/app.log                        # a "mudança" que ninguém lembra
curl -sI localhost:5000/app.log | head -1            # HTTP/1.0 404 File not found
```
Agora diagnostique, sem olhar a linha do `chmod`: (1) o arquivo existe? `ls -l ~/lab/dados/app.log`; (2) o serviço está vivo? `systemctl is-active api-lab`; (3) quem executa o serviço e o que consegue ler? `systemctl show api-lab -p User` e `sudo -u $USER test -r ~/lab/dados/app.log && echo ok || echo negado`; (4) o log da requisição: `journalctl -u api-lab --no-pager | tail -3`; (5) o caminho: `namei -l ~/lab/dados/app.log`. Causa raiz: `---------` no arquivo; o servidor trata qualquer erro de leitura como 404. Correção: `chmod 644 ~/lab/dados/app.log`; verificação: o `curl -sI` volta a dar `200`. Registre num runbook versionado (Git) e limpe com `sudo systemctl stop api-lab`.

A lição de integração: o **código HTTP descreve o que o servidor decidiu mostrar, e não a causa**. Quem leva você à causa são as ferramentas dos módulos anteriores.

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
