---
id: "27_projeto_final_e_preparacao_para_certificacao"
title: "Módulo 27 — Projeto final e preparação para certificação"
sidebar_label: "27 · Projeto final e certificação"
sidebar_position: 27
---

# Módulo 27 — Projeto final e preparação para certificação

> **Objetivo**: juntar tudo da trilha num projeto único e reproduzível — código no Git, pipeline de CI/CD, imagem em container, stack no Compose e no Kubernetes, observabilidade e segurança — e organizar a preparação para **LPIC-1**, **Linux+**, **RHCSA**, **CKA** e **Terraform Associate**.
>
> **Pré-requisitos**: módulos 00 a 26 (ou ao menos 00–25).
>
> **Tempo de referência (não prazo)**: três a quatro semanas.

---

## O projeto: TrilhaShop de ponta a ponta, em Linux

O mesmo **TrilhaShop** das trilhas Azure e GCP, agora construído por você **sobre Linux**, do zero e por código: front estático, **API de catálogo**, **banco PostgreSQL**, **fila/worker** opcional e proxy reverso, rodando em containers, orquestrado (Compose e Kubernetes), com pipeline, métricas, logs e segurança.

### Arquitetura

```
Git (repositório único = fonte da verdade)
 └─ GitHub Actions: lint → testes → scan (Trivy/gitleaks/Checkov) → build → push (GHCR) → deploy
        │
        ▼
 Kubernetes (kind) ── Ingress NGINX (TLS) ── Service ── Deployment API (3 réplicas, probes, limits)
                                                         │
                                                         └── Secret/ConfigMap · StatefulSet Postgres (PVC)
 Observabilidade: Prometheus + Grafana + Loki (+ OTel/Jaeger)  ·  Alertas + SLO + runbooks
 Segurança: não-root · NetworkPolicy · Pod Security · segredos (SOPS/Vault) · RBAC
 Infra como código: Terraform (kind/docker) + Ansible (hosts) · scripts idempotentes
```

### Entregáveis (em ordem sugerida)

1. **Repositório** `trilhashop-linux` com estrutura clara (`app/`, `infra/`, `k8s/`, `docs/`, `.github/workflows/`), `.gitignore`, branch protection e PRs.
2. **Aplicação**: API (`/saude`, `/produtos`) lendo do PostgreSQL; **12-factor** (config por variável de ambiente, logs em stdout, sem estado local).
3. **Container**: Dockerfile multi-stage, não-root, imagem enxuta e com `HEALTHCHECK`; `compose.yaml` local com **proxy + api + banco**.
4. **IaC**: Terraform criando o cluster/ambiente (ou containers) e Ansible configurando o que for host.
5. **Kubernetes**: Deployment (probes, requests/limits, HPA), Service, Ingress com TLS, ConfigMap/Secret, StatefulSet ou Deployment+PVC para o Postgres, NetworkPolicy.
6. **CI/CD**: pipeline com `lint → test → scan → build → push → deploy`, deploy com **aprovação**, estratégia **rolling** (e, como bônus, canary/blue-green).
7. **Observabilidade**: Prometheus/Grafana com os 4 sinais de ouro, alertas **acionáveis**, logs no Loki, ao menos um trace.
8. **Confiabilidade**: SLO de 99,5% com error budget, **runbook** do alerta principal e um **postmortem** de um incidente simulado.
9. **Documentação**: `README.md` que permite a outra pessoa subir tudo com **poucos comandos**, diagrama, decisões e limitações.

### Roteiro de reconstrução (a prova do projeto)

```bash
git clone git@github.com:SEU_USUARIO/trilhashop-linux.git && cd trilhashop-linux
make up              # ou ./scripts/up.sh: kind + ingress + observabilidade + app
make test            # testes + smoke test (curl no /saude e /produtos)
make down            # limpa tudo
```

Se outra pessoa (ou você, numa distro WSL **nova**, importada do snapshot do Módulo 00) consegue ir de zero ao sistema funcionando só com o README, o projeto está pronto.

### Critérios de aceite

- [ ] Tudo reproduzível por código; **nada** configurado só "à mão".
- [ ] Nenhum segredo no Git (`gitleaks` limpo) e imagens sem CVE crítica sem exceção justificada.
- [ ] Containers **não-root**, com probes e limites; `kubectl auth can-i` coerente com o RBAC.
- [ ] Pipeline verde: todo PR passa por lint, testes e scan; deploy só com aprovação.
- [ ] Dashboard + alerta funcionando; consegui **provocar e resolver** um incidente seguindo o runbook.
- [ ] Postmortem escrito (sem culpados) com ações corretivas.
- [ ] Documentação suficiente para reconstruir do zero.

