# Módulo 10 — HTML & CSS

> **Objetivo:** entender HTML como estrutura semântica de uma página e CSS como camada de estilo
> separada dela, preparar o ambiente de trabalho (VSCode) e sair pronto pra começar o desafio
> prático diário.
> **Pré-requisitos:** Módulo 09 (Algoritmos e Lógica de Programação).
> **Tempo de referência:** 3 a 4 horas (mais o tempo do desafio prático, que é diário).
> **Prática correspondente:** [10_html-css-pratica.md](10_html-css-pratica.md)

---

## Por que isso importa

Até aqui, a trilha inteira foi sobre o que acontece "por baixo": bits, circuitos, CPU, sistema
operacional, algoritmos. Este é o primeiro módulo em que o resultado do que você escreve aparece
na tela, visível, pra qualquer pessoa que abrir a página. HTML e CSS são, ao mesmo tempo, o
assunto mais simples de começar da trilha (não tem instalação de linguagem, não tem compilador —
um navegador já basta) e a porta de entrada pra tudo que vem depois: formulários que vão mandar
dado pra um banco (módulos 11/12) e páginas que vão ganhar comportamento com JavaScript
(módulo 13). Este módulo é curto de propósito — o grosso do aprendizado daqui pra frente acontece
na prática diária do desafio, não numa aula longa de teoria.

## `[TEORIA]` HTML como estrutura semântica

Pensa num documento de texto qualquer: ele tem um título, parágrafos, talvez uma lista. Você
reconhece essas partes porque elas *são* essas coisas — um título é maior e mais destacado
porque é um título, não porque "parece bonito assim". HTML formaliza exatamente essa ideia:
cada tag diz o que aquele pedaço da página **é**, não como ele deveria parecer.

```html
<header>...</header>   <!-- é o cabeçalho da página -->
<nav>...</nav>         <!-- é a navegação -->
<main>...</main>       <!-- é o conteúdo principal -->
<article>...</article> <!-- é um conteúdo independente, tipo um post -->
<footer>...</footer>   <!-- é o rodapé -->
```

Existe uma tag "genérica", a `<div>`, que não diz nada sobre o que está dentro dela (só marca
"aqui tem um bloco"). Dá pra montar uma página inteira só com `<div>`s, mas isso joga fora
informação que o HTML já oferece de graça: um leitor de tela sabe anunciar "você está na
navegação" ao ler uma `<nav>`, mas não tem como saber isso de uma `<div>` qualquer.

`[TENTE VOCÊ]` Você está montando um cabeçalho de página com um menu de links no topo. Que tag
usaria pro menu, em vez de uma `<div>` genérica? Resposta: `<nav>`.

## `[TEORIA]` CSS: separando estrutura de apresentação

Pensa na planta de uma casa e na decoração dela como coisas independentes: a planta define onde
ficam paredes e cômodos (a estrutura); a decoração define cor da parede, tipo de piso (a
apresentação) — dá pra redecorar a casa inteira sem mover uma parede. HTML é a planta; CSS é a
decoração. Por isso ficam em arquivos separados (`.html` e `.css`): a mesma estrutura pode ganhar
aparências diferentes só trocando o CSS, sem tocar no HTML.

```css
h1 {
  color: #1a1a1a;
  font-size: 2rem;
}
```
Isso diz: "todo elemento `<h1>` da página usa essa cor e esse tamanho" — a regra mora fora do
HTML, e vale pra todos os `<h1>` de uma vez.

## `[TEORIA]` Preparando o ambiente: VSCode

Antes de começar o desafio diário, vale montar a bancada de trabalho uma única vez, pra não
perder tempo reconfigurando todo dia. O editor recomendado é o **VSCode** (Visual Studio Code,
gratuito) — baixe em code.visualstudio.com e instale normalmente.

Depois de instalado:

1. **Abra uma pasta como projeto** (não um arquivo solto): `Arquivo > Abrir Pasta`, escolha (ou
   crie) a pasta do seu desafio de 30 dias. Trabalhar por pasta, não por arquivo, é o que faz o
   VSCode entender a relação entre seus arquivos `.html`, `.css` e imagens.
2. **Instale duas extensões** (aba de extensões na barra lateral, ícone de blocos):
   - **Live Server**: abre sua página `.html` num navegador e atualiza sozinha toda vez que você
     salva — sem isso, você teria que apertar F5 manualmente a cada mudança.
   - **Prettier**: formata seu código automaticamente ao salvar, então você não perde tempo
     alinhando chaves e indentação na mão.
