---
id: "12_logs_e_monitoramento"
title: "Módulo 12 — Logs e Monitoramento"
sidebar_label: "12 · Logs e Monitoramento"
sidebar_position: 12
---

# Módulo 12 — Logs e Monitoramento

> **Objetivo**: ler, filtrar e gerenciar logs (`/var/log`, rsyslog, journald, logrotate) e monitorar CPU, memória, disco e I/O com `top`, `vmstat`, `iostat`, `sar` e `lsof`, para responder "o que aconteceu?" e "o que está acontecendo?".
>
> **Pré-requisitos**: módulos 04 (texto) e 06 (systemd, processos).
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre os tópicos 108.2 e 108.3 do **LPIC-1 102** e "Monitoring/Logging" do **Linux+**. Referência: https://www.brendangregg.com/linuxperf.html

---

## O diário de bordo e o painel

Um servidor sem logs é uma caixa-preta: quando algo falha, você não tem como saber por quê. **Logs** são o diário (o que aconteceu, quando e por quem); **monitoramento** é o painel (como está agora). Os dois se complementam: o painel avisa que algo está errado, o diário explica por quê.

## Onde estão os logs

| Local | Conteúdo |
|---|---|
| `/var/log/syslog` (Debian) ou `/var/log/messages` (RHEL) | Mensagens gerais do sistema |
| `/var/log/auth.log` (Debian) ou `/var/log/secure` (RHEL) | Autenticação, `sudo`, SSH |
| `/var/log/kern.log` | Kernel |
| `/var/log/dpkg.log`, `/var/log/apt/` | Instalações de pacote |
| `/var/log/nginx/`, `/var/log/apache2/` | Servidores web |
| `journalctl` | Diário do systemd (binário) |

```bash
ls -lh /var/log
sudo tail -n 20 /var/log/syslog
sudo tail -f /var/log/auth.log               # acompanhar logins em tempo real
sudo grep -i "failed password" /var/log/auth.log | tail
```

> `[WSL]` Se não houver `/var/log/syslog`, instale e ative o rsyslog (`sudo apt install -y rsyslog && sudo systemctl enable --now rsyslog`) ou use o `journalctl`, que já funciona com systemd habilitado.

## O caminho de uma mensagem

1. Um programa registra via biblioteca (`syslog()`/`logger`).
2. **journald** (systemd) recebe e guarda em formato binário e indexado.
3. **rsyslog** (opcional) lê do journald e grava em **arquivos de texto** em `/var/log` e/ou envia a servidores remotos.

Cada mensagem tem **facility** (origem: `auth`, `kern`, `mail`, `daemon`, `local0`–`local7`) e **severidade** (de 0 a 7):

| 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| emerg | alert | crit | **err** | **warning** | notice | **info** | debug |

Quanto menor o número, mais grave.

## journalctl em profundidade

```bash
journalctl -b                         # desde o boot atual
journalctl -b -1                      # boot anterior
journalctl -u ssh                     # de um serviço
journalctl -u nginx --since "1 hour ago" --until "10 min ago"
journalctl -p err -b                  # prioridade err ou pior
journalctl -p warning..err
journalctl -f                         # seguir ao vivo
journalctl -k                         # só kernel (como dmesg)
journalctl _UID=1000                  # por usuário
journalctl -o json-pretty -n 1        # formato estruturado
journalctl --disk-usage
sudo journalctl --vacuum-time=7d      # limpa registros com mais de 7 dias
```

> `[TENTE VOCÊ]` Quem mais "fala" no seu sistema? Rode `journalctl -b -o short-iso --no-pager | awk '{print $3}' | sed 's/\[.*//; s/:$//' | sort | uniq -c | sort -rn | head -3`. Resposta: três linhas `contagem programa`, por exemplo `412 systemd` e `98 kernel`. Raciocínio: a coluna 3 do formato `short-iso` é o programa (com PID entre colchetes, que o `sed` remove); o resto é o `sort | uniq -c | sort -rn` do Módulo 04. O journal é só texto estruturado, e todas as ferramentas que você já conhece se aplicam.

> `[ATENÇÃO]` Se o `journalctl` mostrar a dica `You are currently not seeing messages from other users and the system`, seu usuário não está nos grupos `adm` ou `systemd-journal`. Confira com `id -nG`. No Ubuntu o primeiro usuário já está em `adm`; em contas novas, use `sudo journalctl` ou `sudo usermod -aG systemd-journal $USER` (Módulo 05).

