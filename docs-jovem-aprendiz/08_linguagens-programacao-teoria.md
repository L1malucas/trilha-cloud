---
id: 08_linguagens-programacao-teoria
title: "Módulo 08 — Linguagens de Programação"
sidebar_position: 80
---

# Módulo 08 — Linguagens de Programação

> **Objetivo:** entender como um código-fonte escrito em texto legível se transforma nas
> instruções binárias que a CPU realmente executa, e por que a escolha de linguagem carrega
> trade-offs concretos.
> **Pré-requisitos:** Módulo 05 (Arquitetura de Computadores).
> **Tempo de referência:** 3 a 4 horas.
> **Prática correspondente:** [08_linguagens-programacao-pratica.md](08_linguagens-programacao-pratica.md)

---

## Por que isso importa

No módulo 05 você viu o ciclo fetch-decode-execute: a CPU só entende instrução de máquina —
sequências binárias, específicas do processador. Mas você nunca escreve código em binário; escreve
em palavras como `se`, `soma`, `repita`. Como um texto legível chega a virar aquelas instruções
binárias que a Unidade de Controle busca e decodifica? Este módulo responde essa pergunta, e
prepara o terreno pra você escrever seus primeiros algoritmos de verdade no módulo 09.

## `[TEORIA]` Compiladores e interpretadores

Existem dois caminhos principais pra transformar código-fonte em algo que a máquina executa.

Um **compilador** traduz o programa inteiro, de uma vez, antes de qualquer execução começar — o
resultado é um arquivo executável, em instruções de máquina, que depois roda sozinho, direto no
hardware, sem precisar do compilador presente. Um **interpretador** faz o oposto: lê e executa o
código linha por linha, traduzindo e rodando ao mesmo tempo, sem gerar um executável separado —
precisa do interpretador presente toda vez que o programa roda.

A analogia ajuda a fixar: compilar é como traduzir um livro inteiro pra outro idioma antes de
entregar pra alguém ler; interpretar é como um intérprete simultâneo traduzindo frase por frase
enquanto a pessoa fala, ao vivo.

O trade-off é direto: código compilado roda mais rápido (a tradução já foi feita antes, uma única
vez), mas qualquer mudança exige recompilar antes de rodar de novo. Código interpretado é mais
ágil pra testar (edita e roda na hora), mas paga o custo de traduzir de novo a cada execução.

`[TENTE VOCÊ]` Você mudou uma linha de um programa escrito numa linguagem compilada. O que
precisa acontecer antes de rodar a versão nova? Resposta: recompilar — gerar um executável novo a
partir do código atualizado. Rodar o executável antigo mostraria o comportamento de antes da
mudança.

## `[TEORIA]` Variáveis: gavetas nomeadas na memória

Lembra do módulo 03: um número, dentro do computador, é uma sequência de bits guardada na
memória. Uma **variável** é só um nome que você dá pra uma dessas posições de memória, pra não
precisar lembrar o endereço exato — é uma gaveta com etiqueta, em vez de uma gaveta numerada.

Em uma linguagem de tipagem estática (como C++), declarar o **tipo** da variável (`int`, `float`,
`char`) diz ao compilador quantos bits reservar naquela gaveta, e como interpretar o conteúdo
dela. Um `int` normalmente usa 32 bits — e, como você viu no módulo 03, `n` bits representam `2ⁿ`
valores possíveis, não um número ilimitado.

`[ATENÇÃO]` Se um cálculo tentar guardar um valor maior do que o tipo suporta, acontece
**overflow** — em C++, isso não gera erro nem aviso: o valor simplesmente "dá a volta" e vira
outro número, silenciosamente. É o mesmo overflow que você já foi avisado a respeito no módulo
03, agora acontecendo de verdade dentro de um programa.

## `[TEORIA]` Comandos básicos: sequência, decisão, repetição

Toda lógica de programação, por mais complexa que pareça, é construída com só três blocos:

- **Sequência**: passos executados em ordem, um depois do outro — como os passos numerados de uma
  receita.
- **Decisão**: um caminho ou outro, dependendo de uma condição — "se está chovendo, leve
  guarda-chuva" (a mesma lógica condicional que você já formalizou como porta lógica no módulo
  04, agora expressa em código com `if`/`else`).
- **Repetição**: repetir um passo várias vezes, até uma condição parar de valer — "bata o ovo até
  a massa ficar homogênea" (`for`/`while`).

`[TENTE VOCÊ]` Que estrutura de controle você usaria para "leia 10 números digitados pelo
usuário, um de cada vez"? Resposta: repetição (`for`, rodando 10 vezes) — o mesmo passo (ler um
número) se repete um número definido de vezes.

## `[TEORIA]` C++ como linguagem de exemplo

Este módulo usa **C++** como veículo de exemplo — uma linguagem compilada, de tipagem estática,
que mantém a conexão direta com o hardware que você estudou nos módulos 03 a 05 (tipos com
tamanho fixo em bits, sem camadas extras escondendo isso de você), e é a mesma linguagem que você
vai usar nos exercícios de lógica do módulo 09.

**Exemplo narrado — um programa mínimo:**
```cpp
#include <iostream>

int main() {
    int idade;
    std::cout << "Digite sua idade: ";
    std::cin >> idade;
    std::cout << "Você terá " << idade + 1 << " anos no ano que vem.\n";
    return 0;
}
```
Narrando: `int idade;` reserva a gaveta de memória (32 bits, tipo inteiro); `std::cin >> idade`
lê o valor digitado do teclado e guarda nela; `std::cout <<` usa o valor guardado pra montar a
mensagem de saída, somando `1` antes de exibir. O `std::` na frente de `cout`/`cin` só diz "isso
vem da biblioteca padrão (`std`)" — mais sobre isso não é necessário agora, mas vai reaparecer
sempre que você usar recursos prontos da linguagem.

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Esquecer de recompilar depois de editar o código, e testar sem perceber que ainda está rodando
  a versão antiga.
- Escolher um tipo pequeno demais para o valor esperado, sem considerar o risco de overflow.
- Confundir decisão (`if`, um caminho ou outro) com repetição (`while`, o mesmo caminho várias
  vezes) na hora de montar o raciocínio de um algoritmo.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Sequência, decisão, repetição | Módulo 09 — construção de algoritmos completos |
| Tipos e overflow | Reforça o módulo 03, agora dentro de um programa real |
| C++ como linguagem-base | A linguagem usada nos exercícios do módulo 09 |

## `[REFERÊNCIA]`

- SEBESTA, Robert W. *Conceitos de Linguagens de Programação*, 5ª ed., Bookman, 2003.

## Checklist de saída

- [ ] Explico a diferença entre compilador e interpretador, com o trade-off de cada um.
- [ ] Explico o que é uma variável e por que o tipo dela importa, ligando a overflow do módulo 03.
- [ ] Identifico as três estruturas de controle básicas (sequência, decisão, repetição) num
      programa dado.
- [ ] Escrevo, compilo e executo um programa simples em C++, com variável, leitura de entrada e
      saída.
