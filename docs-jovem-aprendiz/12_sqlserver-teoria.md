---
id: 12_sqlserver-teoria
title: "Módulo 12 — SQL Server"
sidebar_position: 120
---

# Módulo 12 — SQL Server

> **Objetivo:** entender o modelo relacional de bancos de dados e escrever comandos SQL —
> definição de tabelas (`CREATE TABLE`), manipulação de dados (`SELECT`/`INSERT`/`UPDATE`/
> `DELETE`), `JOIN`, agregações e subconsultas — usando SQL Server.
> **Pré-requisitos:** Módulo 11 (MongoDB) concluído.
> **Tempo de referência:** 4 a 5 horas.
> **Prática correspondente:** [12_sqlserver-pratica.md](12_sqlserver-pratica.md)

---

## Por que isso importa

No módulo 11 você viu o MongoDB guardando dados como uma pasta flexível de fichas — cada
documento podendo ter campos diferentes dos outros, sem um molde fixo obrigando todo mundo a se
parecer. Um banco relacional como o SQL Server resolve o mesmo problema (guardar e consultar
dados) do jeito oposto: em vez de fichas soltas, uma planilha rígida — colunas fixas, definidas
**antes** de qualquer dado entrar, e toda linha da tabela preenchendo obrigatoriamente essas
mesmas colunas. Nenhum dos dois modelos é "melhor" — cada um troca flexibilidade por garantias
diferentes, e é essa troca que este módulo constrói, na prática.

Vamos usar um cenário de referência para o módulo inteiro: uma tabela `clientes` (`id`, `nome`,
`email`) e uma tabela `pedidos` (`id`, `cliente_id`, `produto`, `valor`).

## `[TEORIA]` Definindo a estrutura: `CREATE TABLE` (DDL)

Antes de guardar qualquer linha, o esquema precisa existir. Isso é feito com comandos de
**Data Definition Language (DDL)** — eles não manipulam dados, definem a *forma* que os dados vão
ter.

```sql
CREATE TABLE clientes (
    id INT PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE pedidos (
    id INT PRIMARY KEY,
    cliente_id INT,
    produto VARCHAR(100),
    valor DECIMAL(10,2)
);
```
Lendo em voz alta: "crie a tabela `clientes`, com uma coluna `id` (número inteiro, chave
primária), uma coluna `nome` (texto de até 100 caracteres) e uma coluna `email` (idem)". Cada
coluna tem um **tipo de dado** fixo — igual você viu no módulo 03 que um tipo numérico tem um
tamanho fixo de bits, aqui uma coluna `INT` só aceita número inteiro, `VARCHAR(100)` só aceita
texto de até 100 caracteres.

Se a tabela já existe e você precisa mudar sua estrutura (não os dados, a estrutura), o comando é
`ALTER TABLE`:
```sql
ALTER TABLE clientes ADD telefone VARCHAR(20);
```

`[TENTE VOCÊ]` Escreva o `CREATE TABLE` para uma tabela `produtos`, com `id` (inteiro, chave
primária), `nome` (texto) e `preco` (decimal). Resposta:
```sql
CREATE TABLE produtos (
    id INT PRIMARY KEY,
    nome VARCHAR(100),
    preco DECIMAL(10,2)
);
```

## `[TEORIA]` Chave primária e chave estrangeira

Se cada pedido tivesse que guardar o nome e o e-mail completos do cliente dentro da própria linha
do pedido, esses dados ficariam duplicados em todo pedido daquele cliente — e se o e-mail dele
mudasse, você teria que atualizar linha por linha, correndo o risco de esquecer alguma e deixar o
banco inconsistente.

É pra evitar isso que existe a **chave primária** (`PRIMARY KEY`): um identificador único de cada
linha de uma tabela (geralmente a coluna `id`, como você já viu no `CREATE TABLE` acima). Outras
tabelas então guardam só esse identificador — a **chave estrangeira** — em vez de duplicar os
dados inteiros, criando um "ponteiro" para a linha original. Repare que, no `CREATE TABLE` de
`pedidos` acima, a coluna `cliente_id` é exatamente isso: não o nome do cliente, só uma referência
ao `id` dele na outra tabela.

