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

## Desfazendo erros

| Situação | Comando |
|---|---|
| Descartar mudança **não** preparada num arquivo | `git restore arquivo` |
| Tirar do *stage* (sem perder a edição) | `git restore --staged arquivo` |
| Corrigir a **última** mensagem/commit | `git commit --amend` |
| Desfazer um commit **publicado** (cria outro inverso) | `git revert <hash>` |
| Ver tudo que aconteceu (rede de segurança) | `git reflog` |

> `[ATENÇÃO]` `git reset --hard` e `git clean -fd` **descartam trabalho sem volta**. E `git push --force` reescreve o histórico dos outros: evite em branches compartilhadas. Em dúvida, `git status` e `git reflog` primeiro.

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

## Laboratórios

### Lab 1 — Seu primeiro repositório
Versione o `~/lab/scripts` (Módulo 11) com `git init`, `.gitignore`, ao menos 3 commits significativos e `git log --oneline`.

### Lab 2 — Desfazendo
Edite um arquivo e descarte com `git restore`; faça um commit com mensagem errada e corrija com `--amend`; faça um commit ruim e desfaça com `git revert`.

### Lab 3 — Branch e conflito
Crie uma branch, altere **a mesma linha** na `main` e na branch, faça merge, **resolva o conflito** e conclua.

### Lab 4 — GitHub
Crie um repositório vazio no GitHub, conecte por SSH, faça `push` e abra um Pull Request de uma branch para a `main` (pode ser você mesmo revisando).

### Desafios

- **Desafio 1:** reescreva um script do Módulo 11 para ser **idempotente** e prove executando-o duas vezes seguidas.
- **Desafio 2:** use `git bisect` para achar o commit que "quebrou" algo (crie o cenário: 10 commits, um deles com bug).
- **Desafio 3:** explique, com suas palavras, `merge` x `rebase` (aprofundado no Módulo 19).

## Erros comuns nesta fase

- Commitar segredos ou arquivos gerados (`node_modules`, `*.tfstate`).
- Mensagens de commit vazias de sentido ("ajustes", "fix").
- Trabalhar direto na `main` sem branch.
- `push --force` em branch compartilhada.
- Commits gigantes misturando assuntos.
- Achar que `git add .` é sempre seguro (confira o `git status` antes).

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
