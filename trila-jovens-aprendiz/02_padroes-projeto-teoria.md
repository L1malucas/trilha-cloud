# Módulo 02 — Padrões de Projeto: Commits, Branches, Versionamento e Pull Requests

> **Objetivo:** entender por que a equipe padroniza mensagens de commit, nomes de branch,
> versionamento semântico e pull requests — e o que cada convenção evita.
> **Pré-requisitos:** Módulo 01 (Git) concluído.
> **Tempo de referência (não prazo):** 2 a 3 horas.
> **Prática correspondente:** [02_padroes-projeto-pratica.md](02_padroes-projeto-pratica.md)

---

## Por que padronizar

Sem convenção, cada commit e cada branch viram uma decisão individual — e o histórico do
repositório perde a única coisa que o torna útil: contar, de forma previsível, o que mudou, por
quê, e em que ordem. Os padrões abaixo não são estética: cada um resolve um problema concreto de
navegação, automação (changelog, versionamento) ou revisão de código. Repare, ao longo do módulo,
que eles não são regras isoladas — o prefixo do commit alimenta a decisão de versionamento, e o
nome da branch alimenta a rastreabilidade até a tarefa. Um padrão sustenta o outro.

## `[TEORIA]` Mensagens de commit

Quando você conta pra alguém o que acabou de fazer no código, você já classifica a mudança sem
perceber: "corrigi um bug no login", "adicionei uma tela nova", "só reorganizei o código, não mudei
nada de fora". O padrão de commit formaliza exatamente essa classificação natural, em um formato
que tanto humanos quanto ferramentas conseguem ler:

```
PREFIXO: descrição
```

- **PREFIXO**: um entre `chore`, `feat`, `fix`, `refactor`, `docs`, `perf`, `style`, `test`,
  `build`, `ci`, `env`.
- **descrição**: curta, objetiva, começando com letra minúscula, no que foi feito (não no que
  "será feito").

| Prefixo | Quando usar |
|---|---|
| `feat` | nova funcionalidade |
| `fix` | correção de bug |
| `refactor` | mudança de estrutura interna sem alterar comportamento |
| `docs` | documentação |
| `perf` | melhoria de performance |
| `style` | formatação, sem mudança de lógica |
| `test` | testes |
| `build` | build/dependências |
| `ci` | pipelines de integração contínua |
| `chore` | manutenção geral |
| `env` | configuração de ambiente |

O motivo de existir um vocabulário fechado (em vez de deixar cada pessoa descrever a mudança do
seu jeito) é que o prefixo não é só um rótulo pra humano ler — é um dado que ferramentas
consomem. Um script pode varrer o histórico de commits e montar um changelog automaticamente
agrupando por prefixo; e, como você vai ver na seção de versionamento semântico mais abaixo, o
prefixo `fix` ou `feat` é exatamente o que determina, de forma automática, se a próxima versão
deve subir o PATCH ou o MINOR. O prefixo certo hoje evita trabalho manual (e erro humano) depois.

**Exemplo narrado:** imagine que você adicionou um botão de "esqueci minha senha" na tela de
login. É uma funcionalidade nova (o sistema ganhou uma capacidade que não tinha) — não uma
correção (nada estava quebrado antes) nem uma refatoração (o comportamento mudou, não só a
estrutura interna). Prefixo correto: `feat`.
```
feat: adicionar recuperação de senha na tela de login
```

`[TENTE VOCÊ]` Qual prefixo você usaria para "o botão de login estava sem funcionar no celular, e
você consertou"? Resposta: `fix` — nada de novo foi adicionado, um comportamento quebrado voltou
a funcionar.

`[ATENÇÃO]` O prefixo errado (ex: `fix` para uma funcionalidade nova) não é só uma questão de
estilo: quebra a geração automática de changelog, e — como você vai ver na próxima seção — pode
levar a próxima versão a subir o número errado.

## `[TEORIA]` Nomes de branch

Assim como o prefixo do commit avisa que *tipo* de mudança é aquela, o nome da branch avisa, já
na aba do repositório, que tipo de trabalho está sendo feito ali dentro — e a qual tarefa
específica ele pertence, antes mesmo de alguém abrir o código.

```
PREFIXO/TASK-NOME-DA-TAREFA
```

- **PREFIXO**: `feature`, `fix`, `hotfix`, `style`, `refactor`, `test`, `chore`, `docs`.
- **TASK**: identificador numérico único da tarefa (ex: ID no sistema de gestão de projeto).
- **NOME-DA-TAREFA**: descrição curta, em minúsculas, palavras separadas por hífen.