**Exemplo narrado:** o cliente `Ana` tem `id = 1` na tabela `clientes`. Cada pedido dela, na
tabela `pedidos`, guarda só `cliente_id = 1` — não o nome "Ana" de novo. Se o e-mail da Ana mudar,
você atualiza uma única linha, na tabela `clientes`, e todos os pedidos continuam apontando
corretamente pra ela.

`[TENTE VOCÊ]` Se a tabela `pedidos` guardasse o nome do cliente escrito por extenso em vez do
`cliente_id`, o que aconteceria se dois clientes diferentes se chamassem "Ana Silva"? Resposta:
não haveria como saber qual pedido é de qual Ana — é exatamente esse tipo de ambiguidade que a
chave primária/estrangeira evita, porque o `id` é único, o nome não necessariamente é.

## `[TEORIA]` Manipulando dados: `INSERT`, `UPDATE`, `DELETE` (DML)

Com a estrutura pronta, os comandos de **Data Manipulation Language (DML)** cuidam do conteúdo —
inserir, alterar e remover linhas, sem tocar na estrutura da tabela.

```sql
-- Criar (Create)
INSERT INTO clientes (id, nome, email) VALUES (1, 'Ana Silva', 'ana@email.com');

-- Alterar (Update) — sempre com WHERE, ou a mudança vale pra TODAS as linhas
UPDATE clientes SET email = 'ana.silva@email.com' WHERE id = 1;

-- Remover (Delete) — mesma regra: sem WHERE, apaga a tabela inteira
DELETE FROM clientes WHERE id = 1;
```

`[ATENÇÃO]` `UPDATE` e `DELETE` sem `WHERE` não dão erro — eles simplesmente aplicam a mudança
(ou a remoção) em **todas** as linhas da tabela. É um dos erros mais caros de cometer com SQL:
sempre confira a cláusula `WHERE` antes de rodar um `UPDATE`/`DELETE`, de preferência testando
antes com um `SELECT` usando a mesma condição, pra ver exatamente quais linhas seriam afetadas.

`[TENTE VOCÊ]` Escreva o comando que atualiza o `valor` do pedido de `id = 3` para `250.00`.
Resposta: `UPDATE pedidos SET valor = 250.00 WHERE id = 3;`

## `[TEORIA]` Consultando dados: `SELECT` e `WHERE`

`SELECT` escolhe quais colunas você quer ver; `WHERE` filtra quais linhas.

```sql
SELECT nome, email FROM clientes WHERE id = 1;
```
Lendo em voz alta: "escolha as colunas `nome` e `email`, da tabela `clientes`, mas só a linha
onde `id` é igual a `1`". `SELECT *` (asterisco) traz todas as colunas, quando você não quer
escolher.

`[TENTE VOCÊ]` Escreva a consulta que traz o `produto` e o `valor` de todos os pedidos com
`valor` maior que `100`. Resposta: `SELECT produto, valor FROM pedidos WHERE valor > 100;`

## `[TEORIA]` Combinando tabelas: `JOIN`

Como os dados estão separados em tabelas diferentes (justamente para evitar a duplicação que a
chave estrangeira resolve), uma pergunta que envolve as duas — "quais produtos a Ana comprou?" —
não está pronta em nenhuma tabela isolada. O `JOIN` existe para reconstruir essa visão combinada,
casando a chave estrangeira de uma tabela com a chave primária da outra.

```sql
SELECT clientes.nome, pedidos.produto
FROM pedidos
JOIN clientes ON pedidos.cliente_id = clientes.id;
```
Lendo em voz alta: "pra cada linha de `pedidos`, encontre a linha de `clientes` cujo `id` bate
com o `cliente_id` desse pedido, e traga o nome do cliente junto com o produto".

`[ATENÇÃO]` Esquecer a condição `ON` (a parte que diz *como* as tabelas se conectam) é um erro
comum e caro: sem ela, o banco combina **cada linha de uma tabela com cada linha da outra** — se
`pedidos` tem 100 linhas e `clientes` tem 50, isso gera 5.000 combinações sem sentido (o chamado
produto cartesiano), em vez das poucas dezenas que fariam sentido de verdade.

`[TENTE VOCÊ]` Reescreva o `JOIN` acima trazendo também o `valor` do pedido. Resposta:
`SELECT clientes.nome, pedidos.produto, pedidos.valor FROM pedidos JOIN clientes ON
pedidos.cliente_id = clientes.id;`

## `[TEORIA]` Resumindo dados: `GROUP BY` e funções de agregação

