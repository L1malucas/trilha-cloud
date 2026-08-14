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

Todos os 20 exercícios abaixo vêm das duas apostilas de exercícios já usadas na trilha
(`APOSTILA_2.md` e `renova_exercicios.md`, na pasta `trila-jovens-aprendiz/`) — nenhum foi
inventado. Um deles (COUNTERSTRIKE) teve o enunciado parcialmente perdido na conversão de PDF
para Markdown; ele foi reconstruído com uma nota explícita, marcada onde aparece.

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

### Bloco 1 — Fundamentais

#### 1. Altura (Autor: Pedro Vidal)

Três amigos discutem para saber quem é o mais alto. Dado a altura de cada um (três inteiros
diferentes `A`, `B`, `C`, entre 100 e 200 cm, separados por espaço), imprima a altura do maior
dos três.

```
Entrada: 100 150 140    Saída: 150
Entrada: 100 137 140    Saída: 140
Entrada: 122 111 103    Saída: 122
```

`[ATENÇÃO]` Sem usar `std::max()` — compare os três valores manualmente, com `if`/`else`.

#### 2. Drone da Amazônia

A loja virtual Amazônia faz entregas com drones. Dadas as coordenadas de entrega (`X1`, `Y1`, uma
linha) e as coordenadas atuais do drone (`X2`, `Y2`, outra linha, `1 <= X1,Y1,X2,Y2 <= 1000`),
imprima "Soltar pacote" se as coordenadas forem iguais, ou "Nao soltar pacote" caso contrário.

```
Entrada:
5 20
5 20
Saída: Soltar pacote

Entrada:
3 4
2 4
Saída: Nao soltar pacote
```

#### 3. Exame Chunin (Autor: Joab Guimarães)

Na Aldeia da Folha, o trio de Naruto, Sasuke e Sakura precisa de dois pergaminhos **diferentes**
para se classificar. Dado o tipo de cada pergaminho que possuem (`P1` e `P2`, cada um em uma
linha — `"A"` azul, `"B"` branco, ou `"N"` sem pergaminho), imprima "classificado" se os dois
pergaminhos forem de tipos diferentes e nenhum for `"N"`, ou "eliminado" caso contrário.

```
Entrada:
A
B
Saída: classificado

Entrada:
B
B
Saída: eliminado

Entrada:
A
N
Saída: eliminado
```

#### 4. Contabilizando Pokémons (Autor: João Pedro Rodrigues)

A Pokédex registra Pokémons de Kanto (`K`), Johto (`J`) e Hoenn (`H`). Dado o total já registrado
de cada região (uma linha, três inteiros `K J H`, `0 <= K,J,H <= 100`) e a quantidade de novos
Pokémons capturados em cada região (outra linha, mesma ordem), imprima o novo total de cada
região, na ordem `K J H`.

```
Entrada:
92 40 54
1 0 0
Saída: 93 40 54

Entrada:
12 1 0
0 2 2
Saída: 12 3 2
```

#### 5. Escolha do Campeão

Lucas quer jogar com o campeão de maior nível de poder entre os `N` que ele mais gosta
(`1 < N < 100`). Dado `N` e, em seguida, `N` linhas com o nível de poder `P` de cada campeão
(`0 <= P <= 10000`), imprima o maior nível de poder.

```
Entrada:
3
1500
3600
500
Saída: 3600

Entrada:
7
300
5200
540
729
3567
480
4000
Saída: 5200
```

`[ATENÇÃO]` Sem usar `std::max_element()` — percorra os `N` valores com um `for`, guardando o
maior visto até agora numa variável (a mesma lógica do Exercício 1, só que generalizada pra `N`
valores lidos em laço em vez de só 3 valores fixos).

### Bloco 2 — Intermediários

#### 6. Média Ponderada

Em uma disciplina, a nota final é composta por duas provas online (peso 4 cada) e um trabalho
final (peso 2). Leia as três notas (decimais) e calcule a média ponderada, imprimindo com duas
casas decimais.

```
Entrada: 8.0 7.5 9.0    Saída: 8.00
Entrada: 6.5 6.0 6.5    Saída: 6.30
Entrada: 5.0 10.0 8.0   Saída: 7.60
```

Fórmula: `(prova1*4 + prova2*4 + trabalho*2) / 10`. Use `std::fixed` e `std::setprecision(2)`
(do cabeçalho `<iomanip>`) pra formatar a saída com duas casas — isso é formatação de saída, não
um atalho que resolve o cálculo por você, então está liberado.

#### 7. Continha

Resolva a expressão `((A + B) * (C - D) * (E + F)) / 2`, dados os seis inteiros `A B C D E F`
(`0 <= cada um <= 100`), e imprima `"Eu sou FERA nas continhas e o resultado é "` seguido do
resultado, como número real com uma casa decimal.

