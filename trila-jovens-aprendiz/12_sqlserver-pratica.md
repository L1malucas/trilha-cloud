# Módulo 12 — SQL Server — Prática

> **Objetivo da prática:** consolidar os conceitos do módulo com 26 tarefas progressivas, usando
> um dataset próprio (rede social profissional `linkedin_db`) — diferente do dataset de ensino
> (`uber_db`), forçando você a aplicar os conceitos num contexto novo, sem copiar consultas do
> material de aula.
> **Pré-requisito:** [12_sqlserver-teoria.md](12_sqlserver-teoria.md)
> **Entregáveis:** um arquivo `.sql` por tarefa (ou por bloco de tarefas relacionadas), com a
> descrição como comentário SQL (`-- descrição`) seguida da query/resposta.
> **Formato de entrega:** publicado no GitHub, com README bem organizado.

---

## Como usar esta apostila

Esta apostila contém 26 tarefas práticas para consolidar os conceitos do módulo. As tarefas
utilizam um dataset próprio — a rede social profissional LinkedIn — completamente diferente do
dataset de ensino (Uber). Resolva as tarefas em ordem: cada grupo prepara o terreno para o
seguinte.

| Nível | Tarefas | Conceitos cobertos |
|---|---|---|
| Básico | 1 a 8 | DDL, DML, SELECT, filtros, paginação, JOINs simples |
| Intermediário | 9 a 16 | JOINs complexos, subqueries, CASE WHEN, índices, SPs, funções |
| Avançado | 17 a 22 | Window Functions, ROLLUP, CTEs, Views, MERGE, PIVOT |
| Projeto Final | 23 a 26 | Integração de todos os módulos, relatórios, otimização, Docker |

## Schema do banco `linkedin_db` — Diagrama Relacional (descrito em tabela)

Não há DDL pronto — você deve escrever cada `CREATE TABLE` a partir desta descrição. Comece pelas
tabelas sem FK (`setores`, `habilidades`) e avance para as dependentes, respeitando a ordem:
(1) setores, (2) habilidades, (3) empresas, (4) usuarios, (5) usuario_habilidades,
(6) experiencias, (7) conexoes, (8) vagas, (9) candidaturas, (10) posts, (11) curtidas,
(12) comentarios.

**Entidades de perfil:**

| Tabela | Colunas | Observações |
|---|---|---|
| `setores` | `setor_id` PK AUTO, `nome` NVARCHAR(100) NOT NULL | |
| `habilidades` | `habilidade_id` PK AUTO, `nome` NVARCHAR(100) NOT NULL, `categoria` VARCHAR(20) NOT NULL | |
| `empresas` | `empresa_id` PK AUTO, `nome` NVARCHAR(200) NOT NULL, `setor_id` FK→setores NOT NULL, `tamanho` VARCHAR(20) NOT NULL, `cidade` NVARCHAR(100) NOT NULL, `pais` CHAR(3) DEFAULT 'BRA', `fundada_em` SMALLINT nullable, `site` VARCHAR(200) nullable, `ativa` BIT DEFAULT 1 | |
| `usuarios` | `usuario_id` PK AUTO, `nome` NVARCHAR(120) NOT NULL, `email` VARCHAR(180) NOT NULL UNIQUE, `titulo_perfil` NVARCHAR(220) nullable, `cidade` NVARCHAR(100) nullable, `pais` CHAR(3) DEFAULT 'BRA', `data_cadastro` DATETIME2 DEFAULT GETDATE(), `premium` BIT DEFAULT 0, `ativo` BIT DEFAULT 1 | |
| `usuario_habilidades` | `usuario_id` FK→usuarios (PK composta), `habilidade_id` FK→habilidades (PK composta), `nivel` VARCHAR(20) NOT NULL | N:N via tabela pivot |
| `experiencias` | `exp_id` PK AUTO, `usuario_id` FK→usuarios NOT NULL, `empresa_id` FK→empresas nullable, `cargo` NVARCHAR(150) NOT NULL, `data_inicio` DATE NOT NULL, `data_fim` DATE nullable, `descricao` NVARCHAR(1000) nullable | |
| `conexoes` | `conexao_id` PK AUTO, `usuario_origem` FK→usuarios NOT NULL, `usuario_destino` FK→usuarios NOT NULL, `status` VARCHAR(15) NOT NULL, `data_solicitacao` DATETIME2 DEFAULT GETDATE(), `data_resposta` DATETIME2 nullable | Auto-relacionamento N:N reflexivo |

