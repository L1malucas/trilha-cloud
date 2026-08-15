# Módulo 11 — MongoDB

> **Objetivo:** entender o modelo de documento do MongoDB e realizar operações de CRUD, consultas
> filtradas, índices, modelagem, agregações e operações avançadas (backup, exportação, ambientes
> reais com Docker/réplicas/Atlas) com confiança.
> **Pré-requisitos:** Módulo 10 (HTML & CSS).
> **Tempo de referência:** 7 a 9 horas.
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
(SQL), que você vai ver formalizado no módulo 12. NoSQL ("Not Only SQL") refere-se a bancos de
dados não relacionais, projetados para armazenar, distribuir e acessar dados usando modelos
diferentes do tradicional modelo relacional — porque nem todo dado se encaixa bem nesse molde
rígido: um catálogo de produtos onde cada categoria tem atributos diferentes (um livro tem
"autor", um eletrônico tem "voltagem") é incômodo de representar em colunas fixas, mas natural
num documento flexível.

| Característica | Relacional (SQL) | NoSQL (MongoDB) |
|---|---|---|
| Estrutura | Tabelas, linhas e colunas | Coleções e documentos |
| Schema | Rígido | Flexível/Dinâmico |
| Relacionamentos | Joins | Documentos aninhados/Referências |
| Escalabilidade | Vertical | Horizontal |
| Consistência | ACID | Eventual (BASE) |
| Casos de uso | Dados estruturados, transações | Grandes volumes, dados variáveis |

### Tipos de bancos NoSQL

MongoDB é do tipo **documentos**, mas existem outras famílias de NoSQL, cada uma resolvendo um
problema diferente:

1. **Documentos** (MongoDB, CouchDB) — dados como documentos flexíveis, tipo JSON.
2. **Chave-valor** (Redis, DynamoDB) — cada dado é acessado por uma chave única, como um
   dicionário gigante.
3. **Colunar** (Cassandra, HBase) — otimizado para ler/escrever colunas inteiras rapidamente, bom
   para grandes volumes analíticos.
4. **Grafos** (Neo4j, JanusGraph) — otimizado para relacionamentos complexos entre entidades (ex:
   redes sociais).

### Casos de uso reais para MongoDB

1. **Aplicações de conteúdo**: CMS, blogs, redes sociais.
2. **E-commerce**: catálogos de produtos, perfis de usuários — exatamente o cenário deste módulo.
3. **IoT**: armazenamento de dados de sensores.
4. **Aplicações mobile**: backend para apps.
5. **Analytics em tempo real**: painéis, métricas.
6. **Gerenciamento de catálogos**: produtos com atributos variáveis.

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

## `[CLI]` Instalação e configuração

Existem duas formas de instalar o MongoDB: convencional (direto no sistema operacional) ou via
Docker (isolado, mais fácil de descartar e recriar do zero).

**Instalação convencional:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y mongodb-org

# macOS (com Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Windows: baixe o instalador em mongodb.com/try/download/community
```

**Instalação via Docker:**
```bash
# Puxar a imagem oficial e subir o container
docker pull mongo
docker run --name mongodb -p 27017:27017 -d mongo

# Com persistência de dados (os dados sobrevivem ao container ser removido)
docker run --name mongodb -p 27017:27017 -v /caminho/local:/data/db -d mongo
```

| Aspecto | Instalação Convencional | Docker |
|---|---|---|
| Facilidade | Média | Alta |
| Configuração | Manual | Simplificada |
| Isolamento | Não | Sim |
| Escalabilidade | Manual | Facilitada |
| Portabilidade | Baixa | Alta |
| Recursos | Usa recursos do host diretamente | Containerizado |

**Conexão e verificação:**
```js
mongosh                                              // shell interativo (ou "mongo" em versões antigas)

// Conexão com autenticação
mongosh -u usuario -p senha --authenticationDatabase admin

// Conexão via string de conexão
mongosh "mongodb://usuario:senha@localhost:27017/database"

// Verificar a instalação
show dbs                   // lista os bancos existentes
use ecommerce               // usa (ou cria) o banco da loja
show collections            // lista as coleções do banco atual
```

## `[TEORIA]` Operações básicas (CRUD)

CRUD é o conjunto mínimo de operações que qualquer banco de dados precisa oferecer: Create
(criar), Read (ler), Update (atualizar), Delete (apagar).

**Criação (Create)** — um documento ou vários de uma vez:
```js
db.produtos.insertOne({
  nome: "Tablet Pro X", preco: 799.99, estoque: 25, categoria: "Eletrônicos"
})

