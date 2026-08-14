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

## `[TEORIA]` Comandos básicos: sequência, decisão, repetição

Toda lógica de programação, por mais complexa que pareça, é construída com só três blocos —
sequência, decisão e repetição. Você já executou uma **sequência** sem perceber: o programa da
"idade" acima roda de cima pra baixo, um passo depois do outro, como os passos numerados de uma
receita. Os outros dois blocos merecem mais tempo, porque é neles que a lógica de verdade
acontece.

### Decisão: `if` / `else if` / `else`

"Se está chovendo, leve guarda-chuva" é a mesma lógica condicional que você já formalizou como
porta lógica no módulo 04 — agora expressa em código. Em C++, isso vira `if`:

```cpp
int nota;
std::cin >> nota;

if (nota >= 90) {
    std::cout << "Conceito A\n";
} else if (nota >= 70) {
    std::cout << "Conceito B\n";
} else if (nota >= 50) {
    std::cout << "Conceito C\n";
} else {
    std::cout << "Conceito D\n";
}
```

Narrando: as condições são checadas **de cima pra baixo**, e a primeira que for verdadeira
"ganha" — as outras nem chegam a ser avaliadas. O `else` final é o "nenhuma das anteriores", pega
tudo que sobrou (por isso não tem condição própria).

`[TENTE VOCÊ]` Com `nota = 72`, qual conceito imprime? Resposta: **Conceito B** — `72 >= 90` é
falso, mas `72 >= 70` é verdadeiro, e como o `if` para na primeira condição verdadeira, nunca
chega a testar `>= 50`.

`[ATENÇÃO]` Um erro clássico é escrever `if (nota = 90)` com um único `=` em vez de `if (nota ==
90)`. Em C++, `=` é **atribuição** (guarda 90 em `nota`), não comparação — e o `if` avalia o
resultado dessa atribuição como verdadeiro (porque `90` é diferente de zero), então essa condição
é **sempre verdadeira**, e de quebra `nota` é sobrescrita silenciosamente para `90`. O que fazer:
sempre `==` (dois sinais de igual) para comparar; `=` (um sinal) é só para atribuir.

### Repetição: `for`

Use `for` quando você já sabe, de antemão, quantas vezes vai repetir:

```cpp
int soma = 0;
for (int i = 1; i <= 10; i++) {
    soma += i;
}
std::cout << "Soma: " << soma << "\n";
```

Narrando as três partes do `for`, separadas por `;`: `int i = 1` roda **uma vez só**, no início
(inicialização); `i <= 10` é checada **antes de cada repetição** — se for falsa, o laço para;
`i++` roda **depois de cada repetição**, incrementando `i`. O corpo (`soma += i`) roda uma vez
para cada valor de `i` de 1 a 10.

`[TENTE VOCÊ]` Como você mudaria esse `for` para somar os primeiros `N` números, onde `N` é lido
do teclado (em vez de fixo em 10)? Resposta: ler `N` com `std::cin >> N` antes do laço, e trocar a
condição para `i <= N`.

### Repetição: `while`

`for` funciona bem quando o número de repetições é conhecido antes de começar. Quando você **não
sabe** quantas vezes vai repetir — só sabe a condição que faz parar — use `while`:

```cpp
int numero;
std::cin >> numero;
while (numero != -1) {
    std::cout << "Você digitou: " << numero << "\n";
    std::cin >> numero;
}
```

Narrando: o programa lê números até o usuário digitar `-1` (o "sentinela" — um valor combinado
pra sinalizar "parei"). Ninguém sabe de antemão quantos números o usuário vai digitar antes disso
— por isso `while`, não `for`.

`[TENTE VOCÊ]` Como adaptar esse código pra parar quando o usuário digitar `0` em vez de `-1`?
Resposta: trocar a condição para `numero != 0`.

`[ATENÇÃO]` Um `while` sem uma condição que eventualmente vira falsa é um laço infinito. O que
**não** fazer:
```cpp
while (true) {
    std::cout << "Isso nunca para\n";
}
```
O que fazer no lugar: garantir que algo dentro do laço eventualmente torne a condição falsa — no
exemplo do sentinela acima, é o `std::cin >> numero` dentro do laço que dá a chance da condição
`numero != -1` virar falsa a cada repetição.

