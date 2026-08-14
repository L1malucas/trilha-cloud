# Módulo 11 — MongoDB — Prática

> **Objetivo da prática:** aplicar as quatro operações de CRUD sobre uma coleção fictícia, e
> validar as respostas com o corretor automático antes de entregar.
> **Pré-requisito:** [11_mongodb-teoria.md](11_mongodb-teoria.md)
> **Entregáveis:** um arquivo `respostas.md` neste módulo, no seu repositório do GitHub.
> **Formato de entrega:** publicado no GitHub, com README explicando a organização do repositório.

---

## Exemplo resolvido

Coleção `usuarios`, com um documento de exemplo:
```json
{ "_id": 1, "nome": "Beatriz", "idade": 28, "cidade": "Recife" }
```

**Tarefa:** inserir um novo usuário chamado "Carlos", 34 anos, de "Salvador", e depois buscar
todos os usuários com mais de 30 anos.

```js
db.usuarios.insertOne({ nome: "Carlos", idade: 34, cidade: "Salvador" })
db.usuarios.find({ idade: { $gt: 30 } })
```
Raciocínio: a inserção usa `insertOne` porque é um único documento novo; a busca usa `find` com
o filtro `{ idade: { $gt: 30 } }` — `$gt` significa "greater than", ou seja, "idade maior que 30".

Agora é sua vez, seguindo o mesmo raciocínio.

## Exercícios

Use uma coleção `produtos`, com estes documentos de partida:
```json
{ "_id": 1, "nome": "Caderno", "preco": 12.90, "estoque": 40 }
{ "_id": 2, "nome": "Caneta", "preco": 2.50, "estoque": 120 }
{ "_id": 3, "nome": "Mochila", "preco": 89.90, "estoque": 8 }
```

### 1. Inserir

Escreva o comando para inserir um novo produto: "Estojo", preço `15.00`, estoque `30`.

### 2. Buscar

Escreva o comando para buscar todos os produtos com `preco` menor que `20`.

### 3. Atualizar

Escreva o comando para atualizar o estoque da "Mochila" para `5`, usando `updateOne`. Antes de
escrever o `updateOne`, escreva também o `find` que você usaria para conferir que o filtro
encontra exatamente o produto certo.

### 4. Apagar

Escreva o comando para remover o produto "Caneta" da coleção, usando `deleteOne`.

**Critério de aceite:** cada exercício tem o comando exato (não só a descrição do que ele faria),
e o exercício 3 inclui o `find` de conferência antes do `updateOne`.

## Rodando o corretor automático

Antes de entregar, rode o corretor automático disponível em `mongo-corretor 2.exe.zip`, nesta
pasta, para autoverificar suas respostas. Se alguma resposta não passar no corretor, revise o
raciocínio (não só copie a resposta certa) antes de seguir para a entrega.

## Critérios de entrega

- Todo o conteúdo publicado em um repositório no GitHub.
- Um `README.md` na raiz do repositório, explicando a organização dos arquivos.
- Cada exercício com o enunciado copiado junto da resposta.
- Confirmação de que o corretor automático foi rodado (anote o resultado no `respostas.md`).

## Checklist de entrega

- [ ] Exercício 1 (inserir) resolvido.
- [ ] Exercício 2 (buscar) resolvido.
- [ ] Exercício 3 (atualizar) resolvido, com o `find` de conferência incluído.
- [ ] Exercício 4 (apagar) resolvido.
- [ ] Corretor automático (`mongo-corretor 2.exe.zip`) rodado, com o resultado anotado.
- [ ] Publicado no GitHub com README.
