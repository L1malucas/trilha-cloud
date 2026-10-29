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

Para o journal **persistir** entre reboots: `sudo mkdir -p /var/log/journal && sudo systemctl restart systemd-journald` (ou `Storage=persistent` em `/etc/systemd/journald.conf`).

## Gerando mensagens: logger

```bash
logger "Backup concluído"                       # entra no log com tag do usuário
logger -p auth.warning -t meuapp "tentativa suspeita"
journalctl -t meuapp -n 3
```

Seus scripts (Módulo 11) devem usar `logger` ou gravar em arquivo com data, e não só imprimir na tela.

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

### Quem está usando o quê: lsof

```bash
sudo lsof -p <PID>                 # arquivos abertos por um processo
sudo lsof -i :80                   # quem usa a porta 80
sudo lsof +D /var/log              # quem tem arquivos abertos nesta pasta
sudo lsof | grep deleted           # arquivos apagados mas ainda abertos (ocupam espaço!)
```

Esse último é um clássico: o disco continua cheio depois de apagar um log gigante porque um processo ainda o mantém aberto; reinicie o processo para liberar.

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

### Desafios

- **Desafio 1:** um mini-dashboard no terminal com `watch -n2` que mostre CPU, memória, disco e top 3 processos.
- **Desafio 2:** script que, a cada minuto, escreve `data cpu% mem% disco%` em CSV (base do monitoramento do Módulo 24).
- **Desafio 3:** explique o significado de cada coluna do `vmstat` e identifique, numa saída de exemplo, se o gargalo é CPU, memória ou disco.

## Erros comuns nesta fase

- Interpretar `free` baixo como falta de memória.
- Esquecer a rotação de logs e encher o disco.
- Apagar log gigante sem reiniciar o processo (espaço não é liberado).
- Procurar só em `/var/log` e esquecer o journal.
- Não persistir o journald e perder logs do boot anterior.

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