**Entidades de engajamento:**

| Tabela | Colunas | Observações |
|---|---|---|
| `vagas` | `vaga_id` PK AUTO, `empresa_id` FK→empresas NOT NULL, `titulo` NVARCHAR(200) NOT NULL, `descricao` NVARCHAR(MAX) nullable, `cidade` NVARCHAR(100) NOT NULL, `modalidade` VARCHAR(20) NOT NULL, `nivel` VARCHAR(20) NOT NULL, `salario_min` DECIMAL(10,2) nullable, `salario_max` DECIMAL(10,2) nullable, `data_publicacao` DATETIME2 DEFAULT GETDATE(), `data_expiracao` DATE nullable, `ativa` BIT DEFAULT 1 | |
| `candidaturas` | `candidatura_id` PK AUTO, `usuario_id` FK→usuarios NOT NULL, `vaga_id` FK→vagas NOT NULL, `status` VARCHAR(25) DEFAULT 'enviada', `data_candidatura` DATETIME2 DEFAULT GETDATE(), `data_atualizacao` DATETIME2 nullable, `carta_apresentacao` NVARCHAR(2000) nullable | |
| `posts` | `post_id` PK AUTO, `usuario_id` FK→usuarios NOT NULL, `conteudo` NVARCHAR(3000) NOT NULL, `tipo` VARCHAR(20) DEFAULT 'texto', `data_publicacao` DATETIME2 DEFAULT GETDATE(), `visualizacoes` INT DEFAULT 0, `ativo` BIT DEFAULT 1 | |
| `curtidas` | `curtida_id` PK AUTO, `post_id` FK→posts NOT NULL, `usuario_id` FK→usuarios NOT NULL, `reacao` VARCHAR(15) DEFAULT 'curtir', `data_curtida` DATETIME2 DEFAULT GETDATE() | |
| `comentarios` | `comentario_id` PK AUTO, `post_id` FK→posts NOT NULL, `usuario_id` FK→usuarios NOT NULL, `conteudo` NVARCHAR(1000) NOT NULL, `data_comentario` DATETIME2 DEFAULT GETDATE() | |

`[ATENÇÃO]` `conexoes` tem duas FKs para `usuarios` (`usuario_origem` e `usuario_destino`) —
auto-relacionamento, cuidado ao escrever a constraint (dois `FOREIGN KEY` distintos apontando
pra mesma tabela pai).

---

## Seção 1 — Básico (Tarefas 1 a 8 | Módulos 1 a 4)

### 01 — Criação do Schema a partir do Diagrama
*Módulo de referência: Módulo 3 — DDL*

Contexto: usando apenas o diagrama acima (sem DDL pronto), crie o banco e todas as tabelas com
suas constraints.
1. Crie o banco `linkedin_db` com collation `Latin1_General_CI_AI`.
2. Escreva e execute os 12 comandos `CREATE TABLE` na ordem correta (respeite as dependências
   de FK).
3. Implemente TODAS as constraints visíveis no diagrama: `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`,
   `CHECK`, `DEFAULT` e `NOT NULL`.
4. Adicione a coluna `linkedin_url VARCHAR(200) UNIQUE` na tabela `usuarios` via `ALTER TABLE`.
5. Crie a tabela `mensagens` (`mensagem_id` PK IDENTITY, `remetente_id` FK, `destinatario_id` FK,
   `conteudo NVARCHAR(1000)`, `data_envio DATETIME2`, `lida BIT DEFAULT 0`) — não está no
   diagrama, projete você mesmo.
