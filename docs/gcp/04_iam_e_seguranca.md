---
id: "04_iam_e_seguranca"
title: "Módulo 04 — IAM e Segurança"
sidebar_label: "04 · IAM e Segurança"
sidebar_position: 4
---

# Módulo 04 — IAM e Segurança

> **Objetivo**: controlar quem pode fazer o quê no GCP — principals, roles, políticas IAM, service accounts e Workload Identity — e proteger segredos e dados com Secret Manager e Cloud KMS, conhecendo o Security Command Center.
>
> **Pré-requisitos**: módulo 03 (hierarquia e herança).
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Cobre "Configuring access and security" do **Associate Cloud Engineer** e segurança do **Cloud Digital Leader**. Referência: https://cloud.google.com/iam/docs/overview

---

## Quem, o quê, onde

Toda decisão de acesso no GCP responde a três perguntas, e a política IAM junta as três:

- **Quem** (*principal*): usuário, grupo, **service account**, domínio.
- **Pode fazer o quê** (*role*): um conjunto de permissões.
- **Em qual recurso** (*escopo*): organização, pasta, projeto ou um recurso específico — e a política **herda** para baixo (Módulo 03).

Uma **permissão** é uma ação granular (`compute.instances.start`); uma **role** agrupa permissões. Três tipos:

| Tipo | O que é | Uso |
|---|---|---|
| **Básicas** (Owner, Editor, Viewer) | Muito amplas | Evite em produção |
| **Predefinidas** (`roles/compute.instanceAdmin.v1`) | Mantidas pelo Google, por serviço | **Padrão recomendado** |
| **Customizadas** | Você escolhe as permissões | Menor privilégio fino |

> `[ATENÇÃO]` Não use **Owner/Editor** como atalho: o *Editor* pode criar e apagar quase tudo no projeto. Dê **roles predefinidas específicas**, no **menor escopo** que resolva (princípio do menor privilégio). Prefira dar acesso a **grupos**, e não a pessoas.

```bash
PROJETO=$(gcloud config get project)

gcloud projects get-iam-policy $PROJETO --format="table(bindings.role,bindings.members)"
gcloud iam roles list --filter="name~compute" --format="value(name)" | head
gcloud iam roles describe roles/storage.objectViewer          # as permissões da role

# Conceder (quem + role + escopo)
gcloud projects add-iam-policy-binding $PROJETO \
  --member="user:colega@exemplo.com" --role="roles/viewer"
gcloud projects remove-iam-policy-binding $PROJETO \
  --member="user:colega@exemplo.com" --role="roles/viewer"

# Quem tem o quê? E "por que não consigo?"
gcloud projects get-iam-policy $PROJETO --flatten="bindings[].members" \
  --filter="bindings.members:colega@exemplo.com" --format="table(bindings.role)"
gcloud asset search-all-iam-policies --scope=projects/$PROJETO --query="policy:colega@exemplo.com"
```

Além de `allow` policies, existem **deny policies** (negam mesmo havendo permissão) e **IAM Conditions** (conceder só em certo horário/recurso/tag). Conhecer a existência é suficiente por ora.

> `[TEORIA]` Prova: o IAM do GCP é **aditivo e herdado**: as permissões efetivas são a **união** do que foi concedido nos níveis acima. Para *remover* acesso, é preciso remover a concessão no nível onde ela existe (ou usar deny policy).

## Service accounts: identidades para aplicações

Uma **service account (SA)** é a identidade de uma **aplicação ou máquina**, não de uma pessoa. A VM, o Cloud Run ou o pipeline "agem como" uma SA, e a SA recebe roles. Assim a aplicação acessa APIs **sem senha de usuário**.

```bash
# Criar a SA da API do TrilhaShop e dar o mínimo necessário
gcloud iam service-accounts create sa-trilhashop-api --display-name="API do TrilhaShop"
SA=sa-trilhashop-api@$PROJETO.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJETO \
  --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"

gcloud iam service-accounts list
gcloud iam service-accounts describe $SA
```

Há três formas de a aplicação se autenticar como a SA — da pior para a melhor:

1. **Chave JSON baixada** (`gcloud iam service-accounts keys create`): um segredo de longa duração que vaza no Git. **Evite.**
2. **SA anexada ao recurso**: a VM/Cloud Run/Function **roda como** a SA (`--service-account=`), e o ambiente fornece credenciais temporárias automaticamente (metadata server). **Recomendado.**
3. **Workload Identity Federation**: identidades **externas** (GitHub Actions, outra nuvem, GKE) trocam seu token por credenciais temporárias do GCP, **sem nenhuma chave**.

```bash
# Anexar a SA a um recurso (ex.: VM)
gcloud compute instances create vm-api --service-account=$SA --scopes=cloud-platform \
  --zone=southamerica-east1-a --machine-type=e2-micro

# Impersonar a SA (testar o que ela pode fazer, sem chave)
gcloud storage ls --impersonate-service-account=$SA
```

> `[ATENÇÃO]` A SA **padrão** do Compute Engine costuma ter o role *Editor* no projeto: ampla demais. Crie SAs **dedicadas, uma por aplicação**, com o mínimo de roles. E se precisar de uma chave, trate-a como senha: rotacione, nunca versione e, se possível, bloqueie a criação por Org Policy (`constraints/iam.disableServiceAccountKeyCreation`).

![Console de IAM com a service account sa-trilhashop-api listada e seu role Secret Manager Secret Accessor](screenshots/04-iam-e-seguranca/01-iam-service-account.png)
> `[PRINT]` Passo a passo para capturar: Console → IAM e administrador → IAM. Capturar a linha da service account com o role atribuído.

## Secret Manager: o cofre de segredos

O **Secret Manager** guarda senhas, tokens e strings de conexão com **versões**, controle de acesso por IAM e **auditoria**. A aplicação lê o segredo em tempo de execução, usando a SA — nada de senha em `.env` ou no Git.

```bash
gcloud services enable secretmanager.googleapis.com

printf 'Host=...;Password=s3gredo' | gcloud secrets create db-connection --data-file=-
gcloud secrets versions add db-connection --data-file=<(printf 'Host=...;Password=nova')   # nova versão
gcloud secrets versions access latest --secret=db-connection                                # ler
gcloud secrets list

# Dar leitura SÓ deste segredo à SA da API
gcloud secrets add-iam-policy-binding db-connection \
  --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
```

> `[ATENÇÃO]` `secretAccessor` dá leitura do **valor**; `secretmanager.viewer` só dos metadados. Conceda a leitura **no segredo específico**, não no projeto inteiro.

## Cloud KMS: gerenciar chaves de criptografia

O Google já **criptografa em repouso por padrão**, com chaves dele. O **Cloud KMS** é para quando você precisa **controlar a chave**: rotação, desativação, auditoria, **CMEK** (*customer-managed encryption keys*) em serviços como Storage, BigQuery e discos.

```bash
gcloud services enable cloudkms.googleapis.com
gcloud kms keyrings create trilhashop --location=southamerica-east1
gcloud kms keys create dados --keyring=trilhashop --location=southamerica-east1 \
  --purpose=encryption --rotation-period=90d --next-rotation-time=$(date -u -d "+90 days" +%Y-%m-%dT%H:%M:%SZ)
gcloud kms keys list --keyring=trilhashop --location=southamerica-east1

echo "dado sensível" | gcloud kms encrypt --key=dados --keyring=trilhashop \
  --location=southamerica-east1 --plaintext-file=- --ciphertext-file=- | base64 | head -c 60; echo
```

> `[ATENÇÃO]` Se uma chave CMEK for **desativada ou destruída**, os dados protegidos por ela ficam **irrecuperáveis**. Chaves KMS não podem ser apagadas na hora (há período de destruição agendada), mas planeje com cuidado.

## Security Command Center e responsabilidade compartilhada

O **Security Command Center (SCC)** é o painel de postura de segurança do GCP: descobre **vulnerabilidades e configurações incorretas** (bucket público, firewall aberto, SA com chave), detecta ameaças e dá visibilidade por organização. O **Cloud Audit Logs** registra quem fez o quê (Módulo 15).

```bash
gcloud logging read 'protoPayload.methodName="SetIamPolicy"' --limit=5 --format="table(timestamp,protoPayload.authenticationInfo.principalEmail)"
```

Lembrete do modelo de **responsabilidade compartilhada** (e "*shared fate*" do Google): o Google protege a infraestrutura; **você** configura IAM, dados e rede. A maioria dos incidentes em nuvem vem de **configuração**, não de falha do provedor.