Para o journal **persistir** entre reboots: `sudo mkdir -p /var/log/journal && sudo systemctl restart systemd-journald` (ou `Storage=persistent` em `/etc/systemd/journald.conf`).

## Gerando mensagens: logger

```bash
logger "Backup concluído"                       # entra no log com tag do usuário
logger -p auth.warning -t meuapp "tentativa suspeita"
journalctl -t meuapp -n 3
```

Seus scripts (Módulo 11) devem usar `logger` ou gravar em arquivo com data, e não só imprimir na tela.

> `[TENTE VOCÊ]` Grave uma mensagem de erro e recupere só os erros. Rode `logger -p user.err -t lab12 "disco quase cheio"; logger -p user.info -t lab12 "tudo certo"; journalctl -t lab12 -p err --no-pager -o cat`. Resposta: só `disco quase cheio` aparece. Raciocínio: `-p err` mostra a severidade 3 **e piores**; o `info` (6) é mais leve e fica de fora. Troque por `-p info` e as duas voltam. É assim que alertas de produção separam ruído de problema.

## rsyslog: regras e envio remoto

Em `/etc/rsyslog.conf` e `/etc/rsyslog.d/*.conf`, cada regra liga *seletor → destino*:

```
auth,authpriv.*      /var/log/auth.log
*.*;auth,authpriv.none  -/var/log/syslog
local3.*             /var/log/meuapp.log
*.*                  @@servidor-de-logs:514      # envia por TCP (@ = UDP)
```

```bash
sudo systemctl restart rsyslog
logger -p local3.info "teste"; tail -1 /var/log/meuapp.log
```

Centralizar logs num servidor evita perdê-los se a máquina for comprometida.

## logrotate: impedir que o log encha o disco

Arquivos de log crescem sem parar. O **logrotate** gira (renomeia), comprime e apaga logs antigos. Cada aplicação tem um arquivo em `/etc/logrotate.d/`:

```bash
sudo tee /etc/logrotate.d/meuapp >/dev/null <<'EOF'
/var/log/meuapp.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 syslog adm
}
EOF
sudo logrotate -d /etc/logrotate.d/meuapp     # -d: simulação (debug), não executa
sudo logrotate -f /etc/logrotate.d/meuapp     # força a rotação agora
ls -l /var/log/meuapp.log*
```

> `[ATENÇÃO]` Disco cheio por log é uma das causas mais comuns de queda de serviço. Confira `du -sh /var/log/* | sort -h | tail` e garanta rotação para **todo** log novo.

> `[ATENÇÃO]` Para acompanhar um log que sofre rotação use `tail -F` (maiúsculo), não `tail -f`. O `-f` segue o **arquivo aberto** (que depois da rotação virou `.1`) e fica mudo; o `-F` reabre o arquivo pelo nome.

## Monitoramento: CPU, memória, disco e I/O

Cinco recursos para olhar, sempre nesta ordem de leitura:

```bash
uptime                       # load average (compare com nproc)
free -h                      # memória: observe "available", não "free"
vmstat 1 5                   # r (fila CPU), si/so (swap), us/sy/id (CPU), wa (espera I/O)
mpstat -P ALL 1 3            # por núcleo        (sudo apt install sysstat)
iostat -xz 1 3               # disco: %util, await (latência)
sar -u 1 5                   # histórico de CPU (sar -r memória, -d disco, -n DEV rede)
top -b -n1 | head -15        # instantâneo
```

> `[TEORIA]` Em `free -h`, "free" baixo **não** é problema: o Linux usa RAM livre como *cache* de disco e a devolve quando preciso. Olhe a coluna **available**. O sinal de pressão real é uso de **swap** (`si`/`so` no `vmstat`) e processos sendo mortos pelo **OOM killer**.

