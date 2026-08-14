---
id: 04_circuitos-digitais-pratica
title: "Módulo 04 — Circuitos Digitais — Prática"
sidebar_position: 41
---

# Módulo 04 — Circuitos Digitais — Prática

> **Objetivo da prática:** fixar o comportamento das portas lógicas montando tabelas verdade e
> combinando portas para resolver problemas simples.
> **Pré-requisito:** [04_circuitos-digitais-teoria.md](04_circuitos-digitais-teoria.md)
> **Entregáveis:** um arquivo `respostas.md` neste módulo, no seu repositório do GitHub.
> **Formato de entrega:** publicado no GitHub, com README explicando a organização do repositório.

---

## Exercícios

### 1. Tabelas verdade

Monte a tabela verdade completa (todas as combinações de entrada) para:
1. `A AND B`
2. `A OR B`
3. `A XOR B`
4. `NOT A`

### 2. Combinando portas

Monte a tabela verdade de `A AND (B OR C)` para as 8 combinações possíveis de A, B e C.

### 3. XOR sem XOR

O XOR pode ser construído combinando apenas AND, OR e NOT. Monte a expressão lógica equivalente
(dica: `(A OR B) AND NOT (A AND B)`) e prove, com a tabela verdade, que ela produz o mesmo
resultado que XOR.

### 4. Combinacional x sequencial

Explique com suas palavras a diferença entre um circuito combinacional e um sequencial, usando um
exemplo do dia a dia para cada um (por exemplo: um circuito comparador de nível de água x uma
trava de porta com memória de estado — "aberta" ou "fechada").

### 5. Desafio — meio-somador

Monte a tabela verdade completa de um meio-somador (half adder): duas entradas (A, B), duas
saídas (Soma e Carry). Identifique qual porta lógica gera a Soma e qual gera o Carry.

## Critérios de entrega

- Todo o conteúdo publicado em um repositório no GitHub.
- Um `README.md` na raiz do repositório, explicando a organização dos arquivos.
- Cada exercício com o enunciado copiado junto da resposta.
- Tabelas verdade completas — não pule combinações de entrada.

## Checklist de entrega

- [ ] Exercício 1 (tabelas verdade básicas) resolvido para as 4 portas.
- [ ] Exercício 2 (combinação de portas) resolvido com as 8 combinações.
- [ ] Exercício 3 (XOR sem XOR) resolvido com a prova via tabela verdade.
- [ ] Exercício 4 (combinacional x sequencial) explicado com exemplos próprios.
- [ ] Exercício 5 (meio-somador) resolvido com a tabela verdade completa.
