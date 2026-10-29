---
id: "06_processos_e_servicos"
title: "Módulo 06 — Processos e Serviços"
sidebar_label: "06 · Processos e Serviços"
sidebar_position: 6
---

# Módulo 06 — Processos e Serviços

> **Objetivo**: enxergar e controlar o que está rodando — processos, sinais, prioridades, jobs, terminais (TTY/PTS), `tmux` — e gerenciar serviços com o systemd: units, `systemctl`, `journalctl`, targets e a sequência de boot.
>
> **Pré-requisitos**: módulos 02 e 05; systemd habilitado no WSL (Módulo 00).
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre os tópicos 101.2, 101.3, 103.5 e 103.6 do **LPIC-1** e "System management" do **Linux+**. Referência: https://www.freedesktop.org/software/systemd/man/

---

## Programa x processo

Um **programa** é um arquivo em disco (a receita). Um **processo** é esse programa **em execução** (a receita sendo cozinhada), com memória, identidade e estado próprios. Cada processo tem:

- **PID** (identificador) e **PPID** (o pai que o criou). Tudo nasce de outro processo (`fork`); o ancestral de todos é o PID 1 (`systemd`).
- **UID/GID** do usuário dono (Módulo 05).
- **Estado**: *R* rodando, *S* dormindo (esperando), *D* esperando I/O, *T* parado, *Z* **zumbi** (terminou, mas o pai não "coletou" o resultado).

```bash
ps                         # processos deste terminal
ps aux                     # todos (a todos usuários, u formato usuário, x sem terminal)
ps -ef --forest | head -20 # árvore pai/filho
ps -o pid,ppid,user,stat,%cpu,%mem,cmd -p $$
pstree -p | head           # árvore compacta
pgrep -a nginx             # PIDs por nome
top                        # monitor ao vivo (q sai; M ordena por memória; P por CPU)
htop                       # versão melhor (sudo apt install htop)
uptime                     # load average (1, 5, 15 min)
```

> `[TEORIA]` O **load average** é o número médio de processos *querendo* CPU. Em uma máquina de 4 núcleos, load 4.0 é "cheio"; 8.0 indica fila. Compare sempre com `nproc`.

## Sinais: conversar com processos

Um **sinal** é uma notificação ao processo. O processo pode tratá-lo ou, em alguns casos, o kernel decide por ele.

| Sinal | Nº | Efeito |
|---|---|---|
| `SIGTERM` | 15 | "Por favor, termine" (permite limpar) — **padrão do `kill`** |
| `SIGKILL` | 9 | Mata na hora, sem chance de limpeza (não pode ser capturado) |
| `SIGHUP` | 1 | "Recarregue a configuração" (muitos daemons) |
| `SIGINT` | 2 | O que o `Ctrl+C` envia |
| `SIGSTOP`/`SIGCONT` | 19/18 | Pausar / retomar |

```bash
sleep 600 &                # cria um processo para treinar
pgrep sleep
kill <PID>                 # envia SIGTERM
kill -9 <PID>              # SIGKILL (último recurso)
kill -HUP <PID>            # recarregar
pkill -f "sleep 600"       # por nome/linha de comando
killall sleep              # por nome exato
```

> `[ATENÇÃO]` Comece sempre por `kill` (SIGTERM) e só use `-9` se o processo não reagir: o `SIGKILL` não deixa o programa fechar arquivos nem liberar recursos, podendo corromper dados.

## Prioridade: nice e renice

O valor **nice** vai de -20 (mais prioridade) a 19 (menos). Usuário comum só pode *aumentar* o nice (ser "mais gentil"); aumentar a prioridade exige root.

```bash
nice -n 10 comando_pesado          # inicia com baixa prioridade
renice -n 5 -p <PID>               # altera um processo existente
ps -o pid,ni,cmd -p <PID>
```

## Jobs: primeiro e segundo plano

Um **job** é um processo controlado pelo seu shell. Útil para não "perder" o terminal.

```bash
sleep 300 &                 # & inicia em segundo plano
jobs                        # lista os jobs deste shell
sleep 500                   # rodando em primeiro plano... aperte Ctrl+Z (suspende)
bg %1                       # manda o job 1 continuar em segundo plano
fg %1                       # traz para o primeiro plano
nohup ./longo.sh > saida.log 2>&1 &   # sobrevive ao fechamento do terminal
disown %1                   # desvincula o job do shell
```

## Terminais, sessões e tmux

Cada terminal é um **TTY** (`/dev/pts/N` em terminais gráficos/SSH). Veja quem está conectado:

