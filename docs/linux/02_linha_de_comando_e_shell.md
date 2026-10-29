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

### Desafios

- **Desafio 1:** em **uma linha** (com pipes), liste os 5 maiores diretórios dentro de `/var` (`du`, `sort -h`, `head`).
- **Desafio 2:** escreva um comando que grave em `relatorio.txt` o resultado de `date`, `whoami` e `hostname`, sem sobrescrever execuções anteriores.
- **Desafio 3:** explique, sem executar, a diferença entre `echo '$HOME'`, `echo "$HOME"` e `echo $(echo $HOME)`.

## Erros comuns nesta fase

- Espaços ao redor do `=` em variáveis (`X = 1` falha; é `X=1`).
- Esquecer aspas em nomes com espaço.
- Redirecionar com `>` para um arquivo importante e sobrescrevê-lo sem querer.
- Esperar que `export` persista depois de fechar o terminal.
- Confundir `>` (sobrescreve) com `>>` (acrescenta).

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
