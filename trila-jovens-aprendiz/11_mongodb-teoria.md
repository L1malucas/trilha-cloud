# Módulo 11 — MongoDB

> **Objetivo:** entender o modelo de documento do MongoDB e realizar operações básicas de CRUD
> com confiança.
> **Pré-requisitos:** Módulo 10 (HTML & CSS).
> **Tempo de referência:** 4 a 5 horas.
> **Prática correspondente:** [11_mongodb-pratica.md](11_mongodb-pratica.md)

---

## Por que isso importa

Lá no módulo 05 você viu que a RAM é volátil — some quando o computador desliga. Todo programa
que você escreveu até agora guarda dados só enquanto está rodando; feche o programa, e os dados
somem junto. Um banco de dados existe pra resolver exatamente esse problema: guardar dado de
forma **persistente** (sobrevive ao programa fechar) e **estruturada** (organizada de um jeito
que dá pra buscar, filtrar e atualizar depois, não só um arquivo de texto solto).

## `[TEORIA]` O modelo de documento

Pensa em duas formas de organizar informação sobre pessoas: uma planilha, com colunas fixas
(nome, idade, e-mail) — toda linha precisa preencher exatamente essas colunas, na mesma ordem; ou
uma pasta de fichas soltas, onde cada ficha pode ter campos diferentes, alguma com um campo a
mais que a outra, sem quebrar nada. O MongoDB segue essa segunda ideia: é um banco de
**documentos**, não de tabelas com colunas fixas.

Cada documento é parecido com um objeto JSON — um conjunto de pares chave-valor:
```json
{
  "nome": "Ana",
  "idade": 22,
  "email": "ana@exemplo.com"
}
```
Um outro documento na mesma coleção poderia ter um campo a mais (`"telefone": "..."`) sem que
isso quebre nada — diferente de uma planilha, onde toda linha é obrigada a ter as mesmas colunas.
Essa flexibilidade tem um preço, que você vai ver com mais clareza no módulo 12 comparando com
SQL Server: sem colunas fixas, não existe uma "regra automática" garantindo que todo documento
tenha os mesmos campos — isso vira responsabilidade de quem escreve o código.

## `[TEORIA]` Coleções e documentos

Uma **coleção** é o equivalente da "pasta" onde ficam várias fichas do mesmo tipo — por exemplo,
uma coleção `produtos` guarda vários documentos, cada um descrevendo um produto:

```json
{ "_id": 1, "nome": "Caderno", "preco": 12.90, "estoque": 40 }
{ "_id": 2, "nome": "Caneta", "preco": 2.50, "estoque": 120 }
```

Repare no `_id`: todo documento no MongoDB tem um identificador único, gerado automaticamente se
você não fornecer um — é ele que garante que dois documentos, mesmo que pareçam iguais, sejam
tratados como registros diferentes.

`[TENTE VOCÊ]` Escreva um documento para um usuário fictício da sua escolha, com pelo menos
`nome`, `idade` e `email`. Não existe resposta "errada" aqui — o ponto é praticar a sintaxe de
chave-valor.

## `[TEORIA]` Operações básicas (CRUD)

CRUD é o conjunto mínimo de operações que qualquer banco de dados precisa oferecer: Create
(criar), Read (ler), Update (atualizar), Delete (apagar). No MongoDB:

**Inserir um documento** (Create):
```js
db.produtos.insertOne({ nome: "Lápis", preco: 1.50, estoque: 200 })
```
Isso cria um novo documento na coleção `produtos`, com `_id` gerado automaticamente.

**Buscar documentos** (Read):
```js
db.produtos.find({ nome: "Lápis" })
```
`find` recebe um filtro — aqui, "todo documento cujo campo `nome` seja `"Lápis"`" — e retorna
todos os documentos que combinam com esse filtro (pode ser mais de um, ou nenhum).

**Atualizar um documento** (Update):
```js
db.produtos.updateOne({ nome: "Lápis" }, { $set: { estoque: 180 } })
```
O primeiro argumento é o filtro (qual documento atualizar); o segundo é o que muda — `$set`
altera só os campos indicados, sem apagar o resto do documento.

**Apagar um documento** (Delete):
```js
db.produtos.deleteOne({ nome: "Lápis" })
```

`[ATENÇÃO]` Em `updateOne` e `deleteOne`, o primeiro argumento (o filtro) é o que decide *qual*
documento é afetado. Um filtro vazio (`{}`) ou vago demais (que combina com mais documentos do
que você pretendia) é o erro mais perigoso aqui — `updateOne`/`deleteOne` afetam só o primeiro
documento que casar com o filtro, mas o equivalente `updateMany`/`deleteMany` afetaria **todos**.
Sempre confira o filtro com um `find` antes de rodar um update ou delete que você não pode
desfazer facilmente.

`[TENTE VOCÊ]` Escreva o comando para buscar todos os produtos da coleção `produtos` com
`estoque` menor que 50 (dica: o filtro usa `{ estoque: { $lt: 50 } }`, onde `$lt` significa "less
than"). Resposta: `db.produtos.find({ estoque: { $lt: 50 } })`.

## Erros comuns

Você já viu este aviso ao longo do módulo — aqui vai só a revisão rápida:

- Rodar `updateOne`/`deleteOne` com um filtro vago demais, afetando um documento diferente do
  pretendido — sempre conferir com `find` antes.
- Achar que todo documento de uma coleção precisa ter exatamente os mesmos campos — no MongoDB,
  isso não é garantido automaticamente.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Modelo de documento (flexível) | Módulo 12 — comparado direto com o modelo relacional (tabelas fixas) do SQL Server |
| Documentos como objetos chave-valor | Módulo 13 — é praticamente a mesma sintaxe de um objeto JavaScript/JSON |

## `[REFERÊNCIA]`

- [Documentação oficial do MongoDB](https://www.mongodb.com/docs/)
- MongoDB Cheat Sheet (indicado no material da trilha)
- `apostila-mongo.pdf` e `tarefas-mongo.pdf`, nesta pasta — material de apoio original com mais
  exercícios.

## Checklist de saída

- [ ] Explico a diferença entre o modelo de documento do MongoDB e uma planilha de colunas fixas.
- [ ] Distingo coleção de documento.
- [ ] Escrevo as quatro operações básicas de CRUD (`insertOne`, `find`, `updateOne`,
      `deleteOne`).
- [ ] Sei por que conferir o filtro com `find` antes de um `updateOne`/`deleteOne` é uma boa
      prática, não excesso de cautela.
