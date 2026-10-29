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

### Desafios

- **Desafio 1:** um comando que apaga arquivos `.log` com mais de 7 dias em uma pasta, mas primeiro só **mostra** quais seriam apagados.
- **Desafio 2:** script de backup `bkp.sh` que faz `tar.gz` de uma pasta com data no nome e mantém só os 3 backups mais recentes.
- **Desafio 3:** encontre, no seu `$HOME`, os 10 maiores arquivos e quanto cada um ocupa (`du`, `sort -h`, `head`).

## Erros comuns nesta fase

- `rm -rf` com variável vazia ou caminho errado.
- Esquecer o `-r` em diretórios (`cp`, `rm`).
- Confundir hard link e symlink.
- Rodar `find -delete` sem testar antes.
- Esquecer `-C` ao extrair e "poluir" o diretório atual.
- Não perceber que o shell expande `*` antes do comando.

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