```bash
tty                 # seu terminal atual (ex.: /dev/pts/0)
who                 # usuários logados e seus terminais
w                   # + o que cada um executa
last -n 5           # histórico de logins
```

Se a conexão cair, processos em primeiro plano morrem junto com o terminal. O **multiplexador de terminal** resolve: o `tmux` mantém sessões vivas no servidor, você "desconecta" e "reconecta" depois — indispensável em SSH.

```bash
sudo apt install -y tmux
tmux new -s lab                 # nova sessão chamada lab
# Dentro do tmux (prefixo Ctrl+b):
#   Ctrl+b %   divide na vertical     Ctrl+b "   divide na horizontal
#   Ctrl+b setas  navega entre painéis
#   Ctrl+b d   DESANEXA (a sessão continua rodando)
tmux ls                         # lista sessões
tmux attach -t lab              # volta para a sessão
tmux kill-session -t lab
```

![tmux com três painéis: um com `top`, outro com `tail -f` de um log e outro com o shell livre](screenshots/06-processos-e-servicos/01-tmux-tres-paineis.png)
> `[PRINT]` Passo a passo para capturar: `tmux new -s lab`, dividir em 3 painéis (`Ctrl+b %` e `Ctrl+b "`), rodar `top` em um, `tail -f ~/lab/dados/app.log` em outro. Capturar a tela inteira.

## systemd: o gerente de serviços

O **systemd** é o PID 1 na maioria das distros modernas: inicia o sistema, sobe serviços na ordem certa (paralelo, por dependências), monitora e reinicia o que cai, e guarda logs. Ele trabalha com **units** (descrições em arquivo):

| Tipo | Para quê |
|---|---|
| `.service` | Um serviço/daemon (nginx, sshd) |
| `.target` | Grupo de units = estado do sistema (como os antigos *runlevels*) |
| `.timer` | Agendamento (substituto do cron) |
| `.mount`, `.socket`, `.path` | Montagens, sockets, observação de arquivos |

**Targets** principais: `multi-user.target` (servidor, sem interface), `graphical.target`, `rescue.target`, `emergency.target`.

```bash
systemctl status ssh                 # estado, PID, últimos logs
sudo systemctl start nginx           # inicia agora
sudo systemctl stop nginx
sudo systemctl restart nginx         # para e inicia
sudo systemctl reload nginx          # recarrega config sem derrubar
sudo systemctl enable nginx          # inicia NO BOOT
sudo systemctl enable --now nginx    # enable + start
sudo systemctl disable nginx
systemctl is-active nginx            # active/inactive
systemctl is-enabled nginx
systemctl list-units --type=service --state=running
systemctl --failed                   # serviços que falharam
systemctl get-default                # target padrão
systemctl list-dependencies multi-user.target | head
```

> `[ATENÇÃO]` `start` e `enable` são coisas diferentes: `start` liga **agora**; `enable` liga **no próximo boot**. Quase todo iniciante esquece um dos dois. Use `enable --now`.

### Criando um serviço seu

```bash
mkdir -p ~/lab/servico && cat > ~/lab/servico/ola.sh <<'EOF'
#!/usr/bin/env bash
while true; do echo "Olá do serviço: $(date)"; sleep 5; done
EOF
chmod +x ~/lab/servico/ola.sh

sudo tee /etc/systemd/system/ola.service >/dev/null <<EOF
[Unit]
Description=Serviço de teste Olá
After=network.target

[Service]
ExecStart=$HOME/lab/servico/ola.sh
Restart=on-failure
RestartSec=3
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload          # relê os arquivos de unit
sudo systemctl enable --now ola
systemctl status ola
journalctl -u ola -f                  # logs ao vivo (Ctrl+C sai)
```

Leia as seções: `[Unit]` descreve e define ordem/dependências, `[Service]` diz *como* rodar (`ExecStart`, `Restart`), `[Install]` diz *em que target* habilitar.

> `[ATENÇÃO]` Depois de criar ou editar uma unit, rode **`systemctl daemon-reload`**. Sem isso o systemd continua com a versão antiga na memória.

## journalctl: os logs do systemd

```bash
journalctl -u ola                     # logs de uma unit
journalctl -u ola --since "10 min ago"
journalctl -p err -b                  # só erros desde o último boot
journalctl -f                         # seguir ao vivo
journalctl -b -1                      # boot anterior
journalctl --disk-usage
```

## Boot: o caminho do botão ao login

