---
id: "11_shell_script_e_automacao"
title: "Módulo 11 — Shell Script e Automação"
sidebar_label: "11 · Shell Script e Automação"
sidebar_position: 11
---

# Módulo 11 — Shell Script e Automação

> **Objetivo**: transformar comandos soltos em programas confiáveis — variáveis, condicionais, loops, funções, tratamento de erro, argumentos — e agendar tudo com `cron`, `at` e *systemd timers*.
>
> **Pré-requisitos**: módulos 02 a 06 (shell, texto, permissões, processos).
>
> **Tempo de referência (não prazo)**: duas semanas, com prática diária.
>
> Cobre os tópicos 105.1, 105.2 e 107.2 do **LPIC-1** e "Scripting" do **Linux+**. É o módulo que mais rende no trabalho de infra. Manual: https://www.gnu.org/software/bash/manual/

---

## Do histórico ao programa

Se você digita a mesma sequência de comandos toda semana, deveria ser um script. Um **script** é um arquivo de texto com comandos, que o shell executa em ordem — mais **lógica** (decisões e repetição). Ele é a ferramenta número 1 de automação de infraestrutura, antes mesmo de Ansible ou Terraform.

O primeiro script:

```bash
mkdir -p ~/lab/scripts && cd ~/lab/scripts
cat > ola.sh <<'EOF'
#!/usr/bin/env bash
echo "Olá, $(whoami)! Hoje é $(date +%d/%m/%Y)."
EOF
chmod +x ola.sh
./ola.sh
```

- `#!/usr/bin/env bash` é o **shebang**: diz ao sistema qual interpretador usar.
- `chmod +x` torna o arquivo **executável** (Módulo 05).
- `./ola.sh` executa (o `./` é necessário, já que o diretório atual não está no `PATH`).

## Variáveis e parâmetros

```bash
#!/usr/bin/env bash
NOME="Lucas"                    # sem espaços em volta do =
IDADE=30
echo "Nome: $NOME, idade: ${IDADE}"        # ${} delimita o nome da variável
HOJE=$(date +%F)                # captura a saída de um comando
SOMA=$((IDADE + 5))             # aritmética
echo "$HOJE | $SOMA"
```

**Parâmetros posicionais** — o que o usuário passa ao script:

| Variável | Significa |
|---|---|
| `$0` | Nome do script |
| `$1`, `$2`, ... | Primeiro, segundo argumento |
| `$#` | Quantos argumentos |
| `$@` | Todos os argumentos (cada um separado; use entre aspas `"$@"`) |
| `$?` | Código de saída do último comando |
| `$$` | PID do script |

```bash
#!/usr/bin/env bash
echo "Script: $0 | Total: $# | Primeiro: ${1:-nenhum}"   # ${1:-padrão} usa valor padrão
```

Ler entrada do usuário:

```bash
read -rp "Qual o seu nome? " NOME
read -rsp "Senha: " SENHA; echo      # -s não exibe o que é digitado
```

> `[ATENÇÃO]` **Sempre coloque variáveis entre aspas**: `"$ARQUIVO"`. Sem aspas, um valor com espaço (`meu arquivo.txt`) vira dois argumentos e o script faz a coisa errada, às vezes com `rm`.

## Condicionais

```bash
if [[ -f "$ARQ" ]]; then
  echo "existe e é arquivo"
elif [[ -d "$ARQ" ]]; then
  echo "é diretório"
else
  echo "não existe"
fi
```

Testes mais usados (dentro de `[[ ]]`):

| Teste | Verdadeiro se... |
|---|---|
| `-f arq` / `-d dir` / `-e x` | É arquivo / diretório / existe |
| `-r` / `-w` / `-x` | Tem permissão de leitura / escrita / execução |
| `-s arq` | Existe e **não** está vazio |
| `-z "$v"` / `-n "$v"` | String vazia / não vazia |
| `"$a" == "$b"` | Strings iguais |
| `$n -eq/-ne/-lt/-le/-gt/-ge $m` | Comparações numéricas |
| `! teste` | Negação |
| `a && b` / `a \|\| b` | E / OU (dentro de `[[ ]]`) |

```bash
if (( IDADE >= 18 )); then echo "maior"; fi         # (( )) para aritmética
[[ "$USER" == "root" ]] || { echo "rode como root"; exit 1; }
```

`case` para várias opções:

```bash
case "$1" in
  start)   echo "iniciando" ;;
  stop)    echo "parando" ;;
  *)       echo "uso: $0 {start|stop}"; exit 1 ;;
esac
```

## Laços

