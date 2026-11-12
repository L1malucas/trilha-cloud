---
id: '06_processos_e_servicos'
title: 'Módulo 06 — Processos e Serviços'
sidebar_label: '06 · Processos e Serviços'
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
- **Estado**: _R_ rodando, _S_ dormindo (esperando), _D_ esperando I/O, _T_ parado, _Z_ **zumbi** (terminou, mas o pai não "coletou" o resultado).

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

> `[TEORIA]` O **load average** é o número médio de processos _querendo_ CPU. Em uma máquina de 4 núcleos, load 4.0 é "cheio"; 8.0 indica fila. Compare sempre com `nproc`.

> `[TENTE VOCÊ]` Seu WSL está sob pressão? Rode `uptime; nproc`. Resposta: se `uptime` mostra `load average: 0.15, 0.10, 0.05` e `nproc` mostra `4`, o sistema está folgado (0,15 de 4 núcleos). Raciocínio: você nunca lê o load sozinho; divide pelo número de núcleos. Load 4 em 4 núcleos é "cheio"; load 4 em 16 núcleos é tranquilo.

## Sinais: conversar com processos

Um **sinal** é uma notificação ao processo. O processo pode tratá-lo ou, em alguns casos, o kernel decide por ele.

| Sinal               | Nº    | Efeito                                                       |
| ------------------- | ----- | ------------------------------------------------------------ |
| `SIGTERM`           | 15    | "Por favor, termine" (permite limpar) — **padrão do `kill`** |
| `SIGKILL`           | 9     | Mata na hora, sem chance de limpeza (não pode ser capturado) |
| `SIGHUP`            | 1     | "Recarregue a configuração" (muitos daemons)                 |
| `SIGINT`            | 2     | O que o `Ctrl+C` envia                                       |
| `SIGSTOP`/`SIGCONT` | 19/18 | Pausar / retomar                                             |

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

> `[TENTE VOCÊ]` Pause e retome um processo sem matá-lo. Rode `sleep 300 & kill -STOP $!; ps -o pid,stat,cmd -p $!` e depois `kill -CONT $!; ps -o pid,stat,cmd -p $!; kill $!`. Resposta: no primeiro `ps` o STAT é `T` (parado); no segundo volta a `S` (dormindo). Raciocínio: `$!` guarda o PID do último job em segundo plano, então você não precisa copiar número nenhum. `STOP`/`CONT` são o "pause/play" do processo — o programa nem fica sabendo.

> `[TENTE VOCÊ]` Fabrique um zumbi e veja o estado `Z`. Rode `python3 -c 'import os,time; os.fork() or os._exit(0); time.sleep(60)' & sleep 1; ps -o pid,ppid,stat,cmd --ppid $!` e depois `kill $!`. Resposta: aparece uma linha com STAT `Z` e o comando `[python3] <defunct>`. Raciocínio: o filho terminou na hora (`_exit(0)`), mas o pai está dormindo e não chamou `wait()` para coletar o resultado; o kernel mantém a "certidão de óbito" na tabela de processos. Ao matar o pai, o systemd (PID 1) adota o zumbi e o limpa.

## Prioridade: nice e renice

O valor **nice** vai de -20 (mais prioridade) a 19 (menos). Usuário comum só pode _aumentar_ o nice (ser "mais gentil"); aumentar a prioridade exige root.

```bash
nice -n 10 comando_pesado          # inicia com baixa prioridade
renice -n 5 -p <PID>               # altera um processo existente
ps -o pid,ni,cmd -p <PID>
```

> `[ATENÇÃO]` Usuário comum só aumenta o nice. Teste: `sleep 200 & renice -n 5 -p $!` funciona; depois `renice -n -5 -p $!` falha com `Permission denied`. Para baixar o nice você precisa de `sudo`. Repare que, uma vez aumentado, você não consegue "voltar atrás" sem root — é de propósito, para um usuário não furar fila.

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

| Tipo                         | Para quê                                                         |
| ---------------------------- | ---------------------------------------------------------------- |
| `.service`                   | Um serviço/daemon (nginx, sshd)                                  |
| `.target`                    | Grupo de units = estado do sistema (como os antigos _runlevels_) |
| `.timer`                     | Agendamento (substituto do cron)                                 |
| `.mount`, `.socket`, `.path` | Montagens, sockets, observação de arquivos                       |

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

Leia as seções: `[Unit]` descreve e define ordem/dependências, `[Service]` diz _como_ rodar (`ExecStart`, `Restart`), `[Install]` diz _em que target_ habilitar.

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

