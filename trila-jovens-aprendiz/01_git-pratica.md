# Módulo 01 — Git — Prática

> **Objetivo da prática:** praticar os comandos essenciais do Git usando o Learn Git Branching e
> um repositório real no GitHub.
> **Pré-requisito:** [01_git-teoria.md](01_git-teoria.md)
> **Entregáveis:** o link do seu repositório no GitHub, mais um arquivo `respostas.md`.
> **Formato de entrega:** publicado no GitHub, com README explicando a organização do repositório.

---

## Exemplo resolvido

Iniciando um repositório, registrando um commit, criando uma branch e mesclando de volta:
```
git init
echo "primeira versão" > app.txt
git add app.txt
git commit -m "adiciona app.txt"

git branch melhoria
git switch melhoria
echo "segunda linha" >> app.txt
git add app.txt
git commit -m "adiciona segunda linha"

git switch main
git merge melhoria
```
Depois do merge, `app.txt` na `main` tem as duas linhas — a mudança feita isoladamente na branch
`melhoria` foi trazida de volta. Rodar `git log --graph --oneline` mostra visualmente os dois
caminhos se juntando.

Agora é a sua vez.

## Exercícios

### 1. Learn Git Branching

Acesse [learngitbranching.js.org](https://learngitbranching.js.org/?locale=pt_BR) e complete:
- A sequência **"Introduction Sequence"** (níveis 1 a 4).
- Pelo menos os 3 primeiros níveis de **"Ramping Up"**.

Para cada nível completado, anote qual comando (ou sequência de comandos) resolveu o desafio.

### 2. Repositório próprio

Crie um repositório no GitHub e faça pelo menos 3 commits, cada um precedido de `git add`.

### 3. Branch e merge

Crie uma branch, faça uma mudança nela, e mescle de volta na `main`. Confira com
`git log --graph --oneline` que o histórico mostra os dois caminhos.

### 4. Gerando e resolvendo um conflito

Edite a mesma linha de um arquivo em duas branches diferentes, tente mesclar, e resolva o
conflito manualmente (removendo os marcadores `<<<<<<<`, `=======`, `>>>>>>>`).

### 5. Material complementar

Assista pelo menos 3 vídeos de uma das playlists indicadas na teoria
([playlist 1](https://www.youtube.com/playlist?list=PLHz_AreHm4dm7ZULPAmadvNhH6vk9oNZA) ou
[playlist 2](https://www.youtube.com/playlist?list=PLucm8g_ezqNq0dOgug6paAkH0AQSJPlIe)) e escreva
um parágrafo curto sobre um conceito que ficou mais claro depois de assistir.

## Critérios de entrega

- Repositório publicado no GitHub, com os commits, a branch mesclada e o conflito resolvido
  visíveis no histórico (`git log --graph`).
- `respostas.md` com os níveis do Learn Git Branching completados (e os comandos usados) e o
  parágrafo do exercício 5.
- Um `README.md` explicando a organização do repositório.

## Checklist de entrega

- [ ] Níveis do Learn Git Branching completados e documentados em `respostas.md`.
- [ ] Repositório com pelo menos 3 commits, cada um com `git add` antes.
- [ ] Branch criada e mesclada de volta na `main`.
- [ ] Conflito de merge gerado propositalmente e resolvido.
- [ ] Parágrafo sobre o vídeo assistido, no `respostas.md`.
