---
id: "15_infraestrutura_como_codigo_e_git"
title: "Módulo 15 — Infraestrutura como Código e Git (introdução)"
sidebar_label: "15 · IaC e Git (introdução)"
sidebar_position: 15
---

# Módulo 15 — Infraestrutura como Código e Git (introdução)

> **Objetivo**: entender a ideia de infraestrutura como código (IaC), por que ela substitui o "configurar à mão", e dominar o Git básico — `init`, `add`, `commit`, `branch`, `merge`, remotos e `.gitignore` — como ferramenta de trabalho diária.
>
> **Pré-requisitos**: módulos 02 a 04 e 11.
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Este módulo é a **porta de entrada**. O aprofundamento vem nos módulos **19 (Git e GitOps)** e **21 (Terraform e Ansible)**. Livro de referência (gratuito, em português): https://git-scm.com/book/pt-br/v2

---

## O problema do "servidor floco de neve"

Imagine um servidor configurado ao longo de dois anos por três pessoas, com dezenas de comandos digitados na mão e ninguém lembrando exatamente quais. Ele funciona, mas é **único** (um "floco de neve"): se queimar, ninguém consegue recriá-lo igual. Em infraestrutura, isso é um risco enorme.

**Infraestrutura como Código** resolve descrevendo a infraestrutura em **arquivos de texto** que você versiona, revisa e executa:

| Sem IaC | Com IaC |
|---|---|
| Cliques e comandos manuais | Arquivos declarativos/scripts |
| "Funciona na minha máquina" | Reproduzível em qualquer ambiente |
| Sem histórico do que mudou | Histórico no Git, com autoria e motivo |
| Mudança arriscada, sem revisão | *Pull request* e revisão antes de aplicar |
| Recuperar após desastre = refazer de memória | Recriar com um comando |

Há duas famílias: **imperativo** ("faça isto, depois aquilo": scripts bash, o que você escreveu no Módulo 11) e **declarativo** ("quero este estado final": Terraform, Ansible, Kubernetes). Os próximos módulos cobrem o segundo.

> `[TEORIA]` O pilar de tudo isso é o **controle de versão**. Sem Git, "infraestrutura como código" não passa de arquivos soltos. Por isso começamos por ele.

## Git: a máquina do tempo do seu código

O **Git** guarda o histórico completo de um projeto como uma sequência de **commits** (fotografias do projeto num instante, com autor, data e mensagem). Você pode voltar no tempo, comparar versões, trabalhar em paralelo em **branches** (ramos) e depois juntá-las.

As três áreas, para entender o fluxo:

```
Diretório de trabalho  --git add-->  Área de preparação (stage)  --git commit-->  Repositório (.git)
    (seus arquivos)                     (o que vai no próximo commit)               (histórico)
```

O `git add` escolhe *o que* entra na próxima fotografia; o `git commit` tira a foto. Essa separação permite fazer commits pequenos e coerentes.

### Configuração inicial (uma vez)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "voce@exemplo.com"
git config --global init.defaultBranch main
git config --global core.editor nano
git config --list
```

### O ciclo básico

```bash
mkdir -p ~/lab/meu-projeto && cd ~/lab/meu-projeto
git init                                   # cria o repositório (pasta .git)
echo "# Meu projeto" > README.md
git status                                 # o que mudou?
git add README.md                          # prepara
git commit -m "Adiciona README"            # fotografa
git log --oneline                          # histórico resumido

