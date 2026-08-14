# Módulo 06 — Sistemas Operacionais — Prática

> **Objetivo da prática:** explorar, no seu próprio sistema operacional, os conceitos de
> processos, memória e gerência de E/S vistos na teoria.
> **Pré-requisito:** [06_sistemas-operacionais-teoria.md](06_sistemas-operacionais-teoria.md)
> **Entregáveis:** um arquivo `respostas.md` neste módulo, no seu repositório do GitHub.
> **Formato de entrega:** publicado no GitHub, com README explicando a organização do repositório.

---

## Exercícios

### 1. Estados de um processo

Liste, na ordem correta, os estados possíveis de um processo (novo, pronto, executando,
bloqueado, terminado) e descreva o que causa a transição entre dois estados à sua escolha (ex: o
que faz um processo sair de "executando" para "bloqueado"?).

### 2. Explorando processos no seu sistema

`[CLI]` Abra um terminal e rode `ps aux` (Linux/Mac) ou abra o Gerenciador de Tarefas
(`Ctrl+Shift+Esc` no Windows). Identifique 3 processos rodando e diga, para cada um, se é um
processo do próprio sistema operacional ou de uma aplicação que você abriu.

### 3. RAM x memória virtual

Explique, com suas próprias palavras, a diferença entre memória RAM (física) e memória virtual.

### 4. Linux x Windows

Monte uma tabela comparando Linux e Windows em pelo menos 3 critérios (ex: código aberto, uso
típico, interface padrão).

### 5. Desafio — encerrando um processo

`[CLI]` Abra um aplicativo simples e seguro para encerrar via terminal (ex: um bloco de notas,
uma calculadora). Descubra o PID dele (`ps aux | grep nome` no Linux/Mac, ou a coluna PID no
Gerenciador de Tarefas no Windows) e encerre-o usando `kill <PID>` (Linux/Mac) ou
`taskkill /PID <pid> /F` (Windows). Descreva o comando exato que você usou e o resultado.

## Critérios de entrega

- Todo o conteúdo publicado em um repositório no GitHub.
- Um `README.md` na raiz do repositório, explicando a organização dos arquivos.
- Cada exercício com o enunciado copiado junto da resposta.
- Nos exercícios 2 e 5, use a saída real do seu terminal — não um exemplo genérico.

## Checklist de entrega

- [ ] Exercício 1 (estados de um processo) resolvido com a transição explicada.
- [ ] Exercício 2 (explorando processos) resolvido com saída real do terminal.
- [ ] Exercício 3 (RAM x memória virtual) explicado com suas palavras.
- [ ] Exercício 4 (Linux x Windows) resolvido com tabela comparativa.
- [ ] Exercício 5 (encerrando um processo) resolvido com o comando usado e o resultado.
