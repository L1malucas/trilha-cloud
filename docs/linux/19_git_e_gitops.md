---
id: "19_git_e_gitops"
title: "Módulo 19 — Git e GitOps"
sidebar_label: "19 · Git e GitOps"
sidebar_position: 19
---

# Módulo 19 — Git e GitOps

> **Objetivo**: ir do Git básico (Módulo 15) ao Git de equipe — como ele funciona por dentro, `rebase` x `merge`, Pull Requests, estratégias de branching, tags e versionamento semântico, hooks, `bisect`/`reflog` e o modelo **GitOps**, onde o repositório é a fonte da verdade da infraestrutura.
>
> **Pré-requisitos**: módulo 15.
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Base do fluxo de trabalho de qualquer time de infra/DevOps, e de CI/CD (Módulo 22) e Kubernetes (Módulo 23). Livro: https://git-scm.com/book/pt-br/v2

---

## Por dentro: o Git é um banco de objetos

Entender o modelo interno elimina o medo dos comandos "avançados". Git guarda quatro tipos de **objetos**, cada um identificado por um **hash** (SHA) do seu conteúdo:

- **blob**: o conteúdo de um arquivo.
- **tree**: um diretório (lista de blobs e outras trees).
- **commit**: aponta para uma tree (a foto do projeto), para o(s) commit(s) **pai** e carrega autor, data e mensagem.
- **tag**: um nome fixo para um commit.

Uma **branch** não é uma cópia: é só um **ponteiro** (um arquivo com um hash) para um commit, que avança a cada commit novo. `HEAD` aponta para a branch em que você está. Por isso criar branch é instantâneo e barato.

```bash
cd ~/lab && rm -rf git-por-dentro && mkdir git-por-dentro && cd git-por-dentro && git init -q
echo "oi" > a.txt && git add a.txt && git commit -qm "primeiro"
git cat-file -p HEAD                      # o commit: tree, autor, mensagem
git cat-file -p HEAD^{tree}               # a árvore: o blob de a.txt
cat .git/HEAD                             # ref: refs/heads/main
cat .git/refs/heads/main                  # o hash do commit
find .git/objects -type f | head          # os objetos armazenados
```

> `[TEORIA]` Como o commit referencia seu pai pelo hash, **alterar um commit antigo muda todos os hashes seguintes**: é por isso que reescrever histórico publicado (`rebase`/`push --force`) é perigoso e deve ser evitado em branches compartilhadas.

## Merge x rebase

As duas formas de integrar o trabalho de uma branch em outra:

- **`merge`**: cria um **commit de junção** com dois pais; preserva o histórico exatamente como aconteceu (com o "losango" no grafo).
- **`rebase`**: **reaplica** seus commits por cima da ponta da outra branch, gerando histórico **linear** (e novos commits com novos hashes).

```bash
git switch -c feature
echo f1 > f.txt && git add f.txt && git commit -qm "feature 1"
git switch main
echo m1 > m.txt && git add m.txt && git commit -qm "main avançou"

git switch feature
git rebase main                      # reaplica 'feature 1' em cima do 'main avançou'
git log --oneline --graph --all
git switch main && git merge --ff-only feature     # avanço rápido (sem commit de merge)
```

Regra de ouro: **faça rebase só em branches suas, ainda não publicadas**. Em branches compartilhadas, use `merge`. Muitos times adotam *squash merge* no PR para manter a `main` limpa.

`rebase -i` reescreve seus commits locais (juntar, renomear, reordenar):

```bash
git rebase -i HEAD~3          # abre o editor: pick, reword, squash, fixup, drop
```

> `[ATENÇÃO]` Se um rebase der errado, **não entre em pânico**: `git rebase --abort` volta ao início, e `git reflog` mostra onde a branch estava antes. Quase nada no Git é perdido de vez em até ~90 dias.

## Ferramentas de investigação e salvamento

```bash
git stash                         # guarda trabalho não commitado e limpa o diretório
git stash list && git stash pop   # devolve
git cherry-pick <hash>            # copia UM commit para a branch atual
git reflog                        # histórico de onde o HEAD esteve (rede de segurança)
git blame arquivo                 # quem mudou cada linha, e em qual commit
git log -p -S"texto"              # commits que adicionaram/removeram "texto"
git bisect start; git bisect bad; git bisect good <hash-bom>   # busca binária pelo commit que quebrou
git bisect run ./teste.sh         # automatiza (o script retorna 0=bom, ≠0=ruim)
git tag -a v1.0.0 -m "Primeira versão"    # marca uma versão
git diff main..feature --stat
```

O `bisect` acha, em ~log₂(N) passos, o commit que introduziu um bug entre centenas — poderosíssimo.

## Trabalho em equipe: Pull Requests e revisão

Um **Pull Request (PR)** (ou *Merge Request* no GitLab) propõe integrar uma branch na `main`, com espaço para **revisão de código**, discussão e checagens automáticas (CI, Módulo 22). Boas práticas:

- PRs **pequenos e focados** (fáceis de revisar).
- Descrição com **o quê e por quê**, e como testar.
- A `main` é **protegida**: sem push direto, exige PR aprovado e CI verde (*branch protection*).
- Revisão cuida de correção, clareza e segurança (segredos!), não de estilo (isso é do linter).

## Estratégias de branching

| Estratégia | Como funciona | Quando |
|---|---|---|
| **Trunk-based** | Branches curtíssimas, integração diária na `main`, *feature flags* | Times maduros, CI/CD forte (recomendado) |
| **GitHub Flow** | `main` + branch por mudança + PR | Simples, a maioria dos times |
| **GitFlow** | `main`, `develop`, `release/*`, `hotfix/*` | Releases versionadas e planejadas (mais pesado) |