db.produtos.insertMany([
  { nome: "Mouse sem fio", preco: 49.99, estoque: 100, categoria: "Acessórios" },
  { nome: "Teclado mecânico", preco: 129.99, estoque: 50, categoria: "Acessórios" }
])
```

**Leitura (Read)**:
```js
db.produtos.find()                                    // todos os documentos
db.produtos.find().pretty()                            // com formatação melhorada
db.produtos.find({ categoria: "Eletrônicos" })          // com critério
db.produtos.findOne({ nome: "Tablet Pro X" })            // só o primeiro que combinar
db.produtos.findOne({ _id: ObjectId("5f8d0d55b54764429c1e1111") })  // busca por ID
db.produtos.find().limit(3)                             // limita a quantidade
db.produtos.find().skip(10).limit(10)                    // pula os 10 primeiros (paginação)
```
`find` recebe um filtro — "todo documento cujo campo `categoria` seja `Eletrônicos`" — e retorna
todos os documentos que combinam, `findOne` retorna só o primeiro.

**Atualização (Update)**:
```js
db.produtos.updateOne(
  { nome: "Tablet Pro X" },
  { $set: { preco: 849.99, desconto: true } }
)

db.produtos.updateMany(
  { categoria: "Acessórios" },
  { $inc: { estoque: -5 } }
)

// Substituir completamente um documento
db.produtos.replaceOne(
  { nome: "Mouse sem fio" },
  { nome: "Mouse Bluetooth Premium", preco: 79.99, estoque: 30, categoria: "Acessórios" }
)
```
O primeiro argumento é o filtro (qual documento atualizar); o segundo é o que muda — `$set`
altera só os campos indicados sem apagar o resto, `$inc` soma (ou subtrai, com valor negativo) um
valor ao campo existente. `replaceOne` é diferente: troca o documento inteiro, não só os campos
indicados.

**Remoção (Delete)**:
```js
db.produtos.deleteOne({ nome: "Tablet Pro X" })
db.produtos.deleteMany({ estoque: { $lt: 10 } })
db.produtos.deleteMany({})           // remove todos os documentos da coleção
db.produtos.drop()                   // remove a coleção inteira (estrutura incluída)
```

`[ATENÇÃO]` Em `updateOne`/`deleteOne`, o filtro decide *qual* documento é afetado — eles afetam
só o primeiro documento que casar. Já `updateMany`/`deleteMany` afetam **todos** os que casarem.
Um filtro vazio (`{}`) ou vago demais nesses dois últimos é o erro mais perigoso aqui — sempre
confira o filtro com um `find` antes de rodar um update/delete que afeta múltiplos documentos e
que você não pode desfazer facilmente.

`[TENTE VOCÊ]` Escreva o comando para buscar todos os produtos com `estoque` menor que 50.
Resposta: `db.produtos.find({ estoque: { $lt: 50 } })`.

## `[TEORIA]` Operadores de consulta

Além de buscar por igualdade exata, o MongoDB tem operadores para comparações, padrões e
verificações de tipo/existência:

| Operador | Explicação | Exemplo |
|---|---|---|
| `$eq` | Corresponde a valores iguais ao especificado | `db.produtos.find({ preco: { $eq: 299.99 } })` |
| `$ne` | Corresponde a valores diferentes do especificado | `db.produtos.find({ categoria: { $ne: "Eletrônicos" } })` |
| `$gt` | Maior que o valor especificado | `db.produtos.find({ preco: { $gt: 1000 } })` |
| `$gte` | Maior ou igual ao valor especificado | `db.produtos.find({ estoque: { $gte: 20 } })` |
| `$lt` | Menor que o valor especificado | `db.produtos.find({ preco: { $lt: 500 } })` |
| `$lte` | Menor ou igual ao valor especificado | `db.produtos.find({ estoque: { $lte: 15 } })` |
| `$in` | Corresponde a qualquer valor do array especificado | `db.produtos.find({ categoria: { $in: ["Eletrônicos", "Acessórios"] } })` |
| `$nin` | Não corresponde a nenhum valor do array especificado | `db.produtos.find({ categoria: { $nin: ["Vestuário", "Alimentos"] } })` |
| `$exists` | Corresponde a documentos que possuem o campo especificado | `db.produtos.find({ desconto: { $exists: true } })` |
| `$type` | Corresponde a documentos com o tipo BSON especificado | `db.produtos.find({ preco: { $type: "double" } })` |
| `$regex` | Permite usar expressões regulares para buscar | `db.produtos.find({ nome: { $regex: /^Smart/i } })` |
| `$text` | Realiza busca de texto em campos indexados para texto | `db.produtos.find({ $text: { $search: "smartphone android" } })` |
| `$all` | Corresponde a arrays que contêm todos os elementos especificados | `db.produtos.find({ tags: { $all: ["bluetooth", "audio"] } })` |
| `$elemMatch` | Corresponde a documentos com um array que tem ao menos um elemento satisfazendo todos os critérios | `db.pedidos.find({ itens: { $elemMatch: { quantidade: { $gt: 1 } } } })` |
| `$size` | Corresponde a arrays com o tamanho especificado | `db.produtos.find({ tags: { $size: 4 } })` |

### Exemplos de buscas avançadas

**Busca exata por valor:**
```js
db.produtos.find({ preco: 299.99 })
```

**Busca por intervalo de valores:**
```js
db.produtos.find({ preco: { $gte: 500, $lte: 3000 } })
```

**Busca com múltiplos critérios (AND implícito):**
```js
db.produtos.find({ categoria: "Eletrônicos", estoque: { $gt: 15 } })
```

**Operador OR** (diferente do AND implícito acima, precisa ser explícito):
```js
db.produtos.find({
  $or: [ { categoria: "Eletrônicos" }, { preco: { $lt: 500 } } ]
})
```

**Busca por texto (com e sem acentuação):**
```js
// Primeiro, criar um índice de texto
db.produtos.createIndex({ nome: "text", descricao: "text" })

