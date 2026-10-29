---
id: "12_banco_de_dados"
title: "Módulo 12 — Banco de Dados"
sidebar_label: "12 · Banco de Dados"
sidebar_position: 12
---

# Módulo 12 — Banco de Dados

> **Objetivo**: conhecer as opções de banco do GCP — Cloud SQL, AlloyDB, Spanner, Firestore, Bigtable e Memorystore —, escolher entre relacional e NoSQL com critério, entender backup/alta disponibilidade/réplicas e criar o banco do catálogo do TrilhaShop com acesso privado.
>
> **Pré-requisitos**: módulos 04 e 05 (segredos, VPC).
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre "Planning and implementing data storage" do **Associate Cloud Engineer** e dados do **Cloud Digital Leader**. Referência: https://cloud.google.com/products/databases

---

## Banco como serviço: o DBA terceirizado

Instalar um banco numa VM (IaaS) é possível, mas você assume patch, backup, alta disponibilidade e tuning. Os bancos **gerenciados** entregam isso prontos: você escolhe o tamanho, e o Google cuida de atualizações, backups, replicação e failover. Para a maioria dos casos, é o caminho certo.

## Qual banco? Relacional ou NoSQL, regional ou global

| Serviço | Tipo | Característica | Use quando |
|---|---|---|---|
| **Cloud SQL** | Relacional (MySQL, PostgreSQL, SQL Server) | Gerenciado, regional, SQL padrão | Aplicações tradicionais; **o mais comum** |
| **AlloyDB** | Relacional (compatível PostgreSQL) | Alto desempenho, HA, analítico integrado | PostgreSQL exigente, em escala maior |
| **Spanner** | Relacional **global**, consistência forte | Escala horizontal com SQL e transações ACID globais | Aplicações globais de missão crítica |
| **Firestore** | NoSQL **documentos** | Serverless, tempo real, sincronização mobile/web | Apps web/mobile, dados flexíveis |
| **Bigtable** | NoSQL **colunas largas** | Altíssimo throughput e baixa latência | IoT, séries temporais, bilhões de linhas |
| **Memorystore** | Cache em memória (Redis/Valkey/Memcached) | Latência de submilissegundo | Cache, sessões, filas leves |
| **BigQuery** | Data warehouse analítico | (ver Módulo 13) | Análises sobre grandes volumes |

> `[TEORIA]` Pergunta clássica: "banco **relacional global** com consistência forte e escala horizontal" → **Spanner**; "relacional comum, gerenciado" → **Cloud SQL**; "milhões de leituras/escritas por segundo, chave-valor/séries temporais" → **Bigtable**; "documentos para app web/mobile em tempo real" → **Firestore**; "análise de petabytes" → **BigQuery**. Escolha pelo **padrão de acesso**, não pela moda.

## Cloud SQL: o banco do catálogo

```bash
PROJETO=$(gcloud config get project); REGIAO=southamerica-east1
gcloud services enable sqladmin.googleapis.com servicenetworking.googleapis.com

# 1) Reserve um intervalo de IPs privados e conecte a VPC ao serviço gerenciado (Private Services Access)
gcloud compute addresses create google-managed-services-trilhashop --global \
  --purpose=VPC_PEERING --prefix-length=16 --network=vpc-trilhashop
gcloud services vpc-peerings connect --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-trilhashop --network=vpc-trilhashop

# 2) Instância PostgreSQL com IP PRIVADO (sem IP público)
gcloud sql instances create sql-trilhashop --database-version=POSTGRES_16 \
  --tier=db-custom-1-3840 --region=$REGIAO --edition=ENTERPRISE \
  --network=projects/$PROJETO/global/networks/vpc-trilhashop --no-assign-ip \
  --storage-size=10GB --storage-auto-increase \
  --backup-start-time=03:00 --enable-point-in-time-recovery \
  --labels=projeto=trilhashop

gcloud sql databases create catalogo --instance=sql-trilhashop
gcloud sql users create app --instance=sql-trilhashop --password="$(openssl rand -base64 24)"
gcloud sql instances describe sql-trilhashop --format="yaml(state,ipAddresses,settings.availabilityType)"
```

