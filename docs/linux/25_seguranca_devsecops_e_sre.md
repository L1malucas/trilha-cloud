---
id: "25_seguranca_devsecops_e_sre"
title: "Módulo 25 — Segurança (DevSecOps) e SRE"
sidebar_label: "25 · DevSecOps e SRE"
sidebar_position: 25
---

# Módulo 25 — Segurança (DevSecOps) e SRE

> **Objetivo**: levar segurança e confiabilidade para dentro do ciclo de entrega — gestão de segredos (Vault, SOPS), varredura de código/imagens/IaC (Trivy, Checkov, gitleaks), políticas (OPA/Kyverno, Pod Security), identidade (OIDC, SSO, MFA) e a prática de **SRE**: SLOs, error budget, gestão de incidentes, postmortems e runbooks.
>
> **Pré-requisitos**: módulos 10, 19, 20, 22, 23 e 24.
>
> **Tempo de referência (não prazo)**: duas a três semanas.
>
> Alinha-se a **CompTIA Security+**, ao **CKS** (segurança em Kubernetes) e às práticas de SRE do Google. Referências: https://sre.google/books/ · https://owasp.org/

---

## Shift left: segurança desde o começo

Tradicionalmente, segurança era um portão no fim ("a equipe de segurança vai revisar antes de ir ao ar"): lento e caro, porque falhas descobertas tarde custam mais. **DevSecOps** "empurra a segurança para a esquerda" do pipeline (*shift left*): checagens **automatizadas e contínuas** em cada etapa — código, dependências, imagem, infraestrutura, execução —, com responsabilidade **compartilhada** entre dev, ops e segurança.

```
commit → [gitleaks: segredos] → [SAST/lint] → [deps: vulnerabilidades] → build → [Trivy: imagem] → [Checkov: IaC] → deploy → [políticas: Kyverno/OPA] → runtime [monitoramento]
```

> `[TEORIA]` Três ideias guiam tudo: **menor privilégio**, **defesa em profundidade** (Módulo 10) e **automatizar o que é repetível** — checagens manuais não escalam e são esquecidas.

## Gestão de segredos

Um **segredo** é qualquer credencial: senha, token, chave de API, chave privada, string de conexão. Regras:

1. **Nunca** no código, no Git, na imagem nem em log (Módulos 15, 20).
2. Fornecidos em **tempo de execução** por um cofre, com **acesso mínimo e auditado**.
3. **Rotacionados** e com **vida curta** (preferir credenciais temporárias).
4. Se vazou: **revogue e troque na hora** — apagar do Git não resolve.

### gitleaks: pegar segredos antes de entrarem

```bash
# instale conforme https://github.com/gitleaks/gitleaks#installing
gitleaks detect --source . --verbose           # varre o histórico
gitleaks protect --staged                      # só o que está no stage (use em pre-commit, Módulo 19)
```

### HashiCorp Vault (servidor de segredos)

```bash
docker run -d --name vault --cap-add=IPC_LOCK -p 8200:8200 \
  -e VAULT_DEV_ROOT_TOKEN_ID=lab-token hashicorp/vault:latest        # modo DEV: só para estudo!
export VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=lab-token

vault kv put secret/trilhashop/db usuario=app senha='s3gredo'
vault kv get secret/trilhashop/db
vault kv get -field=senha secret/trilhashop/db

# política de menor privilégio: só leitura neste caminho
vault policy write app-leitura - <<'EOF'
path "secret/data/trilhashop/*" { capabilities = ["read"] }
EOF
vault token create -policy=app-leitura -ttl=1h          # token temporário e restrito
```

> `[ATENÇÃO]` O modo `-dev` do Vault guarda tudo em memória, com token de root fixo: **jamais use em produção**. Em produção: armazenamento persistente, **unseal** com chaves divididas (Shamir) ou *auto-unseal* por KMS, TLS e auditoria.

O Vault também gera **credenciais dinâmicas** (ex.: usuário de banco que expira em 1 h) — o ideal de "segredo de vida curta".

### SOPS: segredos criptografados no Git

O **SOPS** criptografa **só os valores** de arquivos YAML/JSON/`.env`, deixando as chaves legíveis, para versionar segredos com segurança (usando `age`, GPG ou KMS de nuvem).

