# Módulo 09 — Algoritmos e Lógica de Programação — Prática

> **Objetivo da prática:** implementar algoritmos clássicos de lógica em C++, sem usar métodos
> embutidos da linguagem, documentando o pseudocódigo antes do código.
> **Pré-requisito:** [09_algoritmos-logica-teoria.md](09_algoritmos-logica-teoria.md)
> **Entregáveis:** um arquivo `.cpp` por exercício, com o enunciado (como comentário no topo),
> o pseudocódigo (também como comentário) e o código, nesta ordem, no mesmo arquivo.
> **Formato de entrega:** publicado no GitHub, com README bem organizado explicando a estrutura
> do repositório.

Todos os 35 exercícios abaixo vêm das duas apostilas de exercícios já usadas na trilha
(`APOSTILA_2.pdf`, 10 exercícios, e `renova_exercicios.pdf`, 26 exercícios — lidos diretamente dos
PDFs originais, não dos `.md` convertidos, que tinham perdido vários exercícios inteiros na
conversão) — nenhum foi inventado.

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

#### 20. Torre Xadrez

Uma torre de xadrez, numa posição `(X, Y)` de um tabuleiro `8x8`, se move em linha reta (cima,
baixo, esquerda, direita) até encontrar a primeira peça no caminho, em cada uma das 4 direções.
Se essa peça for inimiga, a torre pode capturá-la (conta no total) e para de andar naquela
direção. Se for aliada, a torre para antes dela, sem capturar nada. Dado o tabuleiro (8 linhas de
8 inteiros `Q`: `0` vazio, `1` aliada, `2` inimiga — a posição da própria torre tem valor `1`) e a
posição `(X, Y)` da torre (`0 <= X, Y <= 7`), imprima quantas peças inimigas a torre consegue
capturar, somando as 4 direções.

```
Entrada:
0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0
2 0 1 1 2 0 0 0
0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0
0 0 2 0 0 0 0 0
0 0 2 0 0 0 0 0
2 2
Saída: 2
```

`[ATENÇÃO]` Percorra cada direção com o seu próprio laço (4 laços, um por direção), parando no
primeiro obstáculo — não existe atalho pronto pra "primeira ocorrência numa direção" na
biblioteca padrão que resolva isso por você.

#### 21. Oxi véi, cadê a praia? (Autor: Hérus Conceição)

Um mapa `10x10` tem cada posição marcada com `*` (água) ou `t` (terra). Transforme em `p` (praia)
todo `t` que estiver em contato direto (vertical **ou** horizontal — não diagonal) com um `*`. O
que estiver fora dos limites do mapa não conta como água. Imprima o mapa corrigido.

```
Entrada (10 linhas de 10 caracteres separados por espaço):
* * * * * * * * * *
* * t t t t * * * *
* t t t t t t * * *
* * * t t t t t t *
* * * * t t t t t *
* * * * t t t t t *
t t t t t t t t t *
t t t t t t t t * *
t t t t t * * * * *
t * * * * * * * * t

Saída:
* * * * * * * * * *
* * p p p p * * * *
* p p t t p * * * *
* * * p t t p p p *
* * * * p t t p p *
* * * * p t p p * *
p p p p t p p p p *
p p p t t t t p * *
p p p p p * * * * *
p * * * * * * * * p
```

#### 22. Batalha de Yavin

Numa matriz `NxN` (`3 <= N <= 100`), cada posição tem `0` (sem nave) ou `1` (nave inimiga). Luke
Skywalker se teleporta `M` vezes (`1 <= M <= 1000`) para coordenadas dadas (linha, coluna); a
cada teleporte, ele dá um único tiro, destruindo a primeira nave inimiga que esteja à sua frente,
na mesma linha, a partir da coluna do teleporte para a direita (se não houver nenhuma nessa
direção, o tiro não acerta nada). Luke nunca se teleporta pra cima de uma nave. Dado `N`, `M`, a
matriz, e as `M` coordenadas de teleporte, some quantas naves ele destrói ao todo.

```
Entrada:
8 3
0 0 0 0 0 0 0 1
1 0 0 1 0 1 0 0
0 0 0 0 1 0 0 0
0 0 0 1 0 0 0 0
0 0 0 0 0 0 1 0
0 1 0 0 1 0 0 0
0 1 0 0 0 0 0 0
0 0 0 0 0 0 0 0
7 2
3 5
3 1
Saída: 2
```

```
Entrada:
4 2
0 1 0 1
0 1 1 0
1 0 0 0
0 0 0 1
3 2
3 1
Saída: 2
```

#### 23. Desenhista (Autor: Jefferson J. Raimon)

Imprima uma pirâmide de altura `P` (`1 <= P <= 20`) usando o caractere `#` para os blocos e `>`
para os espaços vazios à esquerda — cada linha `i` (de `1` até `P`, de cima pra baixo) tem `P - i`
caracteres `>` seguidos de `i` caracteres `#`.

```
Entrada: 7
Saída:
>>>>>>#
>>>>>##
>>>>###
>>>####
>>#####
>######
#######
```