echo "linha nova" >> README.md
git diff                                   # o que mudou (ainda não preparado)
git add -p                                 # prepara pedaço a pedaço (escolhe o que entra)
git commit -m "Atualiza README"
git log --oneline --graph --all            # árvore de commits
```

Boas mensagens de commit explicam **o porquê** em uma linha curta e no imperativo ("Corrige timeout do backup"), e não "alterações" ou "fix".

> `[ATENÇÃO]` Nunca faça commit de **segredos** (senhas, chaves, tokens, `.env`). Mesmo que apague depois, ficam no histórico. Use `.gitignore` desde o início e, se vazar, **troque a credencial**: remover do Git não basta.

> `[TENTE VOCÊ]` Como saber, sem adivinhar, em qual das três áreas está cada mudança? Raciocínio: o `git status -s` mostra duas colunas de letras, a da esquerda é o *stage* e a da direita é o diretório de trabalho. Rode `echo "x" >> README.md; git status -s`, depois `git add README.md; git status -s`. Resposta: primeiro ` M README.md` (espaço, depois M: modificado só no diretório de trabalho); depois `M  README.md` (M na primeira coluna: já está no *stage*). Se aparecer `MM`, você editou de novo depois do `add`. Termine com `git restore --staged README.md && git restore README.md` para voltar ao estado limpo.

### .gitignore

```bash
cat > .gitignore <<'EOF'
*.log
.env
*.pem
node_modules/
dados/
.terraform/
*.tfstate*
EOF
git add .gitignore && git commit -m "Adiciona .gitignore"
```

> `[ATENÇÃO]` O `.gitignore` só vale para arquivos que **ainda não são rastreados**. Se você já fez commit de um `.env`, adicioná-lo ao `.gitignore` depois não o tira do repositório: use `git rm --cached .env` (remove do índice, mantém no disco) e faça um novo commit. E lembre: o conteúdo antigo continua no histórico, então segredo vazado exige trocar a credencial. Para descobrir *por que* um arquivo está sendo ignorado, `git check-ignore -v caminho` aponta a regra e a linha.

## Desfazendo erros

| Situação | Comando |
|---|---|
| Descartar mudança **não** preparada num arquivo | `git restore arquivo` |
| Tirar do *stage* (sem perder a edição) | `git restore --staged arquivo` |
| Corrigir a **última** mensagem/commit | `git commit --amend` |
| Desfazer um commit **publicado** (cria outro inverso) | `git revert <hash>` |
| Ver tudo que aconteceu (rede de segurança) | `git reflog` |

> `[ATENÇÃO]` `git reset --hard` e `git clean -fd` **descartam trabalho sem volta**. E `git push --force` reescreve o histórico dos outros: evite em branches compartilhadas. Em dúvida, `git status` e `git reflog` primeiro.

> `[TENTE VOCÊ]` Dá para recuperar um commit depois de um `reset --hard`? Raciocínio: o `reset` só move o ponteiro da branch; o commit continua no banco de objetos, e o `reflog` guarda o histórico dos movimentos do `HEAD`. Faça, num repositório de teste, `echo a > a.txt && git add a.txt && git commit -m "quase perdi"`, depois `git reset --hard HEAD~1`, `git reflog | head -3` e `git reset --hard HEAD@{1}`. Resposta: o `reflog` lista `quase perdi` na segunda linha, e o último comando traz o commit de volta (`git log --oneline -1` mostra `quase perdi`). Isso funciona enquanto o Git não limpa objetos soltos (semanas, por padrão).

## Branches e merge

Uma **branch** é uma linha independente de trabalho. A regra de ouro: **`main` sempre funciona**; novidades nascem em branches e voltam por *merge*.

```bash
git switch -c funcionalidade-x             # cria e troca (git checkout -b, antigo)
echo "feat" > x.txt && git add x.txt && git commit -m "Adiciona x"
git switch main
git merge funcionalidade-x                 # une os históricos
git branch                                 # lista
git branch -d funcionalidade-x             # apaga a branch já integrada
```

Quando duas branches mudam a **mesma linha**, o merge gera um **conflito**. O Git marca no arquivo:

```
<<<<<<< HEAD
versão da main
=======
versão da branch
>>>>>>> funcionalidade-x
```

Resolva editando o arquivo (escolhendo/combinando), depois `git add arquivo` e `git commit`. Treine de propósito (Lab 3).

> `[TENTE VOCÊ]` O que o Git diz quando a `main` não andou e você faz merge? Raciocínio: se ninguém mexeu na `main` desde que a branch nasceu, não há o que "juntar": basta mover o ponteiro da `main` para a frente. Rode `git switch -c teste && echo t > t.txt && git add t.txt && git commit -m "t" && git switch main && git merge teste`. Resposta: a saída traz `Fast-forward` e **nenhum commit de merge** novo. Repita com `git merge --no-ff` numa outra branch e compare `git log --oneline --graph`: agora aparece o commit de merge.

## Remotos: GitHub

Um **remoto** é uma cópia do repositório num servidor (GitHub, GitLab). Para autenticar sem senha, use chave SSH (Módulo 09) ou token.

```bash
ssh-keygen -t ed25519 -C "voce@exemplo.com"
cat ~/.ssh/id_ed25519.pub                  # cole em GitHub > Settings > SSH keys
ssh -T git@github.com                      # testa