### Repetição: `do-while`

Repare que, no `while` acima, se o primeiro valor digitado já for `-1`, o corpo do laço **nunca
roda** — a condição é checada **antes**. Às vezes você precisa do oposto: rodar o corpo **pelo
menos uma vez**, e só depois checar se repete. É o caso de pedir uma senha: você precisa perguntar
a senha pelo menos uma vez antes de ter algo pra checar.

```cpp
std::string senha;
do {
    std::cout << "Digite a senha: ";
    std::cin >> senha;
} while (senha != "1234");
std::cout << "Acesso liberado!\n";
```

Narrando: o corpo (perguntar e ler a senha) roda primeiro; só **depois** a condição
`senha != "1234"` é checada, decidindo se repete. Essa é a diferença estrutural entre `while` e
`do-while` — não é só estilo, muda quando a condição é avaliada.

`[TENTE VOCÊ]` Quantas vezes o corpo roda em `while (false) { ... }`? E em
`do { ... } while (false)`? Resposta: o `while (false)` roda **zero vezes** (a condição é falsa
antes mesmo de começar); o `do-while` roda **uma vez** (o corpo sempre roda ao menos uma vez,
antes de a condição ser checada pela primeira vez).

## `[TEORIA]` Escrever, compilar e rodar C++ no Windows

Até agora você só leu blocos de código. Chegou a hora de sair da teoria — esta seção é um guia
passo a passo para quem nunca escreveu e rodou um programa C++ no Windows (se você usa Mac ou
Linux, o compilador já vem pronto no sistema — veja a prática deste módulo).

### 1. Escrever o código no Bloco de Notas

Você não precisa de um programa especial pra escrever código — código-fonte é só texto puro. O
**Bloco de Notas** (Notepad), que já vem instalado no Windows, serve perfeitamente.

Abra o Bloco de Notas, digite o código, e use "Salvar como". Aqui mora uma pegadinha: o Windows
esconde a extensão de arquivos por padrão, então o Bloco de Notas pode salvar seu arquivo como
`programa.cpp.txt` sem avisar — o `.txt` é adicionado sozinho por trás das câmaras. Para evitar
isso, no campo "Nome do arquivo" da janela "Salvar como", digite o nome **entre aspas**:
`"programa.cpp"` — as aspas forçam o Windows a usar exatamente essa extensão, ignorando o `.txt`
que ele tentaria acrescentar.

`[ATENÇÃO]` Se o arquivo ficar `programa.cpp.txt` sem você perceber, o compilador não vai
reconhecê-lo como C++ na hora de compilar (o erro geralmente menciona não saber o que fazer com o
arquivo). O que fazer: no Explorador de Arquivos, ative a exibição de extensões (Exibir > mostrar
> Extensões de nomes de arquivos, ou equivalente na sua versão do Windows) antes de começar, para
sempre conseguir ver a extensão real de qualquer arquivo salvo.

### 2. Instalar um compilador

Diferente de Mac e Linux, o Windows **não vem** com um compilador C++ pronto — é preciso instalar
um separadamente antes de conseguir compilar qualquer coisa. O caminho mais usado hoje é o
**MinGW-w64**, distribuído através do MSYS2:

1. Baixe e instale o MSYS2 (site oficial: `msys2.org`).
2. Abra o terminal do MSYS2 (instalado junto) e rode o comando de instalação do compilador
   indicado na documentação oficial do MSYS2 no momento (geralmente algo como
   `pacman -S mingw-w64-ucrt-x86_64-gcc`).
3. Adicione a pasta `bin` do MinGW instalado ao **PATH** do Windows (Painel de Controle > Sistema
   > Configurações avançadas do sistema > Variáveis de Ambiente > selecionar `Path` > Editar >
   Novo, colando o caminho da pasta `bin`) — isso é o que permite chamar `g++` de **qualquer**
   pasta, sem precisar copiar o compilador pra perto de cada programa.

`[TENTE VOCÊ]` Depois de instalar, como você confirma que o `g++` está acessível de qualquer
lugar? Resposta: abra o Prompt de Comando (ou PowerShell) em **qualquer** pasta e rode
`g++ --version`. Se aparecer a versão do compilador, o PATH está configurado certo. Se aparecer
"não é reconhecido como um comando", o PATH ainda não está certo (ou o terminal foi aberto antes
de configurar — feche e abra de novo).

