---
id: 07_redes-computadores-web-pratica
title: "Módulo 07 — Redes de Computadores e Web — Prática"
sidebar_position: 71
---

# Módulo 07 — Redes de Computadores e Web — Prática

> **Objetivo da prática:** inspecionar requisições HTTP reais e decompor URLs, conectando a
> teoria a tráfego de rede real.
> **Pré-requisito:** [07_redes-computadores-web-teoria.md](07_redes-computadores-web-teoria.md)
> **Entregáveis:** um arquivo `respostas.md` neste módulo, no seu repositório do GitHub.
> **Formato de entrega:** publicado no GitHub, com README explicando a organização do repositório.

---

## Exemplo resolvido

`[CLI]` Rodando `curl -v https://example.com`:
```
> GET / HTTP/1.1
> Host: example.com
...
< HTTP/1.1 200 OK
< Content-Type: text/html; charset=UTF-8
...
```
O `>` mostra o que foi enviado (a requisição: método `GET`, para o host `example.com`). O `<`
mostra o que foi recebido (a resposta: código de status `200 OK`, significando sucesso, e o
cabeçalho `Content-Type` dizendo que o corpo da resposta é HTML).

Agora é a sua vez.

## Exercícios

### 1. Inspecionando uma requisição real

`[CLI]` Rode `curl -v <uma URL à sua escolha>` no terminal (ou abra o DevTools do navegador, aba
Network, e recarregue uma página). Cole a saída relevante e identifique:
- O método HTTP usado (ex: `GET`).
- O código de status da resposta (ex: `200`, `404`).
- Pelo menos 2 cabeçalhos de resposta.

### 2. Decompondo URLs

Decomponha 3 URLs à sua escolha em protocolo, domínio, caminho e query string (escolha pelo menos
uma que tenha query string).

### 3. Contando requisições de uma página

Usando o DevTools (aba Network), abra um site e recarregue a página. Quantas requisições foram
feitas para carregar a página inteira (HTML, CSS, imagens, scripts, etc.)? Liste pelo menos 3
delas e diga o tipo de recurso que cada uma trouxe.

### 4. TCP x UDP

Explique com suas palavras a diferença entre TCP e UDP, e cite um exemplo de aplicação que
provavelmente usa cada um, justificando por quê.

### 5. Desafio

`[CLI]` Usando `curl -I <url>` (só cabeçalhos, sem baixar o corpo), compare os cabeçalhos de
resposta de dois sites diferentes e aponte pelo menos uma diferença entre eles.

## Critérios de entrega

- Todo o conteúdo publicado em um repositório no GitHub.
- Um `README.md` na raiz do repositório, explicando a organização dos arquivos.
- Cada exercício com o enunciado copiado junto da resposta, incluindo a saída real do terminal
  ou do DevTools (não um exemplo genérico).

## Checklist de entrega

- [ ] Exercício 1 (inspecionando requisição) resolvido com saída real do terminal/DevTools.
- [ ] Exercício 2 (decompondo URLs) resolvido com as 3 URLs.
- [ ] Exercício 3 (contando requisições) resolvido com pelo menos 3 requisições listadas.
- [ ] Exercício 4 (TCP x UDP) explicado com exemplos próprios.
- [ ] Exercício 5 (comparando cabeçalhos) resolvido com a diferença apontada.