// Busca ignorando acentuação
db.produtos.find({
  $text: { $search: "camera", $caseSensitive: false, $diacriticSensitive: false }
})
```

**Busca em campos aninhados:**
```js
db.produtos.find({ "especificacoes.memoria": "16GB" })
```

**Busca em arrays:**
```js
db.produtos.find({ tags: "bluetooth" })                          // produtos com a tag
db.produtos.find({ tags: { $all: ["bluetooth", "audio"] } })      // com TODAS as tags listadas
```

**Busca por expressão regular:**
```js
db.produtos.find({ nome: { $regex: /^Smart/i } })      // começa com "Smart"
db.produtos.find({ nome: { $regex: /Pro/i } })          // contém "Pro" em qualquer posição
```

**Projeção de campos** (escolher quais campos retornam):
```js
db.produtos.find({ categoria: "Eletrônicos" }, { nome: 1, preco: 1 })                  // só nome e preço
db.produtos.find({ categoria: "Eletrônicos" }, { especificacoes: 0, tags: 0 })          // excluir campos
```

`[TENTE VOCÊ]` Escreva a busca por produtos com nome contendo "Pro" em qualquer posição
(case-insensitive). Resposta: `db.produtos.find({ nome: { $regex: /Pro/i } })`.

## `[TEORIA]` Índices — por que uma consulta fica lenta

Sem índice, `find` precisa varrer documento por documento até achar o que combina com o filtro —
o equivalente a procurar uma palavra num livro lendo página por página. Um índice é uma estrutura
auxiliar que o MongoDB mantém ordenada, permitindo pular direto para os documentos relevantes —
o equivalente ao índice remissivo no fim de um livro, que te leva direto à página certa.

```js
db.produtos.createIndex({ nome: 1 })                                       // simples (1 ascendente, -1 descendente)
db.produtos.createIndex({ categoria: 1, preco: -1 })                        // composto
db.clientes.createIndex({ email: 1 }, { unique: true })                     // único — impede duplicatas
db.produtos.createIndex({ nome: "text", descricao: "text" })                // de texto
db.produtos.createIndex({ promocao: 1 }, { sparse: true })                  // esparso — só p/ docs com o campo
db.sessoes.createIndex({ ultimoAcesso: 1 }, { expireAfterSeconds: 3600 })   // TTL — expira após um período
db.lojas.createIndex({ localizacao: "2dsphere" })                          // geoespacial
```

**Gerenciamento de índices:**
```js
db.produtos.getIndexes()             // listar índices
db.produtos.dropIndex("nome_1")       // remover um índice
db.produtos.dropIndexes()             // remover todos os índices (exceto _id)
```

**Análise de consultas:**
```js
db.produtos.find({ categoria: "Eletrônicos" }).explain()                       // explicação da consulta
db.produtos.find({ categoria: "Eletrônicos" }).explain("executionStats")        // explicação detalhada

