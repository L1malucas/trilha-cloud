---
id: "22_ci_cd"
title: "Módulo 22 — CI/CD"
sidebar_label: "22 · CI/CD"
sidebar_position: 22
---

# Módulo 22 — CI/CD

> **Objetivo**: automatizar o caminho do código à produção — pipelines de integração e entrega contínuas com **GitHub Actions** (e comparação com GitLab CI/Jenkins), estratégias de deploy (rolling, blue/green, canary), feature flags e gestão de artefatos.
>
> **Pré-requisitos**: módulos 11, 19, 20 e 21.
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Alinha-se ao domínio "Automation & CI/CD" de vagas de DevOps/Cloud e ao CKAD/CKA (entrega em Kubernetes, Módulo 23). Documentação: https://docs.github.com/actions

---

## A linha de montagem do software

Sem automação, publicar uma versão é um ritual manual e arriscado: alguém compila, roda testes "se lembrar", copia arquivos para o servidor por SSH. Cada etapa é fonte de erro e demora. **CI/CD** é a linha de montagem que faz isso **sempre igual, a cada mudança**:

- **CI — Integração Contínua**: a cada `push`/PR, o código é **construído e testado** automaticamente. Pega o erro minutos depois de cometido.
- **CD — Entrega/Implantação Contínua**: o artefato aprovado é **entregue** (*delivery*: pronto para publicar com um clique) ou **implantado** automaticamente (*deployment*) nos ambientes.

Etapas típicas de um pipeline:

```
commit → build → testes → análise (lint, scan) → empacotar (imagem) → publicar artefato → deploy dev → testes → deploy prod
```

> `[TEORIA]` O princípio: **falhar rápido e cedo**. Quanto antes o pipeline acusa o problema (lint em segundos, testes em minutos), mais barato o conserto. E o pipeline é **código** (YAML versionado no repositório), revisado em PR como qualquer outro (Módulo 19).

## GitHub Actions: conceitos

| Conceito | O que é |
|---|---|
| **Workflow** | Arquivo YAML em `.github/workflows/` descrevendo um pipeline |
| **Evento** (`on`) | O que dispara: `push`, `pull_request`, `schedule`, `workflow_dispatch` (manual) |
| **Job** | Conjunto de passos, roda num **runner** (por padrão, VMs do GitHub) |
| **Step** | Um comando (`run`) ou uma **action** reutilizável (`uses`) |
| **Runner** | A máquina que executa (hospedada ou *self-hosted*) |
| **Secrets** | Valores sensíveis guardados no GitHub, injetados no job |
| **Matrix** | Executa o mesmo job com várias combinações (versões, SO) |

Jobs rodam **em paralelo** por padrão; `needs:` cria dependência/ordem entre eles.

> `[TENTE VOCÊ]` Dois jobs sem `needs:` rodam em que ordem? Resposta: em **paralelo**, sem ordem garantida. Se o `deploy` precisa esperar o `build`, declare `needs: build`. Quando um job do qual outro depende falha, o dependente é **pulado** (`skipped`), não executado.

## Primeiro workflow: CI de shell scripts

No repositório do seu laboratório (Módulo 15), crie `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read          # menor privilégio para o GITHUB_TOKEN

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: ShellCheck
        run: |
          sudo apt-get update && sudo apt-get install -y shellcheck
          shellcheck scripts/*.sh

  testes:
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        python: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python }}
          cache: pip
      - run: pip install -r requirements.txt pytest
      - run: pytest -q
```

Faça `git push` e acompanhe na aba **Actions** do GitHub. Um check vermelho no PR **bloqueia o merge** se a *branch protection* exigir (Módulo 19).

> `[TENTE VOCÊ]` Dá para validar o YAML do workflow antes do push, sem esperar o GitHub? Resposta: sim. `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest` aponta erros de sintaxe, de expressão `${{ }}` e de `needs` inexistente. Para só checar YAML: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"` (sem saída = válido).

> `[TENTE VOCÊ]` Rode os mesmos passos do job `lint` na sua máquina. Resposta: `shellcheck scripts/*.sh; echo $?` — o código de saída que o runner veria é o mesmo: `0` passa, diferente de `0` deixa o check vermelho. Se funciona local, só falha no CI por diferença de ambiente.

> `[ATENÇÃO]` Fixe versões das actions (`@v4`, ou melhor, o *SHA* do commit) e dê ao `GITHUB_TOKEN` só as `permissions` necessárias. Actions de terceiros são código executado com acesso ao seu repositório e aos secrets.