O `TASK` é a parte que mais gente pula por parecer burocracia — mas é o elo que conecta o código
de volta à tarefa que o motivou. Sem ele, alguém revisando o repositório meses depois vê uma
branch chamada `fix/correcao-login` e não tem como saber *qual* problema de login era esse, nem
onde estava documentada a decisão de corrigi-lo. Com o número da tarefa, essa pessoa consegue
voltar direto ao sistema de gestão e reconstituir o contexto.

**Exemplo narrado:** você foi designado para a tarefa nº `1234`, que pede um cadastro de usuário
novo. É uma funcionalidade nova, então o prefixo é `feature`; a tarefa é a `1234`; o nome
descreve o que é, em poucas palavras:
```
feature/1234-cadastro-usuario
```

Repare a diferença entre `fix` e `hotfix`: `fix` corrige um bug dentro do fluxo normal de
desenvolvimento (vai passar por revisão, testes, etc. como qualquer outra mudança); `hotfix` é
uma correção urgente, geralmente aplicada direto sobre uma versão já em produção, pulando parte
do fluxo normal por causa da urgência. Usar `hotfix` pra tudo que é urgente "na cabeça de quem
escreveu" — sem ser de fato produção quebrada — tira o peso do sinal que essa palavra deveria dar.

**Exceções** — não seguem esse formato: `main`, `develop`, `hmg`.

`[TENTE VOCÊ]` Você vai corrigir um erro crítico de autenticação que está afetando todos os
usuários em produção agora, tarefa nº `9101`. Qual o nome da branch? Resposta:
`hotfix/9101-erro-critico-autenticacao`.

`[ATENÇÃO]` Nomear a branch sem o número da tarefa é o erro mais comum aqui — o nome ainda
"parece certo" visualmente, mas a rastreabilidade até o sistema de gestão de projeto some.

## `[TEORIA]` Versionamento semântico (SemVer)

Toda vez que você atualiza um aplicativo no celular, você confia — mesmo sem perceber — em algum
sinal de que a atualização não vai quebrar o que já funcionava. É exatamente esse sinal que o
Versionamento Semântico formaliza, em três números: `MAJOR.MINOR.PATCH`.

- **MAJOR**: muda quando há incompatibilidade com versões anteriores — algo que já funcionava
  pode parar de funcionar.
- **MINOR**: muda quando se adiciona funcionalidade mantendo compatibilidade — nada quebra, só
  ganha algo novo.
- **PATCH**: muda quando se corrige bug mantendo compatibilidade — nada quebra, só conserta.

Repare que essas três categorias são, quase palavra por palavra, os mesmos três prefixos de
commit que você acabou de estudar: `feat` sinaliza exatamente o tipo de mudança que sobe o MINOR;
`fix` sinaliza o tipo que sobe o PATCH. Não é coincidência — é o mesmo motivo pelo qual as duas
convenções existem juntas: o prefixo do commit já carrega a informação que decide a próxima
versão.

**Exemplo narrado:** a versão atual é `1.5.2`. Você adiciona uma funcionalidade nova, sem quebrar
nada do que já existia — isso é um `feat`, então o MINOR sobe e o PATCH zera: `1.5.2 → 1.6.0`.

`[TENTE VOCÊ]` A versão atual é `2.3.1`. Você removeu um parâmetro obrigatório de uma função
pública (quem já usava a versão anterior vai quebrar). Qual a próxima versão? Resposta: `3.0.0` —
é uma mudança incompatível, então sobe o MAJOR, e MINOR e PATCH zeram.

`[ATENÇÃO]` Pular o incremento de MAJOR ao introduzir uma mudança incompatível — publicando-a
como MINOR ou PATCH — é a causa mais comum de builds quebrando em cascata em projetos com
dependências internas: quem depende da sua biblioteca atualiza "de boa fé", achando que a
mudança era segura, e só descobre o problema em produção.

## `[TEORIA]` Git tags

Uma tag é como um marcador de página num livro — só que, em vez de apontar pra uma posição
aproximada, ela aponta pra um commit exato, de forma permanente, e com um nome legível
(`v1.4.0`) em vez do hash comprido do commit. Isso é o que permite, meses depois, alguém dizer
"me dá o código exatamente como estava na versão 1.4.0" sem precisar procurar qual commit era.