O **Private Services Access** coloca a instância gerenciada **dentro da sua VPC**, acessível por IP interno. Gere a senha com `openssl` e guarde-a no **Secret Manager** (Módulo 04), sem exibi-la.

```bash
SENHA=$(openssl rand -base64 24)
gcloud sql users set-password app --instance=sql-trilhashop --password="$SENHA"
printf '%s' "$SENHA" | gcloud secrets create db-senha --data-file=-
```

Conecte-se:

```bash
# De uma VM da VNet (IP privado) ou pelo proxy/connector seguro:
gcloud sql connect sql-trilhashop --user=app --database=catalogo        # usa um IP temporário/autorizado
# Em produção: Cloud SQL Auth Proxy / conector do Cloud Run (--add-cloudsql-instances), com IAM
```

```sql
CREATE TABLE produtos (id serial PRIMARY KEY, nome text NOT NULL, preco numeric(10,2));
INSERT INTO produtos (nome, preco) VALUES ('Camiseta', 59.90);
SELECT * FROM produtos;
```

> `[ATENÇÃO]` Evite **IPs autorizados `0.0.0.0/0`**: expõe o banco à internet. Use IP privado + **Cloud SQL Auth Proxy** (cifra e autentica por IAM) e dê à SA da aplicação o role `roles/cloudsql.client`.

No Cloud Run, a conexão é declarativa:

```bash
gcloud run services update trilhashop-api --region=$REGIAO \
  --add-cloudsql-instances=$PROJETO:$REGIAO:sql-trilhashop \
  --set-secrets=DB_PASSWORD=db-senha:latest
```

![Console do Cloud SQL mostrando a instância sql-trilhashop PostgreSQL com IP privado e backups automáticos ativados](screenshots/12-banco-de-dados/01-cloud-sql-instancia.png)
> `[PRINT]` Passo a passo para capturar: Console → SQL → `sql-trilhashop`. Capturar a visão geral (conexões com IP privado) e a aba Backups.

## Alta disponibilidade, réplicas e backup

- **HA (alta disponibilidade)**: `--availability-type=REGIONAL` mantém uma **réplica standby síncrona em outra zona**, com **failover automático** (se a zona cair). Dobra o custo de computação.
- **Réplicas de leitura**: cópias **assíncronas** para escalar **leituras** (e DR entre regiões); não são failover automático.
- **Backups**: automáticos diários + sob demanda; **PITR** (*point-in-time recovery*) volta a qualquer instante dentro da janela de retenção.
- **Janela de manutenção**: quando o Google pode aplicar patches.

```bash
gcloud sql instances patch sql-trilhashop --availability-type=REGIONAL      # liga HA
gcloud sql instances create sql-trilhashop-replica --master-instance-name=sql-trilhashop --region=us-east1
gcloud sql backups create --instance=sql-trilhashop --description="antes da migração"
gcloud sql backups list --instance=sql-trilhashop
gcloud sql instances clone sql-trilhashop sql-restaurado --point-in-time=2026-01-01T12:00:00Z    # PITR por clone
```

> `[TEORIA]` Prova: **HA** = failover entre zonas (resiliência); **réplica de leitura** = desempenho de leitura/DR (não é HA automática); **backup/PITR** = recuperação de erro lógico (apagou dados). Os três resolvem problemas diferentes.

## Outros bancos, em uma olhada

```bash
# Firestore (modo Native)
gcloud firestore databases create --location=southamerica-east1 --type=firestore-native
# Memorystore for Redis
gcloud redis instances create cache-trilhashop --region=$REGIAO --size=1 --tier=BASIC --network=vpc-trilhashop
# Spanner (instância pequena, só para conhecer)
gcloud spanner instances create sp-trilhashop --config=regional-southamerica-east1 --description="lab" --processing-units=100
# Bigtable
gcloud bigtable instances create bt-trilhashop --display-name="lab" --cluster-config=id=bt-c1,zone=southamerica-east1-a,nodes=1
```