`[ATENÇÃO]` Sem usar `std::string(quantidade, caractere)` como atalho — imprima caractere por
caractere, num laço.

#### 24. Contador de segundos

Senku quer converter um tempo em segundos (`1 <= N <= 100000000`) para horas, minutos e segundos.
Imprima no formato `"Hh Mm Ss"`.

```
Entrada: 4000    Saída: 1h 6m 40s
Entrada: 5200    Saída: 1h 26m 40s
Entrada: 59      Saída: 0h 0m 59s
```

`[TENTE VOCÊ]` Sem usar nenhuma biblioteca de data/hora — só aritmética de inteiros (`/` e `%`).
Quantas horas cabem em `4000` segundos? Resposta: `4000 / 3600 = 1` hora (divisão inteira); o
resto, `400` segundos, ainda precisa virar minutos e segundos do mesmo jeito.

#### 25. Super Mario Bros

Mario precisa encontrar 240 Star Coins espalhadas em 8 mundos, cada um com 3 áreas secretas que
têm, cada uma, 10 Star Coins, 2 Mega Mushrooms e 1 Carapaça Koopa Azul. Dado quantos itens de cada
tipo você já encontrou nas 3 áreas secretas de um mundo (`SC` Star Coins `0<=SC<=30`, `MM` Mega
Mushrooms `0<=MM<=6`, `CK` Carapaças `0<=CK<=3`), imprima "PROXIMO MUNDO" se já tiver todas as 30
Star Coins daquele mundo, ou, caso contrário, quantos itens de cada tipo ainda faltam (na ordem
SC, MM, CK).

```
Entrada: 30 1 2    Saída: PROXIMO MUNDO
Entrada: 3 1 0     Saída: 27 5 3
Entrada: 10 4 0    Saída: 20 2 3
```

#### 26. As Novas Missões Jedi

Yoda, Luke e Ahsoka realizam `N` missões cada (`1 <= N <= 100`), ganhando `XP` pontos de
experiência por missão completada (`1 <= XP <= 100`). Dado `N`, `XP`, e o XP inicial de cada um
(`XPi`, `1 <= XPi <= 1500`, nesta ordem: Yoda, Luke, Ahsoka), imprima o novo XP de cada um (nome
e valor, uma linha por Jedi, na ordem Yoda/Luke/Ahsoka), assumindo que todos cumpriram as `N`
missões.

```
Entrada:
3 50
1500 800 1000
Saída:
Yoda 1650
Luke 950
Ahsoka 1150
```

#### 27. Bolinhas de Gude

No Natal, Yuri recebe bolinhas de gude de `N` familiares (`1 <= N <= 50`): o primeiro dá `Q`
bolinhas, e cada familiar seguinte dá o dobro do que o anterior deu. Dado `N` e `Q`, imprima o
total de bolinhas que Yuri vai receber.

```
Entrada: 10 2    Saída: 2046
Entrada: 5 15    Saída: 465
```

`[ATENÇÃO]` Sem usar `pow()` de `<cmath>` — some as doações num laço, dobrando a variável a cada
volta em vez de calcular a potência de uma vez.

#### 28. Cai pro x1 (também citado como COUNTERSTRIKE)

Lucas e Pedro jogam 3 partidas de CS:GO. Dada a pontuação de abates de Lucas (`L`) e Pedro (`P`)
em cada uma das 3 partidas (uma linha por partida, `1 <= L, P <= 100`), some o total de abates de
cada um nas 3 partidas e imprima quem teve mais: `"Lucas"`, `"Pedro"`, ou `"Empate"`.

```
Entrada:
20 32
16 50
100 0
Saída: Lucas

Entrada:
20 32
14 54
10 0
Saída: Pedro

Entrada:
16 0
0 8
4 12
Saída: Empate
```

#### 29. Ajude o pequeno Kurumin

Kurumin está preso no meio de `N` gaiolas concêntricas (`1 <= N <= 20`). Cada gaiola tem 4 números
nos lados, `A`, `B`, `C`, `D` (`-20 <= cada um <= 50`). Pra sair de uma gaiola, Kurumin soma os 4
números (`A+B+C+D`); se o resultado for `>= 100`, ele refaz o cálculo daquela gaiola subtraindo em
vez de somar (`A-B-C-D`). No fim, ele soma o resultado de todas as `N` gaiolas — essa soma final é
quantos "anos de vida" ele terá. Imprima `"S anos de vida"`.

```
Entrada:
3
15 13 12 10
04 16 -14 03
40 -13 40 41
Saída: 31 anos de vida
```

*(No exemplo: a 1ª gaiola soma 50; a 2ª soma 09; a 3ª soma 108 — como é `>= 100`, refaz
subtraindo: `40-(-13)-40-41 = -28`. Total: `50+9-28 = 31`.)*

#### 30. Clones das sombras

Naruto começa com 1 clone e, a cada jutsu, cada clone (incluindo ele) cria mais um clone — ou
seja, a quantidade de narutos dobra a cada jutsu. Dado o número de inimigos `N` (`1 <= N <=
5000`), diga se é possível ter exatamente `N` narutos em algum momento (dobrando a partir de 1):
imprima `"Dattebayo"` se for possível, ou `"Tururuuu"` caso contrário.

