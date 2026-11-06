---
id: "03_arquivos_e_diretorios"
title: "Módulo 03 — Arquivos e Diretórios"
sidebar_label: "03 · Arquivos e Diretórios"
sidebar_position: 3
---

# Módulo 03 — Arquivos e Diretórios

> **Objetivo**: manipular arquivos com segurança e velocidade — criar, copiar, mover, apagar, ler, achar, linkar e compactar — entendendo inodes, curingas e a lógica do `find`.
>
> **Pré-requisitos**: módulo 02 (shell, pipes, redirecionamento).
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre os tópicos 103.3, 103.4 e 104.x do **LPIC-1** e "Files and directories" do **Linux+**. Referência: https://www.gnu.org/software/coreutils/manual/

---

## Nome, conteúdo e inode: o arquivo por dentro

Num sistema de arquivos Linux, um arquivo tem **três** partes separadas, e entender isso explica links, `mv` rápido e "disco cheio mesmo sobrando espaço":

- O **nome** (uma entrada de diretório que aponta para um número).
- O **inode**: a "ficha" do arquivo (dono, permissões, tamanho, datas, onde estão os blocos de dados). **O nome do arquivo não está no inode.**
- Os **dados** (blocos no disco).

```bash
ls -li ~/lab/dados/             # -i mostra o número do inode
stat ~/lab/dados/access.log     # a ficha completa
file ~/lab/dados/access.log     # tipo do conteúdo (texto, binário, imagem...)
```

Tipos de arquivo (primeiro caractere de `ls -l`): `-` regular, `d` diretório, `l` link simbólico, `b`/`c` dispositivo de bloco/caractere, `s` socket, `p` pipe nomeado.

> `[TENTE VOCÊ]` Prove que o nome não é o arquivo: `cd ~/lab && echo oi > a.txt && ls -i a.txt && mv a.txt b.txt && ls -i b.txt && cp b.txt c.txt && ls -i c.txt`. Resposta: o número do inode do `a.txt` e do `b.txt` é **o mesmo** (o `mv` só trocou o nome na entrada do diretório, não tocou nos dados), e o `c.txt` ganha um inode **novo** (o `cp` criou outra ficha e copiou os blocos). É por isso que `mv` é instantâneo mesmo com um arquivo de 10 GB na mesma partição. Limpe com `rm b.txt c.txt`.

## Criar, copiar, mover e apagar

```bash
mkdir projeto                          # cria diretório
mkdir -p projeto/{src,docs,tests}      # -p cria os pais; {a,b,c} expande em três
touch projeto/src/app.py               # cria arquivo vazio (ou atualiza a data)
cp arq.txt copia.txt                   # copia arquivo
cp -r projeto projeto_bkp              # copia diretório (recursivo)
cp -a projeto projeto_bkp2             # -a preserva dono, permissões e datas
mv copia.txt outro_nome.txt            # renomeia
mv outro_nome.txt projeto/docs/        # move
rm arq.txt                             # apaga arquivo
rm -r projeto_bkp                      # apaga diretório e conteúdo
rmdir pasta_vazia                      # só apaga diretório vazio
```

> `[ATENÇÃO]` **Não existe lixeira na linha de comando.** `rm` apaga de vez. Antes de qualquer `rm -r`, faça `ls` com o **mesmo padrão** para ver o que será apagado. Nunca rode `rm -rf` com variável possivelmente vazia (`rm -rf $DIR/*` vira `rm -rf /*` se `DIR` estiver vazia).

Use `-i` para pedir confirmação e `-v` para ver o que acontece:

```bash
rm -iv arq*.txt
cp -v origem destino
```

## Lendo arquivos

```bash
cat arq.txt                    # tudo de uma vez
less arq.txt                   # paginado (espaço, b, /busca, q)
head -n 5 arq.txt              # primeiras 5 linhas
tail -n 5 arq.txt              # últimas 5
tail -f ~/lab/dados/app.log    # acompanha novas linhas em tempo real (Ctrl+C para sair)
wc -l arq.txt                  # conta linhas (-w palavras, -c bytes)
```

