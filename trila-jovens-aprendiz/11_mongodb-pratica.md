# Módulo 11 — MongoDB — Prática

> **Objetivo da prática:** construir, passo a passo, o banco de dados de um e-commerce fictício
> (`ecommerce_db`), aplicando CRUD, consultas, índices, modelagem e agregações sobre o mesmo
> projeto até a entrega final.
> **Pré-requisito:** [11_mongodb-teoria.md](11_mongodb-teoria.md)
> **Entregáveis:** um repositório com o `README.md` documentando as decisões tomadas, mais um
> `respostas.md` com os comandos usados em cada tarefa.
> **Formato de entrega:** publicado no GitHub, com README explicando a organização do projeto.

Esta prática não é uma lista de exercícios soltos — é um projeto único (`ecommerce_db`) que você
constrói em camadas, tarefa por tarefa, terminando com um projeto final completo. É o mesmo
banco de dados do começo ao fim.

---

## Exemplo resolvido

Antes de começar a Tarefa 1, veja o raciocínio esperado num passo pequeno: "insira um produto
chamado 'Estojo', preço `15.00`, estoque `30`, categoria `Papelaria`, com as tags `escolar` e
`plastico`".

```js
db.produtos.insertOne({
  nome: "Estojo",
  preco: 15.00,
  estoque: 30,
  categoria: "Papelaria",
  tags: ["escolar", "plastico"]
})
```
Raciocínio: é um único documento novo, então `insertOne` (não `insertMany`); os campos seguem o
padrão já visto na teoria (nome, preco, estoque, categoria) mais o campo `tags`, que é um array —
o MongoDB aceita arrays como valor de campo sem problema, diferente de uma coluna de planilha.

Agora é sua vez, seguindo esse mesmo raciocínio nas tarefas abaixo.

## Tarefas Fundamentais

### Tarefa 1 — Instalação e Configuração

1. Instale o MongoDB na sua máquina (convencional ou Docker — ver `[CLI]` na teoria).
2. Configure um usuário administrador para o banco de dados.
3. Crie um banco de dados chamado `ecommerce_db`.
4. Verifique a conexão usando o MongoDB Compass ou `mongosh`.

### Tarefa 2 — Criação da Estrutura de Dados

1. Crie as coleções `produtos`, `categorias`, `clientes`, `pedidos` e `avaliacoes` no banco
   `ecommerce_db`.
2. Insira pelo menos 5 categorias diferentes de produtos.
3. Documente a estrutura criada em um `README.md`.

### Tarefa 3 — Operações CRUD Básicas

1. Insira pelo menos 15 produtos, distribuídos entre as categorias criadas.
2. Cada produto deve ter: nome, descrição, preço, estoque, categoria, e pelo menos 3 tags.
3. Insira pelo menos 8 clientes com dados completos (nome, email, telefone, endereço).
4. Atualize o estoque de 3 produtos diferentes.
5. Remova um produto que esteja com estoque zerado.
6. Liste todos os produtos em ordem alfabética de nome.

`[ATENÇÃO]` Antes de rodar o `deleteOne` do item 5, confira com `find` que o filtro encontra
exatamente o produto certo — é o mesmo cuidado visto na teoria.

## Tarefas Intermediárias

### Tarefa 4 — Consultas Avançadas

1. Busque produtos por faixa de preço (ex: entre R$ 100 e R$ 500).
2. Encontre produtos que contenham uma palavra específica no nome (usando `$regex`).
3. Busque produtos por categoria e ordene por preço (decrescente).
4. Encontre clientes que moram em uma determinada cidade.
5. Busque produtos que tenham tags específicas.
6. Crie uma consulta que retorne apenas os 5 produtos mais caros.

### Tarefa 5 — Relacionamentos e Documentos Complexos

1. Crie 10 pedidos que relacionem clientes e produtos.
2. Cada pedido deve conter: cliente (referência), data, status, itens (produtos e quantidades),
   valor total.
3. Atualize o estoque automaticamente ao criar um pedido.
4. Para cada pedido, crie pelo menos 2 avaliações de produtos.
5. As avaliações devem ter: produto, cliente, pedido, nota (1-5), comentário e data.
6. Busque pedidos de um cliente específico com todos os detalhes dos produtos (dica: é aqui que
   entra `$lookup`, visto na teoria).