6. Verifique com `SELECT * FROM INFORMATION_SCHEMA.TABLES` e `INFORMATION_SCHEMA.COLUMNS`.

**Critérios de aceite:** todas as 13 tabelas criadas sem erros de FK ou constraint · tentativa de
inserir email duplicado em `usuarios` gera erro de UNIQUE · tentativa de inserir status inválido
em `conexoes` gera erro de CHECK.

### 02 — Inserção do Dataset Base
*Módulo de referência: Módulo 3 — DDL / Módulo 4 — DML*

1. Insira 8 setores: Tecnologia, Finanças, Saúde, Educação, Varejo, Logística, Marketing,
   Consultoria.
2. Insira pelo menos 12 empresas distribuídas entre os setores, com tamanhos variados.
3. Insira pelo menos 30 usuários com `titulo_perfil`, `cidade` e `data_cadastro` variados.
4. Insira pelo menos 15 habilidades (técnicas e soft skills) e associe-as a usuários com níveis
   variados — cada usuário deve ter entre 3 e 7 habilidades.
5. Insira pelo menos 25 vagas distribuídas entre empresas, modalidades e níveis.
6. Insira pelo menos 50 conexões entre usuários com status variados.
7. Insira pelo menos 40 posts, 30 candidaturas e 80 curtidas.

**Critérios de aceite:** inserção sem violações de constraint (teste inserir candidatura
duplicada — deve gerar erro UNIQUE) · pelo menos 1 usuário com mais de 5 conexões aceitas · pelo
menos 1 empresa com mais de 3 vagas ativas.

### 03 — Consultas Básicas de Seleção
*Módulo de referência: Módulo 4 — DML*

1. Liste todos os usuários premium cadastrados nos últimos 6 meses, ordenados por nome.
2. Exiba as 10 vagas com maior `salario_max`: título, `empresa_id`, cidade, modalidade,
   `salario_max`.
3. Liste todas as conexões com status 'pendente' há mais de 7 dias (use `DATEDIFF`).
4. Mostre posts com mais de 100 visualizações, ordenados por visualizações decrescente.
5. Liste usuários sem nenhuma habilidade cadastrada (use `NOT EXISTS`).
6. Pagine os posts: 10 por página, ordenados por `data_publicacao` decrescente. Exiba a página 3
   com `OFFSET FETCH`.

**Critérios de aceite:** filtro de 6 meses usa `DATEADD(MONTH, -6, GETDATE())` corretamente ·
paginação retorna exatamente 10 registros · `NOT EXISTS` é mais seguro que `NOT IN` com NULLs —
documente a diferença.

### 04 — Operadores, Filtros e CASE WHEN
*Módulo de referência: Módulo 4 — DML*

1. Liste vagas com salário entre R$ 5.000 e R$ 15.000, modalidade remoto, nível Pleno ou Senior.
2. Classifique cada vaga por faixa salarial com `CASE WHEN`: 'Ate 5k', '5k a 10k', '10k a 20k',
   'Acima de 20k'. Use `ISNULL` para vagas sem salário informado.
3. Classifique usuários por senioridade: 'Iniciante' (0-1 experiências), 'Em crescimento' (2-3),
   'Experiente' (4+) — use subquery dentro do `CASE`.
4. Liste empresas cujo nome contenha 'Tech' ou 'Digital' (`LIKE`) e estejam no setor de
   Tecnologia.

**Critérios de aceite:** `CASE WHEN` cobre todos os casos sem sobreposição, incluindo NULLs ·
filtro de vagas combina `BETWEEN`, `IN` e `AND` corretamente · classificação de usuários não
duplica registros.

### 05 — UPDATE e DELETE com Segurança
*Módulo de referência: Módulo 4 — DML*

1. Expire vagas com `data_expiracao` anterior a hoje: atualize `ativa = 0`. Antes, execute um
   `SELECT` com os mesmos critérios.
2. Atualize candidaturas para 'reprovada' onde a vaga esteja inativa e o status ainda seja
   'enviada' ou 'em_revisao' (use `UPDATE` com subquery ou `JOIN`).