## Curingas (globbing): o shell expande antes de o comando rodar

O shell troca os padrões pela lista de nomes que combinam, **antes** de chamar o programa:

| Padrão | Casa com |
|---|---|
| `*` | Qualquer sequência de caracteres |
| `?` | Exatamente um caractere |
| `[abc]` / `[a-z]` | Um caractere do conjunto/faixa |
| `{a,b,c}` | Expansão de chaves (gera `a b c`) |

```bash
ls *.log                       # todos terminados em .log
ls arquivo?.txt                # arquivo1.txt, arquivoA.txt...
ls dados/{access,app}.log      # os dois nomes
touch rel_{jan,fev,mar}.txt    # cria três arquivos de uma vez
echo *.txt                     # veja o que o shell expande (ele, não o echo)
```

> `[TENTE VOCÊ]` O que `rm *.log` apaga e o que `rm "*.log"` apaga? Resposta: o primeiro apaga todos os `.log`; o segundo tenta apagar um arquivo chamado literalmente `*.log` (aspas desligam o curinga).

> `[TENTE VOCÊ]` Veja o que acontece quando o curinga não casa com nada: `mkdir -p /tmp/g && cd /tmp/g && touch a1 a2 b1 && echo a? && echo [ab]1 && echo *3`. Resposta: `a1 a2`, depois `a1 b1`, e por fim o texto literal `*3`. Raciocínio: o `echo` não sabe de curingas, quem expande é o shell; e quando **nada** casa, o bash deixa o padrão como está. Cuidado com isso em scripts: `rm *3` tentaria apagar um arquivo chamado literalmente `*3`. Depois, `cd ~ && rm -r /tmp/g`.

## find: o localizador poderoso

`find` **percorre a árvore em tempo real** procurando por critérios. Sintaxe: `find <onde> <critérios> <ação>`.

```bash
find ~/lab -name "*.log"                    # por nome (respeita maiúsculas)
find ~/lab -iname "*.LOG"                   # ignora maiúsculas
find ~/lab -type f                          # só arquivos (d = diretórios)
find ~/lab -type f -size +100k              # maiores que 100 KB
find ~/lab -type f -mtime -1                # modificados nas últimas 24h (+7 = há mais de 7 dias)
find ~/lab -type f -name "*.log" -exec wc -l {} \;     # executa comando em cada achado
find /etc -name "*.conf" 2>/dev/null        # silencia "permission denied"
find ~/lab -type f -name "*.tmp" -delete    # CUIDADO: apaga
```

Para muitos arquivos, ou nomes com espaços, prefira:

```bash
find ~/lab -type f -name "*.log" -print0 | xargs -0 ls -lh
```

`-print0`/`-0` separam por caractere nulo, seguro para nomes esquisitos. `xargs` transforma a lista recebida em argumentos de outro comando.

`locate` é outra opção: **rápido** porque consulta um índice, que pode estar desatualizado.

```bash
sudo apt install -y plocate && sudo updatedb
locate access.log
```

> `[ATENÇÃO]` Rode `find ... -delete` **sem** o `-delete` primeiro: confira a lista, depois repita com a ação. E a ordem importa: `-delete` antes dos filtros pode apagar tudo.

> `[TENTE VOCÊ]` Quantos arquivos regulares existem em `~/lab/dados`? Rode `find ~/lab/dados -type f | wc -l`. Resposta: `3` (`access.log`, `app.log` e `usuarios.csv`) se você só rodou o `gera-lab.sh`; vai aparecer um a mais depois do `sed -i.bak` do Módulo 04. Note a rotina: primeiro **contar/listar** com o `find` puro, e só depois pensar em `-delete` ou `-exec`.

## Links: dois nomes, um arquivo