```bash
age-keygen -o ~/.config/sops/age/keys.txt           # gera a chave (guarde fora do Git!)
export SOPS_AGE_RECIPIENTS=$(grep -o 'age1.*' ~/.config/sops/age/keys.txt | head -1)
printf 'DB_SENHA: s3gredo\nAPI_KEY: abc123\n' > segredos.yaml
sops --encrypt --age "$SOPS_AGE_RECIPIENTS" -i segredos.yaml     # criptografa no lugar
cat segredos.yaml                                                # valores ilegíveis, chaves visíveis
sops --decrypt segredos.yaml                                     # exige a chave privada
```

No Kubernetes: **External Secrets Operator** (sincroniza do Vault/KeyVault/Secrets Manager) ou **Sealed Secrets**.

## Varredura: vulnerabilidades, IaC e código

| Alvo | Ferramenta | Pergunta |
|---|---|---|
| Imagens e dependências | **Trivy**, Grype, Snyk | Há CVEs conhecidas? |
| IaC (Terraform, K8s, Dockerfile) | **Checkov**, tfsec/Trivy | A configuração é insegura (porta aberta, bucket público)? |
| Código (SAST) | **SonarQube**, Semgrep, CodeQL | Há falhas no meu código (injeção, XSS)? |
| Segredos | **gitleaks**, trufflehog | Há credenciais no repositório? |
| Aplicação rodando (DAST) | OWASP **ZAP** | Ela resiste a ataques reais? |

```bash
trivy image --severity HIGH,CRITICAL trilhashop-api:v1        # CVEs da imagem
trivy fs --scanners vuln,secret,misconfig .                   # projeto: deps, segredos e má configuração
trivy config .                                                # Dockerfile/Terraform/K8s
checkov -d . --framework terraform,dockerfile,kubernetes      # políticas de IaC
```

Dois ajustes de pipeline importantes: **falhar o build** em severidade alta/crítica (`--exit-code 1`), e manter um arquivo de **exceções com justificativa** (`.trivyignore`) para falsos positivos. O Módulo 22 mostra onde encaixar isso no GitHub Actions.

> `[TEORIA]` CVE (*Common Vulnerabilities and Exposures*) é o identificador público de uma falha (CVE-2024-xxxx); o **CVSS** dá a gravidade (0–10). Nem toda CVE é explorável no **seu** contexto: priorize por gravidade, exposição e existência de exploit. A cultura saudável é **atualizar com frequência** (patching) em vez de acumular dívida.

## Políticas como código: OPA/Gatekeeper e Kyverno

Em Kubernetes, **admission controllers** podem **recusar** recursos que violam regras. **Kyverno** (políticas em YAML) e **OPA/Gatekeeper** (linguagem Rego) tornam "regras da casa" automáticas:

```yaml
# Kyverno: exige que containers NÃO rodem como root
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: exigir-nao-root }
spec:
  validationFailureAction: Enforce
  rules:
    - name: run-as-non-root
      match: { any: [{ resources: { kinds: [Pod] } }] }
      validate:
        message: "Containers devem rodar como não-root."
        pattern:
          spec:
            securityContext:
              runAsNonRoot: true
```

**Pod Security Standards** (embutidos no K8s) definem três perfis — `privileged`, `baseline`, `restricted` — aplicados por label de namespace:

```bash
k label ns producao pod-security.kubernetes.io/enforce=restricted
```

No cluster, também: **NetworkPolicy** (Módulo 23), `securityContext` (não-root, `readOnlyRootFilesystem`, `capabilities: drop: [ALL]`), imagens assinadas (**cosign**) e RBAC enxuto. Em nuvem: **Azure Policy** (Módulo 03) e *Organization Policies* do GCP cumprem esse mesmo papel.

## Identidade: SSO, OIDC, OAuth2 e MFA

- **MFA**: segundo fator reduz drasticamente o risco de senha vazada. Em qualquer acesso privilegiado, é obrigatório.
- **SSO**: um login central (provedor de identidade — Entra ID, Okta, Google) para vários sistemas.
- **OAuth2**: protocolo de **autorização** (delegar acesso sem dar a senha). **OIDC** (OpenID Connect) acrescenta **autenticação** (quem é o usuário) sobre o OAuth2, via tokens JWT.
- **OIDC para pipelines**: o GitHub Actions pode obter **credenciais temporárias** na nuvem provando sua identidade por OIDC, **sem** guardar chave de longa duração como secret:

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: azure/login@v2        # (ou google-github-actions/auth, aws-actions/configure-aws-credentials)
    with:
      client-id: ${{ vars.AZURE_CLIENT_ID }}
      tenant-id: ${{ vars.AZURE_TENANT_ID }}
      subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

## Compliance e padrões

