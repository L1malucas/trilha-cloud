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

> `[TENTE VOCÊ]` Dois commits com exatamente o mesmo conteúdo e a mesma mensagem têm o mesmo hash? Resposta: não. O hash do commit inclui também o pai, o autor e a data; então, na prática, só dá igual se tudo isso for igual. Já o **blob** (só o conteúdo do arquivo) é idêntico: `git hash-object a.txt` sempre devolve o mesmo hash para o mesmo texto, em qualquer máquina.

> `[TENTE VOCÊ]` Quanto "pesa" criar uma branch? Resposta: quase nada. Rode `git branch teste && cat .git/refs/heads/teste` e você vê um arquivo de ~41 bytes com um hash. Compare com `cat .git/refs/heads/main`: é o mesmo hash, porque as duas apontam para o mesmo commit.

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

> `[TENTE VOCÊ]` Como saber se uma branch já foi publicada antes de fazer rebase nela? Resposta: `git branch -vv` mostra o upstream (`[origin/feature]`) de cada branch; se tem upstream e outras pessoas podem ter puxado, use `merge`. Sem upstream, a branch é só sua e o rebase é seguro.

> `[ATENÇÃO]` Durante um `rebase`, os papéis de "ours" e "theirs" nos conflitos **invertem**: "ours" é a branch sobre a qual você está reaplicando (ex.: `main`) e "theirs" são os seus commits. É a origem de muita resolução de conflito feita ao contrário.

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

> `[TENTE VOCÊ]` Você mexeu em 3 arquivos, mas precisa trocar de branch agora para um hotfix. Como guardar tudo sem commitar, incluindo arquivos novos (não rastreados)? Resposta: `git stash push -u -m "wip"`. O `-u` inclui os untracked; sem ele, os arquivos novos ficam para trás. Depois do hotfix, `git stash pop`.

> `[TENTE VOCÊ]` Como achar quem escreveu uma linha e por quê? Resposta: `git blame -L 10,20 arquivo` mostra o commit de cada linha do intervalo; com o hash em mãos, `git show <hash>` traz a mensagem e o contexto completo.

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

> `[TENTE VOCÊ]` Seu pipeline de GitOps aplicou uma mudança ruim em produção. Qual o rollback correto numa `main` compartilhada? Resposta: `git revert <hash>` — cria um commit novo que desfaz o anterior, sem reescrever o histórico, e o agente (Argo CD/Flux) converge de volta. `git reset --hard` + `push --force` reescreveria a história que outras pessoas e o agente já viram.

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

### Lab 6 — Conflito de merge resolvido sem pânico
Cenário: duas pessoas mudaram a mesma linha de um arquivo de configuração.

```bash
cd ~/lab && rm -rf git-conflito && mkdir git-conflito && cd git-conflito && git init -q -b main
printf 'porta=8080\nambiente=dev\n' > app.conf && git add . && git commit -qm "config base"
git switch -qc ajuste-porta && sed -i 's/8080/9090/' app.conf && git commit -qam "porta 9090"
git switch -q main && sed -i 's/8080/8000/' app.conf && git commit -qam "porta 8000"
git merge ajuste-porta || true     # CONFLITO esperado
git status --short                 # UU app.conf
cat app.conf                       # veja os marcadores <<<<<<< ======= >>>>>>>
```

Edite o `app.conf` deixando `porta=9090` e sem marcadores, depois `git add app.conf && git commit -m "resolve conflito de porta"`. Confira com `git log --oneline --graph`. Se quiser desistir no meio, `git merge --abort`.

### Lab 7 — Release com SemVer, tags e changelog
Cenário: o time fecha a versão 1.0.0, faz uma correção e uma funcionalidade nova.

```bash
cd ~/lab && rm -rf git-release && mkdir git-release && cd git-release && git init -q -b main
echo "v1" > app.txt && git add . && git commit -qm "feat: primeira versão"
git tag -a v1.0.0 -m "Release 1.0.0"
echo "fix" >> app.txt && git commit -qam "fix: corrige cálculo do frete"
git tag -a v1.0.1 -m "Patch"
echo "novo" >> app.txt && git commit -qam "feat: adiciona cupom de desconto"
git tag -a v1.1.0 -m "Minor"
git tag -n                                              # lista tags com a mensagem
git log --pretty="- %s" v1.0.0..v1.1.0                  # changelog entre versões
git describe --tags                                     # v1.1.0
```

