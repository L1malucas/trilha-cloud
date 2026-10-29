---
id: "04_processamento_de_texto"
title: "Módulo 04 — Processamento de Texto"
sidebar_label: "04 · Processamento de Texto"
sidebar_position: 4
---

# Módulo 04 — Processamento de Texto

> **Objetivo**: transformar o terminal numa ferramenta de análise — buscar, filtrar, cortar, ordenar, contar e reescrever texto com `grep`, `cut`, `sort`, `uniq`, `sed` e `awk`, e editar arquivos no `vim`/`nano`. É a habilidade que separa quem "usa" Linux de quem o domina.
>
> **Pré-requisitos**: módulos 02 e 03 (pipes, redirecionamento) e os dados do `~/lab/dados` (Módulo 00).
>
> **Tempo de referência (não prazo)**: duas semanas, com prática diária.
>
> Cobre os tópicos 103.2, 103.7 e 103.8 do **LPIC-1 101** e "Text processing" do **Linux+**. Quase todo log, configuração e saída de comando no Linux é texto.

---

## Por que texto é o centro

No Linux, logs, configurações e a saída de quase todo comando são **texto linha a linha**. Quem sabe filtrar e transformar texto responde em segundos a perguntas que demorariam horas numa interface gráfica: "quais IPs mais acessam o servidor?", "quantos erros houve às 14h?". Os comandos deste módulo são pequenos e se combinam com pipes (Módulo 02), como uma bancada de ferramentas.

Trabalharemos sobre os arquivos gerados no Módulo 00:

```bash
cd ~/lab/dados && ls
head -3 access.log
# 192.168.0.12 - - [10/Jan/2026:00:00:21 +0000] "GET /produtos HTTP/1.1" 200 15432
head -3 app.log
head -3 usuarios.csv
```

## Ver partes do arquivo

```bash
head -n 3 access.log        # primeiras linhas
tail -n 3 access.log        # últimas
tail -f app.log             # acompanha em tempo real (Ctrl+C)
wc -l access.log            # conta linhas
less access.log             # navega (/ procura, n próxima, q sai)
```

## grep: procurar linhas

`grep` imprime as **linhas** que casam com um padrão.

```bash
grep "ERROR" app.log                  # linhas com ERROR
grep -i "error" app.log               # ignora maiúsculas
grep -c "ERROR" app.log               # só CONTA as linhas
grep -n "ERROR" app.log | head        # mostra o número da linha
grep -v "INFO" app.log                # INVERTE: linhas SEM INFO
grep -r "ERROR" ~/lab                 # recursivo em uma pasta
grep -A2 -B1 "ERROR" app.log | head   # 1 linha antes e 2 depois (contexto)
grep -o '"GET [^ ]*' access.log | head   # imprime só o trecho que casou (-o)
grep -l "ERROR" ~/lab/dados/*.log     # só os NOMES dos arquivos que casam
```

### Expressões regulares (regex)

Uma regex descreve **um padrão de texto**. Pense num "curinga turbinado". Com `grep -E` (estendida) você usa:

| Símbolo | Significa | Exemplo |
|---|---|---|
| `.` | Qualquer caractere | `a.c` casa `abc`, `a9c` |
| `*` | 0 ou mais do anterior | `ab*` casa `a`, `abbb` |
| `+` | 1 ou mais | `[0-9]+` casa `123` |
| `?` | 0 ou 1 | `colou?r` |
| `^` / `$` | Início / fim da linha | `^ERROR`, `500$` |
| `[abc]` / `[0-9]` | Um caractere do conjunto | `[A-Z][a-z]+` |
| `\|` | Ou | `404\|500` |
| `( )` | Agrupa | `(ab)+` |
| `{n,m}` | Repetição | `[0-9]{1,3}` |

```bash
grep -E ' (404|500) ' access.log | head                    # status 404 OU 500
grep -E '^192\.168\.0\.[0-9]+' access.log | head -3        # IPs 192.168.0.x
grep -E '\b[0-9]{4}-[0-9]{2}-[0-9]{2}\b' app.log | head -2 # datas AAAA-MM-DD
grep -Eo '[a-z]+@[a-z]+\.com' usuarios.csv                 # e-mails
```

> `[ATENÇÃO]` Em regex, o ponto `.` casa **qualquer** caractere. Para casar um ponto de verdade, escape: `192\.168`. Sem isso, `192.168` casaria também `192x168`. E use aspas simples ao redor da regex para o shell não "comer" os símbolos.

> `[TENTE VOCÊ]` Conte quantas requisições deram erro 500 em `access.log`. Resposta: `grep -c ' 500 ' access.log` (o espaço em volta evita casar `500` dentro de outro número).

## cut, sort, uniq, wc, tr: o quinteto de análise