### 3. Compilar

Abra o Prompt de Comando ou o PowerShell na pasta onde o `.cpp` foi salvo — navegue até ela com
`cd`, por exemplo:
```
cd Desktop
cd meus-programas
```
Depois, compile:
```
g++ programa.cpp -o programa.exe
```
Como já visto antes: nada é executado aqui — só é gerado o arquivo `programa.exe`.

### 4. Rodar

No **Prompt de Comando** (cmd): basta o nome do executável.
```
programa.exe
```
No **PowerShell**: é preciso prefixar com `.\`.
```
.\programa.exe
```
O `.\` é obrigatório no PowerShell por segurança (evita rodar sem querer um programa malicioso
que tenha o mesmo nome de um comando do sistema) — no Prompt de Comando clássico, isso não é
exigido. Essa diferença pega muita gente de surpresa na primeira vez.

`[ATENÇÃO]` Resumo dos três erros mais comuns nesse processo, e o que fazer em cada um:
- **`'g++' não é reconhecido como um comando interno ou externo`** → o PATH não foi configurado
  corretamente, ou o terminal foi aberto antes da configuração. O que fazer: revisar o passo 2, e
  fechar/reabrir o terminal depois de qualquer mudança no PATH.
- **Arquivo salvo como `programa.cpp.txt` sem perceber** → ver o `[ATENÇÃO]` da etapa 1. O que
  fazer: ativar a exibição de extensões no Explorador de Arquivos e conferir antes de compilar.
- **Esquecer o `.\` no PowerShell** → o PowerShell reclama que não reconhece `programa.exe` como
  comando (ele procura primeiro nos comandos do sistema, não na pasta atual). O que fazer: sempre
  usar `.\programa.exe` no PowerShell (não é necessário no Prompt de Comando clássico).

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Esquecer de recompilar depois de editar o código, e testar sem perceber que ainda está rodando
  a versão antiga.
- Escolher um tipo pequeno demais para o valor esperado, sem considerar o risco de overflow.
- Confundir decisão (`if`, um caminho ou outro) com repetição (`while`, o mesmo caminho várias
  vezes) na hora de montar o raciocínio de um algoritmo.
- Usar `=` em vez de `==` dentro de um `if` — a condição vira sempre verdadeira, e de quebra a
  variável é sobrescrita.
- Escrever um `while (true)` sem garantir que algo dentro do laço eventualmente torne a condição
  falsa — resultado é um laço infinito.
- No Windows, salvar o arquivo como `programa.cpp.txt` sem perceber, ou esquecer o `.\` ao rodar
  um executável no PowerShell.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Sequência, decisão, repetição (`if`/`for`/`while`/`do-while`) | Módulo 09 — construção de algoritmos completos |
| Tipos e overflow | Reforça o módulo 03, agora dentro de um programa real |
| C++ como linguagem-base, compilado no Windows | A linguagem e o fluxo de compilação usados nos exercícios do módulo 09 |

## `[REFERÊNCIA]`

- SEBESTA, Robert W. *Conceitos de Linguagens de Programação*, 5ª ed., Bookman, 2003.
- MSYS2 — documentação oficial de instalação: `https://www.msys2.org/`

## Checklist de saída

- [ ] Explico a diferença entre compilador e interpretador, com o trade-off de cada um.
- [ ] Explico o que é uma variável e por que o tipo dela importa, ligando a overflow do módulo 03.
- [ ] Escrevo uma decisão (`if`/`else if`/`else`) em C++ para um problema dado, sem confundir `=`
      com `==`.
- [ ] Escrevo uma repetição em C++ escolhendo corretamente entre `for` (número de repetições
      conhecido) e `while` (condição de parada, número de repetições desconhecido).
- [ ] Explico a diferença entre `while` e `do-while` — quando cada um roda o corpo pela primeira
      vez.
- [ ] Escrevo o código no Bloco de Notas, salvo com a extensão `.cpp` correta, compilo com `g++`
      e executo o programa no Prompt de Comando ou PowerShell, sabendo a diferença entre os dois
      (`programa.exe` x `.\programa.exe`).
