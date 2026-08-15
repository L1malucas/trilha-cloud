---
id: 03_sistemas-numeracao-teoria
title: "Módulo 03 — Sistemas de Numeração"
sidebar_position: 30
---

# Módulo 03 — Sistemas de Numeração

> **Objetivo:** entender como computadores representam números internamente, e converter com
> segurança entre binário, decimal e hexadecimal.
> **Pré-requisitos:** nenhum — primeiro módulo da trilha de fundamentos de computação.
> **Tempo de referência:** 3 a 5 horas.
> **Prática correspondente:** [03_sistemas-numeracao-pratica.md](03_sistemas-numeracao-pratica.md)

---

## Por que isso importa antes de programar

Todo dado que um computador manipula — um número, uma letra, uma cor, uma instrução — é, no
nível mais baixo, uma sequência de bits. Entender como esses bits viram números (e vice-versa)
não é decoreba de conversão: é o que torna compreensível, mais adiante, por que um tipo numérico
"estoura", por que um endereço de memória é escrito em hexadecimal, ou por que `0.1 + 0.2` não dá
exatamente `0.3` em ponto flutuante.

Este módulo não pede pra você decorar procedimentos — pede pra entender **por que** eles
funcionam. É esse entendimento que se aplica em situações que a apostila nunca vai cobrir
explicitamente; decorar uma receita só resolve o exemplo que você já viu.

## `[TEORIA]` Decimal, binário e hexadecimal

Você já usa um sistema posicional todos os dias sem nunca ter parado pra pensar nisso: no número
`341`, o dígito `3` não vale só "3" — vale `3 × 100`, porque está na posição das centenas. O `4`
vale `4 × 10`. O `1` vale `1 × 1`. Ou seja: `341 = 3·10² + 4·10¹ + 1·10⁰`. Cada posição vale 10
vezes mais que a anterior porque a base do sistema decimal é 10 — e "base" é justamente isso:
quantos símbolos diferentes existem (`0` a `9`, dez símbolos) e quanto cada posição pesa em
relação à anterior.

Um computador não tem 10 estados elétricos distintos pra representar dígitos — tem 2: circuito
ligado ou desligado, alta ou baixa tensão. Por isso o hardware usa nativamente a **base 2**, o
**binário**: só os dígitos `0` e `1`, e cada posição vale 2 vezes mais que a anterior
(`1, 2, 4, 8, 16...` em vez de `1, 10, 100, 1000...`). É a mesma ideia do decimal — só muda
quanto cada posição pesa.

Só que binário é verboso: escrever endereços de memória inteiramente em `0`s e `1`s fica
ilegível rápido. Por isso existe um terceiro sistema, pensado como atalho de leitura pro binário:
o **hexadecimal**, base 16. Com 16 símbolos possíveis por posição e só 10 dígitos disponíveis
(`0-9`), a solução foi emprestar as seis primeiras letras do alfabeto: `A` (10), `B` (11), `C`
(12), `D` (13), `E` (14), `F` (15). Hexadecimal "encaixa" com binário porque `2⁴ = 16`: cada
dígito hexadecimal representa exatamente 4 bits, nem mais nem menos — isso fica mais concreto na
seção de conversão binário↔hex, mais abaixo.

| Decimal | Binário | Hex |
|---|---|---|
| 0 | 0000 | 0 |
| 1 | 0001 | 1 |
| 2 | 0010 | 2 |
| 7 | 0111 | 7 |
| 10 | 1010 | A |
| 15 | 1111 | F |

**Um detalhe que confunde muita gente no começo:** `n` posições (bits) não representam `n`
valores — representam `2ⁿ` valores. Com 1 bit dá pra representar 2 valores (`0` e `1`); com 2
bits, 4 valores (`00, 01, 10, 11`); com 4 bits, `2⁴ = 16` valores — exatamente os 16 símbolos que
cabem num único dígito hexadecimal. A tabela acima mostra só 6 das 16 linhas possíveis.

## `[TEORIA]` Convertendo decimal → binário