![Dashboard final do Grafana com os quatro sinais de ouro da API do TrilhaShop em funcionamento](screenshots/27-projeto-final-e-preparacao-para-certificacao/01-dashboard-final.png)
> `[PRINT]` Passo a passo para capturar: com o projeto no ar e tráfego sintético (`hey` ou `ab`), abrir o dashboard da API no Grafana. Capturar latência, tráfego, erros e saturação.

## Desafios integradores

Cada desafio cruza vários módulos e simula um pedido real de trabalho. Faça no projeto `trilhashop-linux`, sem consultar o texto dos módulos (só `man` e a documentação oficial).

- **Desafio 1 — Deploy que se prova sozinho (módulos 11, 19, 20, 22).** Escreva um `scripts/smoke.sh` que suba a stack do Compose, espere o banco ficar saudável, teste `/saude` e `/produtos` com `curl -f` e derrube tudo, saindo com `0` só se tudo passar. Chame-o em um job do workflow e proteja a `main` exigindo esse check.

  **Verifique:** `./scripts/smoke.sh; echo $?` imprime a linha de cada etapa e termina com `0`; ao parar o banco antes (`docker compose stop banco`), o script falha em menos de 60 s com código `1`, e `docker compose ps -q | wc -l` imprime `0` ao final (limpeza garantida).

- **Desafio 2 — Segredo vazou (módulos 19, 22, 25).** Plante uma chave falsa num commit antigo de um branch de teste. Detecte-a com `gitleaks` varrendo o histórico, escreva o procedimento de resposta (revogar, trocar, limpar) e acrescente ao pipeline uma etapa que bloqueie o PR em caso de achado.

  **Verifique:** `docker run --rm -v "$PWD":/repo zricethezav/gitleaks:latest detect --source /repo -v; echo $?` termina com `1` e cita o arquivo e o commit; depois da correção no branch, o mesmo comando termina com `0`.

- **Desafio 3 — Mudança de configuração sem derrubar nada (módulos 20, 21, 23).** Troque o nível de log da API apenas alterando um ConfigMap versionado no Git e aplicando com `kubectl apply -k`, garantindo que os Pods sejam recriados em rolling update (sem ficar com zero réplicas prontas) e que um `rollout undo` volte ao estado anterior.

  **Verifique:** `kubectl rollout status deploy/api` imprime `successfully rolled out`; `kubectl get deploy api -o jsonpath='{.status.availableReplicas}'` nunca mostra `0` durante a troca (acompanhe com `watch`); após `kubectl rollout undo deploy/api`, `kubectl exec deploy/api -- printenv LOG_LEVEL` volta ao valor antigo.

- **Desafio 4 — Incidente de ponta a ponta (módulos 12, 16, 23, 24, 25).** Provoque 5xx na API (por exemplo, apontando a variável do banco para um host inexistente), deixe o alerta de erro disparar, siga o runbook até a causa usando `describe`, `logs` e a métrica, mitigue com rollback e escreva o postmortem *blameless* com linha do tempo e ações corretivas.

  **Verifique:** o alerta aparece como `firing` em `curl -s localhost:9090/api/v1/alerts | grep -c firing` (valor maior que `0`) durante o incidente e volta a `0` depois do rollback; `grep -c '^## ' postmortem.md` imprime pelo menos `5` (resumo, linha do tempo, causa, aprendizados, ações).

- **Desafio 5 — Auditoria de reprodutibilidade (módulos 00, 15, 21, 25).** Em uma distro WSL nova (`wsl --import` do snapshot do módulo 00), clone o repositório e reconstrua tudo só com o README. Registre cada passo que precisou de "ajuste à mão" e transforme-o em código (script, Makefile ou playbook) até a reconstrução rodar sem intervenção.

  **Verifique:** `time make up && make test; echo $?` conclui com `0` sem nenhuma pergunta interativa, e `git status --porcelain | wc -l` imprime `0` (nada ficou fora do repositório).

## Preparação para certificações

A trilha cobre bases de várias provas. Use o quadro para planejar **uma de cada vez**:

| Certificação | Foco | Módulos da trilha | Formato |
|---|---|---|---|
| **LPIC-1** (101 e 102) | Administração Linux, neutra de distro | 01–13, 15–17 | Questões de múltipla escolha e preenchimento |
| **CompTIA Linux+ (XK0-005)** | Admin Linux + segurança + automação + troubleshooting | 01–17, 25 | Múltipla escolha e questões práticas (PBQ) |
| **RHCSA (EX200)** | Admin RHEL, **100% prática** | 02–13, 17 (com `dnf`, SELinux, firewalld, LVM, `Stratis`/XFS) | Prova prática no terminal |
| **CKA** | Administração de Kubernetes | 14, 20, 23 | Prova **prática** no terminal (2 h) |
| **CKAD** | Desenvolvimento em Kubernetes | 20, 22, 23 | Prova prática |
| **HashiCorp Terraform Associate** | Terraform e IaC | 15, 21 | Múltipla escolha |
| **Network+ / CCNA** | Redes | 09, 18 | Múltipla escolha e simulações |
| **Security+** | Segurança geral | 10, 25 | Múltipla escolha e PBQ |

