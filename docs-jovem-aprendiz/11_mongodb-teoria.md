---
id: 11_mongodb-teoria
title: "Módulo 11 — MongoDB"
sidebar_position: 110
---

# Módulo 11 — MongoDB

> **Objetivo:** entender o modelo de documento do MongoDB e realizar operações de CRUD, consultas
> filtradas, índices e modelagem básica com confiança.
> **Pré-requisitos:** Módulo 10 (HTML & CSS).
> **Tempo de referência:** 5 a 6 horas.
> **Prática correspondente:** [11_mongodb-pratica.md](11_mongodb-pratica.md)

---

## Por que isso importa

Lá no módulo 05 você viu que a RAM é volátil — some quando o computador desliga. Todo programa
que você escreveu até agora guarda dados só enquanto está rodando; feche o programa, e os dados
somem junto. Um banco de dados existe pra resolver exatamente esse problema: guardar dado de
forma **persistente** (sobrevive ao programa fechar) e **estruturada** (organizada de um jeito
que dá pra buscar, filtrar e atualizar depois, não só um arquivo de texto solto).

Ao longo deste módulo, todos os exemplos usam o mesmo dataset de uma loja online — coleções
`produtos`, `clientes`, `pedidos` e `avaliacoes` — que é também a base da sua prática e do
projeto final do módulo.

## `[TEORIA]` Por que NoSQL, e o que muda

Até agora, quando você pensa em "banco de dados", provavelmente imagina uma planilha: colunas
fixas, toda linha preenchendo exatamente os mesmos campos. Esse é o modelo **relacional**
(SQL), que você vai ver formalizado no módulo 12. NoSQL ("Not Only SQL") existe porque nem todo
dado se encaixa bem nesse molde rígido — um catálogo de produtos onde cada categoria tem atributos
diferentes (um livro tem "autor", um eletrônico tem "voltagem") é incômodo de representar em
colunas fixas, mas natural num documento flexível.

| Característica | Relacional (SQL) | NoSQL (MongoDB) |
|---|---|---|
| Estrutura | Tabelas, linhas e colunas | Coleções e documentos |
| Schema | Rígido | Flexível/Dinâmico |
| Relacionamentos | Joins | Documentos aninhados/Referências |
| Escalabilidade | Vertical | Horizontal |
| Consistência | ACID | Eventual (BASE) |
| Casos de uso | Dados estruturados, transações | Grandes volumes, dados variáveis |

MongoDB é do tipo **documentos** (existem outros tipos de NoSQL — chave-valor como Redis,
colunar como Cassandra, grafos como Neo4j — mas fora do escopo deste módulo).

## `[TEORIA]` O modelo de documento

Pensa em duas formas de organizar informação sobre produtos: uma planilha, com colunas fixas
(nome, preço, estoque) — toda linha precisa preencher exatamente essas colunas, na mesma ordem;
ou uma pasta de fichas soltas, onde cada ficha pode ter campos diferentes, alguma com um campo a
mais que a outra, sem quebrar nada. O MongoDB segue essa segunda ideia: é um banco de
**documentos**, não de tabelas com colunas fixas.

Cada documento é parecido com um objeto JSON — um conjunto de pares chave-valor. Este é um
produto real do dataset da loja:
```js
db.produtos.insertOne({
  nome: "Tablet Pro X",
  preco: 799.99,
  estoque: 25,
  categoria: "Eletrônicos"
})
```
Um outro documento na mesma coleção poderia ter um campo a mais (`"desconto": true`) sem que isso
quebre nada — diferente de uma planilha, onde toda linha é obrigada a ter as mesmas colunas. Essa
flexibilidade tem um preço, que você vai ver com mais clareza no módulo 12 comparando com SQL
Server: sem colunas fixas, não existe uma "regra automática" garantindo que todo documento tenha
os mesmos campos — isso vira responsabilidade de quem escreve o código.

`[ATENÇÃO]` Todo documento no MongoDB tem um `_id` único, gerado automaticamente se você não
fornecer um — é ele que garante que dois documentos, mesmo que pareçam iguais, sejam tratados
como registros diferentes.

## `[CLI]` Instalação e conexão

Duas formas de instalar: convencional (direto no sistema) ou via Docker (isolado, mais fácil de
descartar e recriar).

```bash
# Docker — puxa a imagem oficial e sobe um container
docker pull mongo
docker run --name mongodb -p 27017:27017 -d mongo

# Com persistência de dados (os dados sobrevivem ao container ser removido)
docker run --name mongodb -p 27017:27017 -v /caminho/local:/data/db -d mongo
```

Conectando e conferindo a instalação:
```js
mongosh                    // abre o shell interativo
show dbs                   // lista os bancos existentes
use ecommerce               // usa (ou cria) o banco da loja
show collections            // lista as coleções do banco atual
```

## `[TEORIA]` Operações básicas (CRUD)

