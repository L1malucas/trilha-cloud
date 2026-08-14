# Módulo 05 — Arquitetura de Computadores — Prática

> **Objetivo da prática:** consolidar o ciclo de execução de instruções e explorar, no seu
> próprio computador, os conceitos de CPU e memória vistos na teoria.
> **Pré-requisito:** [05_arquitetura-computadores-teoria.md](05_arquitetura-computadores-teoria.md)
> **Entregáveis:** um arquivo `respostas.md` neste módulo, no seu repositório do GitHub.
> **Formato de entrega:** publicado no GitHub, com README explicando a organização do repositório.

---

## Exercícios

### 1. Ciclo fetch–decode–execute

Descreva, passo a passo, o que aconteceria no ciclo fetch-decode-execute para uma instrução que
soma o valor de dois registradores e guarda o resultado em um terceiro. Use as três etapas
(busca, decodificação, execução) explicitamente.

### 2. CISC x RISC

Monte uma tabela comparando CISC e RISC com pelo menos 3 critérios (ex: complexidade das
instruções, exemplos de processadores, tamanho típico do código gerado).

### 3. Hierarquia de memória

Ordene do mais rápido/menor para o mais lento/maior: registrador, cache L1, RAM, disco SSD.
Explique, para cada salto na hierarquia, qual o trade-off entre velocidade e capacidade.

### 4. Explorando o seu computador

`[CLI]` Rode no terminal:
- Linux: `lscpu` (informações da CPU) e `free -h` (memória).
- Mac: `sysctl -n machdep.cpu.brand_string` (CPU) e `vm_stat` (memória).
- Windows: `systeminfo` no PowerShell, ou o Gerenciador de Tarefas na aba Desempenho.

Cole a saída relevante e identifique, na saída, pelo menos 2 informações que apareceram na
teoria (ex: número de núcleos, clock, quantidade de memória).

### 5. Desafio

Pesquise o clock (em GHz) e o número de núcleos do processador do seu computador. Explique com
suas palavras o que cada um desses dois números significa na prática.

## Critérios de entrega

- Todo o conteúdo publicado em um repositório no GitHub.
- Um `README.md` na raiz do repositório, explicando a organização dos arquivos.
- Cada exercício com o enunciado copiado junto da resposta.
- No exercício 4, a saída real do seu terminal — não um exemplo genérico.

## Checklist de entrega

- [ ] Exercício 1 (ciclo fetch-decode-execute) resolvido com as 3 etapas explícitas.
- [ ] Exercício 2 (CISC x RISC) resolvido com tabela comparativa.
- [ ] Exercício 3 (hierarquia de memória) resolvido com trade-offs explicados.
- [ ] Exercício 4 (explorando o computador) resolvido com saída real do terminal.
- [ ] Exercício 5 (clock e núcleos) resolvido com explicação própria.
