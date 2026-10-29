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

> `[ATENÇÃO]` Fixe versões das actions (`@v4`, ou melhor, o *SHA* do commit) e dê ao `GITHUB_TOKEN` só as `permissions` necessárias. Actions de terceiros são código executado com acesso ao seu repositório e aos secrets.

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

### Desafios

- **Desafio 1:** pipeline completo `lint → test → scan (Trivy) → build → push → deploy (aprovação)` para a API, com cada etapa dependendo da anterior.
- **Desafio 2:** implemente um deploy **blue/green** com dois containers e um Nginx que troca o `upstream` por script, e prove rollback em segundos.
- **Desafio 3:** versionamento automático: gere `vX.Y.Z` a partir de Conventional Commits (por exemplo, com `release-please`) e publique release notes.

## Erros comuns nesta fase

- Reconstruir o artefato em cada ambiente em vez de promover o mesmo.
- Pipelines lentos demais (sem cache, sem paralelismo).
- Secrets em logs ou em repositórios de fork.
- Actions sem versão fixa e `GITHUB_TOKEN` com permissão ampla.
- Deploy direto em produção sem aprovação nem rollback.
- "Testar em produção" por falta de ambiente de homologação.

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