```
Entrada: 32    Saída: Dattebayo
Entrada: 50    Saída: Tururuuu
Entrada: 16    Saída: Dattebayo
Entrada: 3     Saída: Tururuuu
Entrada: 4     Saída: Dattebayo
Entrada: 1     Saída: Dattebayo
```

`[TENTE VOCÊ]` Isso é o mesmo que perguntar se `N` é uma potência de 2. Sem usar nenhuma função
pronta de log/potência — dobre uma variável começando em 1, num laço, até ela ficar `>= N`, e
compare se bateu exatamente.

#### 31. Forjando Espadas (Autor: Danilo de A. Peleteiro)

Gendry forja espadas em Winterfell. Cada espada usa exatamente 2 fragmentos de aço valiriano, 3
pedaços de madeira e 5 tiras de couro. Dado quanto ele tem de cada material (`A` aço, `M` madeira,
`C` couro), imprima a quantidade máxima de espadas que ele pode forjar sem faltar nenhum
material.

```
Entrada: 4 6 10     Saída: 2
Entrada: 2 100 40   Saída: 1
```

`[ATENÇÃO]` Sem usar `std::min()` — calcule quantas espadas cada material permitiria sozinho
(`A/2`, `M/3`, `C/5`, divisão inteira) e compare os três valores manualmente com `if`/`else` pra
achar o menor, que é o fator limitante.

#### 32. Ajude Skywalker

A nave de Skywalker sonda um quadrante e detecta `A` naves ao todo, sendo `B` amigas à frente,
`C` amigas à direita, `D` amigas à esquerda e `E` amigas atrás (`0 <= A,B,C,D,E <= 1000`,
`B+C+D+E <= A`). Calcule quantas das naves detectadas são inimigas.

```
Entrada: 100 10 20 30 30    Saída: 10
Entrada: 55 1 2 3 4         Saída: 45
```

#### 33. Energia de Aceleração

Pela teoria da relatividade (simplificada para este exercício), a energia necessária para
acelerar um objeto até uma velocidade é `Energia = Massa × Velocidade²`. Dado o peso do Flash em
quilos (`P`, `40 <= P <= 100`) e a velocidade em m/s que ele atingiu (`V`, `0 <= V <=
300000000`), calcule a energia que ele precisaria produzir sem a Força de Aceleração.

```
Entrada: 80 100    Saída: 800000
Entrada: 65 0       Saída: 0
```

#### 34. Pentatlo

O pentatlo moderno soma as notas de um atleta em 5 modalidades (Tiro ao alvo, Natação, Esgrima,
Hipismo, Corrida). Dado o número de inscrição `X` (`1 <= X <= 1000`) e as 5 notas `N1..N5`
(`0 <= cada uma <= 10`), imprima o número de inscrição seguido da média aritmética das 5 notas,
com uma casa decimal.

```
Entrada: 123 5 10 5 10 10    Saída: 123 8.0
Entrada: 230 8 8 7 7 9       Saída: 230 7.8
```

#### 35. Fortalecimento de clima

Cada Pokémon tem um ataque de dano `P` (`1 <= P <= 1000`) e um limite de acréscimo `M`
(`0 <= M <= 1000`) que o clima favorável pode adicionar — mas o clima **sempre** adiciona
exatamente esse valor máximo `M` quando favorável (não é uma escolha, é o efeito do clima). Dado
`N` Pokémons (`1 <= N <= 1000`) e, para cada um, seu `P` e `M`, imprima o dano final de cada um
(`P + M`).

```
Entrada:
3
105 20
122 22
140 50
Saída:
125
144
190
```

## Critérios de entrega

- Todos os 35 exercícios em C++, compilados com `g++` (mesma ferramenta do módulo 08).
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
- [ ] 20. Torre Xadrez — resolvido, parando corretamente em cada direção.
- [ ] 21. Oxi véi, cadê a praia? — resolvido, checando os 4 vizinhos diretos.
- [ ] 22. Batalha de Yavin — resolvido.
- [ ] 23. Desenhista — resolvido sem construtor de string repetida.
- [ ] 24. Contador de segundos — resolvido só com aritmética de inteiros.
- [ ] 25. Super Mario Bros — resolvido.
- [ ] 26. As Novas Missões Jedi — resolvido.
- [ ] 27. Bolinhas de Gude — resolvido sem `pow()`.
- [ ] 28. Cai pro x1 (COUNTERSTRIKE) — resolvido.
- [ ] 29. Ajude o pequeno Kurumin — resolvido com a regra do refazer cálculo.
- [ ] 30. Clones das sombras — resolvido sem função de log/potência pronta.
- [ ] 31. Forjando Espadas — resolvido sem `std::min()`.
- [ ] 32. Ajude Skywalker — resolvido.
- [ ] 33. Energia de Aceleração — resolvido.
- [ ] 34. Pentatlo — resolvido.
- [ ] 35. Fortalecimento de clima — resolvido.
- [ ] Publicado no GitHub com README.
