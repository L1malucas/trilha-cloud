---
id: "02_linha_de_comando_e_shell"
title: "Módulo 02 — Linha de Comando e Shell"
sidebar_label: "02 · Linha de Comando e Shell"
sidebar_position: 2
---

# Módulo 02 — Linha de Comando e Shell

> **Objetivo**: ganhar fluência no terminal — entender como um comando é interpretado, navegar, usar redirecionamento e pipes, variáveis, aliases, histórico e a documentação embutida — com muita prática.
>
> **Pré-requisitos**: módulos 00 e 01.
>
> **Tempo de referência (não prazo)**: uma semana, com prática diária.
>
> Cobre os tópicos 103.1 e 103.x do **LPIC-1 101**, e a base de Command Line do **Linux+**. Este é o módulo mais importante da trilha: tudo depois depende dele. Manual de referência: https://www.gnu.org/software/bash/manual/

---

## Terminal, console, TTY e shell: quem é quem

Quatro palavras que se confundem:

- **Terminal (emulador)**: a janela onde você digita (Windows Terminal).
- **TTY**: a "linha serial" virtual por onde texto entra e sai (`/dev/pts/0`).
- **Shell**: o **programa** que lê o que você digita, interpreta e executa. O padrão é o **bash** (*Bourne Again SHell*); há também `zsh`, `fish`, `sh`.
- **Console**: o terminal físico/principal da máquina.

O shell é um **intérprete**: você escreve uma linha, ele a divide em palavras, expande variáveis e curingas, procura o programa e o executa. Entender essa ordem evita 80% dos mistérios.

```bash
echo $SHELL            # qual shell você usa
echo $0                # shell em execução agora
ps -p $$               # o processo do shell atual
tty                    # o terminal em que você está
```

> `[TENTE VOCÊ]` Descubra em que "linha" e com que programa você está falando com o Linux: `tty`, `echo $0` e `ps -p $$ -o comm=`. Resposta: `tty` devolve algo como `/dev/pts/0`, e os outros dois mostram `bash`. O truque está no `$$`: é uma variável especial que guarda o PID do **próprio shell**, então o `ps` acaba perguntando "quem sou eu?".

## Anatomia de um comando

```
ls   -l   -h   /var/log
│    │    │    └─ argumento (o quê)
│    └────┴────── opções (como)
└─ comando (o programa)
```

- Opções curtas: `-l`, combináveis (`-lah`). Longas: `--all`, `--human-readable`.
- Argumentos são os alvos (arquivos, diretórios, textos).

O prompt também informa: `usuario@maquina:~$` — o `~` é o seu diretório pessoal e o `$` indica usuário comum (`#` indica root).

```bash
whoami                 # usuário atual
pwd                    # diretório atual
hostname               # nome da máquina
date                   # data e hora
clear                  # limpa a tela (ou Ctrl+L)
```

## Obtendo ajuda sem sair do terminal

Saber **procurar** vale mais do que decorar:

```bash
ls --help | less       # ajuda resumida do próprio comando
man ls                 # manual completo (setas, / para buscar, q para sair)
man -k "copy files"    # procura manuais por palavra (apropos)
whatis cp              # descrição de uma linha
info coreutils         # documentação GNU em formato info
type ls                # o que é "ls": alias, função, comando embutido ou programa?
which python3          # caminho do executável
```

As seções do `man`: 1 comandos, 5 formatos de arquivo, 8 administração. `man 5 passwd` mostra o *arquivo* passwd; `man 1 passwd` o *comando*.

> `[TENTE VOCÊ]` Descubra, só com o terminal, qual opção do `ls` ordena por tamanho. Resposta: `man ls` e procure por `-S` (`/sort`, Enter).

> `[TENTE VOCÊ]` Mostre que opções curtas se combinam: rode `ls -l -h -S /var/log | head -4` e depois `ls -lhS /var/log | head -4`. Resposta: a saída é idêntica, com os maiores arquivos primeiro (`-S` ordena por tamanho). O shell só entrega ao `ls` a lista de palavras; é o `ls` que entende `-lhS` como três opções coladas.