1. **Firmware (BIOS/UEFI)** testa o hardware e acha o disco de boot.
2. **Bootloader (GRUB)** carrega o kernel e o *initramfs* (mini-sistema temporário).
3. **Kernel** inicializa hardware e monta a raiz `/`.
4. **systemd (PID 1)** sobe os serviços até o target padrão.
5. **Login**.

> `[WSL]` No WSL não há firmware/GRUB: o Windows inicia o kernel direto. O ciclo de GRUB, `rescue.target` e recuperação é estudado aqui na teoria (e no Módulo 16 via simulação). Para praticar GRUB de verdade, use uma VM (Multipass ou VirtualBox).

## Laboratórios

### Lab 1 — Caçando processos
1. Inicie `sleep 1000 &` três vezes; liste com `pgrep -a sleep`; mate um com `kill`, outro com `kill -9`, o terceiro com `pkill`.
2. Com `top`, ordene por memória (`M`) e identifique o processo que mais consome.
3. Gere carga (`yes > /dev/null &`), observe no `top`, ajuste com `renice`, e mate.

### Lab 2 — Jobs e tmux
1. Rode `sleep 600`, suspenda (`Ctrl+Z`), mande para o fundo (`bg`) e traga de volta (`fg`).
2. Crie uma sessão tmux com `top` e `tail -f`, desanexe, feche o terminal, abra outro e reanexe.

### Lab 3 — Meu serviço no systemd
1. Crie o `ola.service` acima, habilite e veja o log.
2. Faça `sudo kill -9 $(systemctl show -p MainPID --value ola)` e confirme que ele **reinicia sozinho** (`Restart=on-failure`).
3. Mude o `RestartSec`, rode `daemon-reload` e `restart`.

### Desafios

- **Desafio 1:** crie um serviço que escreve a data no `/tmp/hb.log` a cada 10 s, reinicia ao falhar e sobe no boot. Prove cada propriedade.
- **Desafio 2:** descubra, usando `systemctl list-dependencies` e `systemd-analyze blame`, os 5 serviços mais lentos do boot.
- **Desafio 3:** explique a diferença entre um processo zumbi e um processo órfão e como gerar um zumbi em laboratório.

**Limpeza:** `sudo systemctl disable --now ola; sudo rm /etc/systemd/system/ola.service; sudo systemctl daemon-reload`.

## Erros comuns nesta fase

- Usar `kill -9` primeiro.
- Esquecer `enable` (o serviço some no reboot) ou `start`.
- Esquecer o `daemon-reload` após editar uma unit.
- Perder trabalho por não usar `tmux`/`nohup` em sessões SSH.
- Confundir load average com porcentagem de CPU.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| systemd, units | Serviços — Módulo 17; timers — Módulo 11 |
| `journalctl` | Logs — Módulo 12; troubleshooting — Módulo 16 |
| Sinais, processos | Containers — Módulo 14 e 20 |
| Boot e targets | Recuperação — Módulo 16 |
| Load e prioridades | Observabilidade — Módulo 24 |

## `[REFERÊNCIA]`

- systemd — man pages: https://www.freedesktop.org/software/systemd/man/
- `man7.org` — `signal(7)`, `proc(5)`: https://man7.org/linux/man-pages/man7/signal.7.html
- tmux wiki: https://github.com/tmux/tmux/wiki
- Red Hat — *Managing systemd*: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_basic_system_settings/managing-system-services-with-systemctl_configuring-basic-system-settings
- Brendan Gregg — Linux performance: https://www.brendangregg.com/linuxperf.html
- LPI — objetivos 101.3 e 103.5: https://www.lpi.org/our-certifications/exam-101-objectives/

**Como aprofundar:** `man systemd.service`, `man systemd.unit` e a série "systemd for Administrators" de Lennart Poettering.

## Checklist de saída

- [ ] Diferenciar programa e processo; ler PID, PPID e estados (incluindo zumbi).
- [ ] Usar `ps`, `top`/`htop`, `pgrep` e interpretar o load average.
- [ ] Enviar sinais corretos (`TERM`, `KILL`, `HUP`) e saber quando usar cada um.
- [ ] Usar `nice`/`renice`, jobs (`&`, `fg`, `bg`), `nohup`.
- [ ] Manter sessões vivas com `tmux`.
- [ ] Explicar units, targets, `enable` x `start` e `daemon-reload`.
- [ ] Criar um serviço próprio com `Restart` e ler seus logs.
- [ ] Descrever as etapas do boot (firmware → GRUB → kernel → systemd).