3. Remova curtidas de posts inativos (`ativo = 0`) usando `DELETE` com subquery.
4. Atualize visualizações somando 1 para todos os posts publicados há mais de 30 dias e com pelo
   menos 1 curtida.

**Critérios de aceite:** todo `UPDATE`/`DELETE` foi precedido por `SELECT` com os mesmos
critérios · nenhuma FK violada nas operações de `DELETE` · `UPDATE` de candidaturas usa subquery
ou `JOIN` corretamente.

### 06 — JOINs Fundamentais
*Módulo de referência: Módulo 5 — Consultas Avançadas*

1. Liste todas as vagas ativas com: título, nome da empresa, setor, cidade, modalidade, nível e
   faixa salarial formatada como 'R$ X.XXX - R$ Y.YYY'.
2. Mostre todos os usuários com suas candidaturas: nome, título da vaga, nome da empresa, status
   e data.
3. Encontre empresas sem nenhuma vaga ativa (`LEFT JOIN` + `IS NULL`).
4. Liste usuários e a quantidade de conexões aceitas (inclua usuários com 0 conexões).

**Critérios de aceite:** faixa salarial formatada com `CONCAT` + `CAST`/`FORMAT` · usuários com 0
conexões aparecem com `COUNT = 0` · `LEFT JOIN` + `IS NULL` retorna corretamente empresas sem
vagas.

### 07 — Subqueries e EXISTS
*Módulo de referência: Módulo 5 — Consultas Avançadas*

1. Liste vagas para as quais o `usuario_id = 5` ainda não se candidatou (`NOT EXISTS`).
2. Liste usuários com habilidade 'SQL' em nível 'Avançado' ou 'Especialista' (subquery com `IN`).
3. Encontre posts com curtidas de pelo menos 3 usuários diferentes nos últimos 7 dias (subquery
   com `HAVING` no `WHERE`).
4. Liste empresas com mais vagas abertas que a média geral de vagas por empresa.

**Critérios de aceite:** `NOT EXISTS` e `NOT IN` produzem mesmo resultado — documente a diferença
com NULLs · subquery com `HAVING` usada corretamente no `WHERE` · média usa subquery escalar.

### 08 — Funções de Data, Texto e Agregação Simples
*Módulo de referência: Módulos 4 e 5*

1. Calcule a idade média dos perfis em dias (`DATEDIFF` entre `data_cadastro` e hoje).
2. Identifique o mês/ano com mais cadastros de usuários (`GROUP BY YEAR()` e `MONTH()`).
3. Liste as 5 habilidades mais associadas a usuários com contagem e percentual do total.
4. Mostre a distribuição de candidaturas por status: quantidade e % do total.
5. Liste usuários cujo `titulo_perfil` contenha 'Engenheiro', 'Analista' ou 'Desenvolvedor'
   (`LIKE` com `OR`).

**Critérios de aceite:** percentual usa `CAST(...AS FLOAT)` para evitar divisão inteira ·
`GROUP BY` em funções de data funciona corretamente · top 5 habilidades usa `TOP 5` com
`ORDER BY COUNT(*) DESC`.

---

## Seção 2 — Intermediário (Tarefas 9 a 16 | Módulos 5 a 7)

### 09 — JOINs Avançados e Multi-tabela
*Módulo de referência: Módulo 5 — Consultas Avançadas*

1. Crie um relatório completo de candidaturas: nome, email, título do perfil, título da vaga,
   empresa, setor, cidade da vaga, modalidade, nível, status e data.
2. Liste usuários e suas conexões de 2º grau (amigos de amigos ainda não conectados) — use
   `SELF JOIN` em `conexoes`.
3. Encontre usuários que se candidataram a vagas em empresas onde já trabalharam (cruzar
   `candidaturas` com `experiencias`).
4. Para cada empresa: nome, setor, total de vagas, total de candidaturas, taxa de conversão
   (aprovadas / total). Use `NULLIF` para evitar divisão por zero.

