---
id: "11_banco_de_dados"
title: "Módulo 11 — Banco de Dados"
sidebar_label: "11 · Banco de Dados"
sidebar_position: 11
---

# Módulo 11 — Banco de Dados

> **Objetivo**: conhecer as opções de banco do Azure (Azure SQL, Cosmos DB, PostgreSQL/MySQL gerenciados), escolher entre relacional e NoSQL com critério, entender backup/replicação/migração e criar o banco do catálogo do TrilhaShop acessível só pela VNet.
>
> **Pré-requisitos**: módulos 05 e 06 (segurança, rede, Private Endpoint).
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre **Describe Azure data services** (AZ-900) e partes de **Implement and manage storage / compute** (AZ-104). Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900

---

## Banco como serviço: o seu "DBA terceirizado"

Instalar um banco numa VM (IaaS) é possível, mas você assume patch, backup, alta disponibilidade e tuning. Os bancos **gerenciados** (PaaS) entregam isso prontos: você cria o banco, define o tamanho e a Microsoft cuida do resto. Para a maioria dos casos, é a escolha certa.

## Relacional ou NoSQL?

| | Relacional (SQL) | NoSQL |
|---|---|---|
| Modelo | Tabelas, linhas, relacionamentos, esquema rígido | Documentos, chave-valor, grafo, colunas; esquema flexível |
| Consistência | ACID forte, transações | Escolha entre consistência e escala |
| Quando | Pedidos, financeiro, dados com relações | Catálogo flexível, sessão, IoT, escala global |

Os serviços:

- **Azure SQL Database**: SQL Server como serviço (banco único ou *elastic pool*); **Azure SQL Managed Instance**: quase 100% compatível com SQL Server local, ótima para migração; **SQL Server em VM**: controle total.
- **Azure Database for PostgreSQL / MySQL — Flexible Server**: PostgreSQL e MySQL gerenciados, com alta disponibilidade entre zonas.
- **Azure Cosmos DB**: NoSQL global, multi-modelo (NoSQL/documentos, MongoDB, Cassandra, Gremlin, Table), latência de milissegundos, replicação multi-região, cobrança por **RU/s** (Request Units).

> `[TEORIA]` Prova: "migrar um SQL Server local com mínimo de alterações" → **Managed Instance**; "app nova, banco relacional como serviço" → **Azure SQL Database**; "distribuição global, baixa latência, esquema flexível" → **Cosmos DB**; "app open source em PostgreSQL" → **PostgreSQL Flexible Server**.

## Cosmos DB: consistência é um botão

O Cosmos DB oferece cinco níveis de **consistência**, do mais forte ao mais relaxado: *Strong, Bounded Staleness, Session* (padrão, o equilíbrio mais usado), *Consistent Prefix* e *Eventual*. Mais forte = leituras mais atuais, porém latência e custo maiores.

> `[ATENÇÃO]` Em Cosmos DB, o desenho da **partition key** decide desempenho e custo. Uma chave ruim (poucos valores, "hot partition") trava a escala e não dá para trocá-la depois sem migrar os dados.

## Criando o banco do catálogo

```bash
RG=rg-trilhashop-dev
PG=pg-trilhashop-$RANDOM

az postgres flexible-server create -g $RG -n $PG -l brazilsouth \
  --tier Burstable --sku-name Standard_B1ms --version 16 \
  --admin-user trilhaadmin --admin-password "$(openssl rand -base64 24)" \
  --vnet vnet-trilhashop --subnet snet-dados \
  --private-dns-zone privatelink.postgres.database.azure.com \
  --high-availability Disabled --storage-size 32 --yes

az postgres flexible-server db create -g $RG --server-name $PG -d catalogo
az postgres flexible-server show -g $RG -n $PG --query "{estado:state, fqdn:fullyQualifiedDomainName}" -o json
```

A opção `--vnet/--subnet` coloca o servidor **dentro da VNet** (acesso privado, sem IP público). Gere a senha com `openssl` e **grave direto no Key Vault**, sem exibi-la:

```bash
SENHA=$(openssl rand -base64 24)
az keyvault secret set --vault-name $KV --name db-senha --value "$SENHA" -o none
```

Conecte-se de uma VM da VNet:

```bash
psql "host=$PG.postgres.database.azure.com dbname=catalogo user=trilhaadmin sslmode=require"
```

```sql
CREATE TABLE produtos (id serial PRIMARY KEY, nome text NOT NULL, preco numeric(10,2));
INSERT INTO produtos (nome, preco) VALUES ('Camiseta', 59.90);
SELECT * FROM produtos;
```

![Servidor PostgreSQL Flexible no portal, mostrando acesso privado dentro da VNet e a zona de DNS privada](screenshots/11-banco-de-dados/01-postgres-flexible-networking.png)
> `[PRINT]` Passo a passo para capturar: portal → Azure Database for PostgreSQL flexible servers → o servidor → Networking. Capturar a configuração de acesso privado.

Variações:

