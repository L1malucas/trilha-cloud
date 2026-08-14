---
id: 10_html-css-pratica
title: "Módulo 10 — HTML & CSS — Prática"
sidebar_position: 101
---

# Módulo 10 — HTML & CSS — Prática: Desafio 30 Dias de CSS3

> **Objetivo da prática:** treinar HTML e CSS todos os dias, num projeto pequeno por vez, até o
> box model, seletores e Flexbox ficarem naturais.
> **Pré-requisito:** [10_html-css-teoria.md](10_html-css-teoria.md)
> **Entregáveis:** um projeto por dia, publicado no seu repositório do GitHub.
> **Formato de entrega:** GitHub diário + compartilhamento quinzenal no LinkedIn + apresentação
> final.

---

## Exemplo resolvido — Dia 1: ícone de mídia social em camadas

O desafio do Dia 1 pede um ícone circular com efeito de "camadas" (profundidade), usando só HTML
e CSS.

Estrutura HTML — o ícone é um conteúdo independente e pequeno, então uma `<div>` simples já basta
aqui (não há ainda significado semântico específico a comunicar, ao contrário de um `<nav>` ou
`<article>`):
```html
<div class="icone"></div>
```

Estilo, aplicando o box model da teoria — camadas de `box-shadow` empilhadas simulam
profundidade sem precisar de nenhuma imagem:
```css
.icone {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #4a90d9;
  box-shadow:
    0 4px 0 #3a72ad,   /* camada logo abaixo, mais escura */
    0 8px 12px rgba(0,0,0,0.3); /* sombra difusa, dá profundidade */
}
```
Repare que cada `box-shadow` extra empilhado é uma "camada" — a primeira simula uma borda inferior
sólida (como se o círculo tivesse espessura), a segunda espalha uma sombra suave por baixo. Duas
camadas simples já bastam pra dar sensação de profundidade num elemento chapado.

## Regras do desafio

O desafio "30 dias de CSS3" tem regras fixas, seguidas à risca:

1. **Um projeto por dia** — pequeno, focado num conceito (não precisa ser grande, precisa ser
   feito).
2. **Compartilhar o progresso no grupo diariamente.**
3. **Postar tudo no GitHub diariamente** — mesmo que não tenha finalizado o dia.
4. **Compartilhar a cada quinze dias** os desafios feitos, no LinkedIn.
5. **Sem ajuda de IA** para resolver os desafios — o objetivo é treinar o raciocínio próprio de
   CSS, não delegar a solução.
6. **No final do período**, apresentar sobre um assunto determinado por sorteio.

## Trilha principal — 30 desafios de efeitos CSS

A coluna "conceitos" vem da apostila original quando especificada; nos dias sem essa informação
na fonte, pesquise o conceito principal do efeito antes de começar (é parte do exercício).

| Dia | Desafio | Conceitos a aprender |
|---|---|---|
| 01 | Ícone de mídia social em camadas | *(ver exemplo resolvido acima: `box-shadow` empilhado)* |
| 02 | Loader animado | — |
| 03 | Mudança de cor de texto quando entra em outra div | — |
| 04 | Botão com efeito | — |
| 05 | Efeito pulsar | — |
| 06 | Efeito lightning text | — |
| 07 | Preloader animado | — |
| 08 | Coração batendo | — |
| 09 | Pêndulo de Newton | — |
| 10 | Animação de texto alternando | — |
| 11 | Botão com efeito hover | — |
| 12 | Efeito de preenchimento ao passar o mouse | `:hover`, `::before`, transições |
| 13 | Loading com efeito | `animations`, `nth-child()` |
| 14 | Fundo de texto animado | `background-clip`, `animations` |
| 15 | Texto flutuante | `transform`, `animations` |
| 16 | Botão com efeito | `:hover`, `::before`, `transform`, transições |
| 17 | Loader animado | `animations` |
| 18 | Texto esfumaçado | `nth-child()`, `transform`, `:hover` |
| 19 | Efeitos de animação de fundo de partículas | `nth-child()`, `transform`, `animations`, variáveis CSS |
| 20 | Botão com efeito | `:hover`, `::before`, `transform`, transições |
| 21 | Esferas quicando | `nth-child()`, `animations` |
| 22 | Ícones com efeito | `::before`, `::after`, `:hover`, `animations` |
| 23 | Botão com efeito | `:hover`, `transform` |
| 24 | Preloader animado | `animations`, `nth-child()` |
| 25 | Checkbox animado | `::before`, `animations` |
| 26 | Loading com efeito | `::before`, `::after`, `animations` |
| 27 | Efeito pulsar | `::before`, `::after`, `animations` |
| 28 | Cor do background mudando | `animations` |
| 29 | Menu responsivo com Media Queries | `@media` |
| 30 | Fogos de artifício | `nth-child()`, `::before`, `::after`, `animations` |

## Trilha bônus — desenhos com CSS puro