| Padrão | Foco |
|---|---|
| **LGPD** (Brasil) | Proteção de dados pessoais: base legal, minimização, direitos do titular, incidentes |
| **ISO 27001** | Sistema de gestão de segurança da informação |
| **SOC 2** | Controles de segurança/disponibilidade de provedores de serviço |
| **PCI DSS** | Dados de cartão de pagamento |
| **CIS Benchmarks** | Guias técnicos de hardening (Linux, Docker, K8s) |
| **OWASP Top 10** | As 10 falhas mais comuns de aplicações web |

```bash
# Auditar um host contra boas práticas (Módulo 10)
sudo lynis audit system
# Conferir o cluster K8s contra o CIS Benchmark
kube-bench run
```

---

# Parte 2 — SRE: confiabilidade como engenharia

**SRE** (*Site Reliability Engineering*) trata a operação como um problema de **engenharia de software**: automatizar o trabalho repetitivo, medir a confiabilidade e **decidir com dados** o equilíbrio entre lançar novidades e manter o serviço estável.

## SLI, SLO e error budget (retomando o Módulo 24)

- Defina **SLIs** do que o usuário sente (disponibilidade, latência, correção).
- Estabeleça **SLOs** realistas — **100% é a meta errada** (caro, e impede de evoluir). Para 99,9%/mês, o **error budget** é ~43 min.
- **Política de error budget**: com orçamento sobrando, o time pode lançar mais rápido; esgotado, **congela mudanças** e foca em confiabilidade. Isso resolve o conflito dev (quer lançar) x ops (quer estabilidade) com um **número acordado**.

| SLO mensal | Indisponibilidade permitida |
|---|---|
| 99% | ~7 h 18 min |
| 99,9% | ~43 min |
| 99,99% | ~4 min 23 s |

## Toil e automação

**Toil** é trabalho operacional **manual, repetitivo, automatizável e sem valor duradouro** (reiniciar serviço à mão, rodar o mesmo script toda semana). SRE procura **limitar o toil a ~50% do tempo** e automatizar o resto — o que une este módulo aos de scripts (11), Ansible/Terraform (21) e CI/CD (22).

## Gestão de incidentes

Quando algo quebra, a prioridade é **restaurar o serviço**, não achar o culpado nem a causa raiz perfeita. Um processo claro evita o caos:

1. **Detectar** (alerta bom, Módulo 24) e **declarar** o incidente, com **severidade** (SEV1 = parada total … SEV3 = degradação leve).
2. **Papéis**: *Incident Commander* (decide e coordena), *Ops/Comms* (executa e comunica), *Scribe* (registra a linha do tempo).
3. **Mitigar primeiro**: rollback, desligar uma feature flag, escalar, redirecionar tráfego — **estancar o sangramento**.
4. **Comunicar** a stakeholders em intervalos regulares.
5. **Resolver** e confirmar com as métricas.
6. **Aprender** — postmortem.

> `[ATENÇÃO]` Durante o incidente, **registre horários e ações** (o que foi tentado, quando, com qual efeito). A memória falha sob estresse, e esse histórico é a matéria-prima do postmortem.

## Postmortem *blameless*

O **postmortem** documenta o incidente para **aprender**, sem culpar pessoas ("*blameless*"): falhas são tratadas como problemas de **sistema e processo** (faltou alerta, o rollback era manual, a documentação estava velha). Estrutura:

```markdown
# Postmortem — <título> (SEV2, 14/01, 42 min)
## Resumo        (o que aconteceu, impacto, duração)
## Linha do tempo (hora: evento/ação)
## Causa raiz e fatores contribuintes
## O que deu certo / o que deu errado / onde tivemos sorte
## Ações corretivas (dono, prazo, prioridade)
```

O valor está nas **ações corretivas** acompanhadas até o fim.

## Runbooks

Um **runbook** é o passo a passo para um problema conhecido ("API com 5xx alto": verificar X, Y, Z; mitigar com W; escalar para quem). Todo alerta deveria apontar para um runbook. Os que você escreveu no Módulo 16 são o ponto de partida: agora padronize o formato e linke-os nos alertas.

## Práticas de confiabilidade

- **Release gradual** (canary, Módulo 22) e **rollback fácil**.
- **Testes de carga** e de **caos** (derrubar nós/containers de propósito para validar a resiliência — *Chaos Engineering*).
- **Capacity planning** e autoscaling (Módulo 23).
- **Backups testados** e **DR** com RPO/RTO definidos (Módulo 15 do Azure).
- **Dependências**: timeouts, retentativas com *backoff*, *circuit breaker*.