CRUD é o conjunto mínimo de operações que qualquer banco de dados precisa oferecer: Create
(criar), Read (ler), Update (atualizar), Delete (apagar).

**Inserir** (Create) — um documento ou vários de uma vez:
```js
db.produtos.insertOne({
  nome: "Tablet Pro X", preco: 799.99, estoque: 25, categoria: "Eletrônicos"
})

db.produtos.insertMany([
  { nome: "Mouse sem fio", preco: 49.99, estoque: 100, categoria: "Acessórios" },
  { nome: "Teclado mecânico", preco: 129.99, estoque: 50, categoria: "Acessórios" }
])
```

**Buscar** (Read):
```js
db.produtos.find({ categoria: "Eletrônicos" })     // todos que combinam com o filtro
db.produtos.findOne({ nome: "Tablet Pro X" })        // só o primeiro que combinar
db.produtos.find().limit(3)                          // limita a quantidade
db.produtos.find().skip(10).limit(10)                 // pula os 10 primeiros (paginação)
```
`find` recebe um filtro — "todo documento cujo campo `categoria` seja `Eletrônicos`" — e retorna
todos os documentos que combinam, `findOne` retorna só o primeiro.

**Atualizar** (Update):
```js
db.produtos.updateOne(
  { nome: "Tablet Pro X" },
  { $set: { preco: 849.99, desconto: true } }
)

db.produtos.updateMany(
  { categoria: "Acessórios" },
  { $inc: { estoque: -5 } }
)
```
O primeiro argumento é o filtro (qual documento atualizar); o segundo é o que muda — `$set`
altera só os campos indicados sem apagar o resto, `$inc` soma (ou subtrai, com valor negativo) um
valor ao campo existente.

**Apagar** (Delete):
```js
db.produtos.deleteOne({ nome: "Tablet Pro X" })
db.produtos.deleteMany({ estoque: { $lt: 10 } })
```

`[ATENÇÃO]` Em `updateOne`/`deleteOne`, o filtro decide *qual* documento é afetado — eles afetam
só o primeiro documento que casar. Já `updateMany`/`deleteMany` afetam **todos** os que casarem.
Um filtro vazio (`{}`) ou vago demais nesses dois últimos é o erro mais perigoso aqui — sempre
confira o filtro com um `find` antes de rodar um update/delete que afeta múltiplos documentos e
que você não pode desfazer facilmente.

`[TENTE VOCÊ]` Escreva o comando para buscar todos os produtos com `estoque` menor que 50.
Resposta: `db.produtos.find({ estoque: { $lt: 50 } })`.

## `[TEORIA]` Operadores de consulta

Além de buscar por igualdade exata, o MongoDB tem operadores para comparações e padrões:

| Operador | Significado | Exemplo |
|---|---|---|
| `$eq` | igual a | `db.produtos.find({ preco: { $eq: 299.99 } })` |
| `$ne` | diferente de | `db.produtos.find({ categoria: { $ne: "Eletrônicos" } })` |
| `$gt` / `$gte` | maior que / maior ou igual | `db.produtos.find({ preco: { $gt: 1000 } })` |
| `$lt` / `$lte` | menor que / menor ou igual | `db.produtos.find({ estoque: { $lte: 15 } })` |
| `$in` | valor está numa lista | `db.produtos.find({ categoria: { $in: ["Eletrônicos", "Acessórios"] } })` |
| `$regex` | combina com um padrão de texto | `db.produtos.find({ nome: { $regex: /^Smart/i } })` |

**Exemplo narrado — combinando critérios:** "produtos da categoria Eletrônicos com estoque maior
que 15" combina dois filtros no mesmo objeto (AND implícito):
```js
db.produtos.find({ categoria: "Eletrônicos", estoque: { $gt: 15 } })
```
Já "Eletrônicos OU preço menor que 500" precisa do operador explícito `$or`, porque não são dois
filtros sobre o mesmo campo:
```js
db.produtos.find({
  $or: [ { categoria: "Eletrônicos" }, { preco: { $lt: 500 } } ]
})
```

`[TENTE VOCÊ]` Escreva a busca por produtos com nome contendo "Pro" em qualquer posição
(case-insensitive). Resposta: `db.produtos.find({ nome: { $regex: /Pro/i } })`.

## `[TEORIA]` Índices — por que uma consulta fica lenta

Sem índice, `find` precisa varrer documento por documento até achar o que combina com o filtro —
o equivalente a procurar uma palavra num livro lendo página por página. Um índice é uma estrutura
auxiliar que o MongoDB mantém ordenada, permitindo pular direto para os documentos relevantes —
o equivalente ao índice remissivo no fim de um livro, que te leva direto à página certa.