**Critérios de aceite:** relatório completo sem linhas duplicadas por multiplicação de JOINs ·
conexões de 2º grau excluem conexões já existentes (`NOT EXISTS`) · taxa de conversão trata
divisão por zero.

### 10 — Índices — Criação e Análise de Performance
*Módulo de referência: Módulo 6 — Índices*

1. Crie um índice non-clustered para busca de vagas por empresa e data:
   `IX_vagas_empresa_data` em `vagas(empresa_id, data_publicacao DESC)`
   `INCLUDE (titulo, modalidade, nivel)`.
2. Crie um índice filtrado para vagas ativas: `IX_vagas_ativas` em
   `vagas(empresa_id, data_publicacao) WHERE ativa = 1`.
3. Crie índice para candidaturas por usuário: `IX_cand_usuario` em
   `candidaturas(usuario_id, status) INCLUDE (vaga_id, data_candidatura)`.
4. Execute com `SET STATISTICS IO ON` a mesma consulta antes e depois de cada índice. Registre
   os `logical reads` em tabela comparativa.
5. Use o Execution Plan para confirmar Index Seek (não Table Scan) após criar os índices.

**Critérios de aceite:** tabela comparativa (tabela, índice, query, logical reads antes/depois) ·
índice filtrado criado com `WHERE ativa = 1` · Execution Plan confirma Index Seek após criação.

### 11 — Stored Procedure — Busca de Vagas
*Módulo de referência: Módulo 7 — SPs e Funções*

1. Crie `sp_buscar_vagas` com parâmetros opcionais (NULL = ignorar): `@palavra_chave NVARCHAR`,
   `@cidade NVARCHAR`, `@modalidade VARCHAR`, `@nivel VARCHAR`, `@salario_min DECIMAL`,
   `@empresa_id INT`.
2. Retorne: título, empresa, setor, cidade, modalidade, nível, `salario_min`, `salario_max`,
   `data_publicacao` — somente vagas ativas.
3. Implemente filtros opcionais: o filtro só é aplicado quando o parâmetro não for NULL.
4. Adicione `TRY/CATCH` com `THROW` para parâmetros inválidos (ex: `salario_min` negativo).
5. Teste com: todos nulos, apenas cidade = 'Sao Paulo', apenas nível = 'Senior' e combinação de
   3 filtros.

**Critérios de aceite:** SP testada 5 vezes com diferentes combinações — todas corretas ·
filtros nulos não afetam o resultado · `THROW` para `salario_min` negativo funciona corretamente.

### 12 — Stored Procedure — Candidatura com Validação
*Módulo de referência: Módulo 7 — SPs e Funções*

1. Crie `sp_registrar_candidatura(@usuario_id INT, @vaga_id INT, @carta NVARCHAR)`.
2. Valide: (1) usuário existe e ativo, (2) vaga existe e ativa, (3) candidatura não duplicada,
   (4) vaga não expirada.
3. Use `THROW` com códigos 50010 a 50013 para cada validação.
4. Insira dentro de `BEGIN TRANSACTION` com `TRY/CATCH` e retorne `candidatura_id` como `OUTPUT`.

**Critérios de aceite:** 4 cenários de erro testados individualmente · `ROLLBACK` ocorre
corretamente em caso de erro · `candidatura_id` retornado no `OUTPUT`.

### 13 — Funções Customizadas
*Módulo de referência: Módulo 7 — SPs e Funções*

1. Crie `fn_score_perfil(@usuario_id INT)` retornando score: +10 por habilidade, +15 por
   experiência, +5 por conexão aceita, +20 se premium.
2. Crie TVF `fn_conexoes_usuario(@usuario_id INT)` retornando dados completos das conexões
   aceitas.
3. Crie tabela `vaga_habilidades` (`vaga_id` FK, `habilidade_id` FK), popule com dados e crie TVF
   `fn_vagas_recomendadas(@usuario_id INT)` retornando vagas com pelo menos 2 habilidades em
   comum.
4. Use `fn_score_perfil` em `SELECT` para listar os top 10 usuários por score.