```
Entrada: 7 3 15 30 0 2      Saída: Eu sou FERA nas continhas e o resultado é -150.0
Entrada: 1 2 10 5 2 2       Saída: Eu sou FERA nas continhas e o resultado é 30.0
```

#### 8. Caçando Pokémons

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

Entrada:
5 10
0 1 0 0 0 3 0 0 0 0
0 2 0 0 0 1 0 0 0 2
0 3 0 0 0 0 2 0 0 0
8 0 1 0 0 3 0 8 0 0
0 0 0 0 0 0 0 0 1 0
1
Saída: Ash pegou 4 pokemon
```

`[TENTE VOCÊ]` Antes de codar, escreva o pseudocódigo: quantos laços (`for`) você precisa, um
dentro do outro, pra visitar toda posição de uma matriz `N x M`? Resposta: dois — um para as
linhas (0 a N-1), outro aninhado para as colunas (0 a M-1), visitando cada posição `(linha,
coluna)` uma vez.

#### 9. Inventário caótico (Autor: Gustavo Amaral)

Jônatas quer saber se um item está no seu inventário. A entrada tem várias linhas com nomes de
itens, terminando quando for lida a palavra `"fim"`. Depois, é dado o nome do item que ele quer
buscar. Imprima `"item encontrado"` se estiver na lista, ou `"voce ainda nao descobriu este
item"` caso contrário.

`[ATENÇÃO]` Sem usar `std::find()` — guarde os itens lidos (pode usar `std::vector` e
`push_back` pra armazenar, isso não resolve a busca por você) e percorra a lista manualmente,
comparando um por um com o item buscado, até achar ou chegar ao fim.

#### 10. Vamos jogar um jogo (Autor: Danilo de A. Peleteiro)

Você foi capturado por Jigsaw. Dada uma frase `S` (primeira linha) e, na segunda linha, um
inteiro `Q` (`1 <= Q <= 30`) seguido de uma palavra `P`, conte quantas vezes `P` aparece em `S`
(todas as letras minúsculas, ignorando espaços em branco ao contar). Imprima a contagem numa
linha, e depois `"SIM!"` se a contagem for igual a `Q`, ou `"NAO!"` caso contrário.

```
Entrada:
eu quero jogar um jogo jogando limpo
3 jog
Saída:
3
SIM!

Entrada:
xhuisyd xnzyxe nxnzzz zx x ify zzuzzzz z zjx
4 zz
Saída:
6
NAO!
```

`[ATENÇÃO]` Sem usar `std::string::find()` num laço como atalho pronto — monte a string sem
espaços você mesmo (percorrendo caractere a caractere e copiando só os que não são espaço) e
depois compare manualmente, posição por posição, se a palavra `P` aparece a partir de cada
posição.

#### 11. Faxina (Autor: Gabriel Dahia)

Você quer se livrar de livros com título muito consonantal. Dado `N` e `T` (número de livros e
máximo de consoantes permitido), e depois `N` títulos (só letras minúsculas e espaços, até 20
símbolos), imprima para cada um `0` se deve ser doado (mais de `T` consoantes) ou `1` se deve
ficar na estante.

```
Entrada:
3 4
harry potter
senhor dos aneis
aleph
Saída:
0
0
1
```

`[ATENÇÃO]` Sem usar nenhuma função pronta de "contar consoantes" — percorra cada título
caractere a caractere, e para cada letra que não for `a,e,i,o,u` (e não for espaço), incremente
um contador seu.

#### 12. Campo de abóboras

Hagrid pediu ajuda a Harry e Ron pra colher abóboras num campo `N x N`, onde cada posição tem o
peso de uma abóbora. Harry colhe uma linha inteira (da esquerda pra direita); Ron colhe uma
coluna inteira (de cima pra baixo). No ponto de intersecção das duas, a abóbora vai pra quem
chegar primeiro nela (mais perto do seu ponto de início); em caso de empate, fica com Ron. Dado
`N`, a matriz de pesos, e a linha `X` de Harry e a coluna `Y` de Ron (`0 <= X,Y < N`), imprima o
peso total colhido por Harry e, na linha seguinte, o de Ron.

```
Entrada:
4
1 2 3 4
5 6 7 8
1 3 5 7
2 4 6 8
1 2
Saída:
Harry 19
Ron 21
```

`[TENTE VOCÊ]` Antes de codar: o ponto de intersecção fica na posição `(X, Y)` da matriz — ele
entra na soma de Harry, de Ron, ou em nenhuma das duas somas "normais"? Resposta: em nenhuma das
duas somas diretas — ele precisa de uma regra própria (quem está mais perto dele, com empate
para Ron), separada da soma do resto da linha/coluna.