`[TENTE VOCÊ]` Antes do item 2: pedido referencia cliente por id, ou copia os dados do cliente
dentro do documento do pedido? Resposta: referência (`clienteId`) — é a mesma escolha vista na
teoria para relações 1:muitos (um cliente tem muitos pedidos), evitando duplicar os dados do
cliente em cada pedido.

### Tarefa 6 — Índices e Otimização

1. Crie índices para as consultas mais frequentes: nome de produto, categoria+preço, email único
   de cliente, cliente+data de pedido.
2. Analise o desempenho das consultas com e sem índice usando `explain()`.
3. Crie um índice de texto para busca em produtos (nome e descrição).
4. Teste o desempenho com diferentes tipos de consulta e tamanhos de resultado.

## Tarefas Avançadas

### Tarefa 7 — Agregações Básicas

1. Calcule o valor médio dos pedidos.
2. Conte o número de produtos por categoria.
3. Encontre os 3 clientes com maior valor total em pedidos.
4. Calcule o total de vendas por mês.
5. Crie um relatório de produtos mais vendidos.

### Tarefa 8 — Agregações Avançadas

1. Crie um pipeline que mostre a distribuição de notas nas avaliações por categoria de produto.
2. Gere um relatório de vendas por dia da semana e hora do dia.
3. Calcule o tempo médio entre a criação do pedido e sua entrega.
4. Identifique produtos que são frequentemente comprados juntos.
5. Crie um painel com indicadores de desempenho (vendas, ticket médio, produtos mais vistos).

### Tarefa 9 — Exportação e Backup

1. Exporte a coleção de produtos para um arquivo CSV (`mongoexport`).
2. Crie um script de backup automático diário do banco de dados (`mongodump`).
3. Restaure o banco a partir de um backup em uma nova instância MongoDB (`mongorestore`).
4. Crie um script para exportar relatórios de vendas em formato PDF.
5. Implemente um sistema de logs para registrar operações importantes.

### Tarefa 10 — Operações com Docker

1. Crie um `docker-compose.yml` para MongoDB e Mongo Express.
2. Configure persistência de dados com volumes.
3. Implemente um sistema de replicação com 3 instâncias MongoDB.

### Tarefa 11 — Preparação do Projeto

1. Revise o modelo de dados definido nas tarefas anteriores, documentando as decisões de
   embedding x referência tomadas em cada relação.
2. Crie um diagrama de relacionamento entre as coleções.
3. Configure índices otimizados para todos os casos de uso identificados até aqui.
4. Implemente validação de esquema para todas as coleções.

### Tarefa 12 — Relatórios e Analytics

1. Desenvolva relatórios de vendas por período.
2. Crie um sistema de recomendação baseado em compras anteriores.
3. Implemente painéis de métricas para administradores.
4. Crie um sistema de alertas para produtos com estoque baixo.
5. Desenvolva relatórios de comportamento de usuários.

### Tarefa 13 — Entrega e Documentação

1. Documente todas as funcionalidades implementadas.
2. Crie guias de uso para administradores e clientes.
3. Prepare uma apresentação do projeto final.

## Rodando o corretor automático

Nas tarefas fundamentais e intermediárias (1-6), rode o corretor automático disponível em
`mongo-corretor 2.exe.zip`, nesta pasta, para autoverificar suas respostas antes de seguir para
as tarefas avançadas. Se alguma resposta não passar no corretor, revise o raciocínio (não só
copie a resposta certa).

## Critérios de entrega

- Todo o conteúdo publicado em um repositório no GitHub.
- Um `README.md` na raiz do repositório, documentando a estrutura do `ecommerce_db` (coleções,
  campos, decisões de modelagem) — não só "o que rodar", mas "por que foi modelado assim".
- Cada tarefa com os comandos exatos usados, não só a descrição do que fariam.
- Confirmação de que o corretor automático foi rodado nas tarefas 1-6, com o resultado anotado.

## Checklist de entrega

- [ ] Tarefas Fundamentais (1-3) resolvidas — banco criado, estrutura definida, CRUD básico
      funcionando.
- [ ] Tarefas Intermediárias (4-6) resolvidas — consultas avançadas, relacionamentos, índices.
- [ ] Tarefas Avançadas (7-13) resolvidas — agregações, backup, Docker, preparação e entrega do
      projeto final.
- [ ] Corretor automático rodado nas tarefas 1-6, com resultado anotado.
- [ ] Publicado no GitHub com README documentando as decisões de modelagem.