## Navegação: caminhos absolutos e relativos

Um caminho **absoluto** começa na raiz (`/etc/hosts`), funciona de qualquer lugar. Um **relativo** parte de onde você está (`../lab/dados`). Atalhos: `.` (aqui), `..` (pai), `~` (home), `-` (diretório anterior).

```bash
cd /var/log            # absoluto
cd ..                  # sobe um nível
cd ~/lab               # home/lab
cd -                   # volta ao anterior
ls -lah                # lista longa, humana, com ocultos (começam com .)
ls -R ~/lab | head     # recursivo
pushd /etc; pushd /var; dirs; popd; popd    # pilha de diretórios
```

> `[ATENÇÃO]` O Linux **diferencia maiúsculas de minúsculas**: `Lab` e `lab` são pastas diferentes. E espaços em nomes de arquivo exigem aspas ou escape (`"Meu Arquivo"`, `Meu\ Arquivo`).

## Variáveis, ambiente e PATH

**Variáveis** guardam texto. As de **ambiente** são herdadas pelos programas que você inicia.

```bash
NOME="Ana"             # sem espaços ao redor do =
echo "Oi, $NOME"       # expandir com $
export PROJ=trilha     # exportar: filhos enxergam
env | head             # variáveis de ambiente
echo $HOME $USER $PWD
echo $PATH             # lista de pastas onde o shell procura comandos
```

O **PATH** responde: "quando digito `ls`, onde está o programa?" O shell percorre cada pasta do `PATH`, na ordem, até achar. Para rodar um script do diretório atual, use `./script.sh`, já que `.` normalmente **não** está no PATH (por segurança).

```bash
export PATH="$PATH:$HOME/bin"     # acrescenta uma pasta
```

> `[ATENÇÃO]` Variáveis definidas na linha de comando **somem** ao fechar o terminal. Para persistir, grave em `~/.bashrc` (e abra outro terminal ou rode `source ~/.bashrc`).

> `[TENTE VOCÊ]` Entenda o PATH na prática. Rode `echo 'echo oi' > /tmp/oi.sh; chmod +x /tmp/oi.sh; oi.sh`. Resposta: erro `command not found`, porque `/tmp` não está no PATH. Agora `/tmp/oi.sh` imprime `oi` (caminho explícito) e `PATH=$PATH:/tmp oi.sh` também funciona (a pasta entrou no PATH só para aquele comando). Raciocínio: o shell só procura nome "puro" nas pastas do PATH; se o nome tem `/`, ele vai direto ao caminho. Depois, `rm /tmp/oi.sh`.

## Aspas: ' ' x " " x ` `

```bash
X=mundo
echo 'Olá $X'         # aspas simples: literal -> Olá $X
echo "Olá $X"          # aspas duplas: expande variáveis -> Olá mundo
echo "Hoje é $(date +%A)"   # substituição de comando -> Hoje é segunda-feira
```

## Entrada, saída e redirecionamento

Todo programa tem três "canais": **stdin** (0, entrada), **stdout** (1, saída) e **stderr** (2, erros). O shell permite redirecioná-los:

```bash
ls /etc > lista.txt            # stdout -> arquivo (sobrescreve)
echo "mais" >> lista.txt       # acrescenta
ls /inexistente 2> erros.txt   # só stderr -> arquivo
ls /etc /inexistente > ok.txt 2> erro.txt   # separa
ls /etc /inexistente &> tudo.txt            # junta os dois
ls /inexistente 2>/dev/null    # joga erros fora (/dev/null é o "ralo")
wc -l < lista.txt              # stdin vem de arquivo
```

**Here-doc** injeta um bloco de texto como entrada:

```bash
cat > nota.txt <<'EOF'
Linha 1
Linha 2
EOF
```