> `[TENTE VOCÊ]` Leia os logs do boot atual sem se afogar. Rode `journalctl -b -p warning -n 5 --no-pager` e depois `journalctl -u ola -o cat -n 3 --no-pager` (se o `ola` já existir). Resposta: o primeiro mostra até 5 avisos/erros desde o boot (`-p warning` inclui `err` e acima); o segundo mostra só o texto da mensagem, sem data e host (`-o cat`). Raciocínio: filtre primeiro por prioridade (`-p`), depois por unit (`-u`), e só então por tempo (`--since`). Dessa forma você chega na linha certa em segundos.

## Boot: o caminho do botão ao login

1. **Firmware (BIOS/UEFI)** testa o hardware e acha o disco de boot.
2. **Bootloader (GRUB)** carrega o kernel e o _initramfs_ (mini-sistema temporário).
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

### Lab 4 — Limpando um serviço que ignora o SIGTERM

Cenário: um worker de fila precisa terminar a mensagem atual antes de sair. Se o systemd mata na marra, a mensagem se perde.

1. Crie o script e a unit:

```bash
mkdir -p ~/lab/servico && cat > ~/lab/servico/worker.sh <<'SH'
#!/usr/bin/env bash
trap 'echo "recebi SIGTERM, terminando a mensagem atual"; sleep 2; echo "encerrado limpo"; exit 0' TERM
echo "worker iniciado, PID $$"
while true; do sleep 1; done
SH
chmod +x ~/lab/servico/worker.sh
sudo tee /etc/systemd/system/worker.service >/dev/null <<EOF
[Unit]
Description=Worker com encerramento limpo

[Service]
ExecStart=$HOME/lab/servico/worker.sh
User=$USER
TimeoutStopSec=10
EOF
sudo systemctl daemon-reload && sudo systemctl start worker
```

2. Pare e leia o log: `sudo systemctl stop worker; journalctl -u worker -o cat -n 5 --no-pager`. Você deve ver as linhas "recebi SIGTERM" e "encerrado limpo".
3. Remova o `trap` (comente a linha), reinicie e pare de novo: o encerramento é imediato e sem mensagens. Moral: o `systemctl stop` envia `SIGTERM`; quem trata o sinal é o seu programa.
4. Limpeza: `sudo rm /etc/systemd/system/worker.service; sudo systemctl daemon-reload`.

### Lab 5 — Ajustando um serviço sem editar o original (drop-in)

Cenário: a unit vem de um pacote e você não deve editá-la (o upgrade sobrescreve). A solução profissional é um _drop-in_.

1. Com o `ola.service` do Lab 3 ativo, crie o ajuste:

```bash
sudo mkdir -p /etc/systemd/system/ola.service.d
sudo tee /etc/systemd/system/ola.service.d/override.conf >/dev/null <<'EOF'
[Service]
Restart=always
RestartSec=1
Environment=AMBIENTE=homolog
EOF
sudo systemctl daemon-reload && sudo systemctl restart ola
```

2. Confira o que o systemd enxerga: `systemctl cat ola` (mostra o arquivo original e o drop-in) e `systemctl show ola -p Restart -p RestartUSec`. Esperado: `Restart=always` e `RestartUSec=1s`.
3. Remova o diretório `ola.service.d`, rode `daemon-reload` e `restart`, e confirme que voltou para `on-failure`.

### Lab 6 — Processo transitório com systemd-run

Cenário: você precisa rodar uma tarefa pesada uma única vez, com baixa prioridade e visível como serviço, sem criar arquivo de unit.

1. `sudo systemd-run --unit=tarefa-lab --nice=10 sleep 300`
2. `systemctl status tarefa-lab --no-pager | head -8` e `ps -o pid,ni,cmd -C sleep`. O nice deve ser 10.
3. `sudo systemctl stop tarefa-lab` e confirme com `systemctl is-active tarefa-lab` (retorna `inactive`).

### Desafios

- **Desafio 1:** crie um serviço que escreve a data no `/tmp/hb.log` a cada 10 s, reinicia ao falhar e sobe no boot. Prove cada propriedade.
- **Desafio 2:** descubra, usando `systemctl list-dependencies` e `systemd-analyze blame`, os 5 serviços mais lentos do boot.
- **Desafio 3:** explique a diferença entre um processo zumbi e um processo órfão e como gerar um zumbi em laboratório.

