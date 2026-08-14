---
id: 01_git-teoria
title: "Módulo 01 — Git"
sidebar_position: 10
---

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

`[TENTE VOCÊ]` Rode `git init` numa pasta vazia e, em seguida, `git status`. O que aparece?
Resposta: algo como "nothing to commit, working tree clean" — porque não existe nenhum arquivo
ainda para rastrear.

### `git log` — lendo o histórico de verdade

Até aqui você só criou commits — `git log` é como você **lê** esse histórico depois. Sem ele, o
trabalho de dias vira uma caixa preta: você sabe que existe um histórico, mas não consegue
enxergá-lo. Rodando `git log` num repositório com alguns commits, a saída é parecida com esta
(exemplo fabricado, mas no formato real):

```
commit e91a4c73f8b2d0e1a9c4567890abcdef1234567 (HEAD -> main)
Merge: 4f1d9a2 a3f9c21
Author: Ana Souza <ana.souza@email.com>
Date:   Tue Aug 12 14:35:10 2026 -0300

    Merge branch 'feature/1234-cadastro-usuario'

commit a3f9c21e8b4d5f67890123456789abcdef01234
Author: Ana Souza <ana.souza@email.com>
Date:   Tue Aug 12 14:32:07 2026 -0300

    feat: adicionar validação de e-mail no cadastro

commit 7c2e814f3a9b0d1e2f3456789abcdef012345678
Author: Ana Souza <ana.souza@email.com>
Date:   Mon Aug 11 09:15:43 2026 -0300

    fix: corrigir mensagem de erro ao login

commit 4f1d9a2c6e8b7f0123456789abcdef0123456789
Author: Ana Souza <ana.souza@email.com>
Date:   Mon Aug 11 08:50:21 2026 -0300

    docs: adicionar instruções de instalação no README
```

Lendo de cima para baixo (do mais recente para o mais antigo): o topo é o merge que trouxe a
branch `feature/1234-cadastro-usuario` de volta para a `main` (repare o prefixo `feature/1234-...`
— é exatamente o padrão de nome de branch do Módulo 02); embaixo dele, os dois commits que essa
branch trouxe (`feat` e `fix`, com o hash e o autor de cada um); e na base, um commit anterior já
existente na `main` (`docs`).

Duas variações do mesmo comando, pra situações diferentes:

```
git log --oneline
```
```
e91a4c7 Merge branch 'feature/1234-cadastro-usuario'
a3f9c21 feat: adicionar validação de e-mail no cadastro
7c2e814 fix: corrigir mensagem de erro ao login
4f1d9a2 docs: adicionar instruções de instalação no README
```
A mesma história, comprimida numa linha por commit (hash curto + mensagem) — útil quando você só
quer escanear rapidamente o que aconteceu, sem ler autor/data de cada um.

