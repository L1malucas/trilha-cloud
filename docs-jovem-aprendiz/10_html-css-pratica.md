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

## Exemplo resolvido — Dia 1: cartão de perfil

Um bom primeiro projeto do desafio é um cartão de perfil simples: uma imagem, um nome e uma
pequena bio, centralizados numa caixa com sombra.

Estrutura HTML, usando tag semântica pro conteúdo (é uma seção independente de conteúdo, então
`<article>` faz mais sentido que uma `<div>` genérica):
```html
<article class="cartao">
  <img src="foto.jpg" alt="Foto de perfil">
  <h2>Nome da pessoa</h2>
  <p>Uma bio curta.</p>
</article>
```

Estilo, aplicando o que foi visto na teoria — box model pro espaçamento interno, Flexbox pra
centralizar o conteúdo do cartão:
```css
.cartao {
  width: 240px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
```
Repare que cada decisão de CSS aqui remete direto à teoria: `padding` é o espaçamento interno da
caixa (box model), `display: flex` com `flex-direction: column` empilha os itens verticalmente e
`align-items: center` os centraliza no eixo cruzado (que, numa coluna, é o horizontal).

## Regras do desafio

O desafio "30 dias de CSS3" tem regras fixas, seguidas à risca:

1. **Um projeto por dia** — pequeno, focado num conceito (não precisa ser grande, precisa ser
   feito).
2. **Compartilhar o progresso no grupo diariamente.**
3. **Postar tudo no GitHub diariamente** — mesmo que não tenha finalizado o dia.
4. **Compartilhar a cada quinze dias** os desafios feitos, no LinkedIn.
5. **No final do período**, apresentar sobre um assunto determinado por sorteio.

A lista completa dos 30 desafios diários está em `html-css-30-dias.pdf`, já presente nesta pasta
— use-a como guia dia a dia. Os primeiros dias tendem a focar em estrutura e box model (cartões,
listas, formulários simples); os do meio, em seletores e cascata; os finais, em layout com
Flexbox (menus, grids de cartões, páginas completas).

## Critérios de entrega

- Um commit no GitHub por dia do desafio, mesmo que o projeto daquele dia não esteja terminado.
- Um `README.md` na raiz do repositório, listando os 30 dias e linkando pra pasta/arquivo de
  cada um.
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