```bash
for i in 1 2 3; do echo "Item $i"; done
for f in ~/lab/dados/*.log; do echo "$f: $(wc -l < "$f") linhas"; done
for i in $(seq 1 5); do echo $i; done

n=0
while (( n < 3 )); do echo "n=$n"; ((n++)); done

while IFS=',' read -r id nome email dept sal; do        # ler um CSV linha a linha
  echo "$nome trabalha em $dept"
done < <(tail -n +2 ~/lab/dados/usuarios.csv)           # tail pula o cabeçalho
```

> `[TENTE VOCÊ]` Escreva um laço que imprima o tamanho de cada arquivo de `~/lab/dados`. Resposta: `for f in ~/lab/dados/*; do du -h "$f"; done`.

## Funções e arrays

```bash
log() { echo "[$(date +%T)] $*"; }       # $* = todos os argumentos como uma string
log "iniciando backup"

verifica_espaco() {
  local limite=$1                          # local: variável só da função
  local uso; uso=$(df / --output=pcent | tail -1 | tr -dc '0-9')
  (( uso > limite )) && return 1 || return 0
}
verifica_espaco 90 || log "disco quase cheio"

frutas=("maçã" "banana" "uva")
echo "${frutas[1]}  | total: ${#frutas[@]}"
for f in "${frutas[@]}"; do echo "$f"; done
```

## Scripts robustos: falhar cedo, limpar depois

Por padrão, o bash **continua** depois de um erro, o que num script de infraestrutura é perigoso. Comece **todo script** assim:

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
```

- `-e`: aborta no primeiro comando que falhar.
- `-u`: erro ao usar variável **não definida** (pega typos).
- `-o pipefail`: um pipe falha se **qualquer** etapa falhar, não só a última.

`trap` executa uma limpeza ao sair, mesmo com erro ou `Ctrl+C`:

```bash
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"; echo "limpo"' EXIT
echo "trabalhando em $TMP"
```

Parâmetros com opções (`getopts`):

```bash
uso() { echo "uso: $0 [-d diretorio] [-v]"; exit 1; }
DIR="."; VERB=0
while getopts "d:vh" opt; do
  case $opt in
    d) DIR=$OPTARG ;;
    v) VERB=1 ;;
    *) uso ;;
  esac
done
```

> `[ATENÇÃO]` Ferramentas indispensáveis: **`shellcheck`** (analisa o script e aponta erros e más práticas; `sudo apt install shellcheck`) e `bash -n script.sh` (só verifica a sintaxe). Rode `shellcheck` em todo script que escrever: ele ensina bash por correção.

## Exemplo completo: backup rotativo

```bash
#!/usr/bin/env bash
# bkp.sh - backup com data e retenção
set -euo pipefail

ORIGEM=${1:?uso: $0 <origem> [destino] [dias]}
DESTINO=${2:-$HOME/backups}
DIAS=${3:-7}

mkdir -p "$DESTINO"
ARQ="$DESTINO/bkp-$(basename "$ORIGEM")-$(date +%Y%m%d-%H%M%S).tar.gz"

tar -czf "$ARQ" -C "$(dirname "$ORIGEM")" "$(basename "$ORIGEM")"
echo "Backup criado: $ARQ ($(du -h "$ARQ" | cut -f1))"

# retenção: apaga backups mais antigos que $DIAS dias
find "$DESTINO" -name 'bkp-*.tar.gz' -mtime +"$DIAS" -print -delete
```

`${1:?mensagem}` aborta com a mensagem se o argumento faltar — uma validação elegante em uma linha.

![Execução do script bkp.sh mostrando a criação do arquivo de backup com data no nome e seu tamanho](screenshots/11-shell-script-e-automacao/01-bkp-script-execucao.png)
> `[PRINT]` Passo a passo para capturar: criar o `bkp.sh`, rodar `./bkp.sh ~/lab/dados` e depois `ls -lh ~/backups`. Capturar a saída.

## Agendando: cron, at e systemd timers

### cron: tarefas recorrentes

```bash
crontab -e            # edita o seu crontab
crontab -l            # lista
```

Formato: `minuto hora dia-do-mês mês dia-da-semana comando`

```
*/5 * * * *    /home/lucas/lab/scripts/monitor.sh        # a cada 5 minutos
0 2 * * *      /home/lucas/lab/scripts/bkp.sh /home/lucas/lab/dados   # todo dia às 02:00
30 8 * * 1-5   /home/lucas/lab/scripts/relatorio.sh      # 08:30 de seg a sex
@reboot        /home/lucas/lab/scripts/ao_ligar.sh
```

> `[ATENÇÃO]` O `cron` roda com um **ambiente mínimo** (PATH enxuto, sem seu `.bashrc`). Use **caminhos absolutos**, defina `PATH` no topo do crontab e redirecione a saída (`>> /tmp/job.log 2>&1`); senão, falhas somem sem rastro. (O serviço `cron` precisa estar ativo: `sudo systemctl enable --now cron`.)

Ferramenta online para validar a expressão: https://crontab.guru/

### at: uma execução única

```bash
sudo apt install -y at && sudo systemctl enable --now atd
echo "echo 'executou' >> /tmp/at.log" | at now + 2 minutes
atq              # fila
atrm 1           # remove o job 1
```

### systemd timers: o cron moderno

Um **timer** é uma unit que dispara uma **service**. Vantagens: logs no journal, dependências, execução de tarefas perdidas (`Persistent=true`).

```bash
sudo tee /etc/systemd/system/bkp.service >/dev/null <<EOF
[Unit]
Description=Backup do laboratório
[Service]
Type=oneshot
ExecStart=$HOME/lab/scripts/bkp.sh $HOME/lab/dados
User=$USER
EOF

