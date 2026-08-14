---
id: 09_algoritmos-logica-teoria
title: "Módulo 09 — Algoritmos e Lógica de Programação"
sidebar_position: 90
---

# Módulo 09 — Algoritmos e Lógica de Programação

> **Objetivo:** desenvolver o raciocínio de decompor um problema em passos precisos — pseudocódigo
> antes de código — e aplicar as estruturas de controle pra resolver problemas clássicos.
> **Pré-requisitos:** Módulo 08 (Linguagens de Programação).
> **Tempo de referência:** 4 a 6 horas.
> **Prática correspondente:** [09_algoritmos-logica-pratica.md](09_algoritmos-logica-pratica.md)

---

## Por que isso importa

No módulo 08 você ganhou um idioma pra dar instruções ao computador (C++). Este módulo ensina o
que dizer nesse idioma — como pensar um problema até virar uma sequência de passos que o
computador consegue seguir. Esse raciocínio, muito mais do que decorar sintaxe, é o que separa
quem programa resolvendo problemas de quem só copia trechos prontos sem entender por que
funcionam.

Este módulo também é a base do curso de Lógica de Programação do professor Gustavo Guanabara
(recomendado como material audiovisual complementar, disponível no YouTube) e reaproveita
apostilas já disponíveis nesta pasta (`APOSTILA_2.pdf`, `lista de exercio.webp`,
`renova_exercicios.pdf`) — mas o conteúdo escrito aqui ensina por si só, sem depender de assistir
o curso antes.

## `[TEORIA]` Pensamento algorítmico

Você já segue algoritmos todos os dias sem chamá-los assim: uma receita de cozinha (passos em
ordem até chegar no prato pronto), instruções de trajeto até a casa de alguém ("vire aqui, siga
200m, vire ali"). Um **algoritmo** é exatamente isso, formalizado: uma sequência ordenada e
precisa de passos que resolve um problema — precisa o suficiente para que qualquer pessoa (ou
qualquer computador) seguindo-a exatamente chegue ao mesmo resultado.

A habilidade central deste módulo não é "saber a sintaxe de uma linguagem" — é quebrar um
problema grande em passos pequenos o bastante pra que cada um seja trivial de traduzir em código.

## `[TEORIA]` Pseudocódigo antes de código

Pseudocódigo é escrever os passos do algoritmo em linguagem quase natural, sem se preocupar com a
sintaxe exata de C++ ou qualquer outra linguagem. A vantagem de escrever pseudocódigo primeiro é
separar dois problemas diferentes: "o que fazer" (lógica) de "como escrever isso numa linguagem
específica" (sintaxe) — assim, um erro de lógica fica visível antes mesmo de você abrir o editor
de código.

**Exemplo narrado — encontrar o maior número de uma lista, em pseudocódigo:**
```
maior ← primeiro número da lista
para cada número da lista, a partir do segundo:
    se número > maior:
        maior ← número
retorne maior
```
Repare que cada linha é uma decisão de raciocínio, não uma linha de código: "comece assumindo que
o primeiro já é o maior", "compare com cada um dos outros", "se achar algo maior, atualize sua
resposta".

`[TENTE VOCÊ]` Escreva, em pseudocódigo, os passos para verificar se um número é par. Resposta
possível: `se o resto da divisão do número por 2 for igual a 0, então é par; senão, é ímpar`.

## `[TEORIA]` As três estruturas de controle, aplicadas

Revisitando o módulo 08 — sequência, decisão, repetição — mas agora combinadas pra resolver um
problema completo.

**Exemplo narrado — verificar se um número é primo:** um número é primo se só é divisível por 1 e
por ele mesmo. O algoritmo: (sequência) leia o número; (repetição) teste, um por um, se ele é
divisível por cada número de 2 até ele menos 1; (decisão) se algum desses testes for divisível
sem resto, ele não é primo — pode parar de testar e responder "não"; se nenhum for, ele é primo.
Repare como as três estruturas trabalham juntas: a repetição fornece os candidatos a divisor, a
decisão avalia cada um, e assim que a decisão encontra um divisor, o algoritmo já pode parar
(não precisa testar os que sobraram).

## `[ATENÇÃO]` Proibido usar métodos embutidos da linguagem

Nos exercícios deste módulo (e nas apostilas de apoio), **é proibido usar métodos ou funções
prontas da linguagem que já resolvem o problema por você** — por exemplo, usar `std::find()` do
C++ pra buscar um elemento numa lista, ou `std::max_element()` pra achar o maior valor. O
objetivo do exercício não é buscar ou comparar valores usando uma função pronta da biblioteca
padrão — é entender e implementar **você mesmo** o algoritmo por trás disso.

O que **não** fazer:
```cpp
auto it = std::find(itens.begin(), itens.end(), busca);  // resolve sem ensinar nada sobre o algoritmo
```
O que fazer no lugar: implementar a busca manualmente (como no exercício "Inventário caótico", que
você vai praticar no módulo de prática), percorrendo a lista item por item com um `for`,
comparando cada um com o que está sendo buscado, até achar ou chegar ao fim.

**Linguagem dos exercícios deste módulo**: C++ (a mesma introduzida no módulo 08).

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Pular direto pro código sem escrever o pseudocódigo primeiro — geralmente resulta em lógica
  confusa que precisa ser refeita do zero.
- Usar um método embutido da linguagem pra resolver o exercício, violando a regra da trilha.
- Confundir "condição de parada" (quando o `while` deve parar) com "nunca parar" — sempre revisar
  se a condição do laço eventualmente vira falsa.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Pseudocódigo / estruturas de controle | Todos os módulos técnicos seguintes (10-13) — cada exercício pede raciocínio antes de código |
| Implementar algoritmos manualmente | Módulos 11/12 (bancos de dados) — entender por que um índice ou um JOIN existe usa o mesmo raciocínio de "como encontrar algo numa coleção de dados" |

## `[REFERÊNCIA]`

- Curso de Lógica de Programação — Prof. Gustavo Guanabara (YouTube).
- Material de apoio já disponível na pasta: `APOSTILA_2.pdf`, `lista de exercio.webp`,
  `renova_exercicios.pdf`.

## Checklist de saída

- [ ] Decomponho um problema em passos pequenos antes de escrever qualquer código.
- [ ] Escrevo pseudocódigo para um problema simples antes de traduzir para uma linguagem.
- [ ] Identifico as três estruturas de controle dentro de um algoritmo dado.
- [ ] Implemento um algoritmo (ex: busca do maior valor, ordenação) sem usar métodos embutidos da
      linguagem.