> `[ATENÇÃO]` A indentação do YAML é parte da sintaxe: um `run:` com a lista de comandos desalinhada vira erro de parse (ou, pior, um passo que roda só metade). Use `run: |` para blocos de várias linhas e valide com `actionlint`.

## Build e publicação de imagem

```yaml
name: Imagem

on:
  push:
    tags: ["v*"]

permissions:
  contents: read
  packages: write

jobs:
  publicar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ghcr.io/${{ github.repository }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Esse workflow dispara ao criar uma **tag** `v1.0.0`, constrói a imagem do Módulo 20 e publica no GHCR com cache.

> `[TENTE VOCÊ]` O workflow acima não dispara num `git push` comum. Por quê, e como disparar? Resposta: o gatilho é `on.push.tags: ["v*"]`, então só reage a tags. Dispare com `git tag -a v0.1.0 -m "release" && git push origin v0.1.0`. Para testes sem tag, adicione `workflow_dispatch:` em `on:` e execute pela aba Actions.

## Secrets e ambientes

```yaml
  deploy:
    runs-on: ubuntu-latest
    needs: publicar
    environment: producao            # aprovação manual e secrets por ambiente
    steps:
      - name: Deploy via SSH
        env:
          CHAVE: ${{ secrets.DEPLOY_SSH_KEY }}
        run: |
          install -m 600 /dev/null chave && printf '%s' "$CHAVE" > chave
          ssh -i chave -o StrictHostKeyChecking=accept-new deploy@${{ vars.HOST }} "docker compose pull && docker compose up -d"
