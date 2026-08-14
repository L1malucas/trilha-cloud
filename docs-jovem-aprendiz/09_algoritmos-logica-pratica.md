---
id: 09_algoritmos-logica-pratica
title: "Módulo 09 — Algoritmos e Lógica de Programação — Prática"
sidebar_position: 91
---

# Módulo 09 — Algoritmos e Lógica de Programação — Prática

> **Objetivo da prática:** implementar algoritmos clássicos de lógica em C++, sem usar métodos
> embutidos da linguagem, documentando o pseudocódigo antes do código.
> **Pré-requisito:** [09_algoritmos-logica-teoria.md](09_algoritmos-logica-teoria.md)
> **Entregáveis:** um arquivo `.cpp` por exercício, com o enunciado (como comentário no topo),
> o pseudocódigo (também como comentário) e o código, nesta ordem, no mesmo arquivo.
> **Formato de entrega:** publicado no GitHub, com README bem organizado explicando a estrutura
> do repositório.

Os enunciados abaixo vêm das apostilas de exercícios já usadas na trilha (`APOSTILA_2.md` e
`renova_exercicios.md`, na pasta `trila-jovens-aprendiz/`).

---

## Exemplo resolvido

**Palíndromos** (Autor: Ubiratan Neto) — uma palavra é um palíndromo se é a mesma lida de trás
pra frente (ex: "arara", "reviver"). Leia uma palavra `S` (só letras minúsculas) e imprima "Sim"
se for palíndromo, "Nao" caso contrário.

Pseudocódigo:
```
leia a palavra S
i ← posição do primeiro caractere (0)
j ← posição do último caractere (comprimento de S menos 1)
enquanto i for menor que j:
    se o caractere na posição i for diferente do caractere na posição j:
        pare: não é palíndromo
    i ← i + 1
    j ← j - 1
se saiu do laço sem parar: é palíndromo
```

Código:
```cpp
#include <iostream>
#include <string>

int main() {
    std::string s;
    std::cin >> s;

    int i = 0;
    int j = s.size() - 1;
    bool ehPalindromo = true;

    while (i < j) {
        if (s[i] != s[j]) {
            ehPalindromo = false;
            break;
        }
        i++;
        j--;
    }

    std::cout << (ehPalindromo ? "Sim" : "Nao") << "\n";
    return 0;
}
```
Narrando: `i` começa no primeiro caractere, `j` no último — os dois "andam um em direção ao
outro". A cada volta do laço, compara o caractere de `i` com o de `j`; se algum par for
diferente, já sabe que não é palíndromo e pode parar (`break`) sem terminar de percorrer a
palavra. Repare que isso **não** usa nenhuma função pronta de "inverter string" — a comparação é
feita caractere a caractere, pelas posições.

## Exercícios

### 1. Altura (Autor: Pedro Vidal)

Três amigos discutem para saber quem é o mais alto. Dado a altura de cada um (três inteiros
diferentes `A`, `B`, `C`, entre 100 e 200 cm, separados por espaço), imprima a altura do maior
dos três.

```
Entrada: 100 150 140    Saída: 150
Entrada: 122 111 103    Saída: 122
```

`[ATENÇÃO]` Sem usar `std::max()` — compare os três valores manualmente, com `if`/`else`.

### 2. Média Ponderada

Em uma disciplina, a nota final é composta por duas provas online (peso 4 cada) e um trabalho
final (peso 2). Leia as três notas (decimais) e calcule a média ponderada, imprimindo com duas
casas decimais.

```
Entrada: 8.0 7.5 9.0    Saída: 8.00
Entrada: 6.5 6.0 6.5    Saída: 6.30
```

Fórmula: `(prova1*4 + prova2*4 + trabalho*2) / 10`. Use `std::fixed` e `std::setprecision(2)`
(do cabeçalho `<iomanip>`) pra formatar a saída com duas casas — isso é formatação de saída, não
um atalho que resolve o cálculo por você, então está liberado.