**Critérios de aceite:** `fn_score_perfil` retorna scores diferentes para perfis diferentes ·
TVFs usáveis em `FROM` como tabelas · `fn_vagas_recomendadas` não recomenda vagas já
candidatadas.

### 14 — Aggregations — Métricas da Plataforma
*Módulo de referência: Módulo 8 — Aggregations*

1. Para cada empresa: total de vagas por modalidade (presencial/híbrido/remoto) com `GROUP BY`.
2. Calcule o NPS de vagas por setor: % candidaturas aprovadas menos % reprovadas, por setor.
3. Identifique a hora do dia com mais publicações de vagas (`DATEPART(HOUR, ...)`).
4. Use `ROLLUP` para calcular subtotais de candidaturas por empresa e total geral.

**Critérios de aceite:** `ROLLUP` gera subtotal por empresa e linha de total geral · NPS usa
`CAST` para DECIMAL antes da divisão · `DATEPART(HOUR)` aplicado corretamente.

### 15 — Exportação e Backup
*Módulo de referência: Módulo 10 — Exportação e Backup*

1. Use `BCP` para exportar a tabela `vagas` para `vagas_export.csv` (título, `empresa_id`,
   cidade, modalidade, nível, `salario_min`, `salario_max`).
2. Execute `BACKUP FULL` com compressão e verifique com `RESTORE VERIFYONLY`.
3. Documente estratégia de backup: Full/Diferencial/Log, frequência, RPO e RTO.
4. Restaure em `linkedin_db_test` com `RESTORE DATABASE` usando `MOVE` para remapear os arquivos.

**Critérios de aceite:** CSV exportado com separador vírgula e cabeçalho · `RESTORE VERIFYONLY`
conclui sem erros · estratégia de backup com RPO e RTO definidos.

### 16 — Ambiente Docker Completo
*Módulo de referência: Módulo 11 — Docker*

1. Crie `docker-compose.yml` com SQL Server 2022 e Adminer, usando `.env` para credenciais.
2. Crie pasta `./scripts/` com: `01_create_schema.sql`, `02_seed_data.sql`, `03_indexes.sql`,
   `04_procedures.sql`.
3. Monte `./scripts` como volume e execute os 4 scripts via `docker exec` na ordem correta.
4. Documente strings de conexão para Python (pyodbc), Node.js (mssql) e .NET no `README.md`.

**Critérios de aceite:** `docker-compose up -d` sobe os dois containers sem erro · scripts
executados em ordem sem erros de FK · `README.md` executável do zero.

---

## Seção 3 — Avançado (Tarefas 17 a 22 | Módulos 8 e 9)

### 17 — Window Functions — Feed e Engajamento
*Módulo de referência: Módulo 8 — Window Functions*

1. Use `ROW_NUMBER() PARTITION BY usuario_id` para retornar apenas o post mais recente de cada
   usuário.
2. Use `DENSE_RANK()` para ranquear usuários por curtidas recebidas nos últimos 30 dias. Exiba
   top 10.
3. Use `LAG()` para calcular o intervalo em dias entre posts consecutivos de cada usuário.
   Identifique usuários com intervalo médio acima de 30 dias.
4. Calcule o percentual de participação de cada setor no total de vagas usando `SUM() OVER ()`.
5. Calcule o running total de candidaturas por data, particionado por empresa.

**Critérios de aceite:** `ROW_NUMBER()` com `WHERE rn = 1` retorna exatamente 1 post por usuário
· `LAG` retorna NULL no primeiro post — trate com `ISNULL` · percentual soma 100% para todos os
setores.

### 18 — CTEs — Análise de Rede de Conexões
*Módulo de referência: Módulo 9 — CTEs*

1. Escreva CTE recursiva que expanda a rede de um usuário até o 3º grau. Use
   `OPTION (MAXRECURSION 4)`.
2. Use CTEs múltiplas para: total de conexões diretas, total de conexões de 2º grau únicas e
   quantos são premium.
3. Identifique os 5 usuários mais influentes:
   `(conexoes_aceitas * 2) + (posts_proprios * 3) + (curtidas_recebidas * 1)`.