> `[TENTE VOCÊ]` Separe a saída normal do erro: `ls /etc /nao-existe > /tmp/o.txt 2> /tmp/e.txt; wc -l /tmp/o.txt /tmp/e.txt`. Resposta: o `e.txt` tem exatamente **1** linha (a reclamação do `ls`) e o `o.txt` tem a listagem inteira de `/etc`. Cada canal (1 e 2) vai para o seu destino — por isso um script consegue guardar erros em um arquivo e resultados em outro.

> `[ATENÇÃO]` A **ordem** dos redirecionamentos importa. `ls /nao-existe > /tmp/x.txt 2>&1` manda tudo para o arquivo; já `ls /nao-existe 2>&1 > /tmp/x.txt` ainda mostra o erro na tela. Leia da esquerda para a direita: `2>&1` copia "para onde o 1 aponta *agora*". No segundo caso, o 1 ainda apontava para o terminal.

## Pipes: a ideia mais poderosa do Unix

O pipe `|` liga o **stdout** de um comando ao **stdin** do próximo. Programas pequenos, cada um fazendo uma coisa, viram ferramentas poderosas ao se combinar — como uma linha de montagem.

```bash
ls /etc | wc -l                     # quantos itens em /etc
cat ~/lab/dados/access.log | head -3
history | tail -5                   # últimos 5 comandos
ls -l /etc | sort -k5 -n | tail -3  # 3 maiores arquivos por tamanho (coluna 5)
echo "Olá" | tee saida.txt          # tee: mostra na tela E grava
```

> `[TEORIA]` Filosofia Unix: *escreva programas que façam uma coisa bem, que trabalhem juntos e que processem texto*. Os Módulos 03 e 04 são basicamente a coleção dessas ferramentas.

## Produtividade: histórico, atalhos e aliases

**Atalhos do bash** (decore estes e economize horas):

| Atalho | Faz |
|---|---|
| `Tab` | Autocompleta (duas vezes: lista opções) |
| `↑` / `↓` | Navega pelo histórico |
| `Ctrl+R` | Busca no histórico digitando |
| `Ctrl+A` / `Ctrl+E` | Início / fim da linha |
| `Ctrl+W` | Apaga a palavra anterior |
| `Ctrl+C` | Interrompe o comando |
| `Ctrl+D` | Fim de entrada / sair do shell |
| `Ctrl+L` | Limpa a tela |
| `!!` | Repete o último comando (`sudo !!` repete com sudo) |

```bash
history | tail -10              # histórico
!42                             # reexecuta o comando nº 42
alias ll='ls -lah'              # atalho para um comando longo
alias                           # lista aliases
unalias ll
```

Para tornar aliases e variáveis permanentes, edite `~/.bashrc`:

```bash
echo "alias ll='ls -lah'" >> ~/.bashrc
echo 'export EDITOR=nano' >> ~/.bashrc
source ~/.bashrc
```

![Terminal usando Ctrl+R para buscar no histórico um comando digitado anteriormente](screenshots/02-linha-de-comando-e-shell/01-ctrl-r-historico.png)
> `[PRINT]` Passo a passo para capturar: rodar alguns comandos, pressionar `Ctrl+R`, digitar parte de um deles e capturar a tela com o prompt "(reverse-i-search)".

## Encadeando comandos

```bash
mkdir testes; cd testes             # ; roda um e depois o outro, sempre
mkdir novo && cd novo               # && só continua se o anterior deu certo
cd /inexistente || echo "falhou"    # || só executa se o anterior falhou
echo $?                             # código de saída do último comando (0 = sucesso)
```

> `[ATENÇÃO]` O código de saída `0` significa **sucesso**; qualquer outro valor é erro. É o que `&&`, `||` e os scripts (Módulo 11) usam para decidir o próximo passo.

> `[ATENÇÃO]` Antes dos labs, um erro silencioso: `NOME=Ana; bash -c 'echo "[$NOME]"'` imprime `[]`. A variável existe no seu shell, mas o `bash` filho não a herdou. Só `export NOME` a coloca no ambiente dos filhos. É a raiz de metade dos "no meu terminal funciona, no script não".

## Laboratórios