3. **Use o terminal integrado** (`` Ctrl+` `` no Windows/Linux, `` Cmd+` `` no Mac) quando
   precisar rodar comandos de Git pra fazer o commit diário — não precisa alternar de janela.

`[TENTE VOCÊ]` Instale as duas extensões, crie um arquivo `index.html` simples dentro de uma
pasta de projeto, e clique em "Go Live" (Live Server) no canto inferior direito do VSCode. O que
deve acontecer? Resposta: o navegador abre sozinho mostrando sua página, e qualquer alteração
salva no arquivo aparece automaticamente na aba aberta, sem precisar recarregar manualmente.

`[ATENÇÃO]` Se as imagens ou o CSS não aparecerem mesmo com os caminhos certos, o erro mais comum
é ter aberto um **arquivo** solto no VSCode (`Arquivo > Abrir Arquivo`) em vez da **pasta** do
projeto inteiro — sem a pasta aberta como raiz, caminhos relativos (`./estilo.css`,
`./imagens/foto.png`) podem não resolver do jeito esperado.

## `[TEORIA]` O modelo de caixas (box model), rapidamente

Todo elemento HTML ocupa espaço na tela em forma de caixa retangular, com camadas — igual uma
caixa de papelão: o **conteúdo**, o **padding** (preenchimento entre conteúdo e borda), a
**border**, e a **margin** (espaço vazio fora da caixa, que a afasta de outras).

```css
.card {
  width: 200px;
  padding: 16px;
  border: 1px solid #ccc;
  margin: 8px;
}
```

`[ATENÇÃO]` Por padrão, `width` define só a largura do **conteúdo** — padding e border se somam
por cima. Uma caixa com `width: 200px` e `padding: 16px` de cada lado ocupa, na prática,
`200 + 16 + 16 = 232px`. É comum se surpreender com o layout "vazando" por esperar que `width`
já fosse a largura final.

`[TENTE VOCÊ]` Uma caixa tem `width: 100px`, `padding: 10px` em cada lado. Qual a largura total?
Resposta: `100 + 10 + 10 = 120px`.

## `[TEORIA]` Seletores e a cascata, rapidamente

Quando duas regras CSS tentam estilizar o mesmo elemento, o CSS decide quem vence pela
**especificidade** — seletores mais específicos vencem os mais genéricos.

```css
p { color: black; }                  /* genérico */
.aviso { color: red; }               /* mais específico */
#alerta-principal { color: orange; } /* ainda mais específico */
```

`[TENTE VOCÊ]` Um elemento tem `class="destaque"` e existem as regras
`.destaque { color: blue; }` e `p { color: green; }`. Qual cor vence? Resposta: azul — seletor de
classe é mais específico que seletor de tag.

## `[TEORIA]` Flexbox, rapidamente

O Flexbox resolve o problema clássico de alinhar e distribuir elementos dentro de um container.

```css
.container {
  display: flex;
  justify-content: center; /* eixo principal */
  align-items: center;     /* eixo cruzado */
}
```

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Usar `<div>` para tudo, perdendo o significado semântico de tags como `<nav>`/`<article>`.
- Abrir um arquivo solto no VSCode em vez da pasta do projeto — quebra caminhos relativos.
- Esquecer que padding e border se somam ao `width` no comportamento padrão do box model.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Formulários HTML | Módulos 11/12 — dados que um formulário coleta acabam salvos num banco |
| Estrutura semântica da página | Módulo 13 — JavaScript manipula exatamente essa estrutura (o DOM) |

## `[REFERÊNCIA]`

- [MDN — HTML](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
- [MDN — CSS](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
- [Visual Studio Code — documentação oficial](https://code.visualstudio.com/docs)
- [CSS-Tricks](https://css-tricks.com/) — artigos e guias práticos de CSS, bom complemento à
  referência mais formal do MDN.

## Checklist de saída

- [ ] Escolho a tag semântica certa para uma parte de página dada.
- [ ] Explico por que HTML e CSS ficam em arquivos separados.
- [ ] Tenho o VSCode instalado, com Live Server e Prettier, e sei abrir uma pasta de projeto
      (não um arquivo solto).
- [ ] Calculo a largura total de uma caixa considerando padding (box model padrão).
- [ ] Explico como a especificidade decide qual regra CSS vence em um conflito.
- [ ] Uso `display: flex` com `justify-content`/`align-items` para alinhar elementos.