- **Link físico (hard link)**: **outro nome para o mesmo inode**. Os dois nomes são iguais; apagar um não afeta o outro. Só vale dentro do mesmo sistema de arquivos e não para diretórios.
- **Link simbólico (symlink)**: um **atalho**, um arquivo pequeno que guarda o *caminho* do alvo. Funciona entre sistemas de arquivos e para diretórios; se o alvo for apagado, o link fica "quebrado".

```bash
echo "conteudo" > original.txt
ln original.txt fisico.txt            # hard link
ln -s original.txt simbolico.txt      # symlink
ls -li original.txt fisico.txt simbolico.txt     # note: mesmo inode no hard link
rm original.txt
cat fisico.txt                        # ainda funciona
cat simbolico.txt                     # erro: link quebrado
readlink -f simbolico.txt             # para onde aponta
```

![Saída de `ls -li` mostrando o mesmo número de inode para original.txt e fisico.txt e o símbolo -> no link simbólico](screenshots/03-arquivos-e-diretorios/01-links-inodes.png)
> `[PRINT]` Passo a passo para capturar: executar o bloco acima até o `ls -li` (antes do `rm`). Capturar as três linhas.

> `[TENTE VOCÊ]` Quanto pesa um symlink? Rode `ln -s /etc/hostname /tmp/h && ls -l /tmp/h && stat -c %s /tmp/h`. Resposta: o `ls` mostra `/tmp/h -> /etc/hostname` e o `stat` imprime `13`, que é exatamente o número de caracteres de `/etc/hostname`. Um symlink não guarda o conteúdo do alvo — só o **texto do caminho**. Por isso ele "quebra" quando o alvo some. Limpe com `rm /tmp/h`.

## Espaço em disco

```bash
df -h                          # uso por sistema de arquivos montado
df -i                          # uso de INODES (disco "cheio" com espaço sobrando = acabaram os inodes)
du -sh ~/lab                   # tamanho de uma pasta
du -sh ~/lab/* | sort -h       # cada item, do menor ao maior
```

## Compactar e arquivar

`tar` **junta** arquivos num só (arquivo `.tar`); `gzip`/`bzip2`/`xz` **comprimem** um arquivo. Combinados, viram `.tar.gz`, o formato universal.

```bash
tar -czvf backup.tar.gz ~/lab/dados     # c criar, z gzip, v verboso, f arquivo
tar -tzvf backup.tar.gz                 # t lista o conteúdo (sem extrair)
mkdir /tmp/restaura && tar -xzvf backup.tar.gz -C /tmp/restaura   # x extrair, -C destino
tar -cJf backup.tar.xz ~/lab/dados      # J = xz (melhor compressão, mais lento)

gzip arq.txt                            # vira arq.txt.gz (remove o original)
gunzip arq.txt.gz
zip -r bkp.zip ~/lab/dados && unzip -l bkp.zip
```

> `[TEORIA]` Memorize a mnemônica do tar: **c**reate, **x**tract, **t**est/list, **z** gzip, **f** file (sempre por último, pois recebe o nome). Para a prova, `tar czf`, `tar xzf` e `tar tzf` são os três clássicos.

> `[ATENÇÃO]` Ao rodar `tar -czf x.tar.gz ~/lab/dados`, o GNU tar avisa `Removing leading '/' from member names`. Ele tira a barra inicial de propósito: assim o restore não sobrescreve caminhos absolutos por acidente. Consequência: o conteúdo é extraído **relativo** ao diretório atual (ou ao `-C`). Para um backup limpo, entre na pasta pai com `-C`: `tar -czf x.tar.gz -C ~/lab dados` gera membros `dados/...` em vez de `home/usuario/lab/dados/...`.

## Laboratórios

### Lab 1 — Estrutura e limpeza
1. Crie `~/lab/proj/{src,docs,tests}` com um comando e `touch` três arquivos em cada pasta.
2. Copie a árvore com `cp -a` para `proj_bkp` e compare com `diff -r proj proj_bkp`.
3. Apague com `rm -r` só os `.tmp` (crie alguns antes), conferindo com `find` antes.