Você já viu que, em qualquer base, cada posição vale um múltiplo da posição anterior — em
binário, potências de 2 (`1, 2, 4, 8, 16, 32…`). Converter um número decimal pra binário é
descobrir quanto ele tem de cada uma dessas potências.

Existe um jeito mecânico de fazer isso sem testar potência por potência: a **divisão sucessiva
por 2**. A lógica por trás: dividir um número por 2 revela se ele é par ou ímpar, e "par ou ímpar"
é exatamente a informação que o bit menos significativo (`2⁰`) carrega — `0` pra par, `1` pra
ímpar. Anotado esse bit, você descarta essa informação (divide de novo, ignorando o resto) e faz
a mesma pergunta pro próximo bit. É como descascar uma cebola: cada divisão revela uma camada, da
posição menos significativa até a mais significativa — por isso, no fim, os restos são lidos de
baixo pra cima.

Acompanhe com `41`:
```
41 ÷ 2 = 20 resto 1   → ímpar → último bit = 1
20 ÷ 2 = 10 resto 0   → par   → próximo bit = 0
10 ÷ 2 =  5 resto 0   → par   → próximo bit = 0
 5 ÷ 2 =  2 resto 1   → ímpar → próximo bit = 1
 2 ÷ 2 =  1 resto 0   → par   → próximo bit = 0
 1 ÷ 2 =  0 resto 1   → chegou a 0: este é o bit mais significativo
```
De baixo pra cima: `41 = 101001`.

`[TENTE VOCÊ]` Converta `13` sozinho, usando o mesmo raciocínio (par ou ímpar a cada passo).
Resposta: `1101`.

Mais um pra fixar, com um número maior — `114`:
```
114 ÷ 2 = 57 resto 0   → par   → último bit = 0
 57 ÷ 2 = 28 resto 1   → ímpar → próximo bit = 1
 28 ÷ 2 = 14 resto 0   → par   → próximo bit = 0
 14 ÷ 2 =  7 resto 0   → par   → próximo bit = 0
  7 ÷ 2 =  3 resto 1   → ímpar → próximo bit = 1
  3 ÷ 2 =  1 resto 1   → ímpar → próximo bit = 1
  1 ÷ 2 =  0 resto 1   → chegou a 0: bit mais significativo
```
De baixo pra cima: `114 = 1110010`.

`[TENTE VOCÊ]` Converta `77` sozinho, mesmo raciocínio. Resposta: `1001101`.

## `[TEORIA]` Convertendo binário → decimal

Essa conversão é mais direta que a anterior, porque a informação que você precisava descobrir ali
— quais potências de 2 "cabem" no número — já está pronta, escrita nos próprios bits: cada `1`
marca "essa potência entra na soma"; cada `0` marca "essa potência não entra". Basta somar o
valor de posição de cada `1`.

Exemplo: `101001`
```
1·2⁵ + 0·2⁴ + 1·2³ + 0·2² + 0·2¹ + 1·2⁰
= 32 + 0 + 8 + 0 + 0 + 1 = 41
```
Repare que é o mesmo número convertido na seção anterior — as duas direções são inversas uma da
outra, por isso batem.

`[TENTE VOCÊ]` Converta `1101` de volta pra decimal — é o mesmo número do exercício anterior, na
direção contrária. Resposta: `13`.

## `[TEORIA]` Convertendo binário ↔ hexadecimal

Você já sabe por que isso funciona: cada dígito hexadecimal vale exatamente 4 bits, porque
`2⁴ = 16` é a base do hexadecimal. Então converter binário↔hex não exige recalcular o número
inteiro — só agrupar os bits de 4 em 4 (a partir da direita, completando com zeros à esquerda se
faltar) e converter cada grupo isoladamente, como um dígito solto.

Exemplo: `101001` → agrupando de 4 em 4 a partir da direita: `0010 1001` (o zero à esquerda é só
pra completar o grupo) → `2 9` → `0x29`.

