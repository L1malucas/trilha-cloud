# Módulo 13 — JavaScript / Node.js — Prática

> **Objetivo da prática:** escrever e executar JavaScript tanto no navegador quanto pelo Node.js,
> sentindo na prática a diferença entre os dois ambientes.
> **Pré-requisito:** [13_javascript-nodejs-teoria.md](13_javascript-nodejs-teoria.md) — e ter lido
> `apostila_devtrack_v2 (1).pdf` até o módulo 4 antes de começar.
> **Entregáveis:** os arquivos `.js` pedidos abaixo, mais um `README.md`, no seu repositório do
> GitHub.
> **Formato de entrega:** publicado no GitHub. O `README.md` é obrigatório e precisa ter um
> tutorial de execução passo a passo (como rodar cada exercício).

---

## Exemplo resolvido (para você seguir o mesmo formato nos exercícios)

Arquivo `exemplo.js`:
```js
function dobro(numero) {
  return numero * 2;
}

console.log(dobro(21)); // 42
```
Executado no terminal com `node exemplo.js`, o terminal imprime `42` diretamente — sem precisar
abrir nenhum navegador. Se você colasse o mesmo código no console do DevTools de um navegador
(F12 → aba Console), o resultado apareceria ali, dentro da interface do navegador, em vez de no
terminal.

## Exercícios

### 1. `01_funcao.js` — JavaScript puro

Escreva uma função que recebe dois números e retorna o maior deles (sem usar nenhum método
pronto da linguagem para isso, como `Math.max()` — implemente a comparação você mesmo). Teste a
função com pelo menos 3 pares de números diferentes, usando `console.log`.

### 2. `02_terminal.js` — rodando com Node.js

Escreva um script que declara uma variável com seu nome, uma com sua idade, e imprime uma frase
combinando as duas (ex: `"Meu nome é X e tenho Y anos"`). Rode com `node 02_terminal.js` e
confirme que o resultado aparece no terminal.

### 3. Navegador x terminal

Rode o exercício 1 (`01_funcao.js`) de duas formas: primeiro com `node 01_funcao.js` no terminal;
depois colando o mesmo código no console do DevTools do seu navegador (F12 → Console). No seu
`README.md`, descreva onde o resultado apareceu em cada caso, e se algum comportamento foi
diferente entre os dois ambientes.

## Critérios de entrega

- Os arquivos `.js` pedidos, nomeados como indicado.
- Um `README.md` com tutorial de execução passo a passo — alguém que nunca viu o projeto precisa
  conseguir rodar cada exercício só seguindo o README.
- Todo o conteúdo publicado em um repositório no GitHub.

## Checklist de entrega

- [ ] `01_funcao.js` resolvido sem usar métodos prontos, testado com pelo menos 3 pares de números.
- [ ] `02_terminal.js` resolvido e executado via `node`, com saída conferida no terminal.
- [ ] Exercício 3 (navegador x terminal) documentado no README, com a diferença observada.
- [ ] README com tutorial de execução passo a passo.
- [ ] Publicado no GitHub.