```bash
cut -d',' -f2,4 usuarios.csv           # colunas 2 e 4 de um CSV (-d delimitador, -f campo)
cut -d' ' -f1 access.log | head -3     # primeiro campo (IP)
sort usuarios.csv                      # ordena alfabeticamente
sort -t',' -k5 -n usuarios.csv         # por coluna 5 (salário), numérico
sort -rn                               # numérico, decrescente
sort -u                                # ordena e remove duplicatas
uniq -c                                # CONTA ocorrências (exige entrada ORDENADA)
wc -l                                  # conta linhas
tr 'a-z' 'A-Z' < usuarios.csv | head -2   # troca caracteres (minúsculas -> maiúsculas)
tr -d '\r' < arquivo-windows.txt       # remove CRs de arquivos do Windows
```

> `[ATENÇÃO]` `uniq` só agrupa linhas **adjacentes** iguais, por isso o padrão é sempre `sort | uniq -c`. Sem `sort` antes, ele conta errado.

### A receita clássica: contar e ranquear

```bash
# Top 5 IPs que mais acessam o servidor
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -5

# Quantos acessos por código de status
awk '{print $9}' access.log | sort | uniq -c | sort -rn

# Erros por serviço no app.log
grep ERROR app.log | awk '{print $4}' | sort | uniq -c
```

Leia como uma linha de montagem: *extraia a coluna → agrupe iguais → conte → ordene pelo número → pegue o topo*. Uma vez que você enxerga esse padrão, ele serve para quase toda análise de log.

![Terminal mostrando a saída do ranking dos 5 IPs com mais acessos, com a contagem à esquerda de cada IP](screenshots/04-processamento-de-texto/01-top-ips.png)
> `[PRINT]` Passo a passo para capturar: dentro de `~/lab/dados`, rodar `cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -5`. Capturar o comando e a saída.

## sed: reescrever com o fluxo (stream editor)

`sed` lê linha a linha e aplica comandos. O mais usado é a **substituição** `s/padrão/novo/flags`.

```bash
echo "gato preto" | sed 's/gato/cachorro/'        # -> cachorro preto
sed 's/ERROR/ERRO/' app.log | head -3             # troca a PRIMEIRA ocorrência de cada linha
sed 's/ERROR/ERRO/g' app.log | head -3            # g = todas as ocorrências na linha
sed -n '5,8p' app.log                             # imprime só as linhas 5 a 8
sed '/INFO/d' app.log | head                      # APAGA linhas que contêm INFO
sed -i.bak 's/exemplo.com/empresa.com/g' usuarios.csv   # -i edita o ARQUIVO (e guarda .bak)
sed -E 's/([0-9]+)-([0-9]+)-([0-9]+)/\3\/\2\/\1/' <<< "2026-01-10"   # reordena data: 10/01/2026
```

> `[ATENÇÃO]` `sed -i` **modifica o arquivo original**. Sempre teste sem `-i` primeiro, ou use `-i.bak` para manter um backup. E se o padrão tiver `/`, use outro delimitador: `sed 's|/var/log|/tmp|g'`.

## awk: a mini-linguagem de colunas

`awk` divide cada linha em campos (`$1`, `$2`, ..., `$NF` é o último; `$0` a linha toda) e permite lógica. É o "Excel do terminal".

```bash
awk '{print $1}' access.log | head -3                    # primeira coluna
awk -F',' '{print $2, $5}' usuarios.csv                  # -F define o separador
awk -F',' 'NR>1 {print $2" ganha "$5}' usuarios.csv      # NR = nº da linha; pula cabeçalho
awk '$9==500' access.log | head -3                       # só linhas com status 500
awk '$9>=400 {c++} END {print c" erros"}' access.log     # contador + bloco END
awk '{s+=$10} END {print s/1024/1024 " MB"}' access.log  # SOMA bytes (coluna 10)
awk -F',' 'NR>1 {t[$4]+=$5} END {for(d in t) print d, t[d]}' usuarios.csv   # soma por departamento
awk 'BEGIN{FS=","; OFS=" | "} NR>1 {print $2,$4}' usuarios.csv
```

Estrutura: `awk 'CONDIÇÃO { AÇÃO }'`; `BEGIN` roda antes, `END` depois de ler tudo.

> `[TEORIA]` Quando usar o quê: **grep** para *achar linhas*; **cut** para *cortar colunas simples*; **sed** para *substituir/remover texto*; **awk** quando há *colunas + cálculo/condição*. Se a tarefa pede "somar", "agrupar" ou "comparar campos", é awk.

## xargs, tee, diff, paste

```bash
find ~/lab -name "*.log" | xargs wc -l        # transforma a lista em argumentos
echo "teste" | tee -a saida.txt               # tela + arquivo (-a acrescenta)
diff arq1.txt arq2.txt                        # diferenças
diff -u arq1.txt arq2.txt                     # formato unificado (o do git)
paste nomes.txt idades.txt                    # junta arquivos coluna a coluna
```

## Editores: vim e nano

Você **vai** precisar editar arquivos num servidor sem interface gráfica.

