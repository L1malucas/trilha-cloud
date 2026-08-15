# Módulo 04 — Circuitos Digitais

> **Objetivo:** entender como portas lógicas implementam operações sobre bits, e como a
> combinação delas dá origem a memória (latches/flip-flops).
> **Pré-requisitos:** Módulo 03 (Sistemas de Numeração).
> **Tempo de referência:** 3 a 4 horas.
> **Prática correspondente:** [04_circuitos-digitais-pratica.md](04_circuitos-digitais-pratica.md)

---

## Por que isso importa

No módulo 03 você viu o interruptor de luz como analogia para o bit: aceso ou apagado, `1` ou
`0`. Este módulo pega essa ideia e pergunta o próximo passo óbvio: e se você ligar vários
interruptores entre si, de um jeito que o estado de um dependa do estado dos outros? É
exatamente disso que são feitas as portas lógicas — e é a partir delas que se constrói tudo, da
calculadora mais simples até a CPU do módulo 05.

## `[TEORIA]` Níveis de abstração

Você já usa, sem perceber, decisões que combinam duas condições com "e" ou "ou" o tempo todo:
"vou sair de casaco **se** estiver frio **e** estiver chovendo" (as duas precisam ser verdade);
"vou levar guarda-chuva **se** estiver chovendo **ou** o céu estiver nublado" (uma das duas já
basta). Portas lógicas formalizam exatamente esse tipo de decisão — só que com `1` (verdadeiro)
e `0` (falso) no lugar de "está chovendo" ou "não está".

A cadeia de abstração completa é:

```
Transistor (uma chave elétrica, o "interruptor" do módulo 03)
  → Porta lógica (combinação de transistores: AND, OR, NOT...)
    → Circuito digital (combinação de portas)
      → Componente funcional (somador, registrador, memória)
        → CPU
```

Cada nível esconde a complexidade do nível anterior — quem projeta um circuito somador não
precisa pensar em transistores, só em portas lógicas, do mesmo jeito que você não pensa em
transistores quando aperta uma tecla no teclado.

## `[TEORIA]` Portas lógicas básicas

Pegando a decisão do casaco ("frio **e** chuva") e formalizando: chame de `A` a condição "está
frio" e `B` a condição "está chovendo", cada uma valendo `1` (verdadeiro) ou `0` (falso). A porta
**AND** representa exatamente "as duas precisam ser verdadeiras" — só dá `1` quando `A` **e** `B`
são `1`:

| A | B | A AND B |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

A porta **OR** representa "uma das duas já basta" (o exemplo do guarda-chuva) — dá `1` quando
`A` **ou** `B` (ou ambos) forem `1`:

| A | B | A OR B |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

