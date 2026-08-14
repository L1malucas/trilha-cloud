# Módulo 10 — HTML & CSS

> **Objetivo:** entender HTML como estrutura semântica de uma página e CSS como camada de estilo
> separada dela, o suficiente para montar e estilizar páginas simples com confiança.
> **Pré-requisitos:** Módulo 09 (Algoritmos e Lógica de Programação).
> **Tempo de referência:** 4 a 6 horas (mais o tempo do desafio prático, que é diário).
> **Prática correspondente:** [10_html-css-pratica.md](10_html-css-pratica.md)

---

## Por que isso importa

Até aqui, a trilha inteira foi sobre o que acontece "por baixo": bits, circuitos, CPU, sistema
operacional, algoritmos. Este é o primeiro módulo em que o resultado do que você escreve aparece
na tela, visível, pra qualquer pessoa que abrir a página. HTML e CSS são, ao mesmo tempo, o
assunto mais simples de começar da trilha (não tem instalação, não tem compilador — um navegador
já basta) e a porta de entrada pra tudo que vem depois: formulários que vão mandar dado pra um
banco (módulos 11/12) e páginas que vão ganhar comportamento com JavaScript (módulo 13).

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

Essas são tags **semânticas** — existe uma alternativa "genérica", a `<div>`, que não diz nada
sobre o que está dentro dela (só marca "aqui tem um bloco"). Dá pra montar uma página inteira só
com `<div>`s, mas isso joga fora informação que o próprio HTML já oferece de graça: um leitor de
tela (usado por pessoas com deficiência visual) sabe anunciar "você está na navegação" quando lê
uma `<nav>`, mas não tem como saber isso de uma `<div>` qualquer. Um buscador entende que o
conteúdo dentro de `<article>` é o conteúdo principal daquela página. Usar a tag certa não é só
estilo — é comunicar significado pra quem (humano ou máquina) só tem o HTML pra entender a
página.

**Exemplo narrado:** montando a estrutura de uma página de blog — primeiro o `<header>` com o
nome do site e o `<nav>` com os links de navegação; dentro do `<main>`, um `<article>` pra cada
post; no fim, um `<footer>` com direitos autorais. Cada escolha de tag respondeu "o que esse
pedaço *é*", não "como eu quero que ele apareça".

`[TENTE VOCÊ]` Você está montando uma página de perfil de usuário, com um menu de navegação no
topo, uma seção com a bio da pessoa, e uma lista de posts recentes dela. Que tags você usaria
para essas três partes? Resposta: `<nav>` pro menu, `<main>` (ou uma `<section>` dentro dele)
pra bio, e um `<article>` pra cada post recente dentro do `<main>`.

## `[TEORIA]` CSS3: separando estrutura de apresentação

Pensa na planta de uma casa e na decoração dela como duas coisas independentes: a planta define
onde ficam as paredes, portas e cômodos (a estrutura); a decoração define cor da parede, tipo de
piso, estilo dos móveis (a apresentação) — e você pode redecorar a casa inteira sem mover uma
parede sequer. HTML é a planta; CSS é a decoração.

Separar as duas coisas em arquivos diferentes (`.html` e `.css`) tem uma razão prática direta: a
mesma estrutura HTML pode ganhar aparências completamente diferentes só trocando o CSS, sem
mexer em uma linha de HTML — e o inverso também vale, você pode reorganizar a estrutura sem
precisar reescrever todo o estilo do zero.

```css
h1 {
  color: #1a1a1a;
  font-size: 2rem;
}
```
Isso diz: "todo elemento `<h1>` da página usa essa cor e esse tamanho" — a regra de estilo mora
fora do HTML, e vale pra todos os `<h1>` de uma vez.

## `[TEORIA]` O modelo de caixas (box model)

Todo elemento HTML, quando renderizado, ocupa espaço na tela em forma de caixa retangular — e
essa caixa tem camadas, igual uma caixa de papelão de verdade: o **conteúdo** em si (o texto ou
imagem lá dentro), o **padding** (o preenchimento/almofada entre o conteúdo e a borda, como o
isopor dentro de uma caixa de encomenda), a **border** (a borda da caixa, visível ou não), e a
**margin** (o espaço vazio do lado de fora da caixa, que a afasta de outras caixas ao redor —
como o espaço entre duas caixas empilhadas num depósito).