### Como estudar para provas práticas (RHCSA, CKA)

- **Treine no terminal, com cronômetro.** Nessas provas, velocidade e memória muscular decidem.
- Domine a **documentação permitida** (`man`, `kubernetes.io/docs` na CKA) e aprenda a **procurar**, não decorar.
- Configure aliases/autocompletar (`alias k=kubectl`, `export do="--dry-run=client -o yaml"`) e o `vim` (`:set expandtab tabstop=2 shiftwidth=2`).
- Refaça os **laboratórios dos módulos sem consultar o texto**, em ambiente novo (snapshot do Módulo 00).
- Simule: **killer.sh** (inclui 2 sessões com a inscrição da CKA/CKAD), KodeKloud e labs do Red Hat.

### Plano de revisão (sugestão)

1. **Semana 1 — Diagnóstico:** leia os checklists de saída de todos os módulos relevantes; marque o que **não** consegue fazer sem consultar.
2. **Semana 2 — Lacunas:** refaça os laboratórios desses módulos, em ambiente limpo, com cronômetro.
3. **Semana 3 — Simulados:** provas de treino completas; analise **cada erro** (conceito? comando? tempo?).
4. **Semana 4 — Polimento:** repita só os pontos fracos; revise tabelas de decisão e comandos de uma linha.

> `[TEORIA]` Provas de certificação medem **o que você consegue fazer sob pressão**, não só o que entendeu. O projeto final mostra que você **constrói**; os simulados mostram que você consegue **rápido e sem apoio**. Precisa dos dois.

## Encerrando: desmontagem e retrospectiva

```bash
kind delete cluster --name lab
docker compose down -v; docker system prune -af --volumes
terraform destroy
wsl --unregister ubuntu-lab           # (PowerShell) só a distro descartável
```

Antes de apagar: **tire os prints** pendentes dos módulos e **exporte** o que quiser guardar (`wsl --export`). E faça uma **retrospectiva**: o que foi mais difícil? O que você já faria no trabalho amanhã? Qual o próximo passo (Azure, GCP, CKA)?

## Erros comuns nesta fase

- Deixar o projeto "quase pronto" sem README reproduzível.
- Cobrir só o caminho feliz (sem testar falhas, rollback, incidente).
- Estudar para prova prática só lendo.
- Tentar todas as certificações ao mesmo tempo.
- Esquecer de desmontar e deixar o ambiente consumindo recursos.
- Pular os desafios integradores porque "o projeto já subiu": é neles que aparecem as falhas de integração entre módulos.
- Resolver o problema do README "na mão" e não registrar o ajuste em código, o que quebra a reconstrução em ambiente novo.

## `[REFERÊNCIA]`

- LPI — LPIC-1: https://www.lpi.org/our-certifications/lpic-1-overview/
- CompTIA Linux+: https://www.comptia.org/certifications/linux
- Red Hat — RHCSA (EX200): https://www.redhat.com/en/services/training/ex200-red-hat-certified-system-administrator-rhcsa-exam
- CNCF/Linux Foundation — CKA, CKAD, CKS: https://training.linuxfoundation.org/certification/
- HashiCorp — Terraform Associate: https://developer.hashicorp.com/certifications/infrastructure-automation
- Killer Shell: https://killer.sh/ · KodeKloud: https://kodekloud.com/
- The Twelve-Factor App: https://12factor.net/pt_br/
- Google — *SRE Workbook*: https://sre.google/workbook/table-of-contents/

**Próximos passos:** as trilhas **Azure** e **GCP** deste projeto, que reaproveitam o TrilhaShop em nuvem, e a certificação **CKA**.

## Checklist de saída

- [ ] Ter o projeto TrilhaShop no ar a partir do repositório, com poucos comandos.
- [ ] Cumprir todos os critérios de aceite (segredos, segurança, pipeline, observabilidade, SRE, documentação).
- [ ] Ter escolhido a **primeira certificação** e montado o plano de revisão de 4 semanas.
- [ ] Ter feito ao menos um simulado e analisado os erros.
- [ ] Ter desmontado o ambiente e guardado o que importa.