### Lab 1 — Navegação e ajuda
1. Vá para `/var/log` com caminho absoluto, volte com `cd -`, depois suba de `~/lab/dados` para `~` usando `..`.
2. Use `man` para descobrir o que fazem `ls -t` e `ls -r`.
3. Descubra se `ls` é alias, função ou programa com `type`.

### Lab 2 — Redirecionamento e pipes
1. Grave a lista de `/etc` em `etc.txt` e conte as linhas com `wc -l`.
2. Execute `ls /etc /nao-existe` separando saída e erro em arquivos diferentes.
3. Mostre quantos comandos distintos você já usou: `history | awk '{print $2}' | sort -u | wc -l`.

### Lab 3 — Personalizando o ambiente
1. Crie 3 aliases úteis (`ll`, `..`, `gs='git status'`) no `~/.bashrc`.
2. Defina um prompt próprio: `export PS1='\u@\h:\w\$ '` e teste.
3. Abra um novo terminal e confirme que tudo persistiu.

### Lab 4 — Triagem de um log sem abrir editor

Cenário: o time de aplicação avisa que "deu erro de manhã". Você só tem o terminal. Monte a triagem com redirecionamento e pipes:

```bash
cd ~/lab/dados
grep -c ERROR app.log                          # quantos erros no total
grep ERROR app.log | head -3 > ~/lab/erros-amostra.txt
tail -n 5 app.log | tee ~/lab/ultimas.txt | wc -l      # grava e conta ao mesmo tempo (esperado: 5)
grep ERROR nao-existe.log 2> ~/lab/erro-triagem.txt; echo "saída: $?"
[ -s ~/lab/erro-triagem.txt ] && echo "o erro foi capturado no arquivo"
```

Repare no `echo $?` logo após o `grep` que falhou: o código de saída é `2` (erro de uso, arquivo inexistente). Quando o `grep` só não acha nada, o código é `1`. É exatamente essa diferença que os scripts do Módulo 11 usam para decidir o que fazer.

### Lab 5 — Seu próprio comando no PATH

Cenário: você repete o mesmo diagnóstico toda hora e quer virar um comando. Crie `~/bin`, ponha um script lá e coloque a pasta no PATH:

```bash
mkdir -p ~/bin
cat > ~/bin/hoje <<'EOF'
#!/usr/bin/env bash
echo "Hoje é $(date +%d/%m/%Y) e você é $USER em $(hostname)"
EOF
chmod +x ~/bin/hoje
hoje                         # ainda não encontra
export PATH="$PATH:$HOME/bin"
hoje                         # agora funciona de qualquer pasta
type hoje                    # hoje is /home/seu-usuario/bin/hoje
```

Note o `<<'EOF'` com aspas: sem elas o shell expandiria `$(date ...)` na hora de **criar** o arquivo, e o script gravaria uma data fixa. Para persistir, acrescente `export PATH="$PATH:$HOME/bin"` ao `~/.bashrc`.

### Lab 6 — Pré-requisitos antes de uma tarefa

Cenário: antes de rodar um deploy você precisa saber se a máquina tem as ferramentas. Use `&&`, `||` e o código de saída:

```bash
command -v git >/dev/null    && echo "git ok"     || echo "git FALTA"
command -v curl >/dev/null   && echo "curl ok"    || echo "curl FALTA"
command -v nginx >/dev/null  && echo "nginx ok"   || echo "nginx FALTA"
mkdir -p ~/lab/tmp-x && cd ~/lab/tmp-x && pwd
cd /pasta/que/nao/existe || echo "não consegui entrar; ficando em $PWD"
grep -q ERROR ~/lab/dados/app.log; echo "grep -q devolveu $?"
```

O `command -v` não imprime nada se o programa não existe e devolve código diferente de zero — é a forma portátil de perguntar "isso está instalado?". O `grep -q` é "quieto": só devolve o código (0 se achou), perfeito para `if` e `&&`.

### Desafios