git remote add origin git@github.com:SEU_USUARIO/meu-projeto.git
git push -u origin main                    # envia e vincula
git clone git@github.com:SEU_USUARIO/meu-projeto.git
git pull                                   # traz e integra o que há no remoto
git fetch                                  # só traz, sem integrar
```

O fluxo colaborativo mais comum: criar uma branch → *push* → abrir um **Pull Request** → revisão → merge. Detalhes no Módulo 19.

![Saída de `git log --oneline --graph --all` mostrando um merge entre main e uma branch de funcionalidade](screenshots/15-infraestrutura-como-codigo-e-git/01-git-log-graph.png)
> `[PRINT]` Passo a passo para capturar: depois do lab de branches e merge, rodar `git log --oneline --graph --all`. Capturar o grafo.

## Primeiro contato com IaC: um script declarativo e idempotente

Para sentir a diferença entre imperativo e declarativo, compare:

```bash
# Imperativo: falha na 2ª execução (a pasta já existe)
mkdir /tmp/exemplo

# Idempotente: pode rodar N vezes, sempre chega ao mesmo estado
mkdir -p /tmp/exemplo
id deploy &>/dev/null || sudo useradd -m deploy
```

**Idempotência** é a propriedade-chave: executar uma vez ou dez vezes dá o mesmo resultado. Ferramentas como Ansible e Terraform são construídas sobre ela. Escreva seus scripts do Módulo 11 assim, e versione-os.

> `[TENTE VOCÊ]` O que "idempotente" muda na prática? Raciocínio: rode o mesmo comando duas vezes e olhe o código de saída com `echo $?`. Teste `mkdir /tmp/idem; mkdir /tmp/idem; echo $?` e depois `mkdir -p /tmp/idem2; mkdir -p /tmp/idem2; echo $?`. Resposta: o primeiro imprime `mkdir: cannot create directory ‘/tmp/idem’: File exists` e `1` (a segunda execução quebra); o segundo imprime `0` (pode repetir à vontade). É essa diferença que separa um script de "instalação" de um script de "estado desejado".

## Laboratórios

### Lab 1 — Seu primeiro repositório
Versione o `~/lab/scripts` (Módulo 11) com `git init`, `.gitignore`, ao menos 3 commits significativos e `git log --oneline`.

### Lab 2 — Desfazendo
Edite um arquivo e descarte com `git restore`; faça um commit com mensagem errada e corrija com `--amend`; faça um commit ruim e desfaça com `git revert`.

### Lab 3 — Branch e conflito
Crie uma branch, altere **a mesma linha** na `main` e na branch, faça merge, **resolva o conflito** e conclua.

### Lab 4 — GitHub
Crie um repositório vazio no GitHub, conecte por SSH, faça `push` e abra um Pull Request de uma branch para a `main` (pode ser você mesmo revisando).

### Lab 5 — Ignorando dados e artefatos no repositório de estudo
Cenário: no Módulo 00 você fez `git init` em `~/lab`. Os `access.log` de 5000 linhas e as imagens de disco **não** devem ir para o Git.
```bash
cd ~/lab
printf 'dados/\nrootfs/\n*.img\n*.key\n' >> .gitignore
git add .gitignore && git commit -m "Ignora dados gerados, rootfs, imagens e chaves"
git status --short                                  # dados/ e *.img não aparecem mais
git check-ignore -v dados/access.log                # qual regra bloqueou? (o número da linha varia)
```
Mensagem de commit boa explica o **porquê** ("Ignora dados gerados") e não só o quê.

### Lab 6 — Interrupção: stash e cherry-pick
Cenário: você está no meio de uma edição quando chega um hotfix urgente. Guarde o trabalho, aplique a correção na `main` e retome.
```bash
cd ~/lab/meu-projeto
echo "meio de uma edicao" >> README.md
git stash push -m "wip readme"                      # guarda e deixa a árvore limpa
git status --short                                  # vazio
git switch -c hotfix
echo "correcao urgente" > hotfix.txt && git add hotfix.txt && git commit -m "Adiciona correção urgente"
git switch main
git cherry-pick hotfix                              # copia SÓ esse commit para a main
git stash pop                                       # retoma a edição
git log --oneline | head -2
```
`cherry-pick` copia um commit específico (cria outro hash); `merge` traz a branch inteira. Use cherry-pick para levar uma correção pontual a outra linha.

### Lab 7 — Hook que barra segredos
Cenário: o time já vazou uma senha no Git uma vez. Você escreve uma trava local, usando `grep` (Módulo 04) e shell (Módulo 11).
```bash
cd ~/lab/meu-projeto
cat > .git/hooks/pre-commit <<'EOF'
#!/usr/bin/env bash
if git diff --cached | grep -qiE '^\+.*(password|senha|secret)\s*='; then
  echo "BLOQUEADO: parece haver segredo neste commit." >&2
  exit 1
