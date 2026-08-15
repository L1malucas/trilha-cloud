---
id: 12_sqlserver-teoria
title: "Módulo 12 — SQL Server"
sidebar_position: 120
---

# Módulo 12 — SQL Server

> **Objetivo:** dominar bancos de dados relacionais com SQL Server — do modelo relacional até
> stored procedures, window functions, views, CTEs e backup — usando um dataset baseado na
> arquitetura de dados da Uber.
> **Pré-requisitos:** Módulo 11 (MongoDB).
> **Tempo de referência:** 6 a 8 horas (apostila extensa, 11 módulos).
> **Prática correspondente:** [12_sqlserver-pratica.md](12_sqlserver-pratica.md)

---

## Por que isso importa

No módulo 11 você viu o MongoDB como uma "pasta flexível de fichas" — schema dinâmico, documentos
aninhados, sem uma estrutura rígida imposta antes de os dados existirem. SQL Server é o oposto
disso: uma "planilha rígida", com colunas fixas e um esquema definido *antes* de qualquer dado
entrar. Essa rigidez não é uma limitação — é o que garante integridade referencial forte (uma
corrida não pode existir sem um motorista válido, um pagamento não pode existir sem uma corrida)
e transações ACID robustas, essenciais para dados financeiros e de auditoria.

## `[TEORIA]` Módulo 1 — Fundamentos de Bancos Relacionais

Bancos de dados relacionais organizam informações em tabelas com linhas e colunas, garantindo
integridade por meio de chaves primárias, chaves estrangeiras e restrições. O SQL Server, da
Microsoft, é um dos SGBDs mais adotados em ambientes corporativos, oferecendo alta
disponibilidade, segurança robusta e integração nativa com o ecossistema Azure.

### SQL vs NoSQL — Quando usar cada um?

| Característica | SQL (SQL Server) | NoSQL (MongoDB) |
|---|---|---|
| Estrutura | Tabelas, linhas e colunas com schema rígido | Coleções e documentos com schema flexível |
| Relacionamentos | JOINs com integridade referencial | Documentos aninhados ou referências manuais |
| Transações | ACID nativo e robusto | Suporte limitado / eventual consistency |
| Escalabilidade | Vertical (scale-up) | Horizontal (scale-out) |
| Consultas | SQL declarativo e padronizado | Query language proprietária |
| Caso Uber | Transações financeiras, auditoria, relatórios | Logs de geolocalização em tempo real |

### Principais tipos de dados no SQL Server

| Tipo | Descrição | Exemplo de uso no dataset Uber |
|---|---|---|
| INT / BIGINT | Inteiros de 32 e 64 bits | corrida_id, usuario_id |
| DECIMAL(p,s) | Número exato com precisão e escala definidas | valor_final DECIMAL(10,2) |
| VARCHAR(n) | Texto variável ASCII, mais leve | email, status, metodo_pagamento |
| NVARCHAR(n) | Texto variável Unicode (UTF-16) para acentos | nome, origem_endereco |
| DATETIME2 | Data e hora com precisão até 100ns | data_solicitacao, data_fim |
| BIT | Booleano (0 ou 1) | motorista_ativo, cidade_ativa |
| TINYINT | Inteiro de 0 a 255 | nota em avaliações |
| CHAR(n) | Texto de tamanho fixo | estado CHAR(2), placa CHAR(8) |
| SMALLINT | Inteiro -32768 a 32767 | ano do veículo |
| UNIQUEIDENTIFIER | GUID de 128 bits | trip_uuid para sistemas distribuídos |

### Conceitos fundamentais de modelagem relacional

Normalização é o processo de organizar as colunas e tabelas para reduzir redundância e melhorar
a integridade. As três primeiras formas normais (1FN, 2FN, 3FN) cobrem a maioria dos cenários de
aplicações transacionais. Em ambientes de BI e DW, a desnormalização controlada (star schema,
snowflake) é preferida para performance de leitura.

| Forma Normal | Regra | Violação clássica |
|---|---|---|
| 1FN | Sem grupos repetidos, cada campo atômico | Coluna 'telefone1,telefone2' em uma string |
| 2FN | Sem dependência parcial da chave primária | Guardar nome do produto em tabela de itens_pedido |
| 3FN | Sem dependência transitiva entre não-chaves | Guardar cidade e estado do CEP na tabela de clientes |