### 3. Caçando Pokémons

Ash está numa área representada por uma matriz `N x M`. Cada posição tem `0` (sem pokémon) ou um
número `T` diferente de zero (tipo do pokémon ali). Dado a matriz e um tipo `P`, conte quantos
pokémons do tipo `P` existem na matriz.

```
Entrada:
4 4
0 1 0 0
2 0 2 0
0 1 0 0
0 0 0 2
2
Saída: Ash pegou 3 pokemon
```

`[TENTE VOCÊ]` Antes de codar, escreva o pseudocódigo: quantos laços (`for`) você precisa, um
dentro do outro, pra visitar toda posição de uma matriz `N x M`? Resposta: dois — um para as
linhas (0 a N-1), outro aninhado para as colunas (0 a M-1), visitando cada posição `(linha,
coluna)` uma vez.

### 4. Inventário caótico (Autor: Gustavo Amaral)

Jônatas quer saber se um item está no seu inventário. A entrada tem várias linhas com nomes de
itens, terminando quando for lida a palavra `"fim"`. Depois, é dado o nome do item que ele quer
buscar. Imprima `"item encontrado"` se estiver na lista, ou `"voce ainda nao descobriu este
item"` caso contrário.

`[ATENÇÃO]` Sem usar `std::find()` — guarde os itens lidos (pode usar `std::vector` e
`push_back` pra armazenar, isso não resolve a busca por você) e percorra a lista manualmente,
comparando um por um com o item buscado, até achar ou chegar ao fim.

### 5. Desafio — Entregas do Lobo Mau

Chapeuzinho Vermelho atravessa uma estrada de tamanho `T` km para entregar doces. Há pedágios a
cada `D` km (o primeiro pedágio está exatamente no km `D`, igualmente espaçados até o fim da
estrada). Cada km custa `V`, e cada pedágio custa `P`. Calcule o custo total da travessia.

```
Entrada:
60 20
1 10
Saída: 90

Entrada:
100 51
2 50
Saída: 250
```

Pseudocódigo sugerido (sem usar divisão inteira como atalho — pratique o laço):
```
custo ← 0
para km de 1 até T:
    custo ← custo + V
    se km for múltiplo de D:
        custo ← custo + P
imprima custo
```
`[TENTE VOCÊ]` Por que o pedágio do km 60 conta no primeiro exemplo (`T=60, D=20`), mesmo sendo
exatamente o fim da estrada? Resposta: porque o enunciado diz que o pedágio existe em todo
múltiplo de `D` até `T`, incluindo o próprio fim da estrada, se ele coincidir com um múltiplo —
por isso, com `T=60` e `D=20`, há pedágio em `20`, `40` **e** `60`.

## Critérios de entrega

- Todos os exercícios em C++, compilados com `g++` (mesma ferramenta do módulo 08).
- Um arquivo `.cpp` por exercício, com o enunciado e o pseudocódigo como comentário, antes do
  código.
- Nenhum método/função embutido que resolva o problema diretamente foi usado (`std::sort`,
  `std::find`, `std::max`/`std::min` sobre coleções, etc.) — releia o `[ATENÇÃO]` da teoria antes
  de entregar.
- Todo o conteúdo publicado em um repositório no GitHub, com `README.md` explicando a organização.

## Checklist de entrega

- [ ] Exercício 1 (Altura) resolvido sem `std::max()`.
- [ ] Exercício 2 (Média Ponderada) resolvido com a fórmula correta e saída com 2 casas decimais.
- [ ] Exercício 3 (Caçando Pokémons) resolvido com laços aninhados percorrendo a matriz.
- [ ] Exercício 4 (Inventário caótico) resolvido sem `std::find()`.
- [ ] Exercício 5 (Entregas do Lobo Mau) resolvido, testado com os dois exemplos dados.
- [ ] Publicado no GitHub com README.