```css
.card {
  width: 200px;
  padding: 16px;
  border: 1px solid #ccc;
  margin: 8px;
}
```

`[ATENÇÃO]` Por padrão, `width` define só a largura do **conteúdo** — padding e border se somam
por cima, então uma caixa com `width: 200px` e `padding: 16px` de cada lado ocupa, na prática,
`200 + 16 + 16 = 232px` de largura total (border somaria ainda mais). É comum, no começo,
esperar que `width: 200px` seja a largura final da caixa e se surpreender com o layout "vazando".
A propriedade `box-sizing: border-box` resolve isso fazendo o `width` já incluir padding e
border — vale conhecer, mas entenda primeiro o comportamento padrão antes de usá-la.

`[TENTE VOCÊ]` Uma caixa tem `width: 100px`, `padding: 10px` em cada lado, e `border: 2px` em
cada lado (comportamento padrão, sem `border-box`). Qual a largura total ocupada na tela?
Resposta: `100 + 10+10 + 2+2 = 124px`.

## `[TEORIA]` Seletores e a cascata

Quando duas regras CSS diferentes tentam estilizar o mesmo elemento, alguma precisa "ganhar" — é
como duas pessoas dando instruções diferentes pra mesma tarefa: precisa existir uma regra de
prioridade. O CSS resolve isso com **especificidade**: seletores mais específicos vencem os mais
genéricos.

```css
p { color: black; }          /* seleciona todo <p> — genérico */
.aviso { color: red; }       /* seleciona quem tem class="aviso" — mais específico */
#alerta-principal { color: orange; } /* seleciona o id "alerta-principal" — ainda mais específico */
```

Se um `<p class="aviso" id="alerta-principal">` existir, o `id` vence (é o mais específico dos
três), então o texto fica laranja — mesmo que a regra do `id` esteja escrita antes das outras no
arquivo. Especificidade, não ordem no arquivo, decide o empate (ordem só desempata quando a
especificidade é igual).

`[TENTE VOCÊ]` Um elemento tem `class="destaque"` e nenhum `id`. Existem as regras
`.destaque { color: blue; }` e `p { color: green; }`. Qual cor vence? Resposta: azul — seletor
de classe é mais específico que seletor de tag.

## `[TEORIA]` Flexbox: alinhando elementos sem gambiarra

Antes do Flexbox, centralizar uma caixa na tela (vertical e horizontalmente) exigia truques
pouco intuitivos. O Flexbox existe pra resolver exatamente esse tipo de problema: alinhar e
distribuir elementos dentro de um container, numa linha ou coluna.

```css
.container {
  display: flex;
  justify-content: center; /* alinha no eixo principal (horizontal, por padrão) */
  align-items: center;     /* alinha no eixo cruzado (vertical, por padrão) */
}
```

Pensando na direção dos dois eixos ajuda a não confundir as duas propriedades: `justify-content`
trabalha no sentido em que os itens "correm" (a linha), `align-items` no sentido perpendicular a
essa linha.

`[TENTE VOCÊ]` Você quer que os itens de um menu fiquem lado a lado, espaçados igualmente pela
largura toda do container. Que propriedade de `justify-content` você usaria? Resposta:
`justify-content: space-between` (ou `space-around`, dependendo se quer espaço nas pontas
também).

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Usar `<div>` para tudo, perdendo o significado semântico que tags como `<nav>`, `<article>` e
  `<footer>` já dariam de graça.
- Esquecer que padding e border se somam ao `width` no comportamento padrão do box model.
- Achar que a ordem das regras no arquivo CSS decide o empate — quem decide é a especificidade.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Formulários HTML | Módulos 11/12 — dados que um formulário coleta acabam salvos num banco |
| Estrutura semântica da página | Módulo 13 — JavaScript manipula exatamente essa estrutura (o DOM) |

## `[REFERÊNCIA]`

- [MDN — HTML](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
- [MDN — CSS](https://developer.mozilla.org/pt-BR/docs/Web/CSS)

## Checklist de saída

- [ ] Escolho a tag semântica certa para uma parte de página dada, sabendo justificar a escolha.
- [ ] Explico por que HTML e CSS ficam em arquivos separados.
- [ ] Calculo a largura total de uma caixa considerando padding e border (box model padrão).
- [ ] Explico como a especificidade decide qual regra CSS vence em um conflito.
- [ ] Uso `display: flex` com `justify-content`/`align-items` para alinhar elementos.
