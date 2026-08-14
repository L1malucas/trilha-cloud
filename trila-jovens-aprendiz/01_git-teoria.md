# Módulo 01 — Git

> **Objetivo:** entender o que é controle de versão e por que ele existe, e praticar os comandos
> essenciais do Git — commits, branches, merges e resolução de conflitos.
> **Pré-requisitos:** nenhum — primeiro módulo da trilha.
> **Tempo de referência:** 4 a 6 horas.
> **Prática correspondente:** [01_git-pratica.md](01_git-pratica.md)

---

## Por que isso importa

Você já usa `Ctrl+Z` — desfazer uma ação, um passo de cada vez. Mas o `Ctrl+Z` do seu editor de
texto tem três limitações: some quando você fecha o programa, só funciona sozinho (se outra
pessoa mexeu no mesmo arquivo, seu histórico de "desfazer" não sabe nada sobre isso), e é
estritamente linear (não dá pra "desfazer só uma parte" e manter o resto). Git resolve as três
coisas ao mesmo tempo: um histórico permanente, compartilhável entre várias pessoas, e não-linear
(você pode ter caminhos diferentes de mudança acontecendo ao mesmo tempo, sem um atropelar o
outro). Esse módulo é a base de tudo o que vem depois na trilha — a partir daqui, todo módulo
pede entrega via GitHub.

## `[TEORIA]` O que é controle de versão, e por que ele existe

Imagine editar um documento em conjunto com um colega trocando arquivos por e-mail:
`projeto_final.docx`, depois `projeto_final_v2.docx`, depois `projeto_final_v2_CORRIGIDO.docx`.
Rapidamente fica impossível saber qual é a versão certa, o que mudou entre uma e outra, ou quem
mudou o quê. Controle de versão resolve isso guardando, de forma automática e ordenada, um
**snapshot** (uma foto completa do estado do projeto) a cada mudança significativa que você
decide registrar — chamada de **commit**. Cada commit sabe quem fez, quando, e o que mudou em
relação ao commit anterior.

Um **repositório** é o projeto inteiro rastreado dessa forma: os arquivos atuais, mais todo o
histórico de commits que levou até eles, guardado numa pasta oculta chamada `.git`.

## `[TEORIA]` Criando e inspecionando um repositório

`[CLI]`
```
git init
```
Transforma a pasta atual em um repositório Git, criando a pasta `.git` (onde todo o histórico vai
ser guardado). A partir daqui, o Git passa a observar as mudanças nos arquivos dessa pasta.

```
git status
```
Responde a pergunta "onde eu estou agora?" — mostra quais arquivos mudaram desde o último commit,
e quais dessas mudanças já estão prontas para virar o próximo commit.

```
git log
```
Mostra o histórico de commits — cada um com seu identificador único (hash), autor, data e
mensagem.

`[TENTE VOCÊ]` Rode `git init` numa pasta vazia e, em seguida, `git status`. O que aparece?
Resposta: algo como "nothing to commit, working tree clean" — porque não existe nenhum arquivo
ainda para rastrear.

## `[TEORIA]` `add` e `commit` — por que são dois passos, não um

Um detalhe que confunde quem começa: por que não existe um único comando "salvar tudo"? Porque o
Git separa **selecionar o que vai entrar no próximo commit** (`git add`) de **de fato registrar
esse commit** (`git commit`). Pense em empacotar uma caixa para enviar pelos Correios: primeiro
você escolhe o que vai dentro da caixa (`add`), depois lacra e despacha (`commit`). Essa separação
existe porque você pode ter mexido em três arquivos diferentes, mas só quer registrar a mudança
de um deles agora — o `add` deixa você escolher exatamente isso, mesmo quando várias mudanças não
relacionadas estão acontecendo ao mesmo tempo na sua pasta de trabalho.

**Exemplo narrado:** você editou `app.py` e `notas.txt`, mas só quer registrar a mudança do
`app.py` agora:
```
git add app.py
git commit -m "adiciona validação de login"
```
`notas.txt` continua modificado no seu diretório, mas fora desse commit — ele só entra quando
você decidir dar `git add notas.txt` também.

`[ATENÇÃO]` Esquecer o `git add` antes do `git commit` é o erro mais comum no início — o commit
sai vazio, ou sem as mudanças que você esperava que estivessem lá. Rode `git status` sempre antes
de commitar, para conferir exatamente o que está preparado (staged).

`[TENTE VOCÊ]` Crie um arquivo `ola.txt` com qualquer texto, e registre-o em um commit. Resposta:
`git add ola.txt` seguido de `git commit -m "adiciona ola.txt"`.

## `[TEORIA]` Branches — trabalhando em paralelo sem interferir

Imagine que você quer testar uma mudança arriscada num projeto que já funciona, sem correr o
risco de estragar a versão estável enquanto testa. No mundo dos documentos, você faria uma cópia.
No Git, essa "cópia" se chama **branch** — só que, em vez de duplicar o projeto inteiro, o Git só
rastreia inteligentemente os pontos em que a branch nova diverge da original, o que faz criar uma
branch ser praticamente instantâneo.