Trilha paralela e opcional (ou pra rodar numa segunda passada depois da principal): desenhar 30
ícones/objetos usando só formas CSS — sem nenhuma imagem.

| Dia | Tema | Objetivo | Conceitos |
|---|---|---|---|
| 1 | Sol 🌞 | Círculo amarelo com bordas arredondadas e brilho; raios com pseudo-elementos | `border-radius`, `box-shadow`, `transform`, posicionamento absoluto |
| 2 | Nuvem ☁ | Combinar múltiplos círculos sobrepostos | `border-radius`, `position`, flexbox |
| 3 | Casa 🏠 | Formas básicas (retângulos e triângulos) | `border`, `clip-path` |
| 4 | Árvore 🌳 | Copa circular e tronco retangular | `border-radius`, `background-color` |
| 5 | Coração ❤ | Dois círculos + um quadrado rotacionado | `border-radius`, `transform: rotate`, pseudo-elementos |
| 6 | Olho 👁 | Círculos concêntricos e gradiente para profundidade | `border-radius`, `linear-gradient`, centralização |
| 7 | Montanha ⛰ | Triângulos e gradiente para sombra | `clip-path`, `linear-gradient` |
| 8 | Balão 🎈 | Círculo grande + corda conectada | `border-radius`, `position`, `:hover` |
| 9 | Xícara de café ☕ | Xícara com alça e sombra | `border-radius`, `box-shadow`, `position` |
| 10 | Peixe 🐟 | Triângulos e círculos estilizados | `clip-path`, `border-radius`, `position` |
| 11 | Arco-íris 🌈 | Gradientes ou arcos sobrepostos | `linear-gradient`, `conic-gradient`, flexbox |
| 12 | Gato 🐱 | Rosto com orelhas, olhos e bigodes | pseudo-elementos (`::before`/`::after`) |
| 13 | Pássaro 🐦 | Formas geométricas e sombras | `border-radius`, posicionamento absoluto, `box-shadow` |
| 14 | Robô 🤖 | Cabeça retangular, antenas, botões | formas retangulares, bordas arredondadas, gradientes |
| 15 | Avião ✈ | Triângulos para asas, corpo retangular | `clip-path`, `position`, `rotate` |
| 16 | Borboleta 🦋 | Asas simétricas e corpo central | `transform`, `rotate`, pseudo-elementos |
| 17 | Carro 🚗 | Rodas circulares e corpo retangular | `border-radius`, gradientes, centralização |
| 18 | Relógio ⏰ | Ponteiros animados | `@keyframes`, posicionamento absoluto, centralização |
| 19 | Flor 🌸 | Pétalas circulares organizadas radialmente | `transform: rotate`, gradientes, pseudo-elementos |
| 20 | Livro 📖 | Livro aberto com páginas e sombras | `box-shadow`, posicionamento, `transform` |
| 21 | Cachorro 🐶 | Orelhas, olhos e nariz | pseudo-elementos, formas geométricas |
| 22 | Cidade 🏙 | Skyline com prédios e janelas iluminadas | `grid`, `box-shadow`, gradientes |
| 23 | Castelo 🏰 | Torres, bandeiras e portões | `clip-path`, pseudo-elementos, gradientes |
| 24 | Dragão 🐉 | Corpo ondulado e asas | animações, pseudo-elementos, bordas complexas |
| 25 | Barco 🚤 | Formas simples e gradiente para água | `border-radius`, gradientes, flexbox |
| 26 | Mandala 🌀 | Padrões simétricos e coloridos | `transform: rotate`, `clip-path`, gradientes |
| 27 | Planeta 🌍 | Continentes estilizados e gradientes | `radial-gradient`, pseudo-elementos |
| 28 | Computador 💻 | Tela, teclado e sombras | formas geométricas, `box-shadow`, bordas arredondadas |
| 29 | Jogo da velha (interativo) | Tabuleiro com efeito de hover | `:hover`, `transition`, `grid` |
| 30 | Personagem pixelado | Pixel art com grade de blocos | `grid`, alinhamento, cores sólidas |

## Critérios de entrega

- Um commit no GitHub por dia do desafio, mesmo que o projeto daquele dia não esteja terminado.
- Um `README.md` na raiz do repositório, listando os 30 dias (e os bônus, se fizer essa trilha
  também) e linkando pra pasta/arquivo de cada um.
- Compartilhamento no LinkedIn a cada 15 dias (dia 15 e dia 30), com print ou link do
  repositório.
- Ao final, apresentação sobre o assunto sorteado — preparo mínimo: revisar a seção da teoria
  correspondente antes de apresentar.

## Checklist de entrega

- [ ] 30 projetos, um por dia, cada um em sua própria pasta/arquivo no repositório.
- [ ] Commits diários no GitHub (verificável pelo histórico).
- [ ] `README.md` listando e linkando os 30 dias.
- [ ] Progresso compartilhado no grupo diariamente.
- [ ] Compartilhamento no LinkedIn feito no dia 15 e no dia 30.
- [ ] Apresentação final preparada e realizada.