### Lab 2 — find em ação
1. Ache os 10 maiores arquivos de `/usr` (`find /usr -type f -printf '%s %p\n' | sort -rn | head`).
2. Liste os arquivos de `/etc` modificados nos últimos 30 dias.
3. Ache todos os `.log` de `~/lab` e conte as linhas de cada um com `-exec wc -l {} \;`.

### Lab 3 — Links e backup
1. Crie um symlink `~/atalho-dados` para `~/lab/dados`.
2. Gere `backup-AAAAMMDD.tar.gz` usando `$(date +%Y%m%d)` no nome.
3. Extraia em `/tmp/teste` e verifique com `diff -r`.

### Lab 4 — Retenção de logs antigos

Cenário: a pasta de logs de uma aplicação cresce todo dia e a política é guardar só 7 dias. Simule o cenário com datas falsas e aplique a rotina segura (listar, depois apagar):

```bash
mkdir -p ~/lab/logs-app && cd ~/lab/logs-app
touch -d '10 days ago' app-velho1.log app-velho2.log
touch -d '3 days ago' app-recente.log
touch app-hoje.log
ls -l --time-style=long-iso
find . -name '*.log' -mtime +7 -print         # só LISTA: confira a lista
find . -name '*.log' -mtime +7 -delete        # agora apaga
ls
```

Esperado: antes do `-delete`, só `app-velho1.log` e `app-velho2.log` aparecem; depois, sobram `app-recente.log` e `app-hoje.log`. O `-mtime +7` significa "modificado há **mais** de 7 dias".

### Lab 5 — Deploy com symlink e rollback

Cenário: você publica versões de um site em pastas separadas e uma pasta `current` aponta para a versão no ar. Trocar o symlink é a forma clássica de fazer deploy e rollback quase instantâneos:

```bash
mkdir -p ~/lab/deploy/releases/{v1,v2}
echo "versão 1" > ~/lab/deploy/releases/v1/index.html
echo "versão 2" > ~/lab/deploy/releases/v2/index.html
cd ~/lab/deploy
ln -sfn releases/v1 current && cat current/index.html     # versão 1
ln -sfn releases/v2 current && cat current/index.html     # deploy: versão 2
ln -sfn releases/v1 current && cat current/index.html     # rollback: versão 1
ls -l current
```

O `-f` substitui o link existente e o `-n` trata `current` como o próprio link (sem ele, o `ln` criaria o novo link **dentro** da pasta alvo). As versões antigas continuam intactas, então o rollback é só reapontar.

### Lab 6 — Disco cheio: bytes ou inodes?

Cenário: o monitoramento diz "disco cheio" mas `df -h` mostra espaço sobrando. Investigue as duas hipóteses:

```bash
df -h /                                       # espaço em bytes
df -i /                                       # inodes (anote o IUsed)
mkdir ~/lab/muitos && cd ~/lab/muitos && touch f{1..2000}
df -i . | tail -1                             # IUsed subiu cerca de 2000
ls | wc -l                                    # 2000
cd ~ && rm -r ~/lab/muitos
du -h --max-depth=1 /var 2>/dev/null | sort -h | tail -5     # quem ocupa mais em /var
```

Raciocínio: arquivos vazios gastam quase zero bytes, mas cada um consome um **inode**. Milhões de arquivos minúsculos (cache, sessões) podem esgotar os inodes com o disco "vazio" — por isso o diagnóstico sempre olha `df -h` **e** `df -i`.

### Desafios

- **Desafio 1:** um comando que apaga arquivos `.log` com mais de 7 dias em uma pasta, mas primeiro só **mostra** quais seriam apagados.
- **Desafio 2:** script de backup `bkp.sh` que faz `tar.gz` de uma pasta com data no nome e mantém só os 3 backups mais recentes.
- **Desafio 3:** encontre, no seu `$HOME`, os 10 maiores arquivos e quanto cada um ocupa (`du`, `sort -h`, `head`).
- **Desafio 4:** em `~/lab/hl`, crie `dados.txt` com uma linha, depois dois hard links (`l1` e `l2`) para ele. Apague o `dados.txt` original e mostre que o conteúdo sobrevive e que o contador de links do arquivo caiu para 2.
  **Verifique:** `stat -c '%h' ~/lab/hl/l1 && cat ~/lab/hl/l2` deve imprimir `2` e depois a linha que você escreveu.