**nano** (simples): `nano arquivo`. Os atalhos aparecem embaixo (`^O` salvar, `^X` sair, `^W` buscar).

**vim** (poderoso): tem **modos**. A ideia é difícil à primeira vista e depois muito eficiente:

| Modo | Como entrar | Para quê |
|---|---|---|
| **Normal** | `Esc` | Navegar e comandar |
| **Inserção** | `i` (inserir), `a` (depois), `o` (nova linha) | Digitar texto |
| **Comando** | `:` | Salvar, sair, buscar/substituir |

```
:w          salva           :q       sai
:wq  ou  ZZ   salva e sai   :q!      sai SEM salvar
dd          apaga a linha   yy / p   copia / cola linha
/texto      procura         n        próxima ocorrência
:%s/velho/novo/g   substitui em todo o arquivo
u           desfaz          Ctrl+r   refaz
```

Para treinar de verdade: `vimtutor` (30 minutos, interativo).

> `[ATENÇÃO]` Preso no vim? Pressione `Esc` e digite `:q!` + Enter para sair sem salvar. Quase todo iniciante já passou por isso.

## Laboratórios

### Lab 1 — grep
1. Quantas linhas de `app.log` têm `ERROR`? E quantas **não** são `INFO`?
2. Liste os IPs (sem repetição) que receberam `403`.
3. Mostre as linhas de `access.log` com status 5xx usando regex (`' 5[0-9]{2} '`).

### Lab 2 — análise com pipes
1. Top 3 páginas (`$7`) mais acessadas.
2. Quantos erros por hora em `app.log` (extraia a hora com `cut -c12-13`).
3. Quantos bytes foram servidos no total (use `awk`).

### Lab 3 — sed e awk
1. Troque `exemplo.com` por `empresa.com` em `usuarios.csv`, mantendo `.bak`.
2. Em `usuarios.csv`, calcule o salário médio por departamento com awk.
3. Converta o `app.log` para só `HORA NIVEL` por linha.

### Desafios

- **Desafio 1:** produza um relatório de 5 linhas (total de requisições, % de erros 4xx/5xx, top 3 IPs, página mais lenta/maior, hora de pico) usando **só pipes** sobre `access.log`.
- **Desafio 2:** reescreva o mesmo relatório com **um único `awk`**.
- **Desafio 3:** valide e-mails e IPs: extraia de um texto livre só e-mails válidos e IPs com octetos entre 0 e 255.

## Erros comuns nesta fase

- Usar `uniq` sem `sort` antes.
- Esquecer de escapar o ponto em regex de IP.
- `sed -i` sem backup, destruindo o original.
- Regex sem aspas simples (o shell interpreta os símbolos).
- Esquecer o `-E` do `grep` ao usar `+`, `?`, `|`, `()`.
- Escolher `awk`/`sed` quando um `cut` simples resolveria (ou o contrário).

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| `grep`/`awk` em logs | Logs — Módulo 12; troubleshooting — Módulo 16 |
| Pipes e filtros | Scripts — Módulo 11 |
| `vim`/`nano` | Todos os módulos (editar configs em `/etc`) |
| Regex | Firewall/fail2ban — Módulo 10; Nginx — Módulo 17 |
| `jq`/filtros em JSON | `az`/`gcloud` e Kubernetes — Módulos 21 e 23 |

## `[REFERÊNCIA]`

- GNU grep: https://www.gnu.org/software/grep/manual/
- GNU sed: https://www.gnu.org/software/sed/manual/
- GNU awk (*The GNU Awk User's Guide*): https://www.gnu.org/software/gawk/manual/
- Regex interativo: https://regex101.com/ e https://regexr.com/
- *The Linux Command Line*, partes de regex e processamento de texto: https://linuxcommand.org/tlcl.php
- Vim — `vimtutor` e documentação: https://www.vim.org/docs.php
- LPI — objetivos 103.2, 103.7, 103.8: https://www.lpi.org/our-certifications/exam-101-objectives/
- `jq` (JSON no terminal): https://jqlang.github.io/jq/manual/

**Como aprofundar:** o livro *Sed & Awk* (O'Reilly) e os jogos de "regex crossword" para treinar expressões regulares. Depois, aprenda `jq` para JSON.

## Checklist de saída

- [ ] Usar `grep` com `-i -c -n -v -r -o -E` e contexto (`-A/-B`).
- [ ] Escrever regex com âncoras, classes, quantificadores e grupos.
- [ ] Explicar por que `uniq -c` exige `sort` antes.
- [ ] Montar a receita "extrair → agrupar → contar → ranquear" sozinho.
- [ ] Usar `sed 's///g'`, `-n 'Np'`, `d` e `-i.bak` com segurança.
- [ ] Usar `awk` com campos, `-F`, condições, `NR`, `BEGIN`/`END` e somatórios.
- [ ] Escolher entre grep, cut, sed e awk para um problema.
- [ ] Editar e salvar arquivos no `vim` e no `nano`.