Pergunta de raciocínio: por que a segunda tag é `1.0.1` e não `1.1.0`? (Era só `fix:`, compatível, então PATCH.)

### Lab 8 — Hotfix com cherry-pick e stash
Cenário: um bug foi corrigido na `main`, mas a `release` em produção também precisa da correção, e você está no meio de outra tarefa.

```bash
cd ~/lab && rm -rf git-hotfix && mkdir git-hotfix && cd git-hotfix && git init -q -b main
echo "v1" > app.txt && git add . && git commit -qm "base"
git branch release
echo "wip" > rascunho.txt                  # trabalho em andamento
echo "corrigido" >> app.txt && git commit -qam "fix: corrige bug crítico"
HASH=$(git rev-parse --short HEAD)
git stash push -u -m "rascunho"           # guarda o trabalho em andamento
git switch -q release && git cherry-pick "$HASH"
git log --oneline                          # o fix agora também está na release
git switch -q main && git stash pop
```

### Desafios

- **Desafio 1:** hook `pre-commit` que roda `shellcheck` nos scripts alterados e barra o commit se houver erro.
- **Desafio 2:** crie uma tag `v1.0.0` anotada, outra `v1.1.0` após um commit `feat:`, e gere um changelog simples com `git log --pretty="- %s" v1.0.0..v1.1.0`.
- **Desafio 3:** descreva, em um diagrama de texto, o fluxo GitOps de um deploy: dev → PR → CI → merge → agente → cluster.
- **Desafio 4:** num repositório novo, crie 3 branches de feature e integre uma com `merge --no-ff`, outra com `rebase` + `merge --ff-only` e a terceira com `merge --squash`. Compare os grafos.

  **Verifique:** `git log --oneline --graph | head -12` mostra um losango (merge), um trecho linear (rebase) e um único commit de squash, sem os commits intermediários da terceira feature.

- **Desafio 5:** escreva um hook `commit-msg` que rejeite mensagens fora do padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

  **Verifique:** `git commit --allow-empty -m "mexi em coisa"; echo $?` imprime a mensagem de erro e `1`; já `git commit --allow-empty -m "fix: ajusta timeout"; echo $?` imprime `0`.

- **Desafio 6:** use `git bisect run` com um script que testa `grep -q 'ok' status.txt` num histórico de 20 commits em que o bug entrou no 13º.

  **Verifique:** o bisect termina com `<hash> is the first bad commit` apontando para o commit 13 (confira com `git log --oneline | sed -n '8p'`, já que o log lista do mais novo para o mais antigo).

### Desafio avançado — Agente GitOps que só confia em commit assinado

**Nível:** avançado — leva de 1 a 3 horas

- **Cenário:** você vai construir, em miniatura, o que o Argo CD e o Flux fazem. O "cluster" é a pasta `~/lab/gitops/estado`; a fonte da verdade é um repositório bare. O time de segurança exige que o agente aplique **apenas** commits assinados por chaves autorizadas e que qualquer alteração manual no "cluster" (drift) seja desfeita sozinha na próxima rodada.
- **Requisitos:**
  1. `~/lab/gitops/fonte.git` (bare) com um diretório `app/` contendo `config.env` e `replicas.txt`. Os commits legítimos são assinados com **chave SSH** (`ed25519`), e as chaves autorizadas ficam num arquivo `allowed_signers`.
  2. `reconcilia.sh` clona/atualiza um cache local, verifica a assinatura do **commit da ponta** da `main` e, se válida, faz `estado/` ficar **idêntico** a `app/` (arquivos extras são removidos) e grava a revisão aplicada em `estado/.revisao`.
  3. **Idempotente:** uma segunda rodada, sem commits novos, não reescreve nenhum arquivo (o `mtime` de `estado/app/config.env` não muda).
  4. **Drift:** se alguém editar um arquivo ou criar um arquivo extra em `estado/`, a rodada seguinte restaura o estado do repositório e registra no journal (`logger -t reconcilia`) quantos arquivos foram corrigidos.
  5. **Rejeição:** commit na ponta não assinado, ou assinado por uma chave que não está em `allowed_signers`, **não** é aplicado: o estado fica como estava, o script sai com código `3` e o journal recebe uma linha `REJEITADO <hash>`.
  6. **Rollback:** um `git revert` assinado do commit ruim, publicado em cima dele, faz o agente convergir de volta ao conteúdo anterior.
