---
id: 13_javascript-nodejs-teoria
title: "Módulo 13 — JavaScript / Node.js"
sidebar_position: 130
---

# Módulo 13 — JavaScript / Node.js

> **Objetivo:** entender JavaScript como linguagem interpretada, o runtime Node.js (V8 + libuv,
> Event Loop) e os módulos nativos que sustentam qualquer ferramenta de linha de comando real
> (fs, readline, http).
> **Pré-requisitos:** Módulo 12 (SQL Server) concluído.
> **Tempo de referência:** 6 a 8 horas.
> **Prática correspondente:** [13_javascript-nodejs-pratica.md](13_javascript-nodejs-pratica.md)

---

## Por que isso importa

Este é o módulo final da trilha, e ele reúne o que veio antes: o raciocínio algorítmico do
módulo 09, a estruturação de código do módulo 08, a manipulação de dados dos módulos 11 e 12, e
até os conceitos de processo/E-S do módulo 06 — tudo numa única linguagem que roda tanto no
navegador quanto no servidor. A prática deste módulo é construir, peça por peça, uma ferramenta
de linha de comando real (o **DevTrack**) — então a teoria aqui foi escolhida a dedo pra te dar
exatamente o que você vai precisar nela.

## `[TEORIA]` JavaScript como linguagem interpretada

No módulo 08 você viu a diferença entre linguagem compilada (o código inteiro é traduzido pra
máquina antes de rodar) e interpretada (o código é lido e executado, sem uma etapa de compilação
separada visível pra você). JavaScript é interpretada: você escreve o código, manda rodar, e ele
executa direto.

```js
console.log("Olá, mundo!");
```
Essa linha, sozinha, já é um programa completo e executável.

## `[TEORIA]` Variáveis e tipagem dinâmica

No módulo 08, C++ exigia declarar o tipo de cada variável antes de usá-la (`int idade = 20;`) — o
compilador checa esses tipos antes mesmo do programa rodar. JavaScript faz o oposto: você declara
a variável sem dizer o tipo, e o tipo é decidido em tempo de execução, pelo valor que ela recebe
naquele momento — e pode até mudar depois:

```js
let idade = 20;        // aqui, idade é um número
idade = "vinte anos";  // agora, a mesma variável virou texto — sem erro
```

Isso é **tipagem dinâmica**. Ela dá flexibilidade, mas troca a segurança que a checagem de tipos
do compilador C++ te dava — um erro de tipo em JavaScript só aparece quando aquela linha
específica roda, não antes.

`[TENTE VOCÊ]` O que a linha `console.log("2" + 3)` imprime, e por quê? Resposta: `"23"` — como
`"2"` é texto, o operador `+` concatena em vez de somar números.

`[ATENÇÃO]` Esse comportamento — `+` ora somando, ora concatenando, dependendo do tipo em tempo
de execução — é fonte clássica de bugs silenciosos. Confira sempre o tipo de um valor que vem de
fora (input do usuário, resposta de rede, leitura de arquivo) antes de operar com ele.

## `[TEORIA]` Node.js: o runtime por trás do DevTrack

JavaScript nasceu pra rodar dentro do navegador — cada navegador tem um motor que interpreta o
código (o do Chrome se chama **V8**). O Node.js pegou esse mesmo motor V8 e o combinou com uma
segunda peça, a **libuv**, uma biblioteca de E/S assíncrona — e empacotou os dois pra rodar
sozinhos no terminal, sem navegador. É essa dupla que faz o Node funcionar:

| Componente | Papel | O que faz |
|---|---|---|
| **V8** | Motor JS | Compila e executa o JavaScript — gerencia a Call Stack, memória e otimizações |
| **libuv** | E/S assíncrona | Gerencia o Event Loop, o thread pool de disco/rede/DNS |
| **Bindings C++** | Ponte | Conectam as APIs do Node (`fs`, `http`, `crypto`) ao sistema operacional |

`[ATENÇÃO]` É comum ouvir "Node é single-threaded" e concluir que ele não usa nenhuma outra
thread — impreciso. A *sua* Call Stack (o código JavaScript que você escreve) roda numa única
thread. Mas a libuv usa um pool de threads *por baixo dos panos* para as operações de E/S — é
isso que permite ao Node atender milhares de conexões sem travar, delegando o trabalho pesado
para fora da thread principal, exatamente como o sistema operacional intermedia E/S visto no
módulo 06.

## `[TEORIA]` O Event Loop: por que o Node não trava esperando