`[CLI]` Criar uma tag anotada (sugerido rodar na branch `main`):
```
git tag -a v1.4.0 -m "Lançamento da versão 1.4.0"
```
O `-a` importa: cria uma tag **anotada**, que guarda autor, data e mensagem — um objeto completo
no histórico do Git, igual um commit. Sem o `-a`, o Git cria uma tag **leve**, que é só um
apelido apontando pro commit, sem esse metadado. Para marcar lançamentos de versão, a anotada é a
prática recomendada, justamente por preservar o registro de quem e quando lançou aquela versão.

Enviar a tag ao repositório remoto:
```
git push origin v1.4.0
```

Enviar todas as tags de uma vez:
```
git push origin --tags
```

`[TENTE VOCÊ]` Escreva o comando para criar uma tag anotada `v2.0.0` com a mensagem "Lançamento
da versão 2.0.0". Resposta: `git tag -a v2.0.0 -m "Lançamento da versão 2.0.0"`.

## `[TEORIA]` Pull Requests

Antes de existir o Pull Request formal, a forma natural de pedir revisão seria mandar uma
mensagem pra alguém: "oi, fiz tal coisa, por causa de tal motivo, dessa forma — dá uma olhada?".
A descrição de um PR bem escrito é exatamente essa mensagem, só que registrada no lugar certo,
pra qualquer revisor conseguir decidir sem precisar te perguntar nada antes.

**Título**: curto, objetivo, no que foi feito.
```
Adicionando funcionalidade de login
Corrigindo bug na tela de cadastro
Atualizando a versão do Angular
```

**Descrição** — estrutura mínima, respondendo exatamente as três perguntas que um revisor faria
se você não tivesse escrito nada:
- **O que foi feito**: as alterações, de forma objetiva.
- **Por que**: a necessidade que motivou a mudança.
- **Como foi feito**: decisões tomadas, tecnologias usadas.
- **Pull Requests relacionados**: `!número_do_PR`, se houver.
- **Desenvolvedores envolvidos**: `@nome_do_desenvolvedor`.
- **Tarefas relacionadas**: `#número_da_tarefa`.

`[TENTE VOCÊ]` Você criou a tela de recuperação de senha (do exemplo da primeira seção). Escreva
só o título do PR, seguindo o padrão "curto, objetivo, no que foi feito". Resposta possível:
"Adicionando recuperação de senha na tela de login".

`[ATENÇÃO]` Um título vago (`"ajustes"`, `"fix"`) sem descrição obriga o revisor a ler o diff
inteiro sem nenhum contexto prévio — o tempo que você economiza não escrevendo a descrição vira
tempo perdido (multiplicado por cada revisor) tentando reconstruir o que a descrição já diria em
duas linhas.

## Erros comuns nesta fase

Você já viu estes quatro avisos ao longo do módulo — aqui vai só a revisão rápida:

- Usar `fix` para o que na verdade é uma nova funcionalidade (`feat`).
- Nomear branch sem o identificador da tarefa (`TASK`), perdendo a rastreabilidade até o sistema
  de gestão de projeto.
- Pular o incremento de MAJOR ao introduzir uma mudança incompatível.
- Abrir PR com título vago e sem descrição.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Nome de branch por tarefa | Módulo 01 (Git) — fluxo de branches na prática |
| SemVer / tags | Módulos técnicos (09, 11, 12, 13) — ao versionar entregas de exercícios |
| Estrutura de PR | Todo módulo cuja entrega passa por revisão de código |

## `[REFERÊNCIA]`

- [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
- [Semantic Versioning 2.0.0](https://semver.org/lang/pt-BR/)
- [Git Tagging — documentação oficial](https://git-scm.com/book/pt-br/v2/Fundamentos-do-Git-Marcando)

## Checklist de saída

- [ ] Sei escolher o prefixo correto de commit para uma mudança dada, e explicar por que aquele
      prefixo (não outro) se aplica.
- [ ] Sei nomear uma branch seguindo `PREFIXO/TASK-NOME-DA-TAREFA`, incluindo o número da tarefa.
- [ ] Entendo quando incrementar MAJOR, MINOR e PATCH, e por que isso se conecta ao prefixo do
      commit.
- [ ] Sei criar e enviar uma tag anotada, e explicar a diferença entre tag anotada e leve.
- [ ] Sei estruturar a descrição de um Pull Request (o quê / por quê / como) sem que o revisor
      precise perguntar nada antes.
