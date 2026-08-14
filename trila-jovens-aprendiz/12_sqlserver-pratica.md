# Módulo 12 — SQL Server — Prática

> **Objetivo da prática:** escrever comandos SQL reais — `CREATE TABLE`, `SELECT`, `WHERE`,
> `JOIN`, agregações e subconsultas — sobre o cenário de `clientes` e `pedidos` usado na teoria.
> **Pré-requisito:** [12_sqlserver-teoria.md](12_sqlserver-teoria.md)
> **Entregáveis:** um arquivo `.sql` para cada bloco de tarefas, neste módulo, no seu
> repositório do GitHub.
> **Formato de entrega:** publicado no GitHub. Cada arquivo `.sql` deve conter, como comentário
> SQL (`-- descrição`), o enunciado da tarefa, e logo abaixo a query que resolve.

---

## Exemplo resolvido (para você seguir o mesmo formato nos exercícios)

```sql
-- Tarefa: listar o nome e o e-mail de todos os clientes cadastrados.
SELECT nome, email FROM clientes;

-- Tarefa: listar apenas os pedidos com valor acima de 100.
SELECT produto, valor FROM pedidos WHERE valor > 100;
```

Repare no formato: o comentário `-- Tarefa: ...` documenta o que foi pedido, e a query logo
abaixo é a resposta. Esse é o padrão exigido em todo arquivo `.sql` que você entregar. Use como
base o cenário de referência da teoria: tabela `clientes` (`id`, `nome`, `email`) e tabela
`pedidos` (`id`, `cliente_id`, `produto`, `valor`).

## Exercícios

### 1. `01_estrutura.sql` — DDL

1. Escreva o `CREATE TABLE` de `clientes` (`id` inteiro/chave primária, `nome`, `email`) e de
   `pedidos` (`id` inteiro/chave primária, `cliente_id`, `produto`, `valor` decimal).
2. Escreva um `ALTER TABLE` adicionando uma coluna `telefone` em `clientes`.

### 2. `02_manipulacao.sql` — DML

1. Insira pelo menos 3 clientes e 5 pedidos (distribuídos entre esses clientes) com `INSERT`.
2. Escreva um `UPDATE` que corrija o e-mail de um cliente específico, filtrando por `id`.
3. Escreva um `DELETE` que remova um pedido específico, filtrando por `id`.
4. Em um comentário, explique o que aconteceria se o `UPDATE` do item 2 fosse escrito sem
   `WHERE`.

### 3. `03_consultas.sql` — `SELECT`/`WHERE`

Escreva pelo menos 3 consultas `SELECT` com `WHERE` filtrando por condições diferentes (ex: valor
maior que um número, nome contendo um trecho, cliente específico), seguindo o formato do exemplo
resolvido.

### 4. `04_joins.sql`

Escreva pelo menos 2 consultas com `JOIN`, combinando `clientes` e `pedidos`. Confira, antes de
entregar, se você incluiu a condição `ON` em cada uma.

### 5. `05_agregacoes.sql`

1. Escreva uma consulta que retorne o valor total (`SUM`) de todos os pedidos.
2. Escreva uma consulta com `GROUP BY` que retorne quantos pedidos (`COUNT`) cada cliente fez.
3. Escreva uma consulta com `GROUP BY` que retorne o valor médio (`AVG`) dos pedidos por cliente.

### 6. `06_subconsulta.sql`

Escreva uma consulta usando subconsulta (`WHERE ... IN (SELECT ...)`) que retorne o nome dos
clientes que já fizeram algum pedido com valor acima de um valor à sua escolha.

### 7. `07_modelagem.sql`

Escolha um cenário simples (pode ser inventado por você, diferente de `clientes`/`pedidos`) com
pelo menos duas entidades relacionadas (ex: `alunos` e `matriculas`). Escreva, como comentário,
qual seria a chave primária de cada tabela e qual seria a chave estrangeira que conecta as duas —
não precisa criar as tabelas de verdade, só documentar a modelagem e justificar a escolha.

## Critérios de entrega

- Um arquivo `.sql` por bloco de tarefas, nomeado como indicado acima.
- Cada tarefa dentro do arquivo com a descrição em comentário SQL, logo antes da query.
- Todo o conteúdo publicado em um repositório no GitHub, com `README.md` explicando a organização
  dos arquivos.

## Checklist de entrega

- [ ] `01_estrutura.sql` com os dois `CREATE TABLE` e o `ALTER TABLE`.
- [ ] `02_manipulacao.sql` com `INSERT`, `UPDATE` e `DELETE`, todos com `WHERE` onde necessário.
- [ ] `03_consultas.sql` com pelo menos 3 `SELECT`/`WHERE`.
- [ ] `04_joins.sql` com pelo menos 2 `JOIN`s, cada um com a condição `ON` presente.
- [ ] `05_agregacoes.sql` com `SUM`, `COUNT` e `AVG`.
- [ ] `06_subconsulta.sql` com uma subconsulta funcional.
- [ ] `07_modelagem.sql` com a modelagem de chave primária/estrangeira documentada e justificada.
- [ ] Publicado no GitHub com README.