```
git branch nome-da-branch     # cria a branch
git switch nome-da-branch     # troca para ela
```

**Exemplo narrado:** você está na branch `main` (a branch principal, "estável"). Cria uma branch
`experimento`, troca para ela, e faz um commit lá. Se você voltar para `main` com
`git switch main`, esse commit **não aparece** no histórico da `main` — ele existe só dentro de
`experimento`, isolado, até que alguém decida trazê-lo de volta.

Para trazer as mudanças de uma branch de volta:
```
git merge experimento
```
(rodado estando na branch que vai *receber* as mudanças, geralmente a `main`).

`[TENTE VOCÊ]` Crie uma branch chamada `teste`, faça uma mudança nela, volte para `main` e rode
`git log`. O commit da branch `teste` aparece? Resposta: não — ele só passa a existir na `main`
depois que você fizer `git merge teste` estando na `main`.

## `[TEORIA]` Conflitos de merge — por que acontecem

Um conflito de merge acontece quando a **mesma linha** de um arquivo foi alterada de formas
diferentes em duas branches que você está tentando juntar — o Git não tem como adivinhar qual das
duas versões é a "certa", então ele para e pede pra você decidir. É a mesma situação de duas
pessoas editando o mesmo parágrafo de um documento ao mesmo tempo, cada uma à sua maneira:
alguém precisa olhar as duas versões e decidir a final.

Quando isso acontece, o Git marca o trecho conflitante diretamente no arquivo:
```
<<<<<<< HEAD
sua versão da linha
=======
versão da outra branch
>>>>>>> experimento
```
Você edita o arquivo manualmente, decidindo o que fica (pode ser uma das duas versões, as duas
combinadas, ou algo novo), **remove os marcadores** (`<<<<<<<`, `=======`, `>>>>>>>`), e finaliza
o merge normalmente:
```
git add arquivo-resolvido.txt
git commit
```

`[ATENÇÃO]` Esquecer de remover os marcadores de conflito antes de commitar é um erro clássico —
o arquivo fica com esse "lixo" do Git salvo dentro dele, e ninguém percebe até rodar o código (ou
ler o arquivo) e ver os `<<<<<<<` lá dentro.

`[TENTE VOCÊ]` Duas branches mudaram a mesma linha de um arquivo de formas diferentes, e você deu
merge. O Git resolveu sozinho ou parou pedindo sua decisão? Resposta: parou — sempre que a mesma
linha muda de forma diferente nas duas branches, o Git não decide por você.

## `[TEORIA]` Trabalhando com repositórios remotos

Até aqui, tudo aconteceu só na sua máquina. Um **remoto** (como o GitHub) é uma cópia do
repositório hospedada em outro lugar, que permite colaboração — várias pessoas mandando e
recebendo commits do mesmo lugar central.

```
git clone <url>    # baixa uma cópia completa de um repositório remoto
git push           # envia seus commits locais para o remoto
git pull           # traz commits novos do remoto e já mescla no seu branch atual
git fetch          # só baixa a informação do remoto, sem mesclar automaticamente
```

A diferença entre `pull` e `fetch` costuma confundir: `git pull` é, na prática, um `git fetch`
seguido de um `git merge` automático. `git fetch` sozinho deixa você ver o que mudou no remoto
antes de decidir se quer trazer isso para o seu branch atual — útil quando você quer conferir
antes de misturar.

`[TENTE VOCÊ]` Você quer só ver se existem commits novos no remoto, sem aplicá-los ainda no seu
branch atual. Qual comando usa? Resposta: `git fetch`.

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Esquecer o `git add` antes do `git commit`.
- Deixar marcadores de conflito (`<<<<<<<`, `=======`, `>>>>>>>`) no arquivo depois de resolver.
- Confundir `pull` (traz e já mescla) com `fetch` (só traz a informação).

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Nomes de branch (ainda sem convenção formal aqui) | Módulo 02 — Padrões de Projeto formaliza como nomear |
| Commits e histórico | Todo módulo cuja entrega é feita via GitHub |
| Merge e colaboração | Módulos técnicos com projeto prático (09, 10, 11, 12, 13) |

## `[REFERÊNCIA]`

- [Learn Git Branching](https://learngitbranching.js.org/?locale=pt_BR) — ferramenta interativa
  usada na prática deste módulo.
- [Documentação oficial do Git (pt-BR)](https://git-scm.com/book/pt-br/v2)

## Checklist de saída

- [ ] Crio um repositório e faço commits, sabendo explicar por que `add` e `commit` são passos
      separados.
- [ ] Crio e mesclo branches, sabendo explicar por que o commit de uma branch não aparece nas
      outras até o merge.
- [ ] Resolvo um conflito de merge manualmente, removendo os marcadores corretamente.
- [ ] Uso `clone`, `push`, `pull` e `fetch`, e explico a diferença entre `pull` e `fetch`.