**Critérios de aceite:** CTE recursiva tem anchor member e recursive member definidos ·
`MAXRECURSION` aplicado corretamente · score de influência sem duplicações.

### 19 — Views — Camada de Apresentação
*Módulo de referência: Módulo 9 — Views*

1. Crie `vw_perfil_completo`: nome, email, título, cidade, qtd conexões aceitas, qtd posts,
   total curtidas recebidas, `fn_score_perfil`, habilidades como `STRING_AGG`.
2. Crie `vw_vagas_completas`: título, empresa, setor, cidade, modalidade, nível, faixa salarial,
   dias desde publicação, total candidaturas.
3. Crie `vw_empresa_dashboard`: nome, setor, tamanho, vagas ativas, total candidaturas, taxa de
   aprovação (com `NULLIF`), média de dias para preenchimento.
4. Teste cada view com `SELECT` + `WHERE` + `ORDER BY`.

**Critérios de aceite:** `STRING_AGG` correto e sem duplicatas · cada view retorna 1 linha por
entidade principal · `NULLIF` trata divisão por zero em `vw_empresa_dashboard`.

### 20 — MERGE e PIVOT — Relatórios Dinâmicos
*Módulo de referência: Módulo 9 — MERGE e PIVOT*

1. Crie tabela `habilidades_mercado` (`habilidade_id` FK, `nome`, `demanda_vagas INT`). Use
   `MERGE` para sincronizar com dados reais de `vaga_habilidades`.
2. Crie `PIVOT` com vagas por empresa (linhas) x modalidade (colunas). Substitua NULLs por 0 com
   `ISNULL`.
3. Crie segundo `PIVOT`: candidaturas por setor (linhas) x status (colunas).

**Critérios de aceite:** `MERGE` atualiza e insere sem duplicatas em múltiplas execuções ·
`PIVOT` exibe 0 para combinações sem dados · linha de total clara nos PIVOTs.

### 21 — Otimização de Queries Problemáticas
*Módulo de referência: Módulo 6 — Índices e Performance*

Você recebeu 3 queries legadas que causam lentidão em produção. Analise e otimize cada uma.
1. Query A: `SELECT * FROM vagas WHERE YEAR(data_publicacao) = 2024`. Reescreva usando range
   filter (sem função na coluna indexada).
2. Query B: `SELECT * FROM posts ORDER BY visualizacoes DESC` (sem filtro, sem projeção).
   Reescreva com projeção adequada, filtro e paginação.
3. Query C:
   `SELECT u.nome, (SELECT COUNT(*) FROM conexoes WHERE usuario_origem = u.usuario_id) FROM usuarios u`.
   Reescreva com `JOIN` e `GROUP BY`.
4. Para cada: versão original, versão otimizada, logical reads antes/depois, Execution Plan.

**Critérios de aceite:** Query A reescrita com `BETWEEN` ou `>=`/`<=` sem `YEAR()` na coluna ·
Query C elimina subquery correlacionada · redução de logical reads documentada em pelo menos 2
queries.

### 22 — Análise de Cohort de Retenção
*Módulo de referência: Módulos 8 e 9*

1. Defina o mês de cadastro de cada usuário como cohort de aquisição.
2. Para cada cohort, calcule usuários que fizeram ao menos 1 ação (post ou candidatura) em
   M+1, M+2, ..., M+6.
3. Calcule o percentual de retenção: usuários ativos no mês / total do cohort * 100.
4. Apresente como tabela: cohort (mês/ano) x mês_de_atividade (M+1 a M+6) x % retenção.
5. Solução deve usar apenas SQL set-based — proibido cursores ou loops.

**Critérios de aceite:** cohort correto para cada usuário · percentual sem divisão por zero ·
apenas CTEs e/ou Window Functions — sem cursores.

---

## Seção 4 — Projeto Final (Tarefas 23 a 26 | Integração de todos os módulos)

As tarefas a seguir integram todos os conceitos do workshop e simulam entregas reais de um time
de engenharia de dados em uma plataforma como o LinkedIn.