```

**Environments** permitem exigir **aprovação** antes de rodar em produção e isolar secrets por ambiente. Prefira **OIDC** (autenticar na nuvem sem chave de longa duração) a guardar credenciais no GitHub (Módulo 25).

> `[ATENÇÃO]` Secrets **nunca** podem aparecer em log (o GitHub mascara, mas `echo` de variantes derivadas vaza) nem ir em PRs de *forks*. E não faça `set -x` em passos com credenciais.

## Runner self-hosted no WSL

Útil para praticar com sua própria máquina ou acessar rede interna:

1. Repositório → *Settings → Actions → Runners → New self-hosted runner* (Linux x64).
2. Siga os comandos mostrados (`./config.sh --url ... --token ...` e `./run.sh`).
3. No workflow: `runs-on: self-hosted`.

> `[ATENÇÃO]` Runner self-hosted em **repositório público** é perigoso: um PR malicioso executaria código na sua máquina. Use só em repositórios privados e confiáveis.

## Outras ferramentas (mesmos conceitos)

| Ferramenta | Característica |
|---|---|
| **GitLab CI** | Pipeline em `.gitlab-ci.yml`; `stages`, `jobs`, runners; muito integrado ao GitLab |
| **Jenkins** | Servidor próprio, enorme ecossistema de plugins, `Jenkinsfile`; mais trabalho de manutenção |
| **Azure DevOps Pipelines** | `azure-pipelines.yml`, integrado ao ecossistema Microsoft |
| **CircleCI, Tekton** | SaaS / nativo de Kubernetes |

Aprender uma bem ensina todas: **gatilho → jobs → passos → artefato → deploy**.

## Estratégias de deploy

Como colocar a versão nova no ar **sem derrubar o serviço**:

| Estratégia | Como | Vantagem | Risco |
|---|---|---|---|
| **Recreate** | Para tudo e sobe a nova | Simples | Indisponibilidade |
| **Rolling** | Troca instâncias aos poucos (1 a 1) | Sem downtime, usa pouco recurso extra | Duas versões convivem; rollback mais lento |
| **Blue/Green** | Dois ambientes idênticos; vira o tráfego de azul para verde | Rollback instantâneo (volta o tráfego) | Dobra o custo durante a troca |
| **Canary** | Envia 1–5% do tráfego à nova versão e observa | Reduz o raio de impacto | Exige métricas e roteamento de tráfego |

**Feature flags** separam **deploy** de **release**: o código vai para produção desligado e é ativado (para um grupo, ou %) sem novo deploy — base do desenvolvimento *trunk-based* (Módulo 19).

> `[TENTE VOCÊ]` Num blue/green, o que realmente "vira" na hora da troca? Resposta: o roteamento do tráfego (o `upstream` do proxy ou o selector do Service), não as aplicações. As duas versões já estão de pé; a troca é uma mudança de ponteiro, por isso o rollback é só voltar o ponteiro.

Exemplo de rolling update com Compose/SSH (conceito), e em Kubernetes (Módulo 23): `kubectl rollout`, `kubectl rollout undo`.

## Artefatos e dependências

Um **artefato** é o resultado imutável do build (imagem de container, `.deb`, binário, pacote). Regras: **construa uma vez, promova o mesmo artefato** por dev → homologação → produção (não reconstrua em cada ambiente), **versione** (SemVer/SHA do commit) e guarde em um repositório de artefatos (GHCR, ACR, Nexus, Artifactory). Fixe e verifique dependências (lockfiles), e escaneie vulnerabilidades no pipeline (Trivy, Módulo 25).

![Aba Actions do GitHub com um workflow executado com sucesso, mostrando os jobs lint e testes em verde](screenshots/22-ci-cd/01-github-actions-sucesso.png)
> `[PRINT]` Passo a passo para capturar: após o push do `ci.yml`, abrir a aba Actions do repositório e a execução. Capturar o grafo de jobs verdes.

## Laboratórios

### Lab 1 — CI básico
`ci.yml` com `shellcheck` e testes; quebre um script de propósito num PR e veja o check vermelho bloquear o merge.

### Lab 2 — Build e publicação
Workflow que, ao criar a tag `v0.1.0`, constrói a imagem da API (Módulo 20) e publica no GHCR; baixe e rode a imagem publicada.

### Lab 3 — Matrix e cache
Teste em duas versões da linguagem com cache de dependências; compare o tempo com e sem cache.

### Lab 4 — Deploy com aprovação
Job `deploy` num `environment` com aprovação manual que atualiza uma stack Compose (em uma VM/container alvo) via SSH.

### Lab 5 — Runner self-hosted (privado)
Instale um runner self-hosted no WSL e rode um job nele.

### Lab 6 — Rodar localmente o que o pipeline roda
Cenário: antes de abrir o PR, reproduza os passos do `ci.yml` no WSL, para não gastar minutos de CI com erro bobo.

```bash
cd ~/lab && rm -rf ci-local && mkdir -p ci-local/scripts ci-local/.github/workflows && cd ci-local && git init -q -b main
cat > scripts/ok.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "tudo certo"
EOF
cat > scripts/ruim.sh <<'EOF'
#!/usr/bin/env bash
rm -rf $DIR/*
EOF
cat > .github/workflows/ci.yml <<'EOF'
name: CI
on:
  pull_request:
permissions:
  contents: read
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: shellcheck scripts/*.sh
EOF
sudo apt install -y shellcheck
shellcheck scripts/*.sh; echo "saída: $?"      # SC2086 e SC2115 em ruim.sh -> falharia no CI
docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest   # sem saída = workflow válido
```

Corrija `ruim.sh` (aspas e `${DIR:?}`) até o `shellcheck` sair com `0`. Esse é exatamente o ciclo "falhar rápido".

### Lab 7 — Blue/green local com Nginx
Cenário: publicar a versão 2 sem downtime e poder voltar em segundos.

```bash
mkdir -p ~/lab/bluegreen && cd ~/lab/bluegreen
docker network create bg 2>/dev/null || true
mkdir -p v1 v2 && echo "versao 1" > v1/index.html && echo "versao 2" > v2/index.html
docker run -d --name azul  --network bg -v "$PWD/v1":/usr/share/nginx/html:ro nginx:1.27
docker run -d --name verde --network bg -v "$PWD/v2":/usr/share/nginx/html:ro nginx:1.27
cat > upstream.conf <<'EOF'
server { listen 80; location / { proxy_pass http://azul:80; } }
EOF
docker run -d --name borda --network bg -p 127.0.0.1:8097:80 -v "$PWD/upstream.conf":/etc/nginx/conf.d/default.conf:ro nginx:1.27
curl -s localhost:8097                                    # versao 1
sed -i 's/azul/verde/' upstream.conf && docker exec borda nginx -s reload
curl -s localhost:8097                                    # versao 2
sed -i 's/verde/azul/' upstream.conf && docker exec borda nginx -s reload
curl -s localhost:8097                                    # rollback: versao 1
docker rm -f azul verde borda; docker network rm bg
```

### Lab 8 — Gatilhos e variáveis: entender o que dispara o quê
Cenário: o time reclama que "o pipeline rodou duas vezes". Leia e explique este trecho sem executar.

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

Uma branch com PR aberto gera `pull_request` a cada push; ao fazer o merge, o `push` na `main` gera outra execução. Duas execuções, dois eventos, nada de bug. Para evitar o desperdício, restrinja `push` à `main` (como fez o `ci.yml` do módulo) e use `concurrency:` para cancelar execuções antigas da mesma branch:

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

### Desafios

- **Desafio 1:** pipeline completo `lint → test → scan (Trivy) → build → push → deploy (aprovação)` para a API, com cada etapa dependendo da anterior.
- **Desafio 2:** implemente um deploy **blue/green** com dois containers e um Nginx que troca o `upstream` por script, e prove rollback em segundos.
- **Desafio 3:** versionamento automático: gere `vX.Y.Z` a partir de Conventional Commits (por exemplo, com `release-please`) e publique release notes.
- **Desafio 4:** no `pipeline.sh` do lab integrador, acrescente uma etapa de scan com `docker run --rm aquasec/trivy:latest image --exit-code 1 --severity CRITICAL pipeline-demo:<versão>` (monte `-v /var/run/docker.sock:/var/run/docker.sock`) e faça o pipeline falhar em vulnerabilidade crítica.

  **Verifique:** `./pipeline.sh; echo $?` imprime `0` com uma imagem limpa; ao trocar a base por uma imagem antiga (ex.: `alpine:3.10`), a etapa de scan falha e o `echo $?` imprime `1`.

- **Desafio 5:** reescreva o Lab 7 para que o chaveamento seja um script `troca.sh azul|verde` que valida a saúde do destino (`curl -f`) **antes** de recarregar o Nginx e aborta se estiver fora.

  **Verifique:** `./troca.sh verde && curl -s localhost:8097` imprime `versao 2`; com o container verde parado, `./troca.sh verde; echo $?` imprime um erro e `1`, e `curl -s localhost:8097` continua devolvendo `versao 1`.

- **Desafio 6:** em um repositório de teste, configure um workflow com `concurrency` e `permissions` mínimas e um job `deploy` com `environment: producao`; valide tudo com `actionlint`.

  **Verifique:** `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest; echo $?` termina com `0` e sem nenhuma linha de erro.

### Desafio avançado — Canary com rollback automático por taxa de erro
**Nível:** avançado — leva de 1 a 3 horas
- **Cenário:** o time de pagamentos não aceita mais blue/green "tudo ou nada": cada release nova deve receber só uma fatia do tráfego, e se a versão nova começar a errar, o rollback precisa acontecer sozinho, sem ninguém olhando o terminal e sem derrubar requisições em andamento. Você vai montar o mecanismo localmente com containers, como um mini pipeline de entrega progressiva.
- **Requisitos:**
  1. Uma borda Nginx com dois backends (`estavel` e `canario`, ambos Nginx servindo respostas que identificam a versão) e um peso configurável para o canário.
  2. Um script `promove.sh <percentual>` que reescreve o peso e recarrega a borda sem derrubar conexões.
  3. A borda registra num log próprio, por requisição, qual backend atendeu e o status devolvido pelo backend (não só o status final).
  4. Um script `guarda.sh` que, depois de gerar 500 requisições, calcula a taxa de erro (status 5xx) **só do canário** a partir do log e, se passar de 5%, volta o peso do canário para 0 automaticamente e sai com código `2`.
  5. Com 10% de peso e 1000 requisições, o canário recebe entre 7% e 13% do tráfego.
  6. Durante o rollback automático, nenhuma requisição de um loop contínuo de `curl` recebe erro de conexão.
- **Restrições:** sem Kubernetes, sem service mesh e sem instalar nada além de containers `nginx:1.27`; o cálculo da taxa deve ser feito com ferramentas de texto do módulo 04, nunca "de olho".
- **Onde pesquisar:** `ngx_http_upstream_module` (`weight`), `split_clients`, `log_format` com `$upstream_addr` e `$upstream_status`, `nginx -s reload` (graceful), `return` em `location`.
- **Verifique:**
  - Com canário saudável e `./promove.sh 10`, depois `for i in $(seq 1000); do curl -s localhost:8097; done | sort | uniq -c` mostra duas linhas e a do canário entre 70 e 130.
  - Com o canário trocado por uma versão que responde `return 500;`, `./guarda.sh; echo $?` imprime a taxa medida e `2`, e logo depois `./promove.sh --status` (ou o arquivo de config) mostra peso `0`.
  - Em outro terminal, `while :; do curl -s -o /dev/null -w '%{http_code}\n' localhost:8097; done | sort | uniq -c` rodando durante o rollback não contém código `000`.
  - Borda: com o canário saudável, `./guarda.sh; echo $?` imprime `0` e o peso permanece em 10; com menos de 500 linhas de log do canário, o script recusa decidir (saída diferente de `0` e `2`) em vez de aprovar por falta de dados.

## Erros comuns nesta fase

- Reconstruir o artefato em cada ambiente em vez de promover o mesmo.
- Pipelines lentos demais (sem cache, sem paralelismo).
- Secrets em logs ou em repositórios de fork.
- Actions sem versão fixa e `GITHUB_TOKEN` com permissão ampla.
- Deploy direto em produção sem aprovação nem rollback.
- "Testar em produção" por falta de ambiente de homologação.
- Validar o workflow só no GitHub (cada erro de YAML custa um ciclo de commit); rode `actionlint` e os passos localmente antes.
- Pipeline que dispara duas vezes (push + PR) por falta de filtro de branch e de `concurrency`.
- Trocar o proxy para a versão nova sem checar a saúde do destino antes (blue/green sem health check).

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 11 (scripts) | Cada `run:` é um script; `set -euo pipefail` e códigos de saída decidem o verde/vermelho |
| Módulo 19 (Git) | Gatilhos por branch/tag, PR com check obrigatório, SemVer nas tags |
| Módulo 20 (Docker) | `docker build` e push no pipeline; healthcheck do container para o smoke test |
| Módulo 21 (Terraform/Ansible) | `terraform fmt -check`/`validate` e `ansible-playbook --check` como etapas de CI |
| Módulo 12 (logs) | Log do job é o "journal" do pipeline; saber ler a falha primeiro |

### Lab integrador — Pipeline local de ponta a ponta
Monte um "pipeline" em shell que executa as mesmas etapas do CI, usando Git (19), Docker (20) e Terraform (21), e que sai com código diferente de zero na primeira falha.

```bash
mkdir -p ~/lab/pipeline-local && cd ~/lab/pipeline-local
cat > pipeline.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
etapa() { echo "==> $1"; }

etapa "lint de scripts"
shellcheck ./*.sh

etapa "validar IaC"
mkdir -p tf && cat > tf/main.tf <<'TF'
resource "terraform_data" "exemplo" {
  input = "ok"
}
TF
terraform -chdir=tf fmt -check
terraform -chdir=tf init -input=false >/dev/null
terraform -chdir=tf validate

etapa "build da imagem (versão = commit)"
VERSAO=$(git rev-parse --short HEAD 2>/dev/null || echo local)
printf 'FROM alpine:3.20\nCMD ["echo","olá"]\n' > Dockerfile
docker build -q -t pipeline-demo:"$VERSAO" .

etapa "smoke test"
docker run --rm pipeline-demo:"$VERSAO" | grep -q 'olá'
echo "PIPELINE OK (pipeline-demo:$VERSAO)"
EOF
chmod +x pipeline.sh && git init -q -b main 2>/dev/null; git add -A && git commit -qm "chore: pipeline local" 2>/dev/null || true
./pipeline.sh; echo "código de saída: $?"
```

Estrague algo de propósito (um espaço errado no `main.tf`, uma variável sem aspas no script) e veja a etapa que quebra interromper tudo: é o "falhar rápido" na prática.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Deploy em cluster, `rollout` | Kubernetes — Módulo 23 |
| GitOps (Argo CD/Flux) | Módulos 19 e 23 |
| Scan no pipeline, OIDC, secrets | Segurança — Módulo 25 |
| Pipelines de IaC (`plan` em PR) | Terraform — Módulo 21 |
| Métricas de deploy (DORA) | SRE — Módulo 25 |

## `[REFERÊNCIA]`

- GitHub Actions — documentação: https://docs.github.com/actions
- GitHub — *Security hardening for Actions*: https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- GitLab CI/CD: https://docs.gitlab.com/ee/ci/
- Jenkins: https://www.jenkins.io/doc/
- *Continuous Delivery* (Jez Humble): https://continuousdelivery.com/
- DORA — métricas de entrega: https://dora.dev/
- Martin Fowler — *Blue-Green Deployment* e *Canary*: https://martinfowler.com/bliki/BlueGreenDeployment.html
- release-please: https://github.com/googleapis/release-please

**Como aprofundar:** estude as quatro métricas DORA (frequência de deploy, lead time, taxa de falha, tempo de recuperação) e pipelines como código para IaC (`terraform plan` comentado no PR).

## Checklist de saída

- [ ] Explicar CI, entrega contínua e implantação contínua.
- [ ] Ler e escrever um workflow do GitHub Actions (eventos, jobs, steps, `needs`, matrix, secrets).
- [ ] Construir e publicar uma imagem de container por pipeline.
- [ ] Proteger o pipeline (permissões mínimas, versões fixas, secrets, environments com aprovação).
- [ ] Comparar rolling, blue/green e canary e dizer quando usar cada um.
- [ ] Explicar feature flags e a regra "construa uma vez, promova o artefato".
- [ ] Ter um pipeline completo com lint, teste, scan, build e deploy.