## Práticas

### Prática isolada

1. Crie a SA `sa-lab` e dê a ela **só** o role `roles/storage.objectViewer` num bucket específico; teste com `--impersonate-service-account`: ela lê, mas não grava.
   ```bash
   BUCKET=lab-iam-$RANDOM
   gcloud storage buckets create gs://$BUCKET --location=southamerica-east1
   echo ola | gcloud storage cp - gs://$BUCKET/teste.txt
   gcloud iam service-accounts create sa-lab
   gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
     --member="serviceAccount:sa-lab@$PROJETO.iam.gserviceaccount.com" --role="roles/storage.objectViewer"
   gcloud storage cat gs://$BUCKET/teste.txt --impersonate-service-account=sa-lab@$PROJETO.iam.gserviceaccount.com
   echo nao | gcloud storage cp - gs://$BUCKET/x.txt --impersonate-service-account=sa-lab@$PROJETO.iam.gserviceaccount.com   # deve falhar (403)
   ```
2. Guarde um segredo no Secret Manager e leia com a SA.
3. Liste as roles de uma SA e as permissões efetivas de uma role (`iam roles describe`).

**Limpeza:** `gcloud storage rm -r gs://$BUCKET; gcloud iam service-accounts delete sa-lab@$PROJETO.iam.gserviceaccount.com --quiet`.

### Contribuição ao projeto integrador

Dê identidade à API do TrilhaShop **sem nenhum segredo**: SA `sa-trilhashop-api` com `secretmanager.secretAccessor` só no segredo `db-connection`; o segredo guarda a string de conexão (valor fictício por ora); documente no `decisoes.md` que a API usará essa SA anexada ao Cloud Run (Módulo 10) e o segredo será lido em tempo de execução.

`[CUSTO]` IAM e service accounts são gratuitos; Secret Manager cobra centavos por versão ativa e por acessos; KMS cobra por chave/versão e por operação.

## Erros comuns nesta fase

- Usar Owner/Editor no dia a dia.
- Dar roles a pessoas em vez de grupos.
- Baixar chaves JSON de SA e versioná-las.
- Usar a SA padrão do Compute com role Editor.
- Conceder `secretAccessor` no projeto inteiro.
- Esquecer que a propagação de uma mudança de IAM pode levar alguns minutos.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Service account anexada | VMs e Cloud Run — Módulos 08 e 10 |
| Workload Identity | GKE — Módulo 09; CI/CD — trilha Linux, Módulos 22 e 25 |
| Secret Manager | Banco e aplicações — Módulos 10 e 12 |
| Audit Logs | Monitoramento — Módulo 15 |
| Menor privilégio, segredos | DevSecOps — trilha Linux, Módulo 25 |

## `[REFERÊNCIA]`

- Google Cloud — *IAM overview*: https://cloud.google.com/iam/docs/overview
- Google Cloud — *Best practices for using service accounts*: https://cloud.google.com/iam/docs/best-practices-service-accounts
- Google Cloud — *Workload Identity Federation*: https://cloud.google.com/iam/docs/workload-identity-federation
- Google Cloud — *Secret Manager*: https://cloud.google.com/secret-manager/docs
- Google Cloud — *Cloud KMS*: https://cloud.google.com/kms/docs
- Google Cloud — *Security Command Center*: https://cloud.google.com/security-command-center/docs
- Google Cloud — *Predefined roles*: https://cloud.google.com/iam/docs/understanding-roles

**Como aprofundar:** o *IAM Recommender* (`gcloud recommender`) sugere remover permissões não usadas; e o simulador de políticas (*Policy Troubleshooter*) explica por que um acesso foi negado.

## Checklist de saída

- [ ] Explicar principal, role, permissão e escopo, e a herança do IAM.
- [ ] Diferenciar roles básicas, predefinidas e customizadas e dizer por que evitar Editor/Owner.
- [ ] Criar uma service account e dar a ela o menor privilégio.
- [ ] Explicar as três formas de autenticar uma aplicação e por que chave JSON é a pior.
- [ ] Guardar e ler um segredo no Secret Manager com permissão restrita.
- [ ] Explicar quando usar Cloud KMS/CMEK e o risco de perder a chave.
- [ ] Descrever o papel do Security Command Center e dos Audit Logs.