`[TENTE VOCÊ]` Agrupe `11110101` de 4 em 4 e converta pra hexadecimal.
Resposta: `1111 0101` → `F5` → `0xF5`.

**Onde você já viu hexadecimal sem perceber:** toda cor numa página web é escrita em hexadecimal,
tipo `#FF5733`. Não é um código arbitrário — são três valores de 0-255 (intensidade de
Vermelho/Verde/Azul), cada um escrito como 2 dígitos hex (porque `255 = 0xFF`, o maior valor que
2 dígitos hex representam — `16² - 1`). Decompondo `#FF5733`: `FF` = 255 (vermelho no máximo),
`57` = `5·16 + 7 = 87` (verde), `33` = `3·16 + 3 = 51` (azul). É a mesma conversão hex→decimal
de sempre, só que em pares de dígitos em vez de um número inteiro de uma vez.

`[TENTE VOCÊ]` Decomponha a cor `#1A2B3C` em R, G, B decimais.
Resposta: R = `0x1A` = `1·16+10 = 26`; G = `0x2B` = `2·16+11 = 43`; B = `0x3C` = `3·16+12 = 60`.

`[CLI]` Conferindo conversões no terminal (Python já vem instalado na maioria dos sistemas):
```
python3 -c "print(bin(41), hex(41))"
python3 -c "print(int('101001', 2), int('29', 16))"
```

## `[TEORIA]` Soma binária

A soma binária segue a mesma lógica da soma decimal — o que muda é **quando** o vai-um acontece.
Em qualquer base, o vai-um ocorre quando a soma de uma posição alcança o valor da própria base:
em decimal (base 10), isso acontece quando a soma da posição chega a 10 (`9 + 2 = 11`: escreve
`1`, vai um `1`); em binário (base 2), o mesmo bate muito mais cedo, em `1 + 1 = 10` (escreve `0`,
vai um `1`).

```
  0111   (7)
+ 0101   (5)
------
  1100   (12)
```

`[ATENÇÃO]` Ao somar de cabeça, é fácil esquecer de carregar o vai-um adiante — principalmente
quando ele se repete em cadeia, posição após posição, como acontece nas duas primeiras posições
da direita neste exemplo. Confira sempre da direita pra esquerda, carregando explicitamente cada
vai-um antes de somar a próxima coluna.

`[TENTE VOCÊ]` Some `0110 + 0011` sozinho, prestando atenção em cada vai-um.
Resposta: `1001` (9).

**Quando o vai-um "propaga" por várias colunas seguidas** — o caso que mais gera erro de conta —
some `0111 + 0001`:
```
  0111   (7)
+ 0001   (1)
------
  1000   (8)
```
Coluna 1: `1+1 = 10` → escreve `0`, vai-um `1`. Coluna 2: `1+0+vai-um(1) = 10` → escreve `0`,
vai-um `1` de novo. Coluna 3: `1+0+vai-um(1) = 10` → escreve `0`, vai-um `1` mais uma vez.
Coluna 4: `0+0+vai-um(1) = 1` → escreve `1`. O vai-um "empurrou" a soma por três colunas seguidas
antes de parar — é exatamente esse efeito em cadeia que o `[ATENÇÃO]` acima avisa: parar de
carregar o vai-um no meio da cadeia (ex: esquecer na coluna 3) dá um resultado errado sem parecer
óbvio que algo quebrou.

`[TENTE VOCÊ]` Some `1111 + 0001`, acompanhando o vai-um se propagar por toda a soma.
Resposta: `10000` (16) — o vai-um propaga pelas 4 colunas.

## `[APROFUNDAMENTO]` Representação binária em ponto flutuante

Números com casas decimais são representados pelo padrão **IEEE 754**, com três partes: sinal,
expoente e mantissa. A ideia de "posição vale uma potência da base", que você já usou pra parte
inteira, continua valendo pra parte fracionária — só que agora com potências **negativas**: a
primeira casa depois da vírgula binária vale `2⁻¹` (0,5), a segunda `2⁻²` (0,25), e assim por
diante.