// Verificar uso de índices, forçando um índice específico
db.produtos.find({ categoria: "Eletrônicos", preco: { $gt: 1000 } })
  .hint({ categoria: 1, preco: -1 })
  .explain()
```

`[ATENÇÃO]` Índice não é de graça: acelera leitura, mas cada `insert`/`update` precisa também
atualizar os índices — criar índice pra todo campo "só por garantia" piora a performance de
escrita sem necessariamente ajudar consultas que você nunca faz. Crie índice para os campos que
você efetivamente filtra com frequência.

## `[TEORIA]` Modelagem: documentos aninhados x referências

Quando um documento se relaciona com outro, existem duas abordagens:

**1. Documentos aninhados (embedding)** — os dados relacionados ficam dentro do próprio
documento. Melhor para relações 1:1 e 1:poucos; acesso em uma única operação; limitado pelo
tamanho máximo do documento (16 MB):
```js
db.clientes.insertOne({
  nome: "Carlos Mendes",
  email: "carlos@email.com",
  telefone: "(47) 98765-4321",
  enderecos: [
    { tipo: "residencial", rua: "Rua das Palmeiras", numero: "123", cidade: "Florianópolis", estado: "SC" },
    { tipo: "trabalho", rua: "Av. Beira Mar", numero: "1500", cidade: "Florianópolis", estado: "SC" }
  ]
})
```

**2. Referências (linking)** — os dados relacionados ficam em outra coleção, ligados por um id.
Melhor para relações 1:muitos e muitos:muitos; evita duplicação de dados; requer múltiplas
operações para acessar dados relacionados:
```js
db.clientes.insertOne({
  nome: "Carlos Mendes",
  email: "carlos@email.com",
  pedidos: [ ObjectId("7a8b9c0d1e2f3g4h5i6j1112"), ObjectId("7a8b9c0d1e2f3g4h5i6j1113") ]
})

db.pedidos.insertOne({
  _id: ObjectId("7a8b9c0d1e2f3g4h5i6j1112"),
  clienteId: ObjectId("6a1b2c3d4e5f6a7b8c9d4444"),
  data: ISODate("2023-11-15T10:30:00Z"),
  total: 599.98,
  produtos: [ { id: ObjectId("5f8d0d55b54764429c1e3333"), qtd: 2 } ]
})
```

### Consultas em dados relacionados

```js
// Consulta em dados aninhados
db.clientes.find({ "enderecos.cidade": "Florianópolis" })

// Consulta juntando cliente e pedido manualmente (duas idas ao banco)
const cliente = db.clientes.findOne({ email: "carlos@email.com" })
const pedidosCliente = db.pedidos.find({ clienteId: cliente._id }).toArray()

// Agregação para juntar dados numa única operação (equivalente a um JOIN)
db.pedidos.aggregate([
  { $match: { clienteId: ObjectId("6a1b2c3d4e5f6a7b8c9d4444") } },
  { $lookup: { from: "clientes", localField: "clienteId", foreignField: "_id", as: "cliente" } }
])
```

`[TENTE VOCÊ]` Um cliente tem vários endereços (poucos, sempre lidos junto do cliente); um
cliente tem vários pedidos (potencialmente muitos, nem sempre precisa de todos). Qual abordagem
faz mais sentido para cada relação? Resposta: endereços → aninhado (embedding); pedidos →
referência (linking) — é exatamente a escolha feita nos dois exemplos acima.

## `[TEORIA]` Agregações

Quando a pergunta não é "quais documentos combinam com X" mas "como os dados se agrupam" (ex:
"quantos produtos por categoria, e qual o preço médio"), `find` não basta — é preciso um
**pipeline de agregação**: uma sequência de estágios que transforma os dados passo a passo, cada
estágio recebendo a saída do anterior.

**Estágios de agregação comuns:**
```js
// $match - filtra documentos (como um find dentro do pipeline)
db.produtos.aggregate([ { $match: { preco: { $gt: 1000 } } } ])

// $group - agrupa documentos e calcula valores por grupo
db.produtos.aggregate([
  { $group: {
      _id: "$categoria",
      count: { $sum: 1 },
      mediaPreco: { $avg: "$preco" },
      minPreco: { $min: "$preco" },
      maxPreco: { $max: "$preco" }
  }}
])

// $project - seleciona/calcula campos específicos
db.produtos.aggregate([
  { $match: { categoria: "Eletrônicos" } },
  { $project: { nome: 1, preco: 1, valorComImposto: { $multiply: ["$preco", 1.15] } } }
])