> `[TENTE VOCÊ]` Faça um mini-diagnóstico de recursos em 20 segundos. Rode `free -m | awk '/Mem:/{printf "usado %d%% | disponível %d MB\n", ($2-$7)*100/$2, $7}'` e `vmstat 1 3`. Resposta: a primeira linha mostra o uso real (total menos *available*, não menos *free*); no `vmstat`, **ignore a primeira linha** (é a média desde o boot) e leia as duas seguintes. Raciocínio: `r` alto = fila de CPU; `si`/`so` diferentes de zero = swap; `wa` alto = processos esperando disco. Se tudo estiver perto de zero, o sistema está ocioso, o que é um bom resultado.

### Quem está usando o quê: lsof

```bash
sudo lsof -p <PID>                 # arquivos abertos por um processo
sudo lsof -i :80                   # quem usa a porta 80
sudo lsof +D /var/log              # quem tem arquivos abertos nesta pasta
sudo lsof | grep deleted           # arquivos apagados mas ainda abertos (ocupam espaço!)
```

Esse último é um clássico: o disco continua cheio depois de apagar um log gigante porque um processo ainda o mantém aberto; reinicie o processo para liberar.

> `[TENTE VOCÊ]` Reproduza o "arquivo apagado mas aberto". Rode `( exec 3>~/lab/fantasma.log; exec sleep 120 ) & sleep 1; rm ~/lab/fantasma.log; ls -l /proc/$!/fd | grep deleted; kill $!`. Resposta: uma linha como `3 -> /home/voce/lab/fantasma.log (deleted)`. Raciocínio: o `rm` só tira o **nome** do arquivo; o espaço só é devolvido quando o último processo que o mantém aberto fecha o descritor. Aqui o `/proc/PID/fd` mostra o descritor ainda vivo — mesma informação do `lsof | grep deleted`, mas sem instalar nada.

### Gerando carga para observar

```bash
sudo apt install -y stress-ng sysstat
stress-ng --cpu 2 --timeout 30s &
vmstat 1 5          # veja 'us' subir
```

![Saída do vmstat durante um teste de stress-ng com a coluna de CPU de usuário (us) alta](screenshots/12-logs-e-monitoramento/01-vmstat-stress-ng.png)
> `[PRINT]` Passo a passo para capturar: iniciar `stress-ng --cpu 2 --timeout 30s &`, rodar `vmstat 1 8` e capturar a saída com o aumento da coluna `us`.

## Laboratórios

### Lab 1 — Investigando logs
1. Liste os 10 maiores arquivos de `/var/log`.
2. Mostre os últimos erros do boot atual: `journalctl -p err -b`.
3. Gere uma falha de login (`su - inexistente`) e ache-a em `auth.log`/`journalctl`.

### Lab 2 — Logs próprios
1. Escreva um script que registre com `logger -t meuapp` o início e o fim, e consulte com `journalctl -t meuapp`.
2. Crie um `logrotate` para `~/lab/meuapp.log` (diário, 5 rotações, comprimido) e force a rotação.

### Lab 3 — Monitorando
1. Gere carga de CPU e observe no `top`, `vmstat` e `mpstat`.
2. Gere pressão de I/O (`dd if=/dev/zero of=teste bs=1M count=500 oflag=direct`) e observe com `iostat -xz`.
3. Crie o cenário do "arquivo apagado ainda aberto" e prove com `lsof | grep deleted`.

### Lab 4 — Logrotate sem root
Cenário: você quer testar uma política de rotação antes de levá-la a `/etc/logrotate.d/`. O `logrotate` roda como usuário comum se você apontar seu próprio arquivo de estado.
```bash
cd ~/lab
cat > logrotate.conf <<EOF
$HOME/lab/app-rot.log {
    size 1k
    rotate 3
    compress
    missingok
    notifempty
}
EOF
for rodada in 1 2 3 4; do
  seq 1 200 | sed "s/^/rodada $rodada linha /" > ~/lab/app-rot.log
  logrotate -f -s ~/lab/logrotate.state ~/lab/logrotate.conf
done
ls -l ~/lab/app-rot.log*
```
Esperado: `app-rot.log.1.gz`, `.2.gz` e `.3.gz` — **no máximo 3** rotações, apesar de 4 rodadas (a mais antiga foi descartada). Confirme com `zcat ~/lab/app-rot.log.1.gz | head -1` (`rodada 4 linha 1`) e `zcat ~/lab/app-rot.log.3.gz | head -1` (`rodada 2 linha 1`). Teste a simulação com `logrotate -d -s ~/lab/logrotate.state ~/lab/logrotate.conf`.