### Desafio avançado — Deduplicador por hard link
**Nível:** avançado — leva de 1 a 3 horas

- **Cenário:** o diretório de artefatos de build guarda dezenas de versões e a maior parte dos arquivos é idêntica entre elas. O disco está apertado, mas ninguém pode perder arquivo nem mudar o caminho de nada. Você vai escrever `~/lab/dedup.sh <dir>... [--apply]`, que recupera espaço trocando duplicatas por hard links.
- **Requisitos:**
  1. Sem `--apply` é só relatório (dry-run): lista os grupos de duplicatas e quantos bytes seriam economizados, sem alterar nenhum inode.
  2. Duplicata = mesmo conteúdo (compare tamanho primeiro e só então o hash ou `cmp`); arquivos vazios são ignorados.
  3. Só une arquivos com **mesmo dono, grupo e permissões**; um arquivo com modo diferente continua independente.
  4. Nomes com espaços e nomes começando com `-` funcionam.
  5. A troca é segura: em nenhum momento um caminho deixa de existir (cria o link com nome temporário e substitui de forma atômica).
  6. Duplicata em outro filesystem (outro device) não é unida: aviso no stderr, arquivo preservado, exit code 0.
  7. Idempotente: uma segunda execução com `--apply` altera 0 arquivos e relata 0 bytes economizados.
- **Restrições:** sem `fdupes`, `rdfind` ou qualquer pacote novo; nada de `rm` seguido de `ln` (deixaria uma janela sem o arquivo).
- **Onde pesquisar:** `find -printf` com `%s`, `%i`, `%D`; `sort -z` e `uniq -z -w`; `ln -f` vs `mv -T`; `stat -c`.
- **Verifique:**
  ```bash
  T=$(mktemp -d ~/lab/dedup.XXXX); cd "$T"; mkdir a b "c d" /dev/shm/dd
  head -c 200000 /dev/urandom > a/x.bin
  cp a/x.bin b/x2.bin; cp a/x.bin "c d/x 3.bin"; cp a/x.bin ./-opa.bin
  cp a/x.bin b/priv.bin; chmod 600 b/priv.bin; cp a/x.bin /dev/shm/dd/x4.bin
  : > a/v1; : > b/v2; printf abc > a/s1; printf abd > a/s2
  h() { find . -type f -print0 | xargs -0 sha256sum | cut -c1-64 | sort | md5sum; }
  antes=$(h); k1=$(du -sk . | cut -f1)
  ~/lab/dedup.sh . /dev/shm/dd; find . -type f -links +1 | wc -l          # relatório; 0 (nada mudou)
  ~/lab/dedup.sh . /dev/shm/dd --apply; echo "rc=$?"                       # rc=0 e aviso sobre /dev/shm
  stat -c %i a/x.bin b/x2.bin "c d/x 3.bin" ./-opa.bin | sort -u | wc -l  # 1
  stat -c %i b/priv.bin a/x.bin | sort -u | wc -l                          # 2 (modo diferente)
  stat -c %i a/v1 b/v2 | sort -u | wc -l                                   # 2 (vazios ignorados)
  [ "$antes" = "$(h)" ] && echo conteudo-intacto
  echo "economia: $((k1 - $(du -sk . | cut -f1))) KB"                      # algo perto de 580 KB
  ls /dev/shm/dd/x4.bin; stat -c %h /dev/shm/dd/x4.bin                     # existe, 1 link
  ~/lab/dedup.sh . --apply                                                 # 0 arquivos alterados, 0 bytes
  rm -rf "$T" /dev/shm/dd
  ```

## Erros comuns nesta fase