### 23 — Dashboard Executivo — SQL Puro
*Módulo de referência: Todos os módulos*

Contexto: o CEO precisa de um dashboard com KPIs gerado 100% em SQL, sem ferramentas de BI.
1. Use CTEs múltiplas e `UNION ALL` para retornar em 1 result set (formato:
   metrica | valor | variacao_pct):
2. Total de usuários ativos hoje vs semana passada (variação %).
3. Total de vagas abertas hoje vs semana passada.
4. Total de candidaturas nos últimos 7 dias vs 7 dias anteriores.
5. Setor com mais vagas abertas, usuário com mais posts no mês, taxa de conversão global do mês.
6. Apenas SQL set-based — sem cursores. `NULLIF` em todas as divisões.

**Critérios de aceite:** exatamente 1 linha por métrica no result set · variações percentuais com
`NULLIF` para divisão por zero · nenhum cursor ou loop utilizado.

### 24 — Sistema de Recomendação de Vagas por SP
*Módulo de referência: Módulos 7, 8 e 9*

1. Crie `sp_recomendar_vagas @usuario_id INT, @top_n INT = 10`.
2. Score: +30 por habilidade em comum, +20 se cidade da vaga = cidade do usuário, +15 se nível
   compatível, +10 se conexão do usuário trabalha na empresa.
3. Excluir vagas já candidatadas ou inativas.
4. Retornar: título, empresa, cidade, modalidade, nível, `score_relevancia DESC`.
5. `TRY/CATCH` e validação de `@top_n` positivo.

**Critérios de aceite:** SP testada para usuários com perfis diferentes — scores distintos ·
vagas já candidatadas NÃO aparecem · usuário com mais habilidades em comum recebe score maior.

### 25 — Relatório Consolidado de Contratações
*Módulo de referência: Módulos 8, 9 e 10*

1. Crie `sp_relatorio_rh @empresa_id INT, @data_inicio DATE, @data_fim DATE`.
2. Por vaga: título, total candidaturas, distribuição por status (`PIVOT`), tempo médio até
   primeira candidatura e tempo médio até aprovação.
3. Por empresa: total candidaturas, aprovações, taxa de aprovação, vaga mais disputada,
   habilidades dos aprovados via `STRING_AGG`.
4. Use pelo menos 3 CTEs nomeadas para organizar os cálculos.
5. Teste com empresa específica e com `@empresa_id = NULL` (todas as empresas).

**Critérios de aceite:** SP funciona com `empresa_id` específico e NULL · `PIVOT` de status exibe
todos os 6 status · `STRING_AGG` sem duplicatas.

### 26 — Entrega Final — Documentação e Repositório
*Módulo de referência: Todos os módulos*

1. Organize scripts em: `/ddl`, `/dml_seed`, `/indexes`, `/procedures`, `/functions`, `/views`,
   `/tasks`.
2. Crie `README.md` com descrição, pré-requisitos, setup do zero (Docker + scripts) e exemplos.
3. Crie `DOCS.md` documentando cada SP e função: descrição, parâmetros, exemplo de chamada,
   resultado esperado.
4. Execute a sequência completa a partir de um banco zerado usando apenas os scripts do
   repositório.
5. Bônus: script Python com `pyodbc` que executa `sp_recomendar_vagas` para os 3 primeiros
   usuários e salva em CSV.

**Critérios de aceite:** repositório com estrutura de pastas conforme especificado · execução do
zero concluída sem erros manuais · `README.md` executável — seguir as instruções gera ambiente
funcional.

## Checklist de entrega

- [ ] Seção 1 — Básico: tarefas 01 a 08 resolvidas.
- [ ] Seção 2 — Intermediário: tarefas 09 a 16 resolvidas.
- [ ] Seção 3 — Avançado: tarefas 17 a 22 resolvidas.
- [ ] Seção 4 — Projeto Final: tarefas 23 a 26 resolvidas.
- [ ] Todo o conteúdo publicado em um repositório no GitHub, com README organizado.