// $sort - ordena documentos
db.produtos.aggregate([ { $sort: { preco: -1 } } ])       // descendente

// $limit - limita o número de resultados
db.produtos.aggregate([ { $sort: { preco: -1 } }, { $limit: 5 } ])

// $unwind - "explode" um array em múltiplos documentos, um por elemento
db.produtos.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } } }
])

// $lookup - join entre coleções
db.pedidos.aggregate([
  { $match: { status: "Entregue" } },
  { $lookup: { from: "clientes", localField: "clienteId", foreignField: "_id", as: "cliente" } },
  { $unwind: "$cliente" }
])
```

**Exemplo de relatório completo** — receita por categoria, combinando vários estágios:
```js
db.pedidos.aggregate([
  { $match: { status: { $in: ["Entregue", "Em Transporte"] } } },          // só pedidos concluídos
  { $unwind: "$itens" },                                                    // desdobra itens de cada pedido
  { $lookup: { from: "produtos", localField: "itens.produtoId", foreignField: "_id", as: "produto" } },
  { $unwind: "$produto" },
  { $project: {
      categoria: "$produto.categoria",
      valorItem: { $multiply: ["$itens.quantidade", "$itens.precoUnitario"] },
      data: "$dataPedido"
  }},
  { $group: { _id: "$categoria", totalVendas: { $sum: "$valorItem" }, quantidadePedidos: { $sum: 1 } } },
  { $sort: { totalVendas: -1 } }
])
```

## `[TEORIA]` Operações avançadas

**Exportação para CSV** (rodado no terminal, não no shell do MongoDB):
```bash
mongoexport --db=ecommerce --collection=produtos --type=csv \
  --fields=nome,categoria,preco,estoque --out=produtos.csv

# Com autenticação
mongoexport --db=ecommerce --collection=produtos --type=csv \
  --fields=nome,categoria,preco,estoque --out=produtos.csv -u usuario -p senha
```

**Backup e restauração:**
```bash
mongodump --db=ecommerce --out=/caminho/backup/                              # backup do banco
mongodump --db=ecommerce --collection=produtos --out=/caminho/backup/         # de uma coleção
mongodump --db=ecommerce --out=/caminho/backup/ --gzip                        # com compressão

mongorestore --db=ecommerce /caminho/backup/ecommerce/                                       # restaurar o banco
mongorestore --db=ecommerce --collection=produtos /caminho/backup/ecommerce/produtos.bson      # uma coleção
```

**Movendo dados entre bancos:**
```js
// Via MongoDB Shell
db.produtos.find().forEach(function(doc) {
  db.getSiblingDB('ecommerce_backup').produtos.insert(doc)
})
```
```bash
# Via mongoexport/mongoimport, no terminal
mongoexport --db=ecommerce --collection=produtos --out=produtos.json
mongoimport --db=ecommerce_novo --collection=produtos --file=produtos.json
```

`[ATENÇÃO]` Gerenciamento de erros comuns:

1. **Conexão recusada** (`MongoConnectionError: connect ECONNREFUSED 127.0.0.1:27017`) — o
   serviço não está rodando. Verifique com `sudo systemctl status mongod` (instalação
   convencional) ou `docker ps | grep mongo` (Docker).
2. **Violação de índice único** — inserir um documento com valor duplicado num campo com índice
   `unique`. Solução: usar `upsert` para atualizar se existir, inserir se não existir:
   ```js
   db.clientes.updateOne(
     { email: "maria.silva@email.com" },
     { $set: { nome: "Maria Silva", telefone: "11987654321" } },
     { upsert: true }
   )
   ```
3. **Consulta com ID inválido** (`Error: invalid object id: length`) — sempre valide o formato do
   `ObjectId` antes de usar um valor vindo de fora (ex: da URL de uma requisição):
   ```js
   if (ObjectId.isValid(idString)) {
     db.produtos.findOne({ _id: ObjectId(idString) })
   } else {
     // lidar com ID inválido
   }
   ```

## `[APROFUNDAMENTO]` MongoDB em ambientes reais

**Docker Compose** — sobe MongoDB junto com o Mongo Express (interface web de administração):
```yaml
# docker-compose.yml
version: '3'
services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: senha123
    volumes:
      - mongo_data:/data/db
    networks:
      - mongo_network
  mongo-express:
    image: mongo-express:latest
    container_name: mongo-express
    depends_on:
      - mongodb
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: senha123
      ME_CONFIG_MONGODB_SERVER: mongodb
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: senha123
    networks:
      - mongo_network