- **Desafio 4:** crie um serviço que roda como `User=nobody`, não consegue escrever em `/etc` e mesmo assim reinicia automaticamente quando morto com `kill -9`. Prove as duas coisas. **Verifique:** `systemctl show -p User -p Restart <unit>` deve mostrar `User=nobody` e `Restart=on-failure`; `sudo systemctl kill -s KILL <unit>; sleep 4; systemctl is-active <unit>` deve imprimir `active`.

**Limpeza:** `sudo systemctl disable --now ola; sudo rm /etc/systemd/system/ola.service; sudo systemctl daemon-reload`.

### Desafio avançado — Serviços com sandbox e limites medidos

**Nível:** avançado — leva de 1 a 3 horas

- **Cenário:** dois jobs de terceiros vão rodar no mesmo servidor: um que vaza memória e um que consome CPU sem parar. Você precisa garantir que nenhum deles derrube a máquina, nem leia ou escreva onde não deve, e **medir** isso, sem confiar só no que diz o arquivo de unit.
- **Requisitos:**
  1. `hog.service` aloca memória em blocos de 8 MB sem parar e tem teto de 64 MB sem usar swap para escapar. Ao estourar, o kernel o mata (OOM do cgroup), o systemd reinicia com intervalo de 2 s e, após 3 tentativas em 60 s, ele fica `failed` por `start-limit-hit`.
  2. `burn.service` roda um laço de CPU infinito e é limitado a 25% de **um** núcleo; o consumo medido em 10 s fica entre 20% e 30%.
  3. `burn.service` roda sem usuário fixo (alocado dinamicamente pelo systemd), com um diretório de estado próprio gravável em `/var/lib`, enquanto `/etc` e `/usr` ficam somente leitura e `/home` inacessível para ele.
  4. O processo do `burn` não pode ganhar privilégios novos (`setuid`, etc.) e tem `/tmp` privado.
  5. `systemd-analyze security burn.service` reporta exposição geral abaixo de 5.0.
- **Restrições:** os limites e o sandbox devem estar na unit (ou drop-in), não em `systemd-run` avulso; a prova de isolamento deve vir de fora do script do serviço (não vale o próprio serviço dizer que "deu erro ao escrever").
- **Onde pesquisar:** `man systemd.resource-control` (`MemoryMax`, `MemorySwapMax`, `CPUQuota`), `man systemd.exec` (`DynamicUser`, `StateDirectory`, `ProtectSystem`, `ProtectHome`, `NoNewPrivileges`, `PrivateTmp`), `man systemd.service` (`StartLimitBurst`), `nsenter`.
- **Verifique:**
  > [WSL] Confirme antes que `cat /sys/fs/cgroup/cgroup.controllers` lista `cpu` e `memory`. Se não listar, pesquise `kernelCommandLine` no `.wslconfig` ou teste os limites em uma VM (Multipass).
  ```bash
  systemd-analyze security burn.service --no-pager | tail -1                  # exposição < 5.0
  sudo systemctl start burn; P=$(systemctl show -p MainPID --value burn)
  ps -o uid= -p $P | awk '{ exit !($1>=61184 && $1<=65519) }' && echo uid-dinamico
  sudo nsenter -t $P -m -- sh -c 'touch /etc/x; touch /usr/x; ls /home; touch /var/lib/burn/ok && echo estado-ok'
  # esperado: Read-only file system (x2), /home inacessível ou vazio, estado-ok
  grep NoNewPrivs /proc/$P/status                                             # NoNewPrivs: 1
  a=$(systemctl show -p CPUUsageNSec --value burn); sleep 10; b=$(systemctl show -p CPUUsageNSec --value burn)
  echo "cpu%: $(( (b-a)/100000000 ))"                                         # entre 20 e 30
  sudo systemctl start hog; sleep 15
  journalctl -u hog --no-pager | grep -c 'OOM killer'                         # >= 1
  systemctl show hog -p MemoryMax -p MemorySwapMax -p Result -p NRestarts     # 67108864, 0, start-limit-hit, >= 2
  systemctl is-failed hog                                                     # failed
  # Limpeza
  sudo systemctl stop burn hog; sudo systemctl reset-failed hog
  sudo rm /etc/systemd/system/{burn,hog}.service; sudo systemctl daemon-reload
  ```

## Erros comuns nesta fase