- `rm -rf` com variável vazia ou caminho errado.
- Esquecer o `-r` em diretórios (`cp`, `rm`).
- Confundir hard link e symlink.
- Rodar `find -delete` sem testar antes.
- Esquecer `-C` ao extrair e "poluir" o diretório atual.
- Não perceber que o shell expande `*` antes do comando.
- Achar que o disco está cheio só olhando `df -h`, sem checar `df -i`.
- Usar `ln -sf` sem `-n` ao trocar um symlink que aponta para diretório (o novo link nasce dentro do alvo).
- Fazer `tar` com caminho absoluto e depois extrair "no lugar errado" por não usar `-C`.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 00 — `~/lab/dados` e Git em `~/lab` | São os arquivos que você copia, compacta e mede; o `.gitignore` evita versionar backups |
| Módulo 00 — `/mnt/c` x `~` | `du` e `df` deixam claro que `/mnt/c` é outro sistema de arquivos |
| Módulo 01 — FHS e "tudo é arquivo" | `find /etc`, `du /var` e os links `/bin -> usr/bin` ganham sentido |
| Módulo 02 — redirecionamento, pipes, `$(date)` | Montam o nome do backup e capturam os erros do `tar` |
| Módulo 02 — variáveis e aspas | Protegem caminhos com `"$DEST"` ao montar o comando |

### Lab integrador — Backup datado dos dados do lab

Use variável e `$(date)` (02), redirecionamento de stderr (02), `tar` (03), `find`/`ls` (03) e a estrutura do 00:

```bash
export DEST=~/lab/backups
mkdir -p "$DEST"
tar -czf "$DEST/dados-$(date +%Y%m%d-%H%M%S).tar.gz" -C ~/lab dados 2>> "$DEST/erros.log"
ls -lh "$DEST"
tar -tzf "$(ls -t "$DEST"/dados-*.tar.gz | head -1)" | head -5      # confere o conteúdo sem extrair
[ -s "$DEST/erros.log" ] && cat "$DEST/erros.log" || echo "sem erros no backup"
echo 'backups/' >> ~/lab/.gitignore
```

Esperado: um arquivo `dados-AAAAMMDD-HHMMSS.tar.gz` de poucos KB, membros começando com `dados/`, e a mensagem `sem erros no backup`. Rode duas vezes: o `ls -t ... | head -1` sempre escolhe o mais novo.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Inode, `df -i` | Armazenamento — Módulo 08 |
| `find`, `xargs`, `tar` | Scripts de backup — Módulo 11 |
| Permissões de arquivo (`ls -l`) | Módulo 05 |
| `tail -f` | Logs — Módulo 12 |

## `[REFERÊNCIA]`

- GNU Coreutils: https://www.gnu.org/software/coreutils/manual/
- GNU Findutils (`find`, `xargs`): https://www.gnu.org/software/findutils/manual/
- GNU `tar`: https://www.gnu.org/software/tar/manual/
- `man7.org` — `inode(7)`, `glob(7)`: https://man7.org/linux/man-pages/man7/inode.7.html
- *The Linux Command Line*, capítulos de manipulação de arquivos: https://linuxcommand.org/tlcl.php
- LPI — objetivos 103.3/103.4: https://www.lpi.org/our-certifications/exam-101-objectives/

**Como aprofundar:** leia `man find` até a seção "EXAMPLES" e `man 7 glob`; depois refaça os desafios sem consultar este módulo.

## Checklist de saída

- [ ] Explicar nome, inode e dados e por que o nome não está no inode.
- [ ] Usar `cp`, `mv`, `rm`, `mkdir -p` e expansão de chaves com segurança.
- [ ] Explicar globbing e a diferença entre aspas e curinga.
- [ ] Escrever `find` com nome, tipo, tamanho, tempo e `-exec`.
- [ ] Diferenciar hard link e symlink e provar com `ls -li`.
- [ ] Usar `df -h`, `df -i` e `du -sh`.
- [ ] Criar, listar e extrair `tar.gz` sem errar a mnemônica.
