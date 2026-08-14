---
id: 12_sqlserver-teoria
title: "Módulo 12 — SQL Server"
sidebar_position: 120
---

# Módulo 12 — SQL Server

> **Objetivo:** entender o modelo relacional de bancos de dados e escrever consultas SQL básicas
> (`SELECT`, `WHERE`, `JOIN`) usando SQL Server.
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

## `[TEORIA]` Tabelas, linhas, colunas e esquema

Pensa numa planilha que você já usou: colunas com cabeçalho fixo (`Nome`, `Email`, `Data`), e
cada linha embaixo preenchendo essas mesmas colunas — nunca uma linha com uma coluna a mais que
as outras. Um banco relacional formaliza exatamente essa ideia: uma **tabela** tem colunas fixas
(o **esquema**), e cada **linha** (registro) guarda um valor para cada coluna. Diferente do
documento do módulo 11, aqui você não pode simplesmente inventar uma coluna nova numa linha sem
alterar a tabela inteira — o esquema vale igualmente para todas as linhas.

Vamos usar um cenário de referência para o módulo inteiro: uma tabela `clientes` (`id`, `nome`,
`email`) e uma tabela `pedidos` (`id`, `cliente_id`, `produto`, `valor`).

## `[TEORIA]` Chave primária e chave estrangeira

Se cada pedido tivesse que guardar o nome e o e-mail completos do cliente dentro da própria linha
do pedido, esses dados ficariam duplicados em todo pedido daquele cliente — e se o e-mail dele
mudasse, você teria que atualizar linha por linha, correndo o risco de esquecer alguma e deixar o
banco inconsistente.

É pra evitar isso que existe a **chave primária**: um identificador único de cada linha de uma
tabela (geralmente a coluna `id`). Outras tabelas então guardam só esse identificador — a
**chave estrangeira** — em vez de duplicar os dados inteiros, criando um "ponteiro" para a linha
original.

**Exemplo narrado:** o cliente `Ana` tem `id = 1` na tabela `clientes`. Cada pedido dela, na
tabela `pedidos`, guarda só `cliente_id = 1` — não o nome "Ana" de novo. Se o e-mail da Ana mudar,
você atualiza uma única linha, na tabela `clientes`, e todos os pedidos continuam apontando
corretamente pra ela.

`[TENTE VOCÊ]` Se a tabela `pedidos` guardasse o nome do cliente escrito por extenso em vez do
`cliente_id`, o que aconteceria se dois clientes diferentes se chamassem "Ana Silva"? Resposta:
não haveria como saber qual pedido é de qual Ana — é exatamente esse tipo de ambiguidade que a
chave primária/estrangeira evita, porque o `id` é único, o nome não necessariamente é.

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
`pedidos` tem 100 linhas e `clientes` tem 50, isso gera 5.000 combinações sem sentido, em vez das
poucas dezenas que fariam sentido de verdade.

`[TENTE VOCÊ]` Reescreva o `JOIN` acima trazendo também o `valor` do pedido. Resposta:
`SELECT clientes.nome, pedidos.produto, pedidos.valor FROM pedidos JOIN clientes ON
pedidos.cliente_id = clientes.id;`

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Duplicar dados de uma entidade (como cliente) em várias linhas de outra tabela, em vez de usar
  chave estrangeira.
- Esquecer a condição `ON` de um `JOIN`, gerando combinações sem sentido entre as tabelas.
- Achar que `SELECT *` é sempre a opção mais simples — em tabelas grandes, trazer só as colunas
  necessárias é mais eficiente e mais legível.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Modelo rígido de esquema x modelo flexível de documento (módulo 11) | Escolha de banco de dados em projetos reais |
| Consultas estruturadas (`SELECT`/`JOIN`) | Módulo 13 — aplicações em JavaScript/Node.js consultando dados |

## `[REFERÊNCIA]`

- `apostila_sqlserver.pdf` (já presente em `trila-jovens-aprendiz/`) — conteúdo teórico completo,
  com cenários inspirados em um aplicativo de transporte (os cenários são simulados, não refletem
  necessariamente situações reais de mercado).
- `SQL-Cheat-Sheet.pdf` (já presente em `trila-jovens-aprendiz/`) — referência rápida de sintaxe.

## Checklist de saída

- [ ] Explico a diferença entre o modelo de tabelas fixas do SQL Server e o modelo de documentos
      flexíveis do MongoDB (módulo 11).
- [ ] Explico o que é chave primária e chave estrangeira, e por que elas evitam duplicação de dados.
- [ ] Escrevo uma consulta `SELECT` com `WHERE` filtrando por uma condição.
- [ ] Escrevo um `JOIN` básico entre duas tabelas relacionadas, com a condição `ON` correta.
- [ ] Sei explicar o que acontece se a condição `ON` de um `JOIN` for esquecida.
