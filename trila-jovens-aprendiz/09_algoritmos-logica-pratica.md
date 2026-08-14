# Módulo 09 — Algoritmos e Lógica de Programação — Prática

> **Objetivo da prática:** implementar algoritmos clássicos de lógica, sem usar métodos embutidos
> da linguagem, documentando o pseudocódigo antes do código.
> **Pré-requisito:** [09_algoritmos-logica-teoria.md](09_algoritmos-logica-teoria.md)
> **Entregáveis:** um arquivo por exercício, na linguagem de sua escolha entre C/C++, Python,
> Java ou Pascal, com pseudocódigo, código e explicação no mesmo arquivo.
> **Formato de entrega:** publicado no GitHub, com README bem organizado explicando a estrutura
> do repositório.

---

## Exemplo resolvido

**Somar os dígitos de um número** (ex: `458` → `4 + 5 + 8 = 17`).

Pseudocódigo:
```
total ← 0
enquanto número > 0:
    último_dígito ← resto da divisão de número por 10
    total ← total + último_dígito
    número ← parte inteira da divisão de número por 10
retorne total
```

Código (Python, sem usar conversão pra string como atalho — o objetivo é praticar o raciocínio
aritmético, não um truque de manipulação de texto):
```python
numero = 458
total = 0
while numero > 0:
    ultimo_digito = numero % 10
    total = total + ultimo_digito
    numero = numero // 10
print(total)  # 17
```
Repare que `sum(int(d) for d in str(numero))` chegaria no mesmo resultado, mas usando um atalho
de string que não pratica o raciocínio de "descascar" os dígitos aritmeticamente — por isso não é
a resposta esperada aqui, mesmo funcionando.

## Exercícios

### 1. Verificar se um número é primo

Sem usar nenhuma função pronta de biblioteca para isso. Descreva o pseudocódigo antes do código
(o exemplo narrado da teoria já dá o caminho).

### 2. Ordenar uma lista com bubble sort

Implemente o algoritmo de ordenação bubble sort manualmente — sem usar `.sort()`, `sorted()` ou
equivalente. Lembre a lógica: percorra a lista comparando pares vizinhos, trocando de posição
quando estiverem fora de ordem, repetindo até não haver mais trocas necessárias.

### 3. Encontrar o maior valor de uma lista

Sem usar `max()` ou equivalente — percorra a lista manualmente, comparando cada elemento com o
maior encontrado até então (o mesmo raciocínio do exemplo narrado na teoria).

### 4. Inverter uma string

Sem usar slicing reverso (`[::-1]`) nem métodos prontos de inverter — percorra os caracteres
manualmente, construindo o resultado invertido caractere por caractere.

### 5. Desafio — contar palavras repetidas

Dada uma frase, conte quantas vezes cada palavra aparece, sem usar uma função de contagem pronta
(como `Counter`). Pode usar um dicionário comum para guardar as contagens, mas a lógica de
"encontrei essa palavra, incremento o contador dela" deve ser sua.

## Critérios de entrega

- Linguagem escolhida entre as permitidas (C/C++, Python, Java, Pascal).
- Um arquivo por exercício, com a descrição da questão, o pseudocódigo e o código, nesta ordem.
- Nenhum método/função embutido que resolva o problema diretamente foi usado — releia o
  `[ATENÇÃO]` da teoria antes de entregar.
- Todo o conteúdo publicado em um repositório no GitHub, com `README.md` explicando a organização.

## Checklist de entrega

- [ ] Exercício 1 (número primo) resolvido com pseudocódigo e código.
- [ ] Exercício 2 (bubble sort) resolvido sem usar ordenação embutida.
- [ ] Exercício 3 (maior valor) resolvido sem usar `max()`/equivalente.
- [ ] Exercício 4 (inverter string) resolvido sem slicing reverso/método pronto.
- [ ] Exercício 5 (contagem de palavras) resolvido com lógica de contagem própria.
- [ ] Publicado no GitHub com README.
