17/03/2025, 16:21 

README 

# **Apostila de Tarefas - Workshop MongoDB** 

Documentação Oficial 

Curso Básico de Mongo - Legendado Diferenças entre NoSQL e SQL 

## **Introdução** 

Esta apostila contém uma série de tarefas práticas para consolidar os conhecimentos adquiridos durante o Workshop de MongoDB. As tarefas estão organizadas em ordem crescente de dificuldade, acompanhando a evolução do curso e culminando no desenvolvimento do projeto final de e-commerce. 

## **Tarefas Fundamentais** 

### **Tarefa 1: Instalação e Configuração** 

1. Instale o MongoDB na sua máquina (escolha entre instalação convencional ou Docker) 

2. Configure um usuário administrador para o banco de dados 

3. Crie um banco de dados chamado `ecommerce_db` 

4. Verifique a conexão usando o MongoDB Compass ou mongosh 

### **Tarefa 2: Criação da Estrutura de Dados** 

1. Crie as seguintes coleções no banco `ecommerce_db` : 

   - `produtos` 

   - `categorias` 

   - `clientes` 

   - `pedidos` 

   - `avaliacoes` 

2. Insira pelo menos 5 categorias diferentes de produtos 

3. Documente a estrutura criada em um arquivo README.md 

### **Tarefa 3: Operações CRUD Básicas** 

1. Insira pelo menos 15 produtos, distribuídos entre as categorias criadas 

2. Cada produto deve ter: nome, descrição, preço, estoque, categoria, e pelo menos 3 tags 

3. Insira pelo menos 8 clientes com dados completos (nome, email, telefone, endereço) 

4. Atualize o estoque de 3 produtos diferentes 

5. Remova um produto que esteja com estoque zerado 

file:///C:/Users/lucas.lima/AppData/Local/Temp/crossnote2025217-12216-1sja9ts.e2hy.html 

1/3 

17/03/2025, 16:21 

README 

6. Liste todos os produtos em ordem alfabética de nome 

## **Tarefas Intermediárias** 

### **Tarefa 4: Consultas Avançadas** 

1. Busque produtos por faixa de preço (ex: entre R 100 _eR_ 500) 

2. Encontre produtos que contenham uma palavra específica no nome (usando regex) 

3. Busque produtos por categoria e ordene por preço (decrescente) 

4. Encontre clientes que moram em uma determinada cidade 

5. Busque produtos que tenham tags específicas 

6. Crie uma consulta que retorne apenas os 5 produtos mais caros 

### **Tarefa 5: Relacionamentos e Documentos Complexos** 

1. Crie 10 pedidos que relacionem clientes e produtos 

2. Cada pedido deve conter: cliente, data, status, itens (produtos e quantidades), valor total 

3. Atualize o estoque automaticamente ao criar um pedido 

4. Para cada pedido, crie pelo menos 2 avaliações de produtos 

5. As avaliações devem ter: produto, cliente, pedido, nota (1-5), comentário e data 

6. Busque pedidos de um cliente específico com todos os detalhes dos produtos 

### **Tarefa 6: Índices e Otimização** 

1. Crie índices para as consultas mais frequentes: 

   - Índice para busca de produtos por nome 

   - Índice para busca de produtos por categoria e preço 

   - Índice único para email de clientes 

   - Índice para busca de pedidos por cliente e data 

2. Analise o desempenho das consultas com e sem índices usando explain() 

3. Crie um índice de texto para busca em produtos (nome e descrição) 

4. Teste o desempenho com diferentes tipos de consultas e tamanhos de resultado 

## **Tarefas Avançadas** 

### **Tarefa 7: Agregações Básicas** 

1. Calcule o valor médio dos pedidos 

2. Conte o número de produtos por categoria 

3. Encontre os 3 clientes com maior valor total em pedidos 

4. Calcule o total de vendas por mês 

file:///C:/Users/lucas.lima/AppData/Local/Temp/crossnote2025217-12216-1sja9ts.e2hy.html 

2/3 

17/03/2025, 16:21 

README 

5. Crie um relatório de produtos mais vendidos 

### **Tarefa 8: Agregações Avançadas** 

1. Crie um pipeline que mostre a distribuição de notas nas avaliações por categoria de produto 

2. Gere um relatório de vendas por dia da semana e hora do dia 

3. Calcule o tempo médio entre a criação do pedido e sua entrega 

4. Identifique produtos que são frequentemente comprados juntos 

5. Crie um dashboard com indicadores de desempenho (vendas, ticket médio, produtos mais vistos) 

### **Tarefa 9: Exportação e Backup** 

1. Exporte a coleção de produtos para um arquivo CSV 

2. Crie um script de backup automático diário do banco de dados 

3. Restaure o banco a partir de um backup em uma nova instância MongoDB 

4. Crie um script para exportar relatórios de vendas em formato PDF 

5. Implemente um sistema de logs para registrar operações importantes 

### **Tarefa 10: Operações com Docker** 

1. Crie um docker-compose.yml para MongoDB e Mongo Express 

2. Configure persistência de dados com volumes 

3. Implemente um sistema de replicação com 3 instâncias MongoDB 

### **Tarefa 11: Preparação do Projeto** 

2. Crie um diagrama de relacionamento entre as coleções 

3. Configure índices otimizados para todos os casos de uso 

4. Implemente validação de esquema para todas as coleções 

### **Tarefa 12: Relatórios e Analytics** 

1. Desenvolva relatórios de vendas por período 

2. Crie um sistema de recomendação baseado em compras anteriores 

3. Implemente dashboards de métricas para administradores 

4. Crie um sistema de alertas para produtos com estoque baixo 

5. Desenvolva relatórios de comportamento de usuários 

### **Tarefa 13: Entrega e Documentação** 

1. Documente todas as funcionalidades implementadas 

2. Crie guias de uso para administradores e clientes 

3. Prepare uma apresentação do projeto final 

file:///C:/Users/lucas.lima/AppData/Local/Temp/crossnote2025217-12216-1sja9ts.e2hy.html 

3/3 