> `[CUSTO]` **Spanner, Bigtable e AlloyDB cobram por hora desde a criação** (e são caros para estudo): crie, observe e apague na mesma sessão. Firestore tem cota gratuita diária.

## Migração

O **Database Migration Service (DMS)** migra bancos (MySQL, PostgreSQL, SQL Server, Oracle) de outro provedor ou on-premises para Cloud SQL/AlloyDB com **mínimo de downtime**, via replicação contínua. Para esquemas heterogêneos (Oracle → PostgreSQL), há conversão de esquema.

## Práticas

### Prática isolada

1. Crie a instância Cloud SQL PostgreSQL com **IP privado**, banco `catalogo` e usuário `app` (senha no Secret Manager).
2. Conecte por `gcloud sql connect`, crie a tabela e insira 3 linhas.
3. Faça um backup sob demanda, apague uma tabela e **restaure** (clone com PITR ou restore do backup) para recuperar.
4. Crie um Firestore e um documento por `gcloud`/Console e compare com o modelo relacional.
5. Escreva, por escrito, quando você escolheria cada banco da tabela para o TrilhaShop.

**Limpeza:** `gcloud sql instances delete sql-trilhashop --quiet` (e réplicas/Redis/Spanner/Bigtable).

### Contribuição ao projeto integrador

Crie o banco do catálogo do TrilhaShop como **Cloud SQL PostgreSQL com IP privado** na `vpc-trilhashop`, schema `produtos`, senha em `db-senha` no Secret Manager, backup automático e PITR; conecte o Cloud Run (`--add-cloudsql-instances`) e valide: a API conecta, um `psql` da internet **não**. Registre no `decisoes.md` quando migraria para AlloyDB ou Spanner.

`[CUSTO]` Cloud SQL cobra por vCPU/memória/armazenamento e IP; **pare** a instância fora das sessões de estudo (`gcloud sql instances patch ... --activation-policy=NEVER`) ou apague.

## Erros comuns nesta fase

- Abrir o banco com IP autorizado `0.0.0.0/0`.
- Confundir HA (failover) com réplica de leitura.
- Esquecer de guardar a senha no Secret Manager.
- Escolher Spanner/Bigtable quando um Cloud SQL resolvia (custo).
- Esquecer o Private Services Access ao usar IP privado.
- Não testar a restauração do backup.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Banco + Cloud Run | Módulos 09 e 10 |
| Dados para análise | BigQuery — Módulo 13 |
| Backup, HA, PITR | Operações — Módulo 15 |
| Segredos | Secret Manager — Módulo 04 |
| Azure SQL/PostgreSQL | Azure, Módulo 11 |

## `[REFERÊNCIA]`

- Google Cloud — *Databases*: https://cloud.google.com/products/databases
- Google Cloud — *Cloud SQL*: https://cloud.google.com/sql/docs
- Google Cloud — *Cloud SQL private IP*: https://cloud.google.com/sql/docs/postgres/configure-private-ip
- Google Cloud — *Cloud SQL Auth Proxy*: https://cloud.google.com/sql/docs/postgres/sql-proxy
- Google Cloud — *Spanner*: https://cloud.google.com/spanner/docs
- Google Cloud — *Firestore*: https://cloud.google.com/firestore/docs · *Bigtable*: https://cloud.google.com/bigtable/docs
- Google Cloud — *Choose a database*: https://cloud.google.com/architecture/databases/choosing-a-database
- PostgreSQL — documentação: https://www.postgresql.org/docs/

**Como aprofundar:** a árvore de decisão "Database options" no Architecture Center e o laboratório de migração com DMS.

## Checklist de saída

- [ ] Escolher o banco do GCP para cenários (Cloud SQL, AlloyDB, Spanner, Firestore, Bigtable, Memorystore).
- [ ] Criar Cloud SQL com IP privado e explicar o Private Services Access.
- [ ] Conectar com segurança (Auth Proxy/connector) e guardar a senha no Secret Manager.
- [ ] Diferenciar HA, réplica de leitura e backup/PITR.
- [ ] Explicar o papel do Database Migration Service.
- [ ] Ter criado o banco do TrilhaShop e validado o acesso apenas pela rede privada.