Até aqui, cada `SELECT` devolve uma linha por linha da tabela. Às vezes a pergunta não é sobre uma
linha específica, mas sobre um resumo — "quantos pedidos cada cliente fez?", "qual o valor total
vendido?". É pra isso que existem as **funções de agregação** (`COUNT`, `SUM`, `AVG`, `MIN`,
`MAX`), combinadas com `GROUP BY` quando o resumo precisa ser feito *por grupo* (por cliente, por
categoria, etc.) em vez de sobre a tabela inteira.

```sql
-- Total vendido, sobre a tabela inteira (sem agrupar)
SELECT SUM(valor) FROM pedidos;

-- Total vendido, agrupado por cliente
SELECT cliente_id, SUM(valor) AS total_gasto
FROM pedidos
GROUP BY cliente_id;
```
Lendo o segundo: "agrupe as linhas de `pedidos` por `cliente_id`, e para cada grupo, some os
`valor`es" — uma linha de resultado por cliente, não uma linha por pedido.

`[ATENÇÃO]` Numa consulta com `GROUP BY`, toda coluna do `SELECT` que não está dentro de uma
função de agregação precisa estar também no `GROUP BY` — senão o banco não sabe qual valor
mostrar quando existem várias linhas diferentes dentro do mesmo grupo.

`[TENTE VOCÊ]` Escreva a consulta que conta quantos pedidos cada cliente fez. Resposta:
`SELECT cliente_id, COUNT(*) AS total_pedidos FROM pedidos GROUP BY cliente_id;`

## `[APROFUNDAMENTO]` Subconsultas (`subqueries`)

Às vezes o filtro de um `WHERE` depende do resultado de outra consulta, não de um valor fixo.
Uma **subconsulta** é um `SELECT` inteiro usado dentro de outro:

```sql
-- Clientes que já fizeram algum pedido com valor acima de 500
SELECT nome FROM clientes
WHERE id IN (SELECT cliente_id FROM pedidos WHERE valor > 500);
```
A subconsulta (entre parênteses) roda primeiro, devolvendo uma lista de `cliente_id`; a consulta
de fora usa essa lista no `IN` para filtrar `clientes`. É equivalente a fazer um `JOIN`, mas às
vezes mais legível quando você só precisa checar "existe ou não", sem trazer dados da outra
tabela.

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Duplicar dados de uma entidade (como cliente) em várias linhas de outra tabela, em vez de usar
  chave estrangeira.
- Rodar `UPDATE`/`DELETE` sem `WHERE`, afetando todas as linhas da tabela.
- Esquecer a condição `ON` de um `JOIN`, gerando um produto cartesiano sem sentido entre as
  tabelas.
- Num `GROUP BY`, colocar no `SELECT` uma coluna que não está agregada nem no próprio `GROUP BY`.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Modelo rígido de esquema x modelo flexível de documento (módulo 11) | Escolha de banco de dados em projetos reais |
| Consultas estruturadas (`SELECT`/`JOIN`/agregações) | Módulo 13 — aplicações em JavaScript/Node.js consultando dados |

## `[REFERÊNCIA]`

- `SQL-Cheat-Sheet.pdf` (já presente em `trila-jovens-aprendiz/`) — referência de sintaxe SQL
  usada como base deste módulo (DML, DDL, DCL, queries, joins, subqueries, agregações, funções de
  string/data, expressões condicionais, set operations, controle de transação).

## Checklist de saída

- [ ] Explico a diferença entre o modelo de tabelas fixas do SQL Server e o modelo de documentos
      flexíveis do MongoDB (módulo 11).
- [ ] Escrevo um `CREATE TABLE` definindo colunas e chave primária.
- [ ] Explico o que é chave primária e chave estrangeira, e por que elas evitam duplicação de dados.
- [ ] Escrevo `INSERT`, `UPDATE` (com `WHERE`) e `DELETE` (com `WHERE`), e sei o risco de rodar os
      dois últimos sem `WHERE`.
- [ ] Escrevo uma consulta `SELECT` com `WHERE` filtrando por uma condição.
- [ ] Escrevo um `JOIN` básico entre duas tabelas relacionadas, com a condição `ON` correta.
- [ ] Escrevo uma consulta com `GROUP BY` e ao menos uma função de agregação (`COUNT`, `SUM`,
      `AVG`, `MIN`, `MAX`).