```bash
# Azure SQL Database
az sql server create -g $RG -n sql-trilhashop-$RANDOM -l brazilsouth --admin-user trilhaadmin --admin-password "<senha>"
az sql db create -g $RG -s <servidor> -n catalogo --service-objective Basic
az sql server firewall-rule create -g $RG -s <servidor> -n meu-ip --start-ip-address <seu-ip> --end-ip-address <seu-ip>

# Cosmos DB (API NoSQL, serverless)
az cosmosdb create -g $RG -n cosmos-trilhashop-$RANDOM --capabilities EnableServerless
az cosmosdb sql database create -g $RG -a <conta> -n trilhashop
az cosmosdb sql container create -g $RG -a <conta> -d trilhashop -n pedidos --partition-key-path "/clienteId"
```

## Backup, alta disponibilidade e migração

- **Backup automático** com **PITR** (*point-in-time restore*): volta o banco a qualquer instante dentro da retenção (7–35 dias).
- **Alta disponibilidade**: réplica síncrona em outra zona (opção zone-redundant HA nos Flexible Servers) — failover automático.
- **Geo-replicação / failover groups**: réplica em outra região para DR.
- **Migração**: **Azure Database Migration Service** e o *Azure Migrate* movem bancos locais para o Azure com mínimo de downtime.

```bash
az postgres flexible-server backup list -g $RG -n $PG -o table
az postgres flexible-server restore -g $RG -n pg-restaurado --source-server $PG --restore-time "2026-01-01T12:00:00Z"
```

## Práticas

### Prática isolada

1. Crie um PostgreSQL Burstable com acesso público *restrito ao seu IP* (apenas para lab: `--public-access <seu-ip>`), crie a tabela de produtos e insira 3 linhas.
2. Faça um `pg_dump` pelo terminal do WSL e restaure em outro banco:
   ```bash
   pg_dump "host=<fqdn> dbname=catalogo user=trilhaadmin sslmode=require" > catalogo.sql
   psql "host=<fqdn> dbname=catalogo_copia user=trilhaadmin sslmode=require" < catalogo.sql
   ```
3. Crie uma conta Cosmos *serverless*, insira um documento JSON e consulte com SQL (`SELECT * FROM c WHERE c.preco > 50`) pelo Data Explorer do portal.
4. Anote por escrito quando você escolheria um e quando o outro.

**Limpeza:** `az group delete -n rg-lab-banco --yes --no-wait`.

### Contribuição ao projeto integrador

Crie o banco do catálogo do TrilhaShop como PostgreSQL Flexible Server **em `snet-dados`** (acesso privado), schema `produtos`, senha gerada e guardada no Key Vault (`db-senha`), e atualize o segredo `db-connection` do Módulo 05 com a string real. Valide: a API (VM/Container App) conecta; um `psql` da sua máquina, **não**.

`[CUSTO]` Flexible Server Burstable `B1ms` tem camada gratuita por 12 meses em contas novas; fora dela, cobra por hora — **pare o servidor** (`az postgres flexible-server stop`) entre sessões. Cosmos serverless cobra por requisição.

## Erros comuns nesta fase

- Abrir o firewall do banco para `0.0.0.0/0`.
- Escolher partition key com poucos valores no Cosmos DB.
- Deixar a senha no histórico do shell/arquivo versionado.
- Esquecer o `sslmode=require`.
- Confundir Azure SQL Database com Managed Instance na migração.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Private Endpoint/VNet integration | Módulo 06 (rede) |
| Segredos de conexão | Key Vault — Módulo 05 |
| Backup/PITR, HA | Resiliência — Módulo 15 |
| Serviços de dados em outros clouds | AWS (RDS/DynamoDB) e GCP (Cloud SQL/Firestore) |

## `[REFERÊNCIA]`

- Microsoft Learn — *Azure SQL documentation*: https://learn.microsoft.com/azure/azure-sql/
- Microsoft Learn — *PostgreSQL Flexible Server*: https://learn.microsoft.com/azure/postgresql/flexible-server/overview
- Microsoft Learn — *Azure Cosmos DB*: https://learn.microsoft.com/azure/cosmos-db/introduction
- Microsoft Learn — *Consistency levels (Cosmos DB)*: https://learn.microsoft.com/azure/cosmos-db/consistency-levels
- Microsoft Learn — *Choose a data store*: https://learn.microsoft.com/azure/architecture/guide/technology-choices/data-store-decision-tree
- PostgreSQL docs: https://www.postgresql.org/docs/

**Como aprofundar:** a árvore de decisão "Choose a data store" mapeia o tipo de dado ao serviço — refaça-a para os dados do TrilhaShop (catálogo, pedidos, sessão, logs).

## Checklist de saída

- [ ] Explicar quando usar banco gerenciado em vez de banco em VM.
- [ ] Escolher entre Azure SQL DB, Managed Instance, PostgreSQL/MySQL e Cosmos DB.
- [ ] Explicar os níveis de consistência do Cosmos DB e o que é a partition key.
- [ ] Explicar PITR, alta disponibilidade zonal e geo-replicação.
- [ ] Criar um PostgreSQL com acesso privado e conectar a partir de uma VM da VNet.
- [ ] Ter guardado senha e connection string no Key Vault.