**Versionamento semântico (SemVer):** `MAJOR.MINOR.PATCH` — `MAJOR` quebra compatibilidade, `MINOR` adiciona funcionalidade compatível, `PATCH` corrige bug. Combine com **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`) para gerar versões e changelog automaticamente.

## Hooks: automatizando checagens locais

Hooks são scripts em `.git/hooks/` executados em eventos. O `pre-commit` roda antes de cada commit e pode **barrar** o que não passa:

```bash
cat > .git/hooks/pre-commit <<'EOF'
#!/usr/bin/env bash
# Bloqueia commit com possíveis segredos
if git diff --cached | grep -Eiq '(password|secret|api[_-]?key)\s*[:=]\s*\S+'; then
  echo "ERRO: possível segredo no commit. Remova e tente de novo."
  exit 1
fi
EOF
chmod +x .git/hooks/pre-commit
echo 'password=abc123' > leak.txt && git add leak.txt && git commit -m "teste"   # deve ser barrado
```

Hooks locais não vão para o repositório; para compartilhar, use o framework **pre-commit** (https://pre-commit.com/) ou checagens no CI. Para segredos de verdade, use **gitleaks** (Módulo 25).

## GitOps: o repositório é a fonte da verdade

**GitOps** aplica as práticas do Git à **operação** de infraestrutura e aplicações:

1. O **estado desejado** (manifestos Kubernetes, Terraform, configs) vive em um repositório Git.
2. Mudanças acontecem por **PR** (revisão, histórico, auditoria, *rollback = git revert*).
3. Um **agente** (Argo CD, Flux) dentro do ambiente **compara continuamente** o repositório com o estado real e **converge** o ambiente para o repositório (modelo *pull*).

Benefícios: auditoria completa ("quem mudou o quê e por quê"), rollback trivial, ambientes reproduzíveis, e **ninguém** precisa de acesso direto de escrita ao cluster. É o assunto dos Módulos 22 e 23; aqui, o fundamento: **tudo que importa está no Git**.

![Grafo do Git após rebase e fast-forward, mostrando histórico linear](screenshots/19-git-e-gitops/01-rebase-grafo-linear.png)
> `[PRINT]` Passo a passo para capturar: após o lab de rebase, rodar `git log --oneline --graph --all`. Capturar o histórico linear.

## Laboratórios

### Lab 1 — Por dentro
Siga o bloco "git-por-dentro": inspecione commit, tree e blob com `cat-file`; faça um segundo commit e veja o `parent`.

### Lab 2 — Merge x rebase
Crie duas branches divergentes; integre uma com `merge` (commit de junção) e outra com `rebase` (linear) e compare os grafos.

### Lab 3 — Salvando o dia
Faça um `reset --hard` acidental, depois recupere o commit "perdido" com `git reflog` + `git reset --hard <hash>`.

### Lab 4 — bisect
Crie 15 commits, introduza um bug no 9º (um teste que falha) e ache o commit com `git bisect run`.

### Lab 5 — Fluxo de PR real
No GitHub: proteja a `main`, abra um PR de uma branch com 2 commits, peça revisão (a si mesmo/colega), faça *squash merge*.

### Desafios

- **Desafio 1:** hook `pre-commit` que roda `shellcheck` nos scripts alterados e barra o commit se houver erro.
- **Desafio 2:** crie uma tag `v1.0.0` anotada, outra `v1.1.0` após um commit `feat:`, e gere um changelog simples com `git log --pretty="- %s" v1.0.0..v1.1.0`.
- **Desafio 3:** descreva, em um diagrama de texto, o fluxo GitOps de um deploy: dev → PR → CI → merge → agente → cluster.

## Erros comuns nesta fase

- `rebase` em branch compartilhada (reescreve histórico dos outros).
- `push --force` sem `--force-with-lease`.
- PRs enormes, impossíveis de revisar.
- Commitar segredos e achar que apagar resolve.
- Achar que o Git guarda "diferenças" (guarda *snapshots*).
- Trabalhar sem branch protection na `main`.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| PR, branch protection | CI/CD — Módulo 22 |
| GitOps (Argo CD/Flux) | Kubernetes — Módulo 23 |
| Hooks, gitleaks | Segurança — Módulo 25 |
| Repositório como fonte da verdade | Terraform/Ansible — Módulo 21 |

## `[REFERÊNCIA]`

- *Pro Git* (pt-BR): https://git-scm.com/book/pt-br/v2
- Git — documentação: https://git-scm.com/docs
- Learn Git Branching: https://learngitbranching.js.org/?locale=pt_BR
- GitHub — *Branch protection*: https://docs.github.com/pt/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Semantic Versioning: https://semver.org/lang/pt-BR/
- Conventional Commits: https://www.conventionalcommits.org/pt-br/v1.0.0/
- OpenGitOps — princípios: https://opengitops.dev/
- Trunk Based Development: https://trunkbaseddevelopment.com/

**Como aprofundar:** leia o capítulo "Git Internals" do *Pro Git* e os princípios do OpenGitOps.

## Checklist de saída

- [ ] Explicar objetos do Git (blob, tree, commit) e o que é uma branch.
- [ ] Diferenciar `merge` de `rebase` e dizer quando usar cada um.
- [ ] Recuperar trabalho com `reflog` e usar `stash`, `cherry-pick` e `bisect`.
- [ ] Conduzir um Pull Request com revisão e branch protection.
- [ ] Comparar trunk-based, GitHub Flow e GitFlow.
- [ ] Aplicar SemVer e Conventional Commits.
- [ ] Criar um hook de `pre-commit` útil.
- [ ] Explicar o modelo GitOps (pull, estado desejado, rollback por revert).