#### 13. Xeroque Rolmes (Autora: Laila Mota)

Xeroque Rolmes encontrou 6 palavras coladas na parede perto de um cofre — a quantidade de letras
de cada palavra é um dígito da senha. Dadas as 6 palavras (uma por linha), imprima a senha (os 6
dígitos, na ordem das palavras).

```
Entrada:
sh
embhtots
m
qgexyzbcu
wwhzzw
rdfxs
Saída: 281965
```

#### 14. Fazendo um gol (Autor: Julio Cesar)

Lucas quer saber se um chute vai resultar em gol. Na primeira linha, as direções do zagueiro `z`
e do goleiro `g` (cada uma `'e'` ou `'d'`); na segunda linha, as direções de drible `d` do
atacante e de chute `c`. Regras: se `z == d`, o atacante é bloqueado (imprime só "Bloqueado"); se
`z != d`, o atacante dribla (imprime "Driblado" na primeira linha) e então, se `g == c`, o
goleiro pega (imprime "...e o goleiro pega" na segunda linha), senão é gol (imprime "Gol" na
segunda linha).

```
Entrada:
e e
d d
Saída:
Driblado
Gol

Entrada:
e e
e d
Saída:
Driblado
...e o goleiro pega

Entrada:
d d
d c
Saída: Bloqueado
```

*(Os exemplos acima foram reconstruídos a partir da regra descrita no enunciado original — a
tabela de exemplos da fonte veio com as linhas fora de ordem por causa de um problema na
conversão de OCR. A regra em si está clara e é a mesma da apostila original.)*

### Bloco 3 — Desafios

#### 15. Entregas do Lobo Mau

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

#### 16. Incursão da Divisão de Reconhecimento

A Divisão de Reconhecimento precisa eliminar `N` titãs (`20 <= N <= 200`, sempre múltiplo de 5)
em até 1 hora. Levi Ackerman mata 20 titãs por hora sozinho; cada soldado comum mata 5 titãs por
hora. Dado `N`, calcule quantos soldados comuns `X`, no mínimo, são necessários para eliminar
todos os titãs restantes (depois de descontar os que Levi mata) dentro da 1 hora.

```
Entrada: 100    Saída: 16
Entrada: 30     Saída: 2
Entrada: 20     Saída: 0
```

`[ATENÇÃO]` Sem usar `ceil()` de `<cmath>` como atalho — pense em quantos titãs sobram depois de
Levi (`N - 20`, ou `0` se isso for negativo) e use um laço que vai somando soldados um a um até a
capacidade deles (`5` titãs cada) cobrir o restante, contando quantos foram necessários.

#### 17. Desafio Tático

Em um jogo de estratégia, `P` jogadores têm `S` soldados cada, e cada soldado tem um valor de
ataque e um de defesa (`1` a `100`). Dados `P`, `S`, e depois `P` blocos de `S` linhas (cada
linha com o ataque e a defesa de um soldado), imprima, para cada jogador, a soma de ataque e a
soma de defesa de todos os seus soldados.

```
Entrada:
3
4
10 5
15 8
8 3
12 7
5 2
9 6
7 4
11 9
6 1
13 10
10 4
8 6
Saída:
45 23
32 21
37 21
```

`[TENTE VOCÊ]` Quantos laços aninhados você precisa aqui, e o que cada um percorre? Resposta:
dois — um externo percorrendo os `P` jogadores, um interno percorrendo os `S` soldados daquele
jogador, acumulando ataque e defesa antes de imprimir e passar pro próximo jogador.

#### 18. INTERVALOS

Dado um intervalo semiaberto `]x,y]` (uma linha, `x < y`), um intervalo semifechado `[w,z[`
(outra linha, `w < z`) e um número inteiro (terceira linha), diga em qual(is) intervalo(s) o
número está: `"Primeiro intervalo!"`, `"Segundo intervalo!"`, `"Ambos!"`, ou `"Nenhum!"`. Em
`]x,y]`, `x` fica de fora e `y` fica dentro; em `[w,z[`, `w` fica dentro e `z` fica de fora.

```
Entrada: 3 8 / 11 19 / 12     Saída: Segundo intervalo!
Entrada: 4 13 / 16 28 / 13    Saída: Primeiro intervalo!
Entrada: 13 29 / 34 53 / 53   Saída: Nenhum!
Entrada: 1 9 / 7 15 / 7       Saída: Ambos!
Entrada: 10 20 / 30 40 / 25   Saída: Nenhum!
Entrada: 40 50 / 40 50 / 45   Saída: Ambos!
```