fi
EOF
chmod +x .git/hooks/pre-commit
echo 'password=123' > teste.env
git add teste.env && git commit -m "teste"          # deve ser barrado
git restore --staged teste.env && rm teste.env
```
O hook mora em `.git/hooks`, que **não é versionado**: cada pessoa precisa instalá-lo (por isso times usam ferramentas como `pre-commit` ou CI para garantir a regra para todos).

### Desafios

- **Desafio 1:** reescreva um script do Módulo 11 para ser **idempotente** e prove executando-o duas vezes seguidas.
- **Desafio 2:** use `git bisect` para achar o commit que "quebrou" algo (crie o cenário: 10 commits, um deles com bug).
- **Desafio 3:** explique, com suas palavras, `merge` x `rebase` (aprofundado no Módulo 19).
- **Desafio 4:** apague com `git branch -D` uma branch que tenha um commit **não integrado** e recupere esse commit numa nova branch chamada `recuperada`, usando só o que o Git ainda lembra. **Verifique:** `git log --oneline -1 recuperada` deve mostrar o hash curto e a mensagem do commit que você tinha apagado, e `git branch --list recuperada` deve imprimir `  recuperada`.

### Desafio avançado — Segredo vazado: apagar do histórico de verdade

**Nível:** avançado — leva de 1 a 3 horas

- **Cenário:** alguém commitou `DB_PASSWORD=hunter2-prod` num `config.env` e o repositório já foi publicado no remoto da empresa. Trocar a senha é o passo 1, mas o jurídico exige que o segredo **não exista mais** em nenhum commit, tag ou objeto, nem no remoto. As branches e tags são usadas por outras pessoas, então os commits precisam manter autoria, datas e mensagens. Monte o cenário abaixo e faça a limpeza.

```bash
cd ~/lab && rm -rf vazou remoto.git && git init -q --bare remoto.git && git clone -q remoto.git vazou && cd vazou
git config user.name Lab && git config user.email lab@exemplo.com && git switch -qc main
echo v1 > app.txt && git add . && git commit -qm "feat: base"
printf 'PORTA=8080\nDB_PASSWORD=hunter2-prod\n' > config.env && git add . && git commit -qm "feat: config"
git rev-parse HEAD:config.env > ~/lab/blobs-vazados.txt
echo v2 >> app.txt && git commit -qam "fix: ajusta app"
sed -i 's/8080/9090/' config.env && git commit -qam "fix: muda porta"
git rev-parse HEAD:config.env >> ~/lab/blobs-vazados.txt
git tag -a v1.0 -m "release 1.0"
git switch -qc hotfix && echo h >> app.txt && git commit -qam "fix: hotfix urgente" && git switch -q main
git push -q origin --all && git push -q origin --tags
git rev-list --all --count > ~/lab/vazou-antes.txt
git log --all --format=%s | sort | md5sum >> ~/lab/vazou-antes.txt
```

- **Requisitos:**
  1. Em **todas** as branches e tags do clone, nenhum commit contém `hunter2-prod`, mas `config.env` continua existindo com `PORTA` (o histórico da porta `8080` para `9090` é preservado).
  2. A tag `v1.0` continua **anotada** e aponta para o commit reescrito equivalente.
  3. O número de commits e o conjunto de mensagens são iguais aos de antes (compare com `~/lab/vazou-antes.txt`); autor e data de cada commit não mudam.
  4. Os dois blobs listados em `~/lab/blobs-vazados.txt` **deixam de existir** no clone e no `remoto.git`, e não apenas ficam inalcançáveis.
  5. Um clone novo do `remoto.git` já nasce limpo.
  6. O `remoto.git` ganha uma trava `pre-receive` que rejeita qualquer push cujo diff novo tenha `DB_PASSWORD=` com valor, inclusive em uma **branch nova** (onde a revisão antiga é só zeros).
- **Restrições:** sem instalar pacotes (nada de `git-filter-repo` ou BFG), sem apagar o repositório e recriá-lo do zero, e o `push` forçado deve usar a opção que não atropela commits que você não conhece.
- **Onde pesquisar:** `man git-filter-branch` (`--tree-filter`/`--index-filter`, `--tag-name-filter`), `man git-reflog` (`expire`), `man git-gc` (`--prune`), `man git-push` (`--force-with-lease`) e `man githooks` (seção `pre-receive`).
- **Verifique:**

```bash
cd ~/lab/vazou
git log --all -p -S'hunter2-prod' --oneline | wc -l          # 0
git rev-list --all --count; head -1 ~/lab/vazou-antes.txt     # os dois números iguais
git log --all --format=%s | sort | md5sum; tail -1 ~/lab/vazou-antes.txt   # mesmo hash
git cat-file -t v1.0                                          # tag (anotada)
git show v1.0:config.env                                      # só PORTA=8080, sem senha
for r in . ~/lab/remoto.git; do for b in $(cat ~/lab/blobs-vazados.txt); do
  git -C "$r" cat-file -e "$b" 2>/dev/null && echo "EXISTE em $r" || echo "sumiu em $r"; done; done   # 4x "sumiu"
