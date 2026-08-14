---
id: 12_sqlserver-pratica
title: "Módulo 12 — SQL Server — Prática"
sidebar_position: 121
---

# Módulo 12 — SQL Server — Prática

> **Objetivo da prática:** escrever consultas SQL reais, aplicando `SELECT`, `WHERE` e `JOIN`
> sobre cenários inspirados nos materiais de apoio deste módulo.
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
abaixo é a resposta. Esse é o padrão exigido em todo arquivo `.sql` que você entregar.

## Exercícios

Use como base o material `apostila_sqlserver.pdf` (teoria com cenários inspirados num aplicativo
de transporte) e `sqlserver_tarefas.pdf` (tarefas com cenários inspirados numa rede profissional),
ambos já presentes em `trila-jovens-aprendiz/`. Os cenários são simulados — não representam
necessariamente uma situação real de mercado.

### 1. `01_consultas-basicas.sql`

Escreva consultas `SELECT` (com `WHERE` quando fizer sentido) para pelo menos 3 tarefas retiradas
de `sqlserver_tarefas.pdf`, seguindo o formato do exemplo resolvido (comentário + query).

### 2. `02_joins.sql`

Escreva pelo menos 2 consultas com `JOIN`, combinando duas tabelas do cenário da apostila.
Confira, antes de entregar, se você incluiu a condição `ON` em cada uma.

### 3. `03_modelagem.sql`

Escolha um cenário simples (pode ser dos materiais de apoio ou inventado por você) com pelo menos
duas entidades relacionadas (ex: `alunos` e `matriculas`). Escreva, como comentário, qual seria a
chave primária de cada tabela e qual seria a chave estrangeira que conecta as duas — não precisa
criar as tabelas de verdade, só documentar a modelagem e justificar a escolha.

## Critérios de entrega

- Um arquivo `.sql` por bloco de tarefas, nomeado como indicado acima.
- Cada tarefa dentro do arquivo com a descrição em comentário SQL, logo antes da query.
- Todo o conteúdo publicado em um repositório no GitHub, com `README.md` explicando a organização
  dos arquivos.

## Checklist de entrega

- [ ] `01_consultas-basicas.sql` com pelo menos 3 tarefas, cada uma com descrição + query.
- [ ] `02_joins.sql` com pelo menos 2 `JOIN`s, cada um com a condição `ON` presente.
- [ ] `03_modelagem.sql` com a modelagem de chave primária/estrangeira documentada e justificada.
- [ ] Publicado no GitHub com README.