```js
db.produtos.createIndex({ nome: 1 })                          // índice simples (1 = ascendente)
db.produtos.createIndex({ categoria: 1, preco: -1 })            // índice composto
db.clientes.createIndex({ email: 1 }, { unique: true })          // índice único — impede duplicatas
db.produtos.createIndex({ nome: "text", descricao: "text" })     // índice de texto
```

`[CLI]` Para confirmar que uma consulta está de fato usando um índice (e não varrendo tudo):
```js
db.produtos.find({ categoria: "Eletrônicos" }).explain("executionStats")
```

`[ATENÇÃO]` Índice não é de graça: acelera leitura, mas cada `insert`/`update` precisa também
atualizar os índices — criar índice pra todo campo "só por garantia" piora a performance de
escrita sem necessariamente ajudar consultas que você nunca faz. Crie índice para os campos que
você efetivamente filtra com frequência.

## `[TEORIA]` Modelagem: documentos aninhados x referências

Quando um documento se relaciona com outro, existem duas abordagens:

**Aninhado (embedding)** — os dados relacionados ficam dentro do próprio documento:
```js
db.clientes.insertOne({
  nome: "Carlos Mendes",
  email: "carlos@email.com",
  enderecos: [
    { tipo: "residencial", cidade: "Florianópolis" },
    { tipo: "trabalho", cidade: "Florianópolis" }
  ]
})
```
Bom para relações 1:1 ou 1:poucos, onde os dados quase sempre são lidos juntos — busca tudo numa
única operação. Limitado pelo tamanho máximo de um documento (16 MB).

**Referência (linking)** — os dados relacionados ficam em outra coleção, ligados por um id:
```js
db.pedidos.insertOne({
  clienteId: ObjectId("6a1b2c3d4e5f6a7b8c9d4444"),
  total: 599.98
})
```
Bom para relações 1:muitos ou muitos:muitos, evita duplicar dados — mas exige uma segunda consulta
(ou um `$lookup`, o equivalente a um JOIN do módulo 12) para juntar os dados relacionados.

`[TENTE VOCÊ]` Um cliente tem vários endereços (poucos, sempre lidos junto do cliente); um
cliente tem vários pedidos (potencialmente muitos, nem sempre precisa de todos). Qual abordagem
faz mais sentido para cada relação? Resposta: endereços → aninhado (embedding); pedidos →
referência (linking) — é exatamente a escolha feita nos dois exemplos acima.

## `[APROFUNDAMENTO]` Agregações

Quando a pergunta não é "quais documentos combinam com X" mas "como os dados se agrupam" (ex:
"quantos produtos por categoria, e qual o preço médio"), `find` não basta — é preciso um
**pipeline de agregação**, uma sequência de estágios que transforma os dados passo a passo:
```js
db.produtos.aggregate([
  { $group: {
      _id: "$categoria",
      count: { $sum: 1 },
      mediaPreco: { $avg: "$preco" }
  }}
])
```
`$group` agrupa documentos por um campo (aqui, `categoria`) e calcula um valor por grupo — soma,
média, mínimo, máximo. Você vai usar isso na prática, nas tarefas de relatórios.

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Rodar `updateMany`/`deleteMany` com um filtro vago demais, afetando documentos além do
  pretendido — sempre conferir com `find` antes.
- Achar que todo documento de uma coleção precisa ter exatamente os mesmos campos — no MongoDB,
  isso não é garantido automaticamente.
- Criar índice para todo campo sem necessidade — cada índice tem custo de escrita.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Modelo de documento (flexível) | Módulo 12 — comparado direto com o modelo relacional (tabelas fixas) do SQL Server |
| Referência (`clienteId`) e `$lookup` | Módulo 12 — é o mesmo papel de chave estrangeira e `JOIN` |
| Documentos como objetos chave-valor | Módulo 13 — é praticamente a mesma sintaxe de um objeto JavaScript/JSON |

## `[REFERÊNCIA]`

- [Documentação oficial do MongoDB](https://www.mongodb.com/docs/)
- MongoDB Cheat Sheet (indicado no material da trilha)
- `apostila-mongo.md`, nesta pasta — workshop completo (9 módulos), fonte deste módulo, com mais
  exemplos de instalação, exportação/backup e ambientes com Docker/réplicas/Atlas.

## Checklist de saída

- [ ] Explico por que NoSQL existe e o que muda em relação ao modelo relacional (tabela
      comparativa).
- [ ] Distingo coleção de documento, e sei por que o `_id` importa.
- [ ] Escrevo as operações básicas de CRUD (`insertOne`/`insertMany`, `find`/`findOne`,
      `updateOne`/`updateMany`, `deleteOne`/`deleteMany`).
- [ ] Uso ao menos 4 operadores de consulta (`$gt`, `$lt`, `$in`, `$regex` ou equivalentes).
- [ ] Explico por que um índice acelera consultas, usando a analogia do índice de um livro — e
      por que criar índice em excesso tem custo.
- [ ] Escolho entre embedding e referência dado um cenário de relacionamento, justificando.