git clone -q ~/lab/remoto.git /tmp/limpo && git -C /tmp/limpo log --all -p -S'hunter2-prod' --oneline | wc -l   # 0
```

  Teste de borda (a trava funciona e não barra o trabalho normal):

```bash
git switch -qc teste-trava && echo 'DB_PASSWORD=abc123' > novo.env && git add . && git commit -qm "teste"
git push origin teste-trava; echo "saida=$?"                  # "remote rejected" e saida diferente de 0
git reset -q --hard HEAD~1 && echo ok > ok.txt && git add . && git commit -qm "chore: limpo"
git push origin teste-trava; echo "saida=$?"                  # saida=0
```

## Erros comuns nesta fase

- Commitar segredos ou arquivos gerados (`node_modules`, `*.tfstate`).
- Mensagens de commit vazias de sentido ("ajustes", "fix").
- Trabalhar direto na `main` sem branch.
- `push --force` em branch compartilhada.
- Commits gigantes misturando assuntos.
- Achar que `git add .` é sempre seguro (confira o `git status` antes).
- Adicionar um arquivo ao `.gitignore` depois de já tê-lo commitado e achar que ele "saiu" do repositório (falta `git rm --cached`).
- Fazer `git reset --hard` ou `branch -D` sem olhar o `git reflog` antes: quase sempre dá para voltar, mas só enquanto você não entra em pânico e não roda `gc`.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 02 — shell e pipes | `git log --oneline` encadeado com `head` ou `grep`, aliases, `$?` para testar sucesso |
| Módulo 03 — arquivos e diretórios | A pasta `.git` é um diretório comum; `.gitignore` usa os mesmos *globs* do shell |
| Módulo 04 — `grep`, `awk`, `diff` | `git diff`, `git log --grep` e o hook de segredos usam o mesmo raciocínio |
| Módulo 05 — permissões | Chave SSH com `600`; hook só roda com bit `x` |
| Módulo 09 — SSH | Autenticação do remoto por chave `ed25519` |
| Módulo 11 — shell script | Scripts idempotentes e hooks são shell script versionado |

### Lab 8 — Mini-projeto `infra-lab` (integrador)
Cenário: você entrega um script que processa os logs do laboratório, idempotente, versionado e sem commitar o que ele gera. Junta `awk`/`sort`/`uniq` (04), permissões (05), `set -euo pipefail` e `mkdir -p` (11) e o ciclo do Git (15).
```bash
mkdir -p ~/lab/infra-lab/scripts && cd ~/lab/infra-lab && git init -q
cat > scripts/resumo-codigos.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
SAIDA="$HOME/lab/infra-lab/saida"
mkdir -p "$SAIDA"
awk '{print $9}' "$HOME/lab/dados/access.log" | sort | uniq -c | sort -rn > "$SAIDA/codigos.txt"
echo "resumo gerado: $(wc -l < "$SAIDA/codigos.txt") codigos"
EOF
chmod +x scripts/resumo-codigos.sh
printf 'saida/\n' > .gitignore
./scripts/resumo-codigos.sh && sha256sum saida/codigos.txt
./scripts/resumo-codigos.sh && sha256sum saida/codigos.txt      # mesmo hash: idempotente
git add . && git status --short                                 # saida/ não aparece
git commit -m "Adiciona resumo de códigos HTTP do access.log" && git log --oneline
```
Resposta esperada: `resumo gerado: 5 codigos` (200, 301, 403, 404, 500) nas duas execuções, com o **mesmo** hash. Esse é o padrão de trabalho da trilha inteira: script pequeno, repetível, versionado, com a saída fora do repositório.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Git, branches, PR | Git e GitOps — Módulo 19 |
| Idempotência, declarativo | Terraform e Ansible — Módulo 21 |
| Repositório como fonte da verdade | CI/CD — Módulo 22; GitOps — Módulos 19 e 23 |
| `.gitignore` de state/segredos | Segurança — Módulo 25 |

## `[REFERÊNCIA]`

- *Pro Git* (gratuito, pt-BR): https://git-scm.com/book/pt-br/v2
- Git — documentação e referência: https://git-scm.com/doc
- GitHub — *Docs* e guia de SSH: https://docs.github.com/pt/authentication/connecting-to-github-with-ssh
- Learn Git Branching (interativo): https://learngitbranching.js.org/?locale=pt_BR
- Conventional Commits: https://www.conventionalcommits.org/pt-br/v1.0.0/
- HashiCorp — *What is Infrastructure as Code?*: https://www.hashicorp.com/resources/what-is-infrastructure-as-code
- Oh Shit, Git!?! (como sair de problemas): https://ohshitgit.com/pt_BR

**Como aprofundar:** faça o "Learn Git Branching" até o fim, e siga para o Módulo 19.

## Checklist de saída

- [ ] Explicar IaC, imperativo x declarativo e idempotência.
- [ ] Descrever as três áreas do Git (diretório, stage, repositório).
- [ ] Executar `init`, `add`, `commit`, `log`, `diff` e `status` sem consultar.
- [ ] Criar branches, fazer merge e resolver um conflito.
- [ ] Desfazer erros com `restore`, `amend`, `revert` e `reflog`.
- [ ] Configurar um remoto por SSH e fazer `push`/`pull`.
- [ ] Manter segredos fora do repositório com `.gitignore`.