- **Restrições:** sem Argo CD, Flux ou qualquer ferramenta extra, sem GPG (use a assinatura SSH nativa do Git) e sem `git push --force` em nenhum momento.
- **Onde pesquisar:** `man git-config` (`gpg.format`, `user.signingkey`, `gpg.ssh.allowedSignersFile`, `commit.gpgsign`), `man git-verify-commit`, `man ssh-keygen` (seção `ALLOWED SIGNERS`) e `man logger`.
- **Verifique:**

```bash
cd ~/lab/gitops
./reconcilia.sh; cat estado/.revisao; git -C fonte.git rev-parse main          # os dois hashes iguais
A=$(stat -c %Y estado/app/config.env); sleep 1; ./reconcilia.sh; B=$(stat -c %Y estado/app/config.env)
[ "$A" = "$B" ] && echo idempotente
echo hack >> estado/app/config.env; touch estado/extra.txt; ./reconcilia.sh
test ! -e estado/extra.txt && echo extra-removido
diff <(git -C fonte.git show main:app/config.env) estado/app/config.env && echo config-restaurado
journalctl -t reconcilia --since '-1min' --no-pager | grep -ci 'drift'          # >= 1
# commit NAO assinado na ponta (use um clone de trabalho com commit.gpgsign=false):
./reconcilia.sh; echo "saida=$?"                                               # saida=3
cat estado/.revisao                                                            # continua a revisao boa
journalctl -t reconcilia --since '-1min' --no-pager | grep -c REJEITADO        # >= 1
# commit assinado com OUTRA chave (fora do allowed_signers): idem, saida=3
# revert assinado do commit ruim:
./reconcilia.sh; echo "saida=$?"; grep -c . estado/app/config.env              # saida=0, conteudo de antes
```

  Teste de borda: apague o `cache/` inteiro e rode `./reconcilia.sh`; ele deve reconstruir tudo sozinho e terminar com `saida=0` e o mesmo `estado/.revisao`.

## Erros comuns nesta fase

- `rebase` em branch compartilhada (reescreve histórico dos outros).
- `push --force` sem `--force-with-lease`.
- PRs enormes, impossíveis de revisar.
- Commitar segredos e achar que apagar resolve.
- Achar que o Git guarda "diferenças" (guarda *snapshots*).
- Trabalhar sem branch protection na `main`.
- Resolver conflito deixando os marcadores `<<<<<<<` no arquivo e commitando assim (rode `grep -rn '<<<<<<<' .` antes do commit).
- Usar `git reset --hard` + `push --force` para desfazer algo já publicado, em vez de `git revert`.
- Esquecer o `-u` no `git stash` e deixar arquivos novos para trás.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 15 (Git básico, IaC) | `add`, `commit`, `branch` viram a base para rebase, tags e PRs |
| Módulo 11 (shell script) | Hooks são shell scripts; o `bisect run` espera o código de saída `0`/`≠0` |
| Módulo 04 (texto) | `grep -E` dentro do hook e `git log -S`/`--pretty` filtram e formatam histórico |
| Módulo 12 (logs) | `git log` e `reflog` são o "log de auditoria" do repositório |

### Lab integrador — Repositório de scripts com hook e release
Reutilize os dados do `~/lab` e o shell do módulo 11 para montar um mini repositório de automação com checagem local.

```bash
cd ~/lab && rm -rf git-integrador && mkdir git-integrador && cd git-integrador && git init -q -b main
cat > relatorio.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
LOG=${1:-$HOME/lab/dados/access.log}
awk '{print $9}' "$LOG" | sort | uniq -c | sort -rn
EOF
chmod +x relatorio.sh
cat > .git/hooks/pre-commit <<'EOF'
#!/usr/bin/env bash
for f in $(git diff --cached --name-only --diff-filter=AM | grep '\.sh$' || true); do
  bash -n "$f" || { echo "ERRO de sintaxe em $f"; exit 1; }
done
EOF
chmod +x .git/hooks/pre-commit
git add . && git commit -qm "feat: relatório de status HTTP" && git tag -a v0.1.0 -m "primeira versão"
echo 'if [ then' >> relatorio.sh && git commit -qam "fix: quebra proposital"   # deve ser barrado
git checkout -- relatorio.sh && ./relatorio.sh | head -3
```

O hook usa `bash -n` (checa sintaxe sem executar), o script usa `awk` do módulo 04 e a tag marca a versão. O commit quebrado é barrado antes de entrar no histórico.

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