- **Desafio 1:** em **uma linha** (com pipes), liste os 5 maiores diretórios dentro de `/var` (`du`, `sort -h`, `head`).
- **Desafio 2:** escreva um comando que grave em `relatorio.txt` o resultado de `date`, `whoami` e `hostname`, sem sobrescrever execuções anteriores.
- **Desafio 3:** explique, sem executar, a diferença entre `echo '$HOME'`, `echo "$HOME"` e `echo $(echo $HOME)`.
- **Desafio 4:** rode `ls ~/lab/dados /nao-existe` de modo que a saída normal vá para `~/lab/ok.txt`, o erro para `~/lab/erro.txt` e o código de saída do `ls` seja impresso na tela, tudo numa única linha encadeada.
  **Verifique:** `grep -c access.log ~/lab/ok.txt; wc -l < ~/lab/erro.txt` deve mostrar `1` e depois `1`, e o código impresso na tela deve ser `2`.

### Desafio avançado — trace-run: executar e registrar sem perder nada
**Nível:** avançado — leva de 1 a 3 horas

- **Cenário:** o time de plantão cola comandos em produção e, depois do incidente, ninguém consegue reconstruir o que foi executado, o que saiu na tela e o que foi erro. Você vai escrever `~/bin/trace-run` (no seu `PATH`, como no Lab 5) para ser um prefixo: `trace-run <comando> [args...]`. Ele executa o comando normalmente e deixa um registro auditável.
- **Requisitos:**
  1. Cada execução cria `~/lab/runs/<timestamp>/` com `out` (stdout), `err` (stderr) e `meta`.
  2. A saída continua aparecendo no terminal **nos mesmos descritores**: stdout no stdout, stderr no stderr (então `trace-run cmd 2>/dev/null` não mostra o erro na tela, mas ele ainda vai para `err`).
  3. O exit code de `trace-run` é exatamente o do comando executado.
  4. Argumentos com espaços chegam intactos ao comando, e o `meta` registra o comando de forma reexecutável (com escape), o exit code e a duração, nas chaves `cmd=`, `exit=` e `secs=`.
  5. Nenhuma linha se perde: quando o comando termina, `out` e `err` já estão completos, mesmo com saída lenta.
  6. Se o comando morrer por sinal (ex.: `SIGTERM`), o `meta` registra o exit code `128+sinal`.
- **Restrições:** só bash (sem `script`, `ts`, `moreutils` ou Python); sem arquivos temporários fora do diretório da execução; o script deve ter `set -u` e não pode usar `eval`.
- **Onde pesquisar:** `man bash` (seções *Process Substitution*, *Redirection* com `exec` e descritores extras, `wait`), `printf %q`, `$SECONDS` ou `EPOCHREALTIME`.
- **Verifique:**
  ```bash
  trace-run bash -c 'echo out; echo err >&2; exit 7'; echo "rc=$?"     # out e err na tela, rc=7
  d=$(ls -dt ~/lab/runs/*/ | head -1); cat "$d/out" "$d/err"; cat "$d/meta"   # out, err; meta com cmd=, exit=7, secs=
  trace-run bash -c 'echo err >&2' 2>/dev/null                          # nada na tela
  trace-run bash -c 'echo a; sleep 1; echo b' 2>/dev/null | wc -l      # 2
  wc -l < "$(ls -dt ~/lab/runs/*/ | head -1)out"                        # 2 (nada perdido)
  trace-run printf '%s|' 'a b' c; echo                                  # a b|c|
  grep -F 'a\ b' "$(ls -dt ~/lab/runs/*/ | head -1)meta"               # linha cmd= com o escape
  trace-run sleep 30 & sleep 1; pkill -TERM -x sleep; wait %1; echo "rc=$?"   # rc=143
  grep 'exit=143' "$(ls -dt ~/lab/runs/*/ | head -1)meta"
  grep -c eval ~/bin/trace-run                                          # 0
  ```

## Erros comuns nesta fase