- Usar `kill -9` primeiro.
- Esquecer `enable` (o serviço some no reboot) ou `start`.
- Esquecer o `daemon-reload` após editar uma unit.
- Perder trabalho por não usar `tmux`/`nohup` em sessões SSH.
- Confundir load average com porcentagem de CPU.
- Achar que `systemctl stop` mata "à força": ele manda `SIGTERM` e só depois do `TimeoutStopSec` usa `SIGKILL`; um programa sem `trap` simplesmente morre sem limpar nada.
- Rodar o serviço como root "para funcionar" em vez de criar um usuário dedicado e ajustar permissões/`StateDirectory`.
- Editar direto uma unit em `/usr/lib/systemd/system/`: o próximo upgrade do pacote desfaz. Use drop-in (`systemctl edit` ou `.d/override.conf`).

## Ponte com módulos anteriores

| Vem de                                    | Como reaparece aqui                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- | ----- |
| Módulo 02 (pipes, redirecionamento, `$!`) | `ps ...                                                                        | awk`, `kill $!`, `nohup ... > saida.log 2>&1 &`e`journalctl | grep` |
| Módulo 03 (arquivos e caminhos)           | `ExecStart` precisa de caminho absoluto; a unit vive em `/etc/systemd/system/` |
| Módulo 04 (`grep`, `awk`, `sort`, `uniq`) | Contar e agrupar linhas do `journalctl -o cat`                                 |
| Módulo 05 (usuários, `chmod`, `sudo`)     | `User=` da unit, permissões do script e do diretório de estado                 |

### Lab integrador — Serviço com usuário dedicado, permissões e análise de log

Cenário: você vai publicar um coletor de métricas que não pode rodar como seu usuário nem como root.

1. (Módulo 05) Crie um usuário de sistema sem login: `sudo useradd --system --no-create-home --shell /usr/sbin/nologin coletor`.
2. Instale o script em local acessível a ele (a sua `~` costuma ser `750` no Ubuntu 24.04, então ele não leria `~/lab`):

```bash
cat > ~/lab/servico/coletor.sh <<'SH'
#!/usr/bin/env bash
i=0
while true; do
  i=$((i+1))
  nivel=INFO; [ $((i % 4)) -eq 0 ] && nivel=WARN
  echo "$nivel coleta numero $i carga=$(cut -d' ' -f1 /proc/loadavg)"
  echo "$nivel $i" >> /var/lib/coletor/saida.txt
  sleep 1
done
SH
sudo install -m 0755 ~/lab/servico/coletor.sh /usr/local/bin/coletor.sh
```

3. (Módulo 06) Crie a unit com diretório de estado gerenciado pelo systemd:

```bash
sudo tee /etc/systemd/system/coletor.service >/dev/null <<'EOF'
[Unit]
Description=Coletor de metricas do laboratorio

[Service]
ExecStart=/usr/local/bin/coletor.sh
User=coletor
StateDirectory=coletor
Restart=on-failure
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now coletor
```

4. (Módulos 04 e 05) Depois de uns 15 segundos, verifique dono e conteúdo e analise o log:

```bash
ls -ld /var/lib/coletor                                  # dono: coletor
ps -o user,pid,cmd -C coletor.sh                         # roda como coletor, não como você
journalctl -u coletor -o cat --no-pager | awk '{c[$1]++} END{for(k in c) print k, c[k]}'
sudo cat /var/lib/coletor/saida.txt | grep -c WARN
```

Esperado: o `awk` imprime algo como `INFO 11` e `WARN 4`; o `grep -c` bate com o WARN. Se o `StateDirectory=coletor` não existisse, o `echo >>` falharia com `Permission denied` e o `journalctl` mostraria o erro: é o Módulo 05 aparecendo dentro do Módulo 06. 5. Limpeza: `sudo systemctl disable --now coletor; sudo rm /etc/systemd/system/coletor.service /usr/local/bin/coletor.sh; sudo systemctl daemon-reload; sudo userdel coletor`.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em                          |
| --------------------- | --------------------------------------------- |
| systemd, units        | Serviços — Módulo 17; timers — Módulo 11      |
| `journalctl`          | Logs — Módulo 12; troubleshooting — Módulo 16 |
| Sinais, processos     | Containers — Módulo 14 e 20                   |
| Boot e targets        | Recuperação — Módulo 16                       |
| Load e prioridades    | Observabilidade — Módulo 24                   |

## `[REFERÊNCIA]`

- systemd — man pages: https://www.freedesktop.org/software/systemd/man/
- `man7.org` — `signal(7)`, `proc(5)`: https://man7.org/linux/man-pages/man7/signal.7.html
- tmux wiki: https://github.com/tmux/tmux/wiki
- Red Hat — _Managing systemd_: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_basic_system_settings/managing-system-services-with-systemctl_configuring-basic-system-settings
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