volumes:
  mongo_data:
networks:
  mongo_network:
    driver: bridge
```

**Replicação** — múltiplas cópias do banco sincronizadas, para alta disponibilidade:
```bash
# Iniciar um conjunto de réplicas com Docker
docker run -d --name mongo1 -p 27017:27017 mongo --replSet rs0
docker run -d --name mongo2 -p 27018:27017 mongo --replSet rs0
docker run -d --name mongo3 -p 27019:27017 mongo --replSet rs0

# Configurar o conjunto de réplicas
docker exec -it mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'localhost:27017' },
    { _id: 1, host: 'localhost:27018' },
    { _id: 2, host: 'localhost:27019' }
  ]
})
"
```

**MongoDB Atlas** (serviço gerenciado na nuvem):
```js
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://usuario:senha@cluster0.mongodb.net/ecommerce?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function conectar() {
  try {
    await client.connect();
    console.log("Conectado ao MongoDB Atlas!");
    const db = client.db('ecommerce');
    const produtos = await db.collection('produtos').find().limit(5).toArray();
    console.log(produtos);
  } finally {
    await client.close();
  }
}
conectar().catch(console.error);
```

**Segurança e autenticação:**
```js
// Criar usuário com permissões específicas
db.createUser({
  user: "app_user",
  pwd: "senha_segura",
  roles: [ { role: "readWrite", db: "ecommerce" }, { role: "read", db: "analytics" } ]
})
// Iniciar MongoDB com autenticação: mongod --auth

// Conectar com autenticação
mongosh -u app_user -p senha_segura --authenticationDatabase admin
```

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Rodar `updateMany`/`deleteMany` com um filtro vago demais, afetando documentos além do
  pretendido — sempre conferir com `find` antes.
- Achar que todo documento de uma coleção precisa ter exatamente os mesmos campos — no MongoDB,
  isso não é garantido automaticamente.
- Criar índice para todo campo sem necessidade — cada índice tem custo de escrita.
- Inserir valor duplicado num campo com índice único sem tratar com `upsert`.
- Usar um `ObjectId` vindo de fora sem validar o formato antes (`ObjectId.isValid`).

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Modelo de documento (flexível) | Módulo 12 — comparado direto com o modelo relacional (tabelas fixas) do SQL Server |
| Referência (`clienteId`) e `$lookup` | Módulo 12 — é o mesmo papel de chave estrangeira e `JOIN` |
| Documentos como objetos chave-valor | Módulo 13 — é praticamente a mesma sintaxe de um objeto JavaScript/JSON |
| Docker Compose / ambientes reais | Módulo 12 — SQL Server também roda em Docker, com a mesma lógica de containers |

## `[REFERÊNCIA]`

- [Documentação oficial do MongoDB](https://www.mongodb.com/docs/)
- [MongoDB University (cursos oficiais gratuitos)](https://learn.mongodb.com/)
- [Referência de operadores de consulta](https://www.mongodb.com/docs/manual/reference/operator/query/)
- [Referência de estágios de agregação](https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/)
- MongoDB Cheat Sheet (indicado no material da trilha)
- `apostila-mongo.md`, nesta pasta — workshop completo (9 módulos), fonte deste módulo.

## Checklist de saída

- [ ] Explico por que NoSQL existe e o que muda em relação ao modelo relacional (tabela
      comparativa), e cito os 4 tipos de banco NoSQL além de documentos.
- [ ] Distingo coleção de documento, e sei por que o `_id` importa.
- [ ] Instalo o MongoDB (convencional ou Docker) e me conecto via `mongosh`.
- [ ] Escrevo as operações básicas de CRUD (`insertOne`/`insertMany`, `find`/`findOne`,
      `updateOne`/`updateMany`/`replaceOne`, `deleteOne`/`deleteMany`/`drop`).
- [ ] Uso ao menos 6 operadores de consulta, incluindo busca por texto, array e campo aninhado.
- [ ] Crio índices simples, compostos, únicos, esparsos e de texto, e sei analisar uma consulta
      com `explain()`.
- [ ] Escolho entre embedding e referência dado um cenário de relacionamento, justificando.
- [ ] Escrevo um pipeline de agregação com pelo menos 3 estágios encadeados.
- [ ] Sei exportar/fazer backup de uma coleção e tratar os 3 erros mais comuns do dia a dia.
- [ ] Descrevo, em termos gerais, como o MongoDB roda em produção (Docker Compose, réplicas,
      Atlas, autenticação).