### Lab 5 — Disco "cheio" depois de apagar o log
Cenário: o alerta diz 95% de uso; alguém apagou o log gigante e o `df` não mudou. Você reproduz e resolve sem reiniciar o serviço.
```bash
fallocate -l 100M ~/lab/gigante.log
( exec 3<>~/lab/gigante.log; exec sleep 300 ) &
PID=$!
sleep 1
df --output=used -m ~/lab | tail -1                 # uso atual (MB)
rm ~/lab/gigante.log
df --output=used -m ~/lab | tail -1                 # NÃO caiu
ls -l /proc/$PID/fd | grep deleted                  # o culpado
: > /proc/$PID/fd/3                                 # trunca o arquivo apagado
df --output=used -m ~/lab | tail -1                 # caiu cerca de 100 MB
kill $PID
```
Esperado: o uso fica igual após o `rm` e cai ~100 MB após o truncamento. Em produção, essa técnica (ou reiniciar o processo) é como se libera espaço quando o serviço não pode parar. A solução definitiva é o `logrotate` com `copytruncate` ou um sinal de reabertura (`postrotate`).

### Lab 6 — Roteando por severidade com rsyslog
Cenário: o time de plantão quer um arquivo só com os erros da aplicação "pedidos", separado do log geral.
```bash
sudo apt install -y rsyslog
sudo tee /etc/rsyslog.d/30-pedidos.conf >/dev/null <<'EOF'
local3.*     /var/log/pedidos.log
local3.err   /var/log/pedidos-erros.log
EOF
sudo systemctl restart rsyslog
logger -p local3.info -t pedidos "pedido 1001 criado"
logger -p local3.err  -t pedidos "falha ao gravar pedido 1002"
sudo cat /var/log/pedidos.log
sudo cat /var/log/pedidos-erros.log
```
Esperado: `pedidos.log` tem as duas mensagens; `pedidos-erros.log` apenas a de falha. Limpeza: `sudo rm /etc/rsyslog.d/30-pedidos.conf /var/log/pedidos*.log; sudo systemctl restart rsyslog`.

### Desafios

- **Desafio 1:** um mini-dashboard no terminal com `watch -n2` que mostre CPU, memória, disco e top 3 processos.
- **Desafio 2:** script que, a cada minuto, escreve `data cpu% mem% disco%` em CSV (base do monitoramento do Módulo 24).
- **Desafio 3:** explique o significado de cada coluna do `vmstat` e identifique, numa saída de exemplo, se o gargalo é CPU, memória ou disco.
- **Desafio 4:** crie `alerta.sh <tag> <limite>` que conta as mensagens de severidade `err` ou pior com aquela tag nos últimos 5 minutos e sai com código `2` se passarem do limite (e `0` caso contrário), usando `journalctl`. **Verifique:** depois de `logger -p user.err -t d4 a; logger -p user.err -t d4 b`, o comando `./alerta.sh d4 1; echo $?` imprime `2` e `./alerta.sh d4 5; echo $?` imprime `0`.

## Erros comuns nesta fase

- Interpretar `free` baixo como falta de memória.
- Esquecer a rotação de logs e encher o disco.
- Apagar log gigante sem reiniciar o processo (espaço não é liberado).
- Procurar só em `/var/log` e esquecer o journal.
- Não persistir o journald e perder logs do boot anterior.
- Usar `tail -f` num log com rotação (o correto é `tail -F`) e achar que o serviço parou de logar.
- Gravar scripts que só imprimem na tela: sem `logger` ou arquivo, ninguém consegue investigar o que rodou às 3h da manhã.
- Escrever uma regra de `logrotate` e não testá-la com `logrotate -d` antes de colocá-la em produção.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 04 (`grep`, `awk`, `sort`, `uniq -c`) | Todo log é texto: contar erros, agrupar por hora, achar o pico |
| Módulo 05 (grupos, permissões) | Quem lê `/var/log` e o journal (`adm`, `systemd-journal`); `create 0640 syslog adm` no logrotate |
| Módulo 06 (systemd, `journalctl -u`) | O journal é o log dos serviços que você criou lá |
| Módulo 09 (SSH, `ss`) | Tentativas de login inválidas e conexões aparecendo em `auth.log`/journal |
| Módulo 11 (scripts, `logger`, timers) | O script grava no journal com `logger`; o timer o executa periodicamente |