**Call Stack** é a estrutura (LIFO — Last In, First Out) que rastreia onde o programa está na
execução: uma função chamada entra na pilha, uma função que retorna sai. Se ela nunca esvaziar
(loop infinito, recursão sem caso base), o processo trava — **stack overflow**.

Operações de E/S (ler um arquivo, fazer uma requisição HTTP) levam tempo — colocá-las direto na
Call Stack travaria tudo enquanto esperam. Em vez disso, o Node delega essas operações à libuv, e
o **Event Loop** — o mecanismo que faz o Node "não-bloqueante" — fica de olho em filas de
callbacks prontos pra rodar assim que a Call Stack esvazia:

```js
console.log("1 — síncrono");
setTimeout(() => console.log("3 — macrotask (setTimeout)"), 0);
Promise.resolve().then(() => console.log("2 — microtask (Promise)"));
console.log("1.5 — ainda síncrono");
```
**Raciocínio, linha por linha:** as duas chamadas de `console.log` síncronas rodam primeiro,
porque estão direto na Call Stack. `Promise.resolve().then(...)` agenda uma **microtask** — o
Node esvazia completamente a fila de microtasks assim que a Call Stack fica livre, antes de
qualquer outra coisa. `setTimeout(..., 0)` agenda uma **macrotask** — só roda depois, na fase
seguinte do loop, mesmo com delay zero.

`[TENTE VOCÊ]` Qual é a ordem real de saída do código acima? Resposta:
`"1 — síncrono"`, `"1.5 — ainda síncrono"`, `"2 — microtask (Promise)"`,
`"3 — macrotask (setTimeout)"` — síncrono primeiro, microtasks segundo, macrotasks por último.

## `[TEORIA]` De callbacks a async/await

O padrão mais antigo de assincronicidade em JavaScript é o **callback**: uma função passada como
argumento, chamada quando a operação termina. Node.js consagrou o padrão **error-first callback**
— o primeiro argumento do callback é sempre um erro (ou `null`):

```js
fs.readFile("dados.json", "utf-8", (err, conteudo) => {
  if (err) { console.error("Erro:", err.message); return; }
  console.log(JSON.parse(conteudo));
});
console.log("Isso executa ANTES do callback acima");
```

Quando várias operações assíncronas precisam acontecer em sequência, os callbacks se aninham —
o "Pyramid of Doom". **Promises** resolvem isso: um objeto que representa o resultado futuro de
uma operação, em um de três estados (`pending`, `fulfilled`, `rejected`), permitindo encadear com
`.then()`/`.catch()` em vez de aninhar.

`async/await` é **açúcar sintático** sobre Promises — não é um mecanismo novo, é a mesma coisa
escrita de um jeito que lê como código síncrono:

```js
async function carregarConfig() {
  try {
    const texto = await fs.promises.readFile("config.json", "utf-8");
    return JSON.parse(texto);
  } catch (err) {
    if (err.code === "ENOENT") return { porta: 3000 }; // valor padrão
    throw err; // re-lança o que não sabemos tratar
  }
}
```
Com `async/await`, o tratamento de erro volta ao `try/catch` de sempre — o fluxo de erro fica
visualmente colado ao código que pode falhar, diferente da cadeia de `.catch()` das Promises.

`[ATENÇÃO]` Esquecer o `await` antes de uma chamada assíncrona é um dos erros mais comuns — a
função continua executando sem esperar o resultado, e você acaba com uma Promise pendente no
lugar do valor esperado, em vez de um erro óbvio.

## `[TEORIA]` Sistema de arquivos com `fs/promises`

O DevTrack (a ferramenta que você vai construir na prática) persiste tudo em um arquivo JSON
local — e para isso usa o submódulo `fs/promises`, a versão moderna do `fs` que retorna Promises
em vez de pedir callback:

```js
import { readFile, writeFile, rename } from "fs/promises";

async function salvarJSON(caminho, dados) {
  const tmp = caminho + ".tmp";
  await writeFile(tmp, JSON.stringify(dados, null, 2), "utf-8");
  await rename(tmp, caminho); // operação atômica: não corrompe se falhar no meio
}
```
Por que escrever num arquivo temporário e depois renomear, em vez de escrever direto no arquivo
final? Porque `rename` é atômico no sistema operacional — ou o arquivo final é totalmente
substituído, ou nada muda. Escrever direto arrisca deixar um JSON pela metade se o processo cair
no meio da escrita.