sudo tee /etc/systemd/system/bkp.timer >/dev/null <<'EOF'
[Unit]
Description=Agenda o backup diário
[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now bkp.timer
systemctl list-timers --all | grep bkp
sudo systemctl start bkp.service        # testa a service na hora
journalctl -u bkp.service
```

## Laboratórios

### Lab 1 — Primeiros scripts
1. `saudacao.sh` que recebe o nome como argumento e imprime a saudação (com valor padrão se faltar).
2. `contador.sh` que conta de 1 até N (N vindo do argumento) com `for`/`while`.
3. `info.sh` que mostra uso de disco, memória e carga, com uma função por métrica.

### Lab 2 — Scripts úteis
1. `monitor-disco.sh`: avisa (e sai com código ≠ 0) se qualquer filesystem estiver acima de 80%.
2. `analisa-log.sh`: recebe um log e mostra total de linhas, erros e top 3 IPs (reaproveite o Módulo 04).
3. `instala.sh` **idempotente**: instala um pacote só se ainda não estiver instalado (`dpkg -s`).

### Lab 3 — Agendamento
1. Agende `monitor-disco.sh` a cada minuto no cron, escrevendo em `/tmp/monitor.log`; acompanhe com `tail -f`.
2. Crie um timer systemd equivalente e compare os logs (`journalctl`).

### Desafios

- **Desafio 1:** CLI `lab-toolbox.sh` com subcomandos (`backup`, `limpar`, `report`) e `--help`, usando `case`, `getopts` e funções.
- **Desafio 2:** `bkp.sh` que valida a origem, evita sobrescrever, mantém só os N backups mais recentes e registra tudo em log.
- **Desafio 3:** rode `shellcheck` em todos os seus scripts e corrija **todas** as advertências.

## Erros comuns nesta fase

- Esquecer as aspas em variáveis.
- Espaços em volta do `=` na atribuição.
- Não usar `set -euo pipefail`.
- `cron` com caminho relativo e sem log de saída.
- Esquecer `chmod +x` ou o shebang.
- Script que só funciona na primeira execução (não idempotente).
- `rm -rf "$DIR/"*` com `$DIR` vazio (use `${DIR:?}`).

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| `set -euo pipefail`, funções | Provisionamento — Módulo 21; pipelines — Módulo 22 |
| `cron`/timers | Backups e manutenção — Módulos 12 e 17 |
| Idempotência | Ansible/Terraform — Módulo 21 |
| Scripts de diagnóstico | Troubleshooting — Módulo 16 |

## `[REFERÊNCIA]`

- GNU Bash Reference Manual: https://www.gnu.org/software/bash/manual/
- Google Shell Style Guide: https://google.github.io/styleguide/shellguide.html
- ShellCheck: https://www.shellcheck.net/
- Bash Pitfalls (erros clássicos): https://mywiki.wooledge.org/BashPitfalls
- *Advanced Bash-Scripting Guide*: https://tldp.org/LDP/abs/html/
- `man 5 crontab`, `man systemd.timer`: https://man7.org/linux/man-pages/
- crontab.guru: https://crontab.guru/
- LPI — objetivos 105.1, 105.2, 107.2: https://www.lpi.org/our-certifications/exam-102-objectives/

**Como aprofundar:** o *Bash Hackers Wiki*, o guia "Bash Strict Mode" e praticar no Exercism (trilha Bash): https://exercism.org/tracks/bash

## Checklist de saída

- [ ] Escrever scripts com shebang, variáveis, argumentos (`$1`, `$#`, `"$@"`) e `read`.
- [ ] Usar `if`, `case`, `for`, `while` e funções com variáveis `local`.
- [ ] Explicar `set -e`, `-u` e `-o pipefail`, e usar `trap`.
- [ ] Citar variáveis entre aspas e saber por quê.
- [ ] Escrever scripts idempotentes e validar com `shellcheck`.
- [ ] Agendar com `cron` (caminhos absolutos, log) e com timers systemd.
- [ ] Entregar o `lab-toolbox.sh`.