### Lab integrador — Quando foi o pico de erros?
Cenário: o suporte reporta lentidão "à tarde". Você analisa o `access.log` do laboratório, descobre a hora do pico de erros 5xx e registra o achado no journal com tag própria, para que outras ferramentas (e colegas) o encontrem.
1. (Módulos 04 e 11) O script:
```bash
cat > ~/lab/scripts/incidente.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
LOG=${1:-$HOME/lab/dados/access.log}
[[ -r "$LOG" ]] || { echo "log ilegível: $LOG" >&2; exit 1; }
echo "Erros 5xx por hora:"
awk '$9 ~ /^5/ {c[substr($4,14,2)]++} END{for (h in c) print h"h", c[h]}' "$LOG" | sort
pico=$(awk '$9 ~ /^5/ {h=substr($4,14,2); c[h]++} END{for (h in c) if (c[h]>m) {m=c[h]; mh=h}; print mh"h", m}' "$LOG")
echo "Pico: $pico"
logger -p user.warning -t incidente "pico de 5xx: $pico"
EOF
chmod +x ~/lab/scripts/incidente.sh
~/lab/scripts/incidente.sh
```
Esperado: uma tabela `HHh N` (uma linha por hora com erros) e a linha `Pico: HHh N` com o maior valor da tabela. Se o `access.log` não existir, rode `~/lab/gera-lab.sh`.
2. (Módulo 06) Recupere o registro no journal:
```bash
journalctl -t incidente -p warning -o cat -n 1 --no-pager
```
Esperado: `pico de 5xx: HHh N`, igual à linha `Pico:` do passo anterior.
3. (Módulo 05) Verifique quem teria acesso a esse tipo de log: `id -nG | tr ' ' '\n' | grep -E '^(adm|systemd-journal)$'` e `ls -ld /var/log`. Explique por que o `logrotate` do Lab 2 usa `create 0640 syslog adm`.
4. (Módulo 11) Encapsule em um serviço de uma execução, para que o timer do Módulo 11 possa chamá-lo: crie `incidente.service` com `Type=oneshot` e `ExecStart=$HOME/lab/scripts/incidente.sh` (como no Lab integrador do Módulo 11), rode `sudo systemctl start incidente.service` e confirme com `journalctl -u incidente.service -o cat --no-pager | tail -3`. Remova a unit ao terminar.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| `journalctl`, logs de serviços | Troubleshooting — Módulo 16 |
| `grep`/`awk` em logs | Módulo 04 (reaplicado aqui) |
| Métricas de sistema | Prometheus e Grafana — Módulo 24 |
| Logs centralizados | Loki/ELK — Módulo 24; Log Analytics no Azure |
| Auditoria | Segurança — Módulos 10 e 25 |

## `[REFERÊNCIA]`

- `man7.org` — `journalctl(1)`, `rsyslog.conf(5)`, `logrotate(8)`: https://man7.org/linux/man-pages/
- systemd — `journald.conf`: https://www.freedesktop.org/software/systemd/man/journald.conf.html
- Brendan Gregg — *Linux Performance* e USE Method: https://www.brendangregg.com/linuxperf.html
- sysstat (`sar`, `iostat`, `mpstat`): https://github.com/sysstat/sysstat
- Red Hat — *Viewing and managing log files*: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/auditing-the-system_security-hardening
- LPI — objetivos 108.2 e 108.3: https://www.lpi.org/our-certifications/exam-102-objectives/

**Como aprofundar:** o **USE Method** do Brendan Gregg (Utilização, Saturação, Erros por recurso) é o roteiro mental que organiza qualquer análise de desempenho.

## Checklist de saída

- [ ] Localizar os principais logs do sistema e dos serviços.
- [ ] Explicar o papel de journald e rsyslog e ler facility/severidade.
- [ ] Filtrar com `journalctl` por serviço, tempo, prioridade e boot.
- [ ] Gerar mensagens com `logger` e configurar o `logrotate`.
- [ ] Interpretar `uptime`, `free`, `vmstat`, `iostat` e `sar`.
- [ ] Explicar por que "free" baixo não significa falta de memória.
- [ ] Achar "arquivo apagado mas aberto" com `lsof`.