```
git log --graph --oneline
```
```
*   e91a4c7 Merge branch 'feature/1234-cadastro-usuario'
|\
| * a3f9c21 feat: adicionar validação de e-mail no cadastro
| * 7c2e814 fix: corrigir mensagem de erro ao login
|/
* 4f1d9a2 docs: adicionar instruções de instalação no README
```
Aqui a estrutura fica visual: as duas linhas com `|` mostram os dois commits que viveram numa
branch separada antes de voltar pra `main` no merge (`*` com `|\`). É a mesma informação do
primeiro `git log`, só que desenhada — ajuda muito quando o histórico tem várias branches indo e
voltando.

`[TENTE VOCÊ]` Olhando o `git log --graph --oneline` acima, quantos commits foram feitos *dentro*
da branch `feature/1234-cadastro-usuario`, antes dela ser mesclada de volta? Resposta: 2
(`a3f9c21` e `7c2e814`) — são os dois que aparecem na linha desviada (`|`) antes de ela voltar a
se juntar com a `main`.

`[CLI]` Quer ver só o conteúdo exato que um commit específico mudou (não só a mensagem)?
```
git show a3f9c21
```
Mostra a mensagem do commit *e* o diff (as linhas exatas que mudaram) daquele commit específico —
como abrir uma "foto" isolada do histórico, sem precisar navegar pelo projeto inteiro.

## `[TEORIA]` `.gitignore` — o que o Git nunca deveria rastrear

Nem todo arquivo dentro de uma pasta de projeto deveria virar parte do histórico. Arquivos
gerados automaticamente (ex: pastas de dependências baixadas, como `node_modules/`) ou que
contêm dados sensíveis/locais (ex: senhas de ambiente num arquivo `.env`) não devem ser
versionados — cada pessoa que clona o repositório já gera ou configura os seus próprios. Um
arquivo `.gitignore`, na raiz do projeto, diz ao Git "nunca me pergunte sobre esses arquivos":

```
node_modules/
.env
*.log
__pycache__/
```

`[ATENÇÃO]` Se um arquivo já foi commitado *antes* de entrar no `.gitignore`, adicioná-lo à lista
não remove ele do histórico — o Git só ignora *mudanças futuras* nele. O que fazer no lugar: rode
`git rm --cached nome-do-arquivo` (remove do rastreamento sem apagar o arquivo do seu disco),
*depois* adicione ao `.gitignore`, e commit essa remoção.

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

### `git diff` — vendo exatamente o que mudou, antes de decidir

`git add` escolhe *quais arquivos* entram no commit, mas antes de decidir isso, muitas vezes você
quer conferir *o que exatamente* mudou dentro deles — não só "o arquivo `app.py` foi modificado",
mas as linhas específicas. `git diff` mostra isso.

**Exemplo narrado:** você alterou uma função em `app.py`, adicionando uma verificação de senha.
Antes de dar `git add`, você roda:
```
git diff
```
```diff
diff --git a/app.py b/app.py
index 3f8a1b2..9c7d4e5 100644
--- a/app.py
+++ b/app.py
@@ -12,7 +12,7 @@ def validar_login(usuario, senha):
     if not usuario or not senha:
         return False
-    return usuario in banco_de_dados
+    return usuario in banco_de_dados and senha == banco_de_dados[usuario]
```
Linhas com `-` (vermelho, no terminal) são o que existia antes; linhas com `+` (verde) são o que
existe agora. `git diff`, sozinho, mostra as mudanças que **ainda não foram** adicionadas com
`git add` (working directory vs. último commit). Depois de dar `git add app.py`, rodar `git diff`
de novo não mostra mais nada — porque não há diferença entre o *working directory* e o que está
*staged*. Pra ver o que está staged, comparado ao último commit, o comando é outro:
```
git diff --staged
```

`[TENTE VOCÊ]` Você editou um arquivo e já rodou `git add`. Quer conferir de novo, com calma, o
que exatamente vai entrar no commit antes de confirmar. Qual comando usa? Resposta:
`git diff --staged` — `git diff` sozinho não mostraria nada, porque a mudança já está staged.

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

### `git stash` — guardando uma mudança no bolso, sem commitar pela metade

Cenário comum: você está no meio de uma mudança em `experimento`, ainda não pronta pra virar
commit, e precisa trocar rapidamente para `main` (ex: pra corrigir algo urgente). O Git não deixa
trocar de branch com mudanças conflitantes soltas no meio do caminho — e você não quer forçar um
commit incompleto só pra "guardar o lugar". `git stash` resolve isso: guarda suas mudanças não
commitadas num "bolso" separado, deixando a pasta de trabalho limpa de novo.

```
git stash          # guarda as mudanças atuais, limpa a pasta de trabalho
git stash list     # lista o que está guardado
git stash pop      # traz de volta o último stash guardado, removendo-o da lista
```

`[TENTE VOCÊ]` Você guardou uma mudança com `git stash`, trocou de branch, resolveu o que
precisava, e voltou pra branch original. Como recupera a mudança guardada? Resposta:
`git stash pop`.

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

### `git reset` e `git revert` — o Ctrl+Z do próprio Git

Lá na abertura deste módulo, a comparação foi com `Ctrl+Z` — um "desfazer" permanente e
compartilhável. `git reset` e `git revert` são exatamente isso, mas cada um resolve um problema
diferente:

- **`git reset`** move o histórico da branch pra trás, como se os commits mais recentes nunca
  tivessem existido — ele **reescreve** o histórico local.
  ```
  git reset --soft HEAD~1   # desfaz o último commit, mas mantém as mudanças "staged"
  git reset --hard HEAD~1   # desfaz o último commit E descarta as mudanças de vez
  ```
- **`git revert`** não apaga nada do histórico — ele cria um **novo commit** que aplica o efeito
  contrário do commit escolhido, cancelando a mudança sem reescrever nada que já existia.
  ```
  git revert a3f9c21
  ```

`[ATENÇÃO]` `git reset --hard` num commit que **já foi enviado** pra um remoto compartilhado
(`git push`) é perigoso: reescreve um histórico que outras pessoas já baixaram, e a próxima vez
que elas sincronizarem vai gerar confusão ou conflito. O que fazer no lugar: em branches
compartilhadas, prefira `git revert` — ele desfaz o efeito sem apagar o que já aconteceu, então
todo mundo consegue sincronizar normalmente. Reserve `git reset` para commits que **ainda estão
só na sua máquina**, nunca enviados.

`[TENTE VOCÊ]` Você já deu `git push` de um commit com um bug, e outras duas pessoas do time já
baixaram esse commit. Você usaria `git reset` ou `git revert` pra corrigir? Resposta: `git
revert` — como o commit já foi compartilhado, reescrever o histórico com `reset` bagunçaria o
repositório de quem já baixou; `revert` desfaz o efeito com um commit novo, sem esse problema.

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

### Conectando um repositório local a um remoto do zero

Quando você começa um projeto localmente (com `git init`) e só depois cria o repositório vazio no
GitHub, precisa *ligar* os dois manualmente:

```
git remote add origin https://github.com/seu-usuario/seu-projeto.git
git remote -v
```
`git remote add origin <url>` registra o endereço do remoto sob o apelido `origin` (convenção
padrão — poderia ter outro nome, mas quase ninguém muda). `git remote -v` lista os remotos
configurados, confirmando que o endereço ficou certo.

No primeiro `push` de uma branch nova, é preciso avisar ao Git qual branch remota essa branch
local deve **rastrear** (a *tracking branch*) — depois disso, `git push`/`git pull` sozinhos já
sabem pra onde ir:
```
git push -u origin main
```
O `-u` (de *upstream*) faz exatamente essa ligação, uma vez só; nos próximos pushes dessa branch,
`git push` sozinho já basta.

`[TENTE VOCÊ]` Depois de rodar `git push -u origin main` uma vez, o que muda no próximo commit
que você quiser enviar? Resposta: basta `git push`, sem precisar especificar `origin main` de
novo — a tracking branch já foi configurada.

### Quando o `push` é rejeitado

Um push é rejeitado quando o remoto tem commits que você ainda não tem localmente (ex: outra
pessoa já enviou algo desde a última vez que você sincronizou). O Git recusa o push pra não
sobrescrever esse trabalho às cegas.

```
git push
# ! [rejected] main -> main (fetch first)
# error: failed to push some refs
```

O que fazer: trazer o que está faltando antes de tentar de novo.
```
git pull
git push
```

`[ATENÇÃO]` Existe uma forma de "forçar" o push mesmo com a rejeição (`git push --force`), mas
isso **sobrescreve** o histórico do remoto com o seu, descartando silenciosamente qualquer commit
que estivesse lá e você não tem — perigoso numa branch compartilhada, porque apaga trabalho de
outras pessoas sem aviso. O que fazer no lugar: resolva com `git pull` (trazendo e mesclando o
que está faltando) antes de tentar o push de novo; se realmente precisar forçar em algum cenário
específico (ex: reescreveu um commit só seu, ainda não visto por ninguém), use
`git push --force-with-lease` em vez de `--force` puro — ele falha com segurança se alguém mais
tiver enviado algo desde a última vez que você sincronizou, em vez de sobrescrever cegamente.

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Esquecer o `git add` antes do `git commit`.
- Commitar um arquivo que já deveria estar no `.gitignore` antes de existir.
- Deixar marcadores de conflito (`<<<<<<<`, `=======`, `>>>>>>>`) no arquivo depois de resolver.
- Confundir `pull` (traz e já mescla) com `fetch` (só traz a informação).
- Usar `git reset --hard` num commit que já foi enviado a um remoto compartilhado.
- Usar `git push --force` puro numa branch compartilhada, em vez de `--force-with-lease` (ou,
  melhor ainda, resolver com `pull` antes).

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Nomes de branch (ainda sem convenção formal aqui) | Módulo 02 — Padrões de Projeto formaliza como nomear |
| `git log` e histórico de commits | Módulo 02 — mensagens de commit padronizadas aparecem exatamente nesse formato |
| Commits e histórico | Todo módulo cuja entrega é feita via GitHub |
| Merge e colaboração | Módulos técnicos com projeto prático (09, 10, 11, 12, 13) |

## `[REFERÊNCIA]`

- [Learn Git Branching](https://learngitbranching.js.org/?locale=pt_BR) — ferramenta interativa
  usada na prática deste módulo.
- [Documentação oficial do Git (pt-BR)](https://git-scm.com/book/pt-br/v2)

## Checklist de saída

- [ ] Crio um repositório e faço commits, sabendo explicar por que `add` e `commit` são passos
      separados.
- [ ] Leio a saída de `git log`, `git log --oneline` e `git log --graph`, sabendo dizer o que
      cada formato mostra de diferente.
- [ ] Uso `git diff` e `git diff --staged` pra conferir mudanças antes de commitar.
- [ ] Configuro um `.gitignore` e sei corrigir um arquivo que foi commitado por engano antes dele
      existir.
- [ ] Crio e mesclo branches, sabendo explicar por que o commit de uma branch não aparece nas
      outras até o merge.
- [ ] Uso `git stash` pra trocar de branch sem perder uma mudança em andamento.
- [ ] Resolvo um conflito de merge manualmente, removendo os marcadores corretamente.
- [ ] Sei quando usar `git reset` (histórico só local) e quando usar `git revert` (histórico já
      compartilhado).
- [ ] Uso `clone`, `push`, `pull` e `fetch`, e explico a diferença entre `pull` e `fetch`.
- [ ] Configuro um remoto do zero com `git remote add`/`-u`, e sei resolver um push rejeitado sem
      usar `--force` puro.