O problema é que nem toda fração decimal tem representação binária finita nesse esquema — do
mesmo jeito que nem toda fração tem representação decimal finita (`1/3`, por exemplo, vira uma
dízima infinita em base 10). O motivo é aritmético: `0,1` decimal equivale à fração `1/10`, e
`10 = 2 × 5`. Como o fator `5` não é potência de 2, essa fração nunca "fecha" em binário — vira
uma dízima infinita, do mesmo jeito que `1/3` faz em decimal (porque `3` não é fator de `10`).
Quando o computador guarda essa dízima infinita num número finito de bits, ela precisa ser
cortada em algum ponto — e é esse corte que gera o pequeno erro de arredondamento. Por isso
`0.1 + 0.2` acumula um erro e não dá exatamente `0.3`.

Esse não é um "bug" da linguagem: é uma limitação inerente de como frações são armazenadas em
qualquer base finita — só que, como o hardware usa base 2, ela aparece até em frações decimais
"redondas" como `0,1`, que não são redondas nenhuma pro binário.

## `[TEORIA]` Onde isso aparece na prática

- **Endereçamento**: endereços de memória são quase sempre exibidos em hexadecimal, por ser mais
  compacto que binário e mais preciso que decimal para representar múltiplos de potências de 2.
- **Transmissão de dados**: velocidades de rede e tamanhos de arquivo são medidos em bits/bytes —
  entender a base binária explica por que 1 KB "prático" (1024 bytes) difere do 1 KB "comercial"
  (1000 bytes).
- **Controle**: máscaras de bits e *flags* (usadas em permissões de arquivo, registradores de
  status de CPU, etc.) são operações diretas sobre a representação binária de um número.

## Erros comuns

Você já viu estes três avisos ao longo do módulo — aqui vai só a revisão rápida:

- **Confundir "quantidade de bits" com "quantidade de valores representáveis"**: `n` bits
  representam `2ⁿ` valores, não `n` valores (seção "Decimal, binário e hexadecimal").
- **Esquecer o vai-um na soma binária**, especialmente quando ele se repete em cadeia por várias
  posições (seção "Soma binária").
- **Achar que ponto flutuante representa qualquer número decimal com exatidão** — a limitação é
  aritmética, não um defeito de implementação (seção "Representação binária em ponto flutuante").

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Bits e portas lógicas | Módulo 04 — Circuitos Digitais |
| Endereçamento em hexadecimal | Módulo 05 — Arquitetura de Computadores |
| Overflow e representação de tipos | Módulo 08 — Linguagens de Programação |

## `[REFERÊNCIA]`

- BROOKSHEAR, J. Glenn. *Ciência da Computação — Uma Visão Abrangente*, 7ª ed., Bookman, 2005 —
  Capítulo 1 (Armazenamento e Manipulação de Dados).
- VELLOSO, Fernando de Castro. *Informática: Conceitos Básicos*, 6ª ed., Campus, 2002.
- [IEEE 754 explicado visualmente](https://float.exposed/) — ferramenta interativa que mostra bit
  a bit como um número em ponto flutuante é armazenado.
- [RapidTables — Conversor binário/decimal/hexadecimal](https://www.rapidtables.com/convert/number/binary-to-decimal.html) —
  para conferir suas conversões manuais.

## Checklist de saída

- [ ] Converto um número decimal para binário e hexadecimal manualmente — e sei explicar por que
      o método funciona, não só executá-lo.
- [ ] Converto binário/hexadecimal de volta para decimal.
- [ ] Somo dois números binários, aplicando o vai-um corretamente, e sei apontar onde um erro de
      vai-um costuma acontecer.
- [ ] Explico por que hexadecimal é usado como atalho para representar binário, e por que o
      agrupamento é sempre de 4 em 4 bits.
- [ ] Entendo, em termos gerais, por que ponto flutuante tem imprecisão — e por que isso não é um
      "bug".
- [ ] Sei por que `n` bits representam `2ⁿ` valores, não `n` valores.