A porta **NOT** só inverte: se a condição era verdadeira, passa a falsa, e vice-versa ("**não**
está frio").

| A | NOT A |
|---|---|
| 0 | 1 |
| 1 | 0 |

A partir dessas três, existem mais quatro portas derivadas — cada uma é só a anterior com um
detalhe a mais:

| Porta | Regra | Relação com as básicas |
|---|---|---|
| NAND | saída 0 só se A **e** B forem 1 | AND, depois invertido (NOT) |
| NOR | saída 1 só se A **e** B forem 0 | OR, depois invertido (NOT) |
| XOR | saída 1 se A e B forem **diferentes** | "OR, mas exclui o caso em que os dois são 1" |
| XNOR | saída 1 se A e B forem **iguais** | XOR, depois invertido (NOT) |

`[TENTE VOCÊ]` Monte a tabela verdade de `A NAND B` para as 4 combinações de A e B, partindo da
tabela do AND que você acabou de ver e invertendo cada resultado. Resposta: `00→1, 01→1, 10→1,
11→0`.

## `[APROFUNDAMENTO]` NAND e NOR são "universais"

Repare na tabela acima: XOR foi descrito como "uma combinação das portas básicas", não como uma
porta fundamental à parte. Isso não é acaso — é possível ir além e construir **AND, OR e NOT**
(as três portas "básicas") usando apenas cópias de uma única porta: NAND (ou, alternativamente,
apenas NOR). Essa propriedade é chamada de completude funcional. Na prática, chips reais são
fabricados majoritariamente com portas NAND, e as demais portas são montadas combinando NANDs —
é mais barato fabricar um único tipo de componente em escala do que vários tipos diferentes.

## `[TEORIA]` Circuitos combinacionais

Um circuito é **combinacional** quando a saída depende **apenas** dos valores atuais das
entradas — não existe memória do que aconteceu antes. É o caso de tudo que você viu até aqui: a
tabela verdade de um AND não muda dependendo do que entrou nele um segundo atrás.

**Exemplo narrado — o meio-somador (half adder):** some dois bits, `A` e `B`, do jeito que você
já soma binário desde o módulo 03. O resultado tem duas partes: o dígito da soma em si, e o
"vai-um" (carry), caso a soma estoure. Pensando bit a bit: quando `A` e `B` são diferentes
(`0,1` ou `1,0`), a soma é `1` sem vai-um — exatamente a regra do XOR. Quando os dois são `1`, a
soma "estoura" pra `10`: o dígito da soma vira `0` e sobra um vai-um de `1` — exatamente a regra
do AND.

| A | B | Soma (XOR) | Carry (AND) |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |

Ou seja: um somador não é uma porta nova — é XOR e AND, os dois recebendo as mesmas entradas,
cada um respondendo uma pergunta diferente ("qual o dígito?" e "estourou?").

`[TENTE VOCÊ]` Monte a tabela verdade de `A AND (B OR C)` para as 8 combinações de A, B e C —
primeiro resolva `B OR C` pra cada linha, depois combine o resultado com `A` via AND. Resposta:
só dá `1` quando `A = 1` **e** pelo menos um entre `B` ou `C` for `1` (linhas `1,0,1`; `1,1,0`;
`1,1,1`).

## `[TEORIA]` Circuitos sequenciais

Um circuito é **sequencial** quando a saída depende das entradas **e** de um estado interno
anterior — ou seja, o circuito tem memória. Pense na diferença entre um interruptor comum de luz
e uma trava de porta: o interruptor é puramente combinacional (a luz reflete só a posição atual
do interruptor); já uma trava eletrônica com senha "lembra" se você já digitou os primeiros
dígitos corretos antes de aceitar o último — o resultado depende do que já aconteceu, não só do
dígito atual.

`[ATENÇÃO]` É comum, nesta altura, achar que todo circuito reage "instantaneamente" às entradas,
como um combinacional — mas circuitos sequenciais mudam de estado de forma sincronizada, não a
cada minúscula oscilação elétrica. Para isso, eles usam um **clock**: um sinal que "pulsa" em
intervalos regulares e sincroniza *quando* o estado pode mudar. Confundir "clock" com "só
velocidade" é outro erro comum — a função dele é sincronização, não apenas ritmo.

**Exemplo narrado — a trava eletrônica com senha de 3 dígitos:** imagine uma trava que só abre
com a senha `4-7-2`, digitada dígito por dígito num teclado. O circuito precisa "lembrar" quanto
já foi digitado corretamente até agora — isso é o estado interno.

```
Estado inicial: "nada digitado ainda" (0 dígitos corretos confirmados)

Dígito 1 digitado: 4  → confere com o 1º dígito da senha (4). Estado avança:
                        "1 dígito correto confirmado".
Dígito 2 digitado: 7  → confere com o 2º dígito da senha (7). Estado avança:
                        "2 dígitos corretos confirmados".
Dígito 3 digitado: 2  → confere com o 3º dígito da senha (2). Estado avança:
                        "senha completa e correta" → a trava abre.
```

Repare que a trava só abre por causa da *sequência* de estados que ela acumulou — se você
digitasse `4-7-2` fora de ordem, ou pulasse direto pro `2`, o resultado seria diferente, mesmo
usando os mesmos três dígitos. Um circuito combinacional (como as portas lógicas vistas antes)
nunca conseguiria fazer isso: ele só enxerga a entrada do instante atual, sem noção de "o que já
veio antes".

`[TENTE VOCÊ]` Nessa trava de 3 dígitos, o usuário digita `4-9-2` (o segundo dígito está errado).
O que acontece com o estado interno no dígito 2, e a trava abre no final? Resposta: o estado
"reseta" — como o dígito 2 (`9`) não confere com o esperado (`7`), o circuito volta pro estado
"nada confirmado" (ou entra num estado de erro), e mesmo o `2` final batendo com o 3º dígito da
senha, a trava não abre, porque a sequência como um todo não foi validada corretamente.

## `[TEORIA]` Latches e flip-flops

- **Latch (SR latch)**: o circuito de memória mais simples — guarda 1 bit, e muda de estado
  sempre que as entradas de Set/Reset mudam (sem esperar um clock).
- **Flip-flop (ex: tipo D)**: uma evolução do latch que só muda de estado em sincronia com o
  clock (na borda de subida ou descida do sinal) — é o bloco básico usado para construir
  registradores e memória, porque garante que todos os bits de um registrador mudem juntos, no
  mesmo instante, em vez de um de cada vez de forma imprevisível.

**Exemplo narrado — a mesma entrada, dois comportamentos diferentes:** imagine que o mesmo sinal
de entrada `D` (dado a guardar) chega tanto a um latch quanto a um flip-flop tipo D, e observe o
que cada um guarda ao longo do tempo (`↑` marca um pulso de clock):

| Momento | Entrada D | Clock | O que o **latch** guarda | O que o **flip-flop** guarda |
|---|---|---|---|---|
| t0 | 0 | — | 0 | 0 |
| t1 | 1 | — | **1** (mudou na hora) | 0 (ainda não teve pulso) |
| t2 | 0 | — | **0** (mudou na hora de novo) | 0 (ainda não teve pulso) |
| t3 | 1 | ↑ | **1** | **1** (só agora, no pulso) |
| t4 | 0 | — | **0** (mudou na hora) | 1 (mantém até o próximo pulso) |
| t5 | 1 | ↑ | **1** | **1** (só agora, no pulso) |

Repare: o latch "treme" a cada mudança de `D`, mesmo entre pulsos de clock — ele reflete o valor
atual de `D` o tempo todo. O flip-flop ignora completamente o que acontece com `D` entre um pulso
e outro, e só "olha" pra entrada exatamente no instante do pulso. É por isso que registradores
(que precisam trocar vários bits ao mesmo tempo, de forma previsível) usam flip-flops: se
usassem latches, cada bit poderia mudar num instante ligeiramente diferente, conforme o ruído
elétrico de cada fio — com flip-flops, todos esperam o mesmo pulso de clock pra mudar juntos.

`[TENTE VOCÊ]` Na tabela acima, se `D` mudasse de `1` para `0` bem no meio do intervalo entre t3
e t5 (sem nenhum pulso de clock acontecendo nesse meio tempo), o que aconteceria com o valor
guardado no flip-flop? Resposta: nada — o flip-flop mantém o valor `1` do último pulso (t3) até o
próximo pulso de clock (t5), ignorando qualquer mudança de `D` nesse meio tempo. O latch, por
outro lado, mudaria para `0` imediatamente.

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Confundir circuito combinacional com sequencial — achar que toda saída é "instantânea".
- Esquecer que NAND (ou NOR) sozinha já é suficiente para construir qualquer circuito.
- Achar que "clock" é só sinônimo de velocidade, quando sua função real é sincronizar *quando* o
  estado pode mudar.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Flip-flops / memória | Módulo 05 — registradores e hierarquia de memória |
| Portas lógicas (AND, OR, NOT) | Módulo 08 — operadores lógicos em algoritmos (`&&`, `\|\|`, `!`) |

## `[REFERÊNCIA]`

- BROOKSHEAR, J. Glenn. *Ciência da Computação — Uma Visão Abrangente*, 7ª ed., Bookman, 2005 —
  Capítulo 2 (Armazenamento de Dados / lógica booleana).
- WHITE, Ron. *Como Funciona o Computador*, 8ª ed., Quark, 1998.
- [All About Circuits — Latches e Flip-Flops](https://www.allaboutcircuits.com/textbook/digital/chpt-10/latches/) —
  explicação técnica com diagramas de tempo (em inglês).
- [Ben Eater — Building an SR latch](https://www.youtube.com/watch?v=KM0DdEaY5sY) — vídeo
  montando um latch com portas NOR reais, mão na massa.

## Checklist de saída

- [ ] Monto a tabela verdade de AND, OR, NOT, XOR a partir de entradas dadas, sabendo justificar
      a partir de um exemplo do cotidiano (ex: a decisão do casaco/guarda-chuva).
- [ ] Explico por que NAND é considerada uma porta "universal".
- [ ] Diferencio circuito combinacional de circuito sequencial, com um exemplo de cada.
- [ ] Explico o papel do clock em um circuito sequencial — por que ele sincroniza, não só marca
      velocidade.
- [ ] Descrevo, em termos gerais, o que um flip-flop guarda e por que ele é a base da memória.
- [ ] Explico, com a linha do tempo latch x flip-flop, por que registradores usam flip-flops e
      não latches.
- [ ] Explico por que um meio-somador é só XOR + AND, e não uma porta nova.