`[REFERÊNCIA]` [Tipos de dados (T-SQL)](https://learn.microsoft.com/pt-br/sql/t-sql/data-types/data-types-transact-sql) · [Comparação SQL Server Editions](https://learn.microsoft.com/pt-br/sql/sql-server/editions-and-components-of-sql-server-2022) · [Guia de normalização de banco de dados](https://learn.microsoft.com/pt-br/office/troubleshoot/access/database-normalization-description)

## `[TEORIA]` Módulo 2 — Instalação e Configuração

### `[CLI]` Instalação via Docker (recomendado para desenvolvimento)

```
# Baixar imagem oficial do SQL Server 2022
docker pull mcr.microsoft.com/mssql/server:2022-latest

# Executar container com variáveis de ambiente
docker run -e 'ACCEPT_EULA=Y' \
  -e 'SA_PASSWORD=UberWorkshop@2024' \
  -p 1433:1433 --name sqlserver \
  -d mcr.microsoft.com/mssql/server:2022-latest

# Verificar status do container
docker ps | grep sqlserver

# Conectar via sqlcmd dentro do container
docker exec -it sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U SA -P 'UberWorkshop@2024'
```

| Aspecto | Instalação Convencional | Docker |
|---|---|---|
| Facilidade | Média — requer configuração do SO | Alta — um comando sobe o ambiente |
| Isolamento | Compartilha recursos do host | Totalmente isolado em container |
| Portabilidade | Baixa — específico do SO | Alta — roda igual em qualquer máquina |
| Reprodutibilidade | Trabalhosa | Total — `docker-compose up` |
| Uso recomendado | Produção on-premise | Desenvolvimento e testes |

### Criação do banco e verificações iniciais

```sql
-- Criar banco de dados com collation explícita
CREATE DATABASE uber_db
COLLATE Latin1_General_CI_AI;
-- CI = Case Insensitive | AI = Accent Insensitive

USE uber_db;

-- Verificar bancos existentes
SELECT name, create_date, collation_name, compatibility_level
FROM sys.databases
ORDER BY create_date DESC;

-- Verificar versão instalada
SELECT @@VERSION;

-- Verificar configurações do banco
SELECT name, value_in_use
FROM sys.configurations
WHERE name IN ('max degree of parallelism',
               'cost threshold for parallelism',
               'max server memory (MB)');
```

`[ATENÇÃO]` Para Windows, baixe o SQL Server Developer Edition gratuitamente em
microsoft.com/sql-server — possui todos os recursos do Enterprise sem custo para uso em
desenvolvimento e testes.

`[REFERÊNCIA]` [Instalação SQL Server no Docker](https://learn.microsoft.com/pt-br/sql/linux/quickstart-install-connect-docker) · [Azure Data Studio (ferramenta gratuita)](https://learn.microsoft.com/pt-br/azure-data-studio/download-azure-data-studio) · [CREATE DATABASE](https://learn.microsoft.com/pt-br/sql/t-sql/statements/create-database-transact-sql)

## `[TEORIA]` Módulo 3 — DDL — Criação da Estrutura de Dados

O dataset simula parte da arquitetura de dados transacionais da Uber: usuários (passageiros),
motoristas, veículos, corridas, pagamentos e avaliações. As tabelas seguem boas práticas de
normalização e uso de constraints para garantir integridade referencial.

### Schema completo — uber_db

```sql
USE uber_db;

-- 1. CIDADES
CREATE TABLE cidades (
    cidade_id INT IDENTITY(1,1) PRIMARY KEY,
    nome NVARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    pais CHAR(3) NOT NULL DEFAULT 'BRA',
    fuso VARCHAR(40) NOT NULL DEFAULT 'America/Sao_Paulo',
    ativa BIT NOT NULL DEFAULT 1
);

-- 2. USUARIOS (passageiros)
CREATE TABLE usuarios (
    usuario_id INT IDENTITY(1,1) PRIMARY KEY,
    nome NVARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    data_cadastro DATETIME2 NOT NULL DEFAULT GETDATE(),
    ativo BIT NOT NULL DEFAULT 1,
    cidade_id INT NOT NULL,
    CONSTRAINT uq_usuario_email UNIQUE (email),
    CONSTRAINT fk_usuario_cidade FOREIGN KEY (cidade_id)
        REFERENCES cidades(cidade_id)
);

-- 3. MOTORISTAS
CREATE TABLE motoristas (
    motorista_id INT IDENTITY(1,1) PRIMARY KEY,
    nome NVARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    cnh VARCHAR(20) NOT NULL,
    data_cadastro DATETIME2 NOT NULL DEFAULT GETDATE(),
    avaliacao_media DECIMAL(3,2) NULL,
    ativo BIT NOT NULL DEFAULT 1,
    cidade_id INT NOT NULL,
    CONSTRAINT uq_motorista_email UNIQUE (email),
    CONSTRAINT uq_motorista_cnh UNIQUE (cnh),
    CONSTRAINT fk_motorista_cidade FOREIGN KEY (cidade_id)
        REFERENCES cidades(cidade_id)
);

-- 4. VEICULOS
CREATE TABLE veiculos (
    veiculo_id INT IDENTITY(1,1) PRIMARY KEY,
    motorista_id INT NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    ano SMALLINT NOT NULL,
    placa CHAR(8) NOT NULL,
    categoria VARCHAR(20) NOT NULL
        CHECK (categoria IN ('UberX','UberBlack','UberComfort','Moto')),
    ativo BIT NOT NULL DEFAULT 1,
    CONSTRAINT uq_veiculo_placa UNIQUE (placa),
    CONSTRAINT fk_veiculo_motorista FOREIGN KEY (motorista_id)
        REFERENCES motoristas(motorista_id)
);

-- 5. CORRIDAS
CREATE TABLE corridas (
    corrida_id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NOT NULL,
    motorista_id INT NOT NULL,
    veiculo_id INT NOT NULL,
    cidade_id INT NOT NULL,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('solicitada','aceita','em_andamento','concluida','cancelada')),
    origem_endereco NVARCHAR(200) NOT NULL,
    destino_endereco NVARCHAR(200) NOT NULL,
    data_solicitacao DATETIME2 NOT NULL DEFAULT GETDATE(),
    data_inicio DATETIME2 NULL,
    data_fim DATETIME2 NULL,
    distancia_km DECIMAL(8,3) NULL,
    duracao_minutos INT NULL,
    valor_base DECIMAL(10,2) NULL,
    valor_final DECIMAL(10,2) NULL,
    surge_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    CONSTRAINT fk_corrida_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id),
    CONSTRAINT fk_corrida_motorista FOREIGN KEY (motorista_id) REFERENCES motoristas(motorista_id),
    CONSTRAINT fk_corrida_veiculo FOREIGN KEY (veiculo_id) REFERENCES veiculos(veiculo_id),
    CONSTRAINT fk_corrida_cidade FOREIGN KEY (cidade_id) REFERENCES cidades(cidade_id)
);

-- 6. PAGAMENTOS
CREATE TABLE pagamentos (
    pagamento_id INT IDENTITY(1,1) PRIMARY KEY,
    corrida_id INT NOT NULL UNIQUE,
    metodo VARCHAR(30) NOT NULL
        CHECK (metodo IN ('credito','debito','pix','carteira_uber')),
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente'
        CHECK (status IN ('pendente','aprovado','recusado','estornado')),
    data_pagamento DATETIME2 NULL,
    CONSTRAINT fk_pagamento_corrida FOREIGN KEY (corrida_id) REFERENCES corridas(corrida_id)
);

-- 7. AVALIACOES
CREATE TABLE avaliacoes (
    avaliacao_id INT IDENTITY(1,1) PRIMARY KEY,
    corrida_id INT NOT NULL,
    avaliador_tipo VARCHAR(10) NOT NULL
        CHECK (avaliador_tipo IN ('usuario','motorista')),
    nota TINYINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario NVARCHAR(500) NULL,
    data_avaliacao DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_avaliacao_corrida FOREIGN KEY (corrida_id) REFERENCES corridas(corrida_id)
);

-- 8. PROMOCOES
CREATE TABLE promocoes (
    promocao_id INT IDENTITY(1,1) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descricao NVARCHAR(200) NOT NULL,
    desconto_pct DECIMAL(5,2) NOT NULL CHECK (desconto_pct BETWEEN 1 AND 100),
    validade DATE NOT NULL,
    uso_maximo INT NOT NULL DEFAULT 1,
    usos_realizados INT NOT NULL DEFAULT 0,
    ativa BIT NOT NULL DEFAULT 1
);
```

### Constraints — Referência rápida

| Constraint | Função | Exemplo no schema |
|---|---|---|
| PRIMARY KEY | Identifica unicamente cada linha | `corrida_id INT IDENTITY PRIMARY KEY` |
| FOREIGN KEY | Garante que o valor existe na tabela pai | `REFERENCES cidades(cidade_id)` |
| UNIQUE | Proíbe duplicatas em uma coluna | `CONSTRAINT uq_usuario_email UNIQUE (email)` |
| CHECK | Valida valor contra uma expressão | `CHECK (nota BETWEEN 1 AND 5)` |
| DEFAULT | Valor automático quando não informado | `data_cadastro DATETIME2 DEFAULT GETDATE()` |
| NOT NULL | Proíbe valores nulos | `nome NVARCHAR(120) NOT NULL` |
| IDENTITY | Auto-incremento gerenciado pelo SQL Server | `INT IDENTITY(1,1)` |

`[REFERÊNCIA]` [CREATE TABLE](https://learn.microsoft.com/pt-br/sql/t-sql/statements/create-table-transact-sql) · [Constraints (PRIMARY KEY, FOREIGN KEY, CHECK)](https://learn.microsoft.com/pt-br/sql/relational-databases/tables/unique-constraints-and-check-constraints) · [ALTER TABLE](https://learn.microsoft.com/pt-br/sql/t-sql/statements/alter-table-transact-sql)

## `[TEORIA]` Módulo 4 — DML — Operações CRUD

### SELECT — Leitura de dados

```sql
USE uber_db;

-- Todas as corridas concluídas
SELECT * FROM corridas WHERE status = 'concluida';

-- TOP 10 corridas mais caras com alias e cálculo
SELECT TOP 10
    corrida_id, valor_final, distancia_km,
    ROUND(valor_final / NULLIF(distancia_km,0), 2) AS preco_por_km
FROM corridas
WHERE status = 'concluida'
ORDER BY valor_final DESC;

-- Paginação com OFFSET FETCH (página 2, 20 registros por página)
SELECT corrida_id, usuario_id, motorista_id, valor_final
FROM corridas
ORDER BY data_solicitacao DESC
OFFSET 20 ROWS FETCH NEXT 20 ROWS ONLY;
```

### INSERT — Inserção eficiente

```sql
-- INSERT simples
INSERT INTO cidades (nome, estado, pais)
VALUES ('Sao Paulo', 'SP', 'BRA');

-- INSERT múltiplo (uma única operação — mais eficiente)
INSERT INTO cidades (nome, estado)
VALUES
    ('Rio de Janeiro', 'RJ'),
    ('Curitiba', 'PR'),
    ('Belo Horizonte', 'MG'),
    ('Porto Alegre', 'RS');

-- INSERT com OUTPUT para capturar ID gerado
DECLARE @ids TABLE (id INT);
INSERT INTO cidades (nome, estado)
OUTPUT INSERTED.cidade_id INTO @ids
VALUES ('Recife', 'PE');
SELECT id FROM @ids;
```

### UPDATE e DELETE com boas práticas

```sql
-- UPDATE seguro: sempre use WHERE específico
UPDATE motoristas SET ativo = 0 WHERE motorista_id = 7;

-- UPDATE com JOIN (recalcular avaliacao_media do motorista)
UPDATE m
SET m.avaliacao_media = sub.media
FROM motoristas m
JOIN (
    SELECT c.motorista_id, AVG(CAST(a.nota AS DECIMAL(3,2))) AS media
    FROM avaliacoes a
    JOIN corridas c ON a.corrida_id = c.corrida_id
    WHERE a.avaliador_tipo = 'usuario'
    GROUP BY c.motorista_id
) sub ON m.motorista_id = sub.motorista_id;

-- Boa prática: SELECT antes do DELETE para revisar o que será removido
SELECT * FROM promocoes
WHERE validade < CAST(GETDATE() AS DATE) AND usos_realizados = 0;

DELETE FROM promocoes
WHERE validade < CAST(GETDATE() AS DATE) AND usos_realizados = 0;
```

`[ATENÇÃO]` Sempre execute um `SELECT` com o mesmo `WHERE` antes de um `UPDATE` ou `DELETE` em
produção. Use `BEGIN TRANSACTION` + `ROLLBACK` para testar modificações sem confirmar
irreversivelmente.

### Operadores de filtragem — Referência

| Operador | Descrição | Exemplo |
|---|---|---|
| `BETWEEN` | Faixa de valores (inclusiva) | `valor_final BETWEEN 20 AND 100` |
| `IN` | Lista de valores aceitos | `status IN ('concluida','cancelada')` |
| `LIKE` | Padrão de texto | `nome LIKE 'Jo%' -- inicia com Jo` |
| `IS NULL` | Campo sem valor | `data_fim IS NULL` |
| `EXISTS` | Subquery retorna ao menos 1 linha | `WHERE EXISTS (SELECT 1 FROM ...)` |
| `NOT IN` | Exclui valores da lista | `metodo NOT IN ('debito','pix')` |
| `AND / OR` | Combinação de condições | `status='concluida' AND cidade_id=1` |

`[REFERÊNCIA]` [SELECT (T-SQL)](https://learn.microsoft.com/pt-br/sql/t-sql/queries/select-transact-sql) · [UPDATE](https://learn.microsoft.com/pt-br/sql/t-sql/queries/update-transact-sql) · [OFFSET FETCH (Paginação)](https://learn.microsoft.com/pt-br/sql/t-sql/queries/select-order-by-clause-transact-sql)

## `[TEORIA]` Módulo 5 — Consultas Avançadas

### JOINs — Tipos e quando usar

| Tipo de JOIN | Retorna | Caso de uso típico |
|---|---|---|
| INNER JOIN | Apenas linhas com correspondência em ambos os lados | Corridas com motorista ativo |
| LEFT JOIN | Todas as linhas da esquerda + correspondências (NULL se sem match) | Usuários com ou sem corridas |
| RIGHT JOIN | Todas as linhas da direita + correspondências | Raramente usado; prefira LEFT JOIN |
| FULL OUTER JOIN | Todas as linhas de ambas as tabelas | Auditoria de dados órfãos |
| CROSS JOIN | Produto cartesiano (todas as combinações) | Tabelas de combinações / gerador de datas |
| SELF JOIN | Tabela juntada com ela mesma | Hierarquias, referências entre linhas da mesma tabela |

`[ATENÇÃO]` Um `JOIN` sem `ON` (ou com a condição errada) vira um `CROSS JOIN` acidental —
produto cartesiano, multiplicando o número de linhas do resultado de forma explosiva. Sempre
confira a condição de junção antes de rodar em uma tabela grande.

### Exemplo: detalhamento completo de uma corrida

```sql
SELECT
    c.corrida_id,
    u.nome AS passageiro,
    m.nome AS motorista,
    m.avaliacao_media,
    CONCAT(v.marca,' ',v.modelo) AS veiculo,
    v.categoria,
    ci.nome AS cidade,
    c.origem_endereco, c.destino_endereco,
    c.distancia_km, c.valor_final, c.surge_multiplier,
    p.metodo AS forma_pagamento, p.status AS status_pagamento,
    DATEDIFF(MINUTE, c.data_inicio, c.data_fim) AS duracao_real_min
FROM corridas c
INNER JOIN usuarios u ON c.usuario_id = u.usuario_id
INNER JOIN motoristas m ON c.motorista_id = m.motorista_id
INNER JOIN veiculos v ON c.veiculo_id = v.veiculo_id
INNER JOIN cidades ci ON c.cidade_id = ci.cidade_id
LEFT JOIN pagamentos p ON c.corrida_id = p.corrida_id
WHERE c.status = 'concluida'
ORDER BY c.data_fim DESC;
```

### Subqueries e CASE WHEN

```sql
-- Subquery no WHERE: motoristas com média abaixo de 4
SELECT motorista_id, nome, avaliacao_media
FROM motoristas
WHERE motorista_id IN (
    SELECT c.motorista_id
    FROM avaliacoes a
    JOIN corridas c ON a.corrida_id = c.corrida_id
    WHERE a.avaliador_tipo = 'usuario'
    GROUP BY c.motorista_id
    HAVING AVG(CAST(a.nota AS FLOAT)) < 4.0
);

-- CASE WHEN: classificar corridas por distância
SELECT corrida_id, distancia_km,
    CASE
        WHEN distancia_km < 5 THEN 'Curta'
        WHEN distancia_km < 20 THEN 'Media'
        ELSE 'Longa'
    END AS classificacao
FROM corridas WHERE status = 'concluida';
```

### Funções nativas mais utilizadas

| Categoria | Função | Exemplo prático |
|---|---|---|
| Data/Hora | `DATEDIFF(unit, d1, d2)` | `DATEDIFF(MINUTE, data_inicio, data_fim)` |
| Data/Hora | `DATEADD(unit, n, date)` | `DATEADD(DAY, -30, GETDATE())` |
| Data/Hora | `FORMAT(date, pattern)` | `FORMAT(data_inicio, 'dd/MM/yyyy HH:mm')` |
| Data/Hora | `DATEPART(part, date)` | `DATEPART(HOUR, data_solicitacao)` |
| Texto | `LEN / DATALENGTH` | `LEN(comentario)` |
| Texto | `CONCAT(a, b, ...)` | `CONCAT(m.marca,' ',m.modelo)` |
| Texto | `TRIM / UPPER / LOWER` | `TRIM(email)` |
| Numérico | `ROUND(n, decimals)` | `ROUND(valor_final, 2)` |
| Numérico | `NULLIF(a, b)` | `NULLIF(distancia_km, 0)` — evita divisão por zero |
| Nulidade | `ISNULL(col, default)` | `ISNULL(comentario, 'Sem comentario')` |
| Nulidade | `COALESCE(a, b, c)` | `COALESCE(data_fim, GETDATE())` |

`[REFERÊNCIA]` [JOINs e performance](https://learn.microsoft.com/pt-br/sql/relational-databases/performance/joins) · [Funções de data e hora](https://learn.microsoft.com/pt-br/sql/t-sql/functions/date-and-time-data-types-and-functions-transact-sql) · [Subqueries](https://learn.microsoft.com/pt-br/sql/relational-databases/performance/subqueries)

## `[TEORIA]` Módulo 6 — Índices e Performance

Índices são estruturas de disco que permitem ao SQL Server localizar linhas sem varrer toda a
tabela. Um índice errado pode piorar a performance de escritas; um índice bem projetado pode
reduzir leituras de centenas de milhares de páginas para dezenas.

### Tipos de índice

| Tipo | Estrutura | Quando usar |
|---|---|---|
| Clustered Index | Define a ordem física dos dados (1 por tabela) | Coluna usada em range scans e ORDER BY — geralmente a PK |
| Non-Clustered Index | Estrutura separada com ponteiro para a linha | Colunas em WHERE, JOIN e ORDER BY de queries frequentes |
| Índice Composto | Múltiplas colunas no mesmo índice | Queries que filtram por 2+ colunas juntas |
| Índice com INCLUDE | Colunas extras na folha do índice | Evita Key Lookup — covering index |
| Índice Único | Garante unicidade + performance de busca | email, CPF, placa |
| Índice Filtrado | Índice parcial com cláusula WHERE | Indexar apenas registros ativos ou por status específico |

### Criando índices estratégicos para o dataset Uber

```sql
-- Índice para busca de corridas por usuário e data (query mais frequente)
CREATE NONCLUSTERED INDEX IX_corridas_usuario_data
ON corridas (usuario_id, data_solicitacao DESC)
INCLUDE (status, valor_final, motorista_id);

-- Índice para dashboard: corridas por cidade e status
CREATE NONCLUSTERED INDEX IX_corridas_cidade_status
ON corridas (cidade_id, status)
INCLUDE (valor_final, data_solicitacao);

-- Índice filtrado: apenas corridas ativas (aceita / em_andamento)
CREATE NONCLUSTERED INDEX IX_corridas_ativas
ON corridas (motorista_id, data_solicitacao)
WHERE status IN ('aceita', 'em_andamento');

-- Listar todos os índices de uma tabela
SELECT name, type_desc, is_unique, is_primary_key, filter_definition
FROM sys.indexes
WHERE object_id = OBJECT_ID('corridas');
```

### Analisando performance com Execution Plan e STATISTICS IO

```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Execução SEM índice adequado (observe Table Scan ou Index Scan no plano)
SELECT * FROM corridas WHERE status = 'concluida' AND cidade_id = 1;

-- Criar índice e executar novamente
CREATE NONCLUSTERED INDEX IX_corridas_status_cidade
ON corridas (status, cidade_id);

SELECT * FROM corridas WHERE status = 'concluida' AND cidade_id = 1;
-- Compare os 'logical reads' antes e depois

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;

-- Identificar índices não utilizados (candidatos a remoção)
SELECT OBJECT_NAME(i.object_id) AS tabela, i.name AS indice,
    s.user_seeks, s.user_scans, s.user_lookups, s.user_updates
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s
    ON i.object_id = s.object_id AND i.index_id = s.index_id
WHERE OBJECT_NAME(i.object_id) = 'corridas'
ORDER BY ISNULL(s.user_seeks,0) DESC;
```

`[ATENÇÃO]` No Azure Data Studio ou SSMS, pressione `Ctrl+M` (Include Actual Execution Plan)
antes de executar para visualizar graficamente o custo de cada operação. Procure por "Table Scan"
e "Key Lookup" — ambos indicam oportunidades de otimização com índices.

`[REFERÊNCIA]` [Guia de design de índices](https://learn.microsoft.com/pt-br/sql/relational-databases/sql-server-index-design-guide) · [sys.dm_db_index_usage_stats](https://learn.microsoft.com/pt-br/sql/relational-databases/system-dynamic-management-views/sys-dm-db-index-usage-stats-transact-sql)

## `[TEORIA]` Módulo 7 — Stored Procedures, Funções e Transactions

### Stored Procedure com TRY/CATCH e controle transacional

```sql
CREATE OR ALTER PROCEDURE sp_iniciar_corrida
    @usuario_id INT, @motorista_id INT, @veiculo_id INT,
    @cidade_id INT, @origem NVARCHAR(200), @destino NVARCHAR(200),
    @nova_corrida_id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validar motorista ativo
        IF NOT EXISTS (SELECT 1 FROM motoristas WHERE motorista_id = @motorista_id AND ativo = 1)
            THROW 50001, 'Motorista inativo ou nao encontrado.', 1;

        -- Validar veículo associado
        IF NOT EXISTS (
            SELECT 1 FROM veiculos
            WHERE veiculo_id = @veiculo_id AND motorista_id = @motorista_id AND ativo = 1)
            THROW 50002, 'Veiculo nao associado ao motorista.', 1;

        -- Inserir corrida
        INSERT INTO corridas (usuario_id, motorista_id, veiculo_id, cidade_id,
            status, origem_endereco, destino_endereco)
        VALUES (@usuario_id, @motorista_id, @veiculo_id, @cidade_id,
            'aceita', @origem, @destino);

        SET @nova_corrida_id = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW; -- Re-lança o erro para o chamador
    END CATCH
END;

-- Executar a SP com parâmetro de saída
DECLARE @id INT;
EXEC sp_iniciar_corrida
    @usuario_id = 1, @motorista_id = 3, @veiculo_id = 3,
    @cidade_id = 1, @origem = 'Av. Paulista, 1000',
    @destino = 'Aeroporto de Congonhas',
    @nova_corrida_id = @id OUTPUT;
SELECT @id AS corrida_criada;
```

### Funções escalares e de tabela (TVF)

```sql
-- Função escalar: calcular valor com surge
CREATE OR ALTER FUNCTION fn_valor_com_surge
    (@valor_base DECIMAL(10,2), @surge DECIMAL(4,2))
RETURNS DECIMAL(10,2)
AS
BEGIN
    RETURN ROUND(@valor_base * @surge, 2);
END;

-- Uso em SELECT
SELECT corrida_id,
    dbo.fn_valor_com_surge(valor_base, surge_multiplier) AS valor_cobrado
FROM corridas WHERE status = 'concluida';

-- Table-Valued Function: histórico de corridas de um usuário
CREATE OR ALTER FUNCTION fn_historico_usuario (@usuario_id INT)
RETURNS TABLE AS RETURN (
    SELECT c.corrida_id, c.data_solicitacao, c.status,
        m.nome AS motorista, v.modelo, v.categoria,
        c.valor_final, p.metodo AS pagamento
    FROM corridas c
    JOIN motoristas m ON c.motorista_id = m.motorista_id
    JOIN veiculos v ON c.veiculo_id = v.veiculo_id
    LEFT JOIN pagamentos p ON c.corrida_id = p.corrida_id
    WHERE c.usuario_id = @usuario_id
);

-- TVF usada como tabela
SELECT * FROM dbo.fn_historico_usuario(5)
ORDER BY data_solicitacao DESC;
```

`[REFERÊNCIA]` [CREATE PROCEDURE](https://learn.microsoft.com/pt-br/sql/t-sql/statements/create-procedure-transact-sql) · [TRY...CATCH e THROW](https://learn.microsoft.com/pt-br/sql/t-sql/language-elements/try-catch-transact-sql) · [CREATE FUNCTION](https://learn.microsoft.com/pt-br/sql/t-sql/statements/create-function-transact-sql) · [Transações (BEGIN/COMMIT/ROLLBACK)](https://learn.microsoft.com/pt-br/sql/t-sql/language-elements/transactions-transact-sql)

## `[TEORIA]` Módulo 8 — Aggregations e Window Functions

### GROUP BY, HAVING e funções de agregação

```sql
-- Receita e ticket médio por cidade e mês
SELECT
    ci.nome AS cidade, YEAR(c.data_fim) AS ano, MONTH(c.data_fim) AS mes,
    COUNT(*) AS total_corridas, SUM(c.valor_final) AS receita_total,
    AVG(c.valor_final) AS ticket_medio, MAX(c.valor_final) AS corrida_mais_cara,
    COUNT(DISTINCT c.motorista_id) AS motoristas_ativos
FROM corridas c
JOIN cidades ci ON c.cidade_id = ci.cidade_id
WHERE c.status = 'concluida'
GROUP BY ci.nome, YEAR(c.data_fim), MONTH(c.data_fim)
HAVING SUM(c.valor_final) > 1000
ORDER BY ano DESC, mes DESC, receita_total DESC;

-- ROLLUP: subtotais por cidade + total geral
SELECT
    ISNULL(ci.nome, '** TOTAL GERAL **') AS cidade,
    COUNT(*) AS total_corridas, SUM(c.valor_final) AS receita
FROM corridas c
JOIN cidades ci ON c.cidade_id = ci.cidade_id
WHERE c.status = 'concluida'
GROUP BY ROLLUP(ci.nome);
```

### Window Functions — analisar sem perder detalhes de linha

```sql
-- RANK: motoristas por receita dentro de cada cidade
SELECT
    ci.nome AS cidade, m.nome AS motorista, SUM(c.valor_final) AS receita,
    RANK() OVER (PARTITION BY ci.nome ORDER BY SUM(c.valor_final) DESC) AS rank_cidade,
    ROW_NUMBER() OVER (PARTITION BY ci.nome ORDER BY SUM(c.valor_final) DESC) AS row_num
FROM corridas c
JOIN motoristas m ON c.motorista_id = m.motorista_id
JOIN cidades ci ON c.cidade_id = ci.cidade_id
WHERE c.status = 'concluida'
GROUP BY ci.nome, m.nome, m.motorista_id;

-- LAG e LEAD: comparar corrida atual com anterior do mesmo usuário
SELECT
    usuario_id, corrida_id, data_solicitacao, valor_final,
    LAG(valor_final) OVER (PARTITION BY usuario_id ORDER BY data_solicitacao) AS corrida_anterior,
    LEAD(valor_final) OVER (PARTITION BY usuario_id ORDER BY data_solicitacao) AS proxima_corrida
FROM corridas WHERE status = 'concluida';

-- Running total de receita por data
SELECT
    CAST(data_fim AS DATE) AS data, SUM(valor_final) AS receita_dia,
    SUM(SUM(valor_final)) OVER (ORDER BY CAST(data_fim AS DATE)) AS receita_acumulada
FROM corridas WHERE status = 'concluida'
GROUP BY CAST(data_fim AS DATE)
ORDER BY data;
```

| Window Function | Comportamento | Diferença chave |
|---|---|---|
| ROW_NUMBER() | Número sequencial único por janela | Nunca repete, mesmo com empates |
| RANK() | Mesmo número para empates, pula o próximo | 1, 1, 3 (pula o 2) |
| DENSE_RANK() | Mesmo número para empates, não pula | 1, 1, 2 (não pula) |
| LAG(col, n) | Valor da linha N posições antes | Acessa linha anterior na mesma janela |
| LEAD(col, n) | Valor da linha N posições adiante | Acessa próxima linha na mesma janela |
| SUM() OVER | Soma acumulada ou por partição | Não colapsa linhas como GROUP BY |

`[REFERÊNCIA]` [Window Functions (cláusula OVER)](https://learn.microsoft.com/pt-br/sql/t-sql/queries/select-over-clause-transact-sql) · [GROUP BY com ROLLUP, CUBE, GROUPING SETS](https://learn.microsoft.com/pt-br/sql/t-sql/queries/select-group-by-transact-sql)

## `[TEORIA]` Módulo 9 — Views, CTEs e Queries Avançadas

### Views — encapsulando consultas complexas

```sql
CREATE OR ALTER VIEW vw_corridas_completas AS
SELECT
    c.corrida_id, u.nome AS passageiro, u.email AS email_passageiro,
    m.nome AS motorista, m.avaliacao_media, v.categoria,
    CONCAT(v.marca,' ',v.modelo) AS veiculo, ci.nome AS cidade,
    c.status, c.origem_endereco, c.destino_endereco,
    c.distancia_km, c.valor_final, c.surge_multiplier,
    p.metodo AS pagamento, p.status AS status_pgto,
    DATEDIFF(MINUTE, c.data_inicio, c.data_fim) AS duracao_min
FROM corridas c
JOIN usuarios u ON c.usuario_id = u.usuario_id
JOIN motoristas m ON c.motorista_id = m.motorista_id
JOIN veiculos v ON c.veiculo_id = v.veiculo_id
JOIN cidades ci ON c.cidade_id = ci.cidade_id
LEFT JOIN pagamentos p ON c.corrida_id = p.corrida_id;

-- Usar a view como tabela
SELECT cidade, categoria, AVG(valor_final) AS ticket_medio
FROM vw_corridas_completas
WHERE status = 'concluida'
GROUP BY cidade, categoria;
```

### CTEs — Common Table Expressions

```sql
-- CTE múltipla: top 3 motoristas por cidade
WITH cte_receita AS (
    SELECT c.motorista_id, c.cidade_id,
        SUM(c.valor_final) AS receita_total, COUNT(*) AS total_corridas
    FROM corridas c WHERE c.status = 'concluida'
    GROUP BY c.motorista_id, c.cidade_id
),
cte_ranking AS (
    SELECT *, RANK() OVER (PARTITION BY cidade_id ORDER BY receita_total DESC) AS rank
    FROM cte_receita
)
SELECT m.nome, ci.nome AS cidade, r.receita_total, r.total_corridas, r.rank
FROM cte_ranking r
JOIN motoristas m ON r.motorista_id = m.motorista_id
JOIN cidades ci ON r.cidade_id = ci.cidade_id
WHERE r.rank <= 3
ORDER BY ci.nome, r.rank;
```

### MERGE e PIVOT

```sql
-- MERGE: atualizar avaliacao_media de todos os motoristas
MERGE motoristas AS alvo
USING (
    SELECT c.motorista_id, AVG(CAST(a.nota AS DECIMAL(3,2))) AS nova_media
    FROM avaliacoes a
    JOIN corridas c ON a.corrida_id = c.corrida_id
    WHERE a.avaliador_tipo = 'usuario'
    GROUP BY c.motorista_id
) AS origem ON (alvo.motorista_id = origem.motorista_id)
WHEN MATCHED THEN
    UPDATE SET alvo.avaliacao_media = origem.nova_media;

-- PIVOT: corridas por cidade x categoria de veículo
SELECT cidade_id, UberX, UberBlack, UberComfort, Moto
FROM (
    SELECT c.cidade_id, v.categoria
    FROM corridas c
    JOIN veiculos v ON c.veiculo_id = v.veiculo_id
    WHERE c.status = 'concluida'
) AS dados
PIVOT (
    COUNT(categoria)
    FOR categoria IN ([UberX],[UberBlack],[UberComfort],[Moto])
) AS pvt;
```

`[REFERÊNCIA]` [WITH (CTE)](https://learn.microsoft.com/pt-br/sql/t-sql/queries/with-common-table-expression-transact-sql) · [MERGE](https://learn.microsoft.com/pt-br/sql/t-sql/statements/merge-transact-sql) · [PIVOT e UNPIVOT](https://learn.microsoft.com/pt-br/sql/t-sql/queries/from-using-pivot-and-unpivot)

## `[TEORIA]` Módulo 10 — Exportação, Backup e Automação

### Exportação com BCP e BULK INSERT

```sql
-- Exportar tabela corridas para CSV (terminal)
bcp uber_db.dbo.corridas out C:\exports\corridas.csv \
    -c -t',' -r'\n' -S localhost -U sa -P UberWorkshop@2024

-- Exportar resultado de query customizada
bcp "SELECT c.corrida_id, u.nome, c.valor_final
     FROM uber_db.dbo.corridas c
     JOIN uber_db.dbo.usuarios u ON c.usuario_id = u.usuario_id
     WHERE c.status = 'concluida'"
    queryout C:\exports\relatorio.csv \
    -c -t',' -S localhost -U sa -P UberWorkshop@2024

-- Importar CSV com BULK INSERT (T-SQL)
BULK INSERT uber_db.dbo.corridas
FROM 'C:\dados\corridas_importacao.csv'
WITH (
    FIELDTERMINATOR = ',', ROWTERMINATOR = '\n',
    FIRSTROW = 2, TABLOCK
);
```

### Backup e Restore — Estratégia 3-2-1

```sql
-- Backup FULL (base de toda a estratégia)
BACKUP DATABASE uber_db
TO DISK = 'C:\backups\uber_db_full.bak'
WITH FORMAT, INIT, COMPRESSION,
    NAME = 'uber_db - Full Backup', STATS = 10;

-- Backup DIFERENCIAL (somente mudanças desde o último full)
BACKUP DATABASE uber_db
TO DISK = 'C:\backups\uber_db_diff.bak'
WITH DIFFERENTIAL, NAME = 'uber_db - Differential';

-- Backup de LOG DE TRANSACOES
BACKUP LOG uber_db TO DISK = 'C:\backups\uber_db_log.trn';

-- Verificar integridade antes de restaurar
RESTORE VERIFYONLY FROM DISK = 'C:\backups\uber_db_full.bak';

-- Restaurar em novo banco (com remapeamento de arquivos)
RESTORE DATABASE uber_db_restore
FROM DISK = 'C:\backups\uber_db_full.bak'
WITH MOVE 'uber_db' TO 'C:\data\uber_restore.mdf',
    MOVE 'uber_db_log' TO 'C:\data\uber_restore.ldf',
    REPLACE, STATS = 5;
```

| Tipo de Backup | O que captura | Frequência típica | RPO resultante |
|---|---|---|---|
| FULL | Todo o banco | Semanal | 7 dias |
| DIFFERENTIAL | Mudanças desde o último FULL | Diário | 1 dia |
| LOG | Transações desde o último LOG | A cada 15-60 min | Minutos |

`[REFERÊNCIA]` [BACKUP DATABASE](https://learn.microsoft.com/pt-br/sql/t-sql/statements/backup-transact-sql) · [BCP Utility](https://learn.microsoft.com/pt-br/sql/tools/bcp-utility) · [BULK INSERT](https://learn.microsoft.com/pt-br/sql/t-sql/statements/bulk-insert-transact-sql)

## `[TEORIA]` Módulo 11 — SQL Server com Docker

### docker-compose.yml completo com SQL Server + Adminer

```yaml
# docker-compose.yml
version: '3.8'
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: uber_sqlserver
    env_file: .env
    environment:
      ACCEPT_EULA: 'Y'
      MSSQL_PID: 'Developer'
    ports:
      - '1433:1433'
    volumes:
      - sqlserver_data:/var/opt/mssql
      - ./scripts:/scripts
    networks:
      - uber_net
    healthcheck:
      test: /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P $SA_PASSWORD -Q 'SELECT 1' || exit 1
      interval: 30s
      timeout: 10s
      retries: 5
  adminer:
    image: adminer:latest
    container_name: uber_adminer
    depends_on:
      sqlserver:
        condition: service_healthy
    ports:
      - '8080:8080'
    networks:
      - uber_net
volumes:
  sqlserver_data:
networks:
  uber_net:
    driver: bridge
```

### Arquivo .env e inicialização automática

```
# .env (NUNCA commite este arquivo no git)
SA_PASSWORD=UberWorkshop@2024
```

```
# Subir o ambiente
docker-compose up -d

# Executar scripts SQL dentro do container
docker exec uber_sqlserver /opt/mssql-tools/bin/sqlcmd \
    -S localhost -U SA -P UberWorkshop@2024 \
    -i /scripts/01_create_schema.sql

docker exec uber_sqlserver /opt/mssql-tools/bin/sqlcmd \
    -S localhost -U SA -P UberWorkshop@2024 \
    -i /scripts/02_seed_data.sql
```

String de conexão por linguagem:
```
# Python (pyodbc):
# 'DRIVER={ODBC Driver 18};SERVER=localhost,1433;DATABASE=uber_db;
#  UID=SA;PWD=UberWorkshop@2024;TrustServerCertificate=yes'

# Node.js (mssql):
# { server:'localhost', port:1433, database:'uber_db',
#   authentication:{type:'default', options:{userName:'SA',
#   password:'UberWorkshop@2024'}} }

# .NET / C#:
# Server=localhost,1433;Database=uber_db;User Id=SA;
# Password=UberWorkshop@2024;TrustServerCertificate=True;
```

`[ATENÇÃO]` Organize seus scripts em uma pasta `./scripts/` numerada:
`01_create_schema.sql`, `02_seed_data.sql`, `03_indexes.sql`, `04_procedures.sql`. Isso permite
reconstruir o ambiente completo com um único `docker-compose up`.

`[REFERÊNCIA]` [SQL Server no Docker (Linux)](https://learn.microsoft.com/pt-br/sql/linux/sql-server-linux-docker-container-deployment) · [Imagem oficial mcr.microsoft.com/mssql/server](https://mcr.microsoft.com/en-us/product/mssql/server/about)

## Erros comuns

- Rodar `UPDATE`/`DELETE` sem `WHERE` (ou com `WHERE` errado) — sempre valide com `SELECT`
  primeiro, e use transação pra poder dar `ROLLBACK`.
- Esquecer o `ON` em um `JOIN`, gerando produto cartesiano acidental.
- Criar índice em toda coluna "por garantia" — cada índice extra piora a performance de escrita;
  índice deve responder a uma consulta real e frequente.
- Confundir `NOT IN` com `NOT EXISTS` quando a subquery pode retornar `NULL` — `NOT IN` com
  `NULL` na lista nunca retorna nada (armadilha clássica).

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Modelo relacional x documento (módulo 11) | Contraste permanente ao longo da trilha de bancos de dados |
| Stored Procedures / Transactions | Módulo 13 — ao integrar backend (Node.js) com banco de dados |
| Docker Compose | Reaparece em qualquer ambiente de desenvolvimento containerizado |

## `[REFERÊNCIA]`

- [Portal principal da documentação T-SQL](https://learn.microsoft.com/pt-br/sql/t-sql/language-reference)
- [Tipos de dados](https://learn.microsoft.com/pt-br/sql/t-sql/data-types/data-types-transact-sql)
- [CREATE TABLE + Constraints](https://learn.microsoft.com/pt-br/sql/t-sql/statements/create-table-transact-sql)
- [SELECT completo](https://learn.microsoft.com/pt-br/sql/t-sql/queries/select-transact-sql)
- [JOINs e performance](https://learn.microsoft.com/pt-br/sql/relational-databases/performance/joins)
- [Window Functions (OVER)](https://learn.microsoft.com/pt-br/sql/t-sql/queries/select-over-clause-transact-sql)
- [WITH CTE](https://learn.microsoft.com/pt-br/sql/t-sql/queries/with-common-table-expression-transact-sql)
- [MERGE (Upsert)](https://learn.microsoft.com/pt-br/sql/t-sql/statements/merge-transact-sql)
- [CREATE PROCEDURE](https://learn.microsoft.com/pt-br/sql/t-sql/statements/create-procedure-transact-sql)
- [BACKUP DATABASE](https://learn.microsoft.com/pt-br/sql/t-sql/statements/backup-transact-sql)
- [SQL Server no Docker](https://learn.microsoft.com/pt-br/sql/linux/sql-server-linux-docker-container-deployment)
- Leitura complementar (referência de sintaxe genérica, não específica de SQL Server):
  `SQL-Cheat-Sheet.md`, já presente em `trila-jovens-aprendiz/`.

## Checklist de saída

- [ ] Sei diferenciar SQL de NoSQL e explicar quando cada um se aplica melhor.
- [ ] Escrevo `CREATE TABLE` com PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK e DEFAULT.
- [ ] Executo `SELECT`/`INSERT`/`UPDATE`/`DELETE` com segurança (SELECT antes de UPDATE/DELETE).
- [ ] Escrevo os 6 tipos de JOIN e sei quando cada um se aplica.
- [ ] Crio índices non-clustered, compostos e filtrados, e leio um Execution Plan básico.
- [ ] Escrevo uma Stored Procedure com TRY/CATCH e controle transacional.
- [ ] Uso Window Functions (`ROW_NUMBER`, `RANK`, `LAG`/`LEAD`, `SUM() OVER`).
- [ ] Crio Views e CTEs (inclusive múltiplas) para organizar consultas complexas.
- [ ] Sei fazer backup FULL/DIFFERENTIAL/LOG e explicar RPO de cada um.
- [ ] Subo um ambiente SQL Server completo via Docker Compose.