![Saída do `trivy image` listando vulnerabilidades por pacote, com severidade HIGH e CRITICAL em destaque](screenshots/25-seguranca-devsecops-e-sre/01-trivy-image.png)
> `[PRINT]` Passo a passo para capturar: rodar `trivy image --severity HIGH,CRITICAL trilhashop-api:v1`. Capturar a tabela de resultados.

## Laboratórios

### Lab 1 — Segredos
Rode gitleaks no seu repositório (plante um segredo falso e veja ser detectado); suba o Vault em modo dev, guarde e leia um segredo, crie uma política read-only e um token temporário.

### Lab 2 — SOPS
Criptografe um `.env`/YAML com age+SOPS, versione-o no Git (o criptografado) e prove que o diff mostra só valores cifrados.

### Lab 3 — Varreduras
`trivy image` e `trivy config`/`checkov` no seu Dockerfile/Terraform; corrija 3 achados e rode de novo para ver o resultado melhorar.

### Lab 4 — Políticas no cluster
No kind (Módulo 23), instale Kyverno e aplique a política "não-root" (Enforce); tente criar um Pod root e veja o bloqueio.

### Lab 5 — Incidente simulado
Simule: derrube o banco da stack, deixe o alerta disparar (Módulo 24), conduza a resposta com papéis, e escreva o **postmortem blameless** e o runbook.

### Desafios

- **Desafio 1:** pipeline com **gitleaks + Trivy + Checkov**, falhando em severidade alta, com exceções justificadas.
- **Desafio 2:** defina o SLO do TrilhaShop (99,5%), calcule o error budget, escreva a política de congelamento e o runbook do alerta principal.
- **Desafio 3:** *game day*: um colega (ou você, em duas "personas") quebra algo sem avisar; vocês detectam, mitigam e documentam usando o processo de incidentes.

## Erros comuns nesta fase

- Considerar segurança uma etapa final.
- Segredo vazou e "só apagar o commit".
- Vault em modo dev em ambiente real.
- Scanners rodando mas ignorados (sem falhar o build, sem dono).
- SLO de 100% ou sem política para o orçamento.
- Postmortem que procura culpados, e ações sem dono nem prazo.
- Alertas sem runbook.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Pipeline seguro | CI/CD — Módulo 22; projeto final — Módulo 27 |
| Segredos no Key Vault | Azure, Módulo 05; Secret Manager (GCP, Módulo 04) |
| Políticas | Azure Policy (Módulo 03); Org Policies (GCP, Módulo 03) |
| SLOs e incidentes | Observabilidade — Módulo 24; projeto final — Módulo 27 |

## `[REFERÊNCIA]`

- OWASP: https://owasp.org/ · OWASP Top 10: https://owasp.org/www-project-top-ten/
- Trivy: https://aquasecurity.github.io/trivy/ · Checkov: https://www.checkov.io/
- gitleaks: https://github.com/gitleaks/gitleaks · SOPS: https://github.com/getsops/sops
- HashiCorp Vault — tutoriais: https://developer.hashicorp.com/vault/tutorials
- Kyverno: https://kyverno.io/docs/ · OPA/Gatekeeper: https://open-policy-agent.github.io/gatekeeper/
- Kubernetes — *Pod Security Standards*: https://kubernetes.io/docs/concepts/security/pod-security-standards/
- CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks
- Google — *SRE Books* (gratuitos): https://sre.google/books/
- Atlassian — *Incident management handbook*: https://www.atlassian.com/incident-management/handbook
- LGPD: https://www.gov.br/anpd/pt-br
- CompTIA Security+: https://www.comptia.org/certifications/security · CKS: https://training.linuxfoundation.org/certification/certified-kubernetes-security-specialist/

**Como aprofundar:** leia o *Google SRE Book* (caps. sobre SLOs, incidentes e postmortems) e o *OWASP Top 10*; para K8s, prepare o **CKS**.

## Checklist de saída

- [ ] Explicar *shift left* e os pontos de checagem de um pipeline seguro.
- [ ] Guardar e consumir segredos com Vault/SOPS sem expô-los no Git.
- [ ] Rodar Trivy, Checkov e gitleaks e interpretar/tratar achados.
- [ ] Aplicar políticas em Kubernetes (Pod Security, Kyverno/OPA) e RBAC enxuto.
- [ ] Explicar OAuth2, OIDC, SSO, MFA e credenciais temporárias via OIDC.
- [ ] Definir SLI/SLO, calcular error budget e redigir a política de orçamento.
- [ ] Conduzir um incidente com papéis e escrever um postmortem *blameless*.
- [ ] Escrever um runbook e ligá-lo a um alerta.