`[ATENÇÃO]` O erro mais comum aqui é tratar os dois intervalos como se fossem do mesmo tipo
(ambos abertos ou ambos fechados nas duas pontas). Preste atenção em qual extremo é `<` e qual é
`<=` em cada um dos dois intervalos — eles são diferentes um do outro de propósito.

#### 19. Pirâmide de limonadas (Autor: Vinicius Martins)

Sanji quer montar uma pirâmide de taças com `N` níveis (`1 <= N <= 9`). O nível `J` (de `1` a
`N`, topo=1, base=N) tem `J*2-1` taças, cada uma representada pelo algarismo `J`, com `N-J`
espaços em branco antes das taças daquele nível. Imprima os níveis em ordem crescente (do topo
pra base).

```
Entrada: 2
Saída:
 1
222

Entrada: 7
Saída:
      1
     222
    33333
   4444444
  555555555
 66666666666
7777777777777
```

`[ATENÇÃO]` Sem usar o construtor `std::string(quantidade, caractere)` como atalho pra gerar a
linha de taças de uma vez — use um laço `for` que imprime, um por um, cada espaço e depois cada
algarismo da taça.

#### 20. COUNTERSTRIKE

> ⚠️ **Enunciado reconstruído a partir de um fragmento incompleto da fonte original** — a
> descrição do problema foi perdida na conversão de PDF para Markdown; só sobreviveram o título,
> a restrição `1 <= A, M, C <= 100` e dois pares de entrada/saída. A reconstrução abaixo bate
> matematicamente com os dois exemplos conhecidos, mas a variável `A` não pôde ser encaixada com
> certeza na fórmula — se você tiver o PDF original da apostila, vale conferir e corrigir este
> exercício antes de resolvê-lo.

Reconstrução: numa partida, você precisa de `C` balas ao todo; cada caixa de munição vendida
contém `M` balas, e só se compram caixas inteiras. Dado `A`, `M` e `C` (nesta ordem, uma linha,
`1 <= A, M, C <= 100`), calcule quantas caixas, no mínimo, são necessárias para ter pelo menos
`C` balas.

```
Entrada: 4 6 10     Saída: 2
Entrada: 2 100 40   Saída: 1
```

`[ATENÇÃO]` Mesma regra dos outros exercícios: sem `ceil()` de `<cmath>` — use um laço somando
caixas uma a uma até a quantidade de balas acumulada (`caixas * M`) atingir `C`.

## Critérios de entrega

- Todos os 20 exercícios em C++, compilados com `g++` (mesma ferramenta do módulo 08).
- Um arquivo `.cpp` por exercício, com o enunciado e o pseudocódigo como comentário, antes do
  código.
- Nenhum método/função embutido que resolva o problema diretamente foi usado (`std::sort`,
  `std::find`, `std::max`/`std::max_element`, `ceil()`, construtor de string repetida, etc.) —
  releia o `[ATENÇÃO]` da teoria e de cada exercício antes de entregar.
- Todo o conteúdo publicado em um repositório no GitHub, com `README.md` explicando a organização.

## Checklist de entrega

- [ ] 1. Altura — resolvido sem `std::max()`.
- [ ] 2. Drone da Amazônia — resolvido.
- [ ] 3. Exame Chunin — resolvido.
- [ ] 4. Contabilizando Pokémons — resolvido.
- [ ] 5. Escolha do Campeão — resolvido sem `std::max_element()`.
- [ ] 6. Média Ponderada — resolvido com a fórmula correta e saída com 2 casas decimais.
- [ ] 7. Continha — resolvido.
- [ ] 8. Caçando Pokémons — resolvido com laços aninhados percorrendo a matriz.
- [ ] 9. Inventário caótico — resolvido sem `std::find()`.
- [ ] 10. Vamos jogar um jogo — resolvido sem `std::string::find()` como atalho.
- [ ] 11. Faxina — resolvido contando consoantes manualmente.
- [ ] 12. Campo de abóboras — resolvido com a regra de intersecção correta.
- [ ] 13. Xeroque Rolmes — resolvido.
- [ ] 14. Fazendo um gol — resolvido com as quatro situações de saída cobertas.
- [ ] 15. Entregas do Lobo Mau — resolvido, testado com os dois exemplos dados.
- [ ] 16. Incursão da Divisão de Reconhecimento — resolvido sem `ceil()`.
- [ ] 17. Desafio Tático — resolvido com laços aninhados.
- [ ] 18. INTERVALOS — resolvido com os seis exemplos batendo.
- [ ] 19. Pirâmide de limonadas — resolvido sem construtor de string repetida.
- [ ] 20. COUNTERSTRIKE — resolvido (ciente de que o enunciado foi reconstruído).
- [ ] Publicado no GitHub com README.