- Espaços ao redor do `=` em variáveis (`X = 1` falha; é `X=1`).
- Esquecer aspas em nomes com espaço.
- Redirecionar com `>` para um arquivo importante e sobrescrevê-lo sem querer.
- Esperar que `export` persista depois de fechar o terminal.
- Confundir `>` (sobrescreve) com `>>` (acrescenta).
- Inverter a ordem de `2>&1` e `>` e se perguntar por que o erro continua na tela.
- Criar um script e esquecer o `chmod +x` (ou o `./` quando a pasta não está no PATH).
- Usar `$(...)` dentro de here-doc **sem** aspas no delimitador e gravar o valor de hoje no arquivo em vez do comando.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 00 — Windows Terminal + Ubuntu | É o **terminal** que abriga o **shell** (bash) descritos no começo deste módulo |
| Módulo 00 — `~/lab` e `gera-lab.sh` | Os dados de `~/lab/dados` alimentam todos os pipes e redirecionamentos |
| Módulo 00 — `wslpath`, `explorer.exe` | Mostram que o shell roda programas de outro mundo (Windows) como qualquer comando |
| Módulo 01 — `/etc/os-release`, `uname`, `hostnamectl` | São os comandos que você agora encadeia, redireciona e transforma em script |
| Módulo 01 — FHS (`/etc`, `/var`, `/usr`) | Viram os caminhos absolutos e relativos que você navega |

### Lab integrador — Um painel do ambiente em um comando

Junte o que veio do 00 e do 01 (dados do lab, `os-release`, `uname`, FHS) com variáveis, here-doc, PATH, pipes e `tee`:

```bash
mkdir -p ~/bin
cat > ~/bin/info-lab <<'EOF'
#!/usr/bin/env bash
. /etc/os-release
echo "Distro : $PRETTY_NAME"
echo "Kernel : $(uname -r)"
echo "Usuário: $USER em $(hostname)"
echo "Logs   : $(wc -l < "$HOME/lab/dados/access.log") linhas em access.log"
echo "/etc   : $(ls /etc | wc -l) itens"
EOF
chmod +x ~/bin/info-lab
export PATH="$PATH:$HOME/bin"
info-lab | tee ~/lab/info-lab.txt
wc -l ~/lab/info-lab.txt
```

Esperado: cinco linhas no painel, `5000 linhas em access.log` e `5 /home/.../info-lab.txt` no `wc`. Se `info-lab` não for encontrado, o PATH não foi exportado nesta sessão.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Pipes e redirecionamento | Módulo 04 (`grep`, `sed`, `awk`) |
| Código de saída, `&&`/`||` | Módulo 11 (scripts) |
| Variáveis e PATH | Módulos 07 e 11 |
| `.bashrc`, aliases | Todo o resto da trilha |

## `[REFERÊNCIA]`

- GNU Bash Reference Manual: https://www.gnu.org/software/bash/manual/
- Advanced Bash-Scripting Guide: https://tldp.org/LDP/abs/html/
- *The Linux Command Line* (gratuito), partes 1 e 2: https://linuxcommand.org/tlcl.php
- `man7.org` — páginas de manual online: https://man7.org/linux/man-pages/
- explainshell (explica comandos peça por peça): https://explainshell.com/
- LPI — objetivos 103: https://www.lpi.org/our-certifications/exam-101-objectives/
- Bash Pitfalls: https://mywiki.wooledge.org/BashPitfalls

**Como aprofundar:** pratique no site OverTheWire "Bandit" (https://overthewire.org/wargames/bandit/), um jogo que ensina terminal Linux por desafios progressivos.

## Checklist de saída

- [ ] Diferenciar terminal, TTY, shell e console.
- [ ] Decompor um comando em programa, opções e argumentos.
- [ ] Usar `man`, `--help`, `whatis` e `type` para se virar sozinho.
- [ ] Navegar com caminhos absolutos e relativos, `cd -` e `~`.
- [ ] Explicar o PATH e por que scripts locais precisam de `./`.
- [ ] Usar `>`, `>>`, `2>`, `&>` e `|` corretamente.
- [ ] Explicar aspas simples x duplas e `$(...)`.
- [ ] Usar `Ctrl+R`, `Tab`, `!!` e criar aliases persistentes.
- [ ] Interpretar `$?` e os operadores `&&` e `||`.