`[ATENÇÃO]` Existe uma versão síncrona (`readFileSync`, `writeFileSync`) que bloqueia a Call
Stack até terminar. É aceitável só em dois casos: scripts simples de linha de comando que não
precisam atender mais ninguém enquanto isso, ou ler configuração uma única vez, no início do
programa, antes de qualquer outra coisa rodar. Num servidor (como o que você vai construir na
Tarefa 9 da prática), usar a versão síncrona trava *todas* as conexões enquanto um único arquivo
é lido.

## `[TEORIA]` Terminal interativo com `readline`

O módulo `readline` lê entrada do usuário linha por linha — é a base de qualquer menu interativo
no terminal, como o primeiro CLI do DevTrack:

```js
import readline from "readline";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// rl.question é baseado em callback — envolver em Promise permite usar await
const perguntar = (texto) => new Promise((resolve) => rl.question(texto, resolve));

const nome = await perguntar("Qual o título da tarefa? ");
console.log(`Tarefa "${nome}" registrada.`);
```

Um detalhe que muda o comportamento de um CLI real: `process.stdout.isTTY` é `true` só quando a
saída vai para um terminal interativo de verdade — `false` quando é redirecionada para um arquivo
ou outro programa (`node cli.js | cat`). Programas bem-feitos detectam isso e trocam tabelas
coloridas por um JSON limpo quando não há terminal do outro lado.

`[TENTE VOCÊ]` Se você rodar `node cli.js` direto no terminal, `process.stdout.isTTY` é `true` ou
`false`? E se rodar `node cli.js | cat`? Resposta: `true` no primeiro caso (terminal interativo
real); `false` no segundo (a saída está sendo redirecionada para outro processo).

## `[TEORIA]` Rede e HTTP no Node

O módulo 07 já cobriu os conceitos de HTTP/URL em geral — aqui é como o Node os expõe como código.
Um servidor HTTP nativo, sem framework:

```js
import http from "http";

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: "ok" }));
  }
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not Found" }));
});
server.listen(3000, () => console.log("Servidor em http://localhost:3000"));
```

Para *consumir* uma API externa, o Node 18+ já traz `fetch` global — sem precisar importar nada:

```js
const resposta = await fetch("https://api.github.com/repos/nodejs/node/issues");
if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
const issues = await resposta.json();
```

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai a revisão:

- Confiar que `+` sempre soma, sem checar se os dois lados são realmente números.
- Esquecer o `await` antes de uma chamada assíncrona.
- Usar `fs.readFileSync`/`writeFileSync` num servidor, bloqueando todas as conexões.
- Achar que "Node é single-threaded" significa que nenhuma outra thread existe — a libuv usa um
  pool de threads por baixo, só a sua Call Stack é single-threaded.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Event Loop / processos assíncronos | Módulo 06 (SO) — mesma lógica de E/S não-bloqueante, agora em código |
| Servidor HTTP / fetch | Módulo 07 (Redes) — os mesmos conceitos de HTTP, agora implementados |
| Todo o módulo | Prática: projeto DevTrack, que usa cada um destes tópicos numa ferramenta real |

## `[REFERÊNCIA]`

- `workshop_nodejs_v3 (1).md` (já presente em `trila-jovens-aprendiz/`) — workshop completo de
  referência por tópico, fonte deste módulo.
- `apostila_devtrack_v2 (1).md` (já presente em `trila-jovens-aprendiz/`) — as 24 tarefas do
  projeto DevTrack, base da prática deste módulo.
- Documentação oficial: [Node.js — process](https://nodejs.org/api/process.html),
  [Node.js — fs/promises](https://nodejs.org/api/fs.html#promises-api),
  [Node.js — readline](https://nodejs.org/api/readline.html),
  [Node.js — Event Loop, Timers e process.nextTick()](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/).
- [Node.js — Documentação completa](https://nodejs.org/docs/latest/api/)
- [MDN — JavaScript](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)

## Checklist de saída

- [ ] Explico por que JavaScript é interpretada, ligando com compilador/interpretador do módulo 08.
- [ ] Explico a diferença entre tipagem estática (C++, módulo 08) e dinâmica (JavaScript).
- [ ] Descrevo o papel do V8 e da libuv no runtime Node, e por que "single-threaded" é uma
      simplificação.
- [ ] Explico a ordem de execução entre código síncrono, microtasks e macrotasks no Event Loop.
- [ ] Escrevo uma função `async` com `try/catch` para tratar erro de leitura de arquivo.
- [ ] Explico por que `fs/promises` é preferível a `fs` síncrono num servidor.
- [ ] Sei o que `process.stdout.isTTY` detecta e por que isso importa num CLI.
