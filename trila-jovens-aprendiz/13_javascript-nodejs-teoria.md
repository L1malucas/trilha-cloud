# Módulo 13 — JavaScript / Node.js

> **Objetivo:** entender JavaScript como linguagem interpretada e o Node.js como ambiente que
> permite rodar JavaScript fora do navegador.
> **Pré-requisitos:** Módulo 12 (SQL Server) concluído. Ler `apostila_devtrack_v2 (1).pdf` até o
> módulo 4 **antes** de começar os exercícios práticos.
> **Tempo de referência:** 5 a 6 horas.
> **Prática correspondente:** [13_javascript-nodejs-pratica.md](13_javascript-nodejs-pratica.md)

---

## Por que isso importa

Este é o módulo final da trilha, e ele reúne o que veio antes: o raciocínio algorítmico do
módulo 09, a estruturação de código do módulo 08, e a manipulação de dados dos módulos 11 e 12 —
tudo numa única linguagem que roda tanto no navegador (onde qualquer site interativo usa
JavaScript) quanto no servidor (via Node.js). Entender essa dualidade é o que explica por que
JavaScript virou, na prática, a linguagem mais usada do mundo: aprende uma vez, aplica nos dois
lados de uma aplicação.

## `[TEORIA]` JavaScript como linguagem interpretada

No módulo 08 você viu a diferença entre linguagem compilada (o código inteiro é traduzido pra
máquina antes de rodar) e interpretada (o código é lido e executado linha a linha, sem uma etapa
de compilação separada visível pra você). JavaScript é interpretada: você escreve o código, manda
rodar, e ele executa direto — sem gerar um arquivo executável separado como aconteceria em C.

```js
console.log("Olá, mundo!");
```
Essa linha, sozinha, já é um programa completo e executável — não existe etapa de "compilar
antes".

## `[TEORIA]` Variáveis, funções e tipagem dinâmica

No módulo 08, C exigia declarar o tipo de cada variável antes de usá-la (`int idade = 20;`) — o
compilador checa esses tipos antes mesmo do programa rodar. JavaScript faz o oposto: você declara
a variável sem dizer o tipo, e o tipo é decidido em tempo de execução, pelo valor que ela recebe
naquele momento — e pode até mudar depois:

```js
let idade = 20;        // aqui, idade é um número
idade = "vinte anos";  // agora, a mesma variável virou texto — sem erro
```

Isso é chamado de **tipagem dinâmica**. Ela dá flexibilidade (menos código pra escrever, menos
burocracia), mas troca a segurança que a checagem de tipos do compilador C te dava — um erro de
tipo em JavaScript só aparece quando aquela linha específica roda, não antes.

Funções em JavaScript seguem a mesma lógica do módulo 08 (nome, parâmetros, corpo, retorno), só
com sintaxe própria:

```js
function somar(a, b) {
  return a + b;
}
console.log(somar(2, 3)); // 5
```

`[TENTE VOCÊ]` O que a linha `console.log(somar("2", 3))` imprime, e por quê? Resposta:
`"23"` — como `"2"` é texto (tipagem dinâmica não bloqueou isso), o operador `+` concatena texto
em vez de somar números.

`[ATENÇÃO]` Esse comportamento — `+` ora somando números, ora concatenando texto, dependendo do
tipo dos valores em tempo de execução — é uma fonte clássica de bugs silenciosos em JavaScript.
Vale sempre conferir o tipo de uma variável antes de operar com ela, especialmente quando o valor
vem de fora (input do usuário, resposta de um banco de dados).

## `[TEORIA]` Node.js: JavaScript fora do navegador

Originalmente, JavaScript só existia dentro do navegador — cada navegador tem um "motor" que lê
e executa o código JS de uma página (o do Chrome se chama V8). O Node.js pegou exatamente esse
motor V8 e o empacotou para rodar sozinho, no terminal, sem navegador nenhum — é por isso que dá
pra usar JavaScript tanto no front-end (a página que o usuário vê) quanto no back-end (o servidor
que responde os pedidos), com a mesma linguagem dos dois lados.

**Diferença na prática:** no navegador, `console.log()` aparece no console do DevTools (F12); no
terminal, rodando com Node.js, o mesmo `console.log()` aparece direto na tela do terminal.

```
node arquivo.js
```
Isso executa `arquivo.js` usando o Node.js, fora de qualquer navegador.

`[TENTE VOCÊ]` Se você escrever `console.log("teste")` num arquivo `teste.js` e rodar
`node teste.js` no terminal, onde o texto "teste" vai aparecer? Resposta: direto no terminal, na
mesma janela onde você rodou o comando — não dentro de nenhum navegador.

## Erros comuns

Você já viu este aviso ao longo do módulo — aqui vai a revisão:

- Confiar que `+` sempre soma, sem checar se os dois lados são realmente números — em JavaScript,
  ele também concatena texto, dependendo do tipo em tempo de execução.
- Achar que Node.js é "outra linguagem" — é o mesmo JavaScript, só rodando fora do navegador.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Lógica algorítmica (módulo 09) aplicada numa linguagem real | Projetos práticos fora da trilha |
| Consulta a bancos de dados (módulos 11/12) | Aplicações Node.js que leem/gravam dados |

## `[REFERÊNCIA]`

- `apostila_devtrack_v2 (1).pdf` (já presente em `trila-jovens-aprendiz/`) — conceitos
  fundamentais de JavaScript. Leitura obrigatória até o módulo 4, antes da prática.
- `workshop_nodejs_v3 (1).pdf` (já presente em `trila-jovens-aprendiz/`) — aplicação prática em
  ambiente Node.js.

## Checklist de saída

- [ ] Explico por que JavaScript é uma linguagem interpretada, ligando com a distinção
      compilador/interpretador do módulo 08.
- [ ] Explico a diferença entre tipagem estática (C, módulo 08) e tipagem dinâmica (JavaScript).
- [ ] Escrevo uma função simples em JavaScript, com parâmetros e retorno.
- [ ] Explico o que é o Node.js e por que ele permite rodar JavaScript fora do navegador.
- [ ] Sei rodar um arquivo `.js` pelo terminal usando `node arquivo.js`.
