---
id: 08_linguagens-programacao-pratica
title: "Módulo 08 — Linguagens de Programação — Prática"
sidebar_position: 81
---

# Módulo 08 — Linguagens de Programação — Prática

> **Objetivo da prática:** escrever, compilar e executar programas simples em C++, entendendo
> compilação e execução como dois momentos distintos.
> **Pré-requisito:** [08_linguagens-programacao-teoria.md](08_linguagens-programacao-teoria.md)
> **Entregáveis:** os arquivos `.cpp` desta prática, mais um `README.md` explicando como compilar
> e rodar cada um.
> **Formato de entrega:** publicado no GitHub, com README contendo o passo a passo de execução.

---

## Exemplo resolvido

**Programa que lê um número e imprime o dobro dele:**
```cpp
#include <iostream>

int main() {
    int numero;
    std::cout << "Digite um número: ";
    std::cin >> numero;
    std::cout << "O dobro é: " << numero * 2 << "\n";
    return 0;
}
```

Salve como `dobro.cpp` (no Windows, usando o Bloco de Notas — ver a seção "Escrever, compilar e
rodar C++ no Windows" da teoria se ainda não fez isso, principalmente o cuidado com a extensão
`.cpp.txt`). Agora, dois momentos **distintos**:

1. **Compilar** (traduzir o texto inteiro pra um executável, uma vez só):
   ```
   g++ dobro.cpp -o dobro.exe
   ```
   Nada é executado aqui — só é gerado o arquivo `dobro.exe` (o executável). No Mac/Linux o mesmo
   comando funciona sem o `.exe` (`g++ dobro.cpp -o dobro`), já que esses sistemas não usam essa
   extensão para executáveis.

2. **Executar** (rodar o executável já traduzido, quantas vezes quiser, sem recompilar):
   - No **Prompt de Comando** (Windows): `dobro.exe`
   - No **PowerShell** (Windows): `.\dobro.exe` (o `.\` é obrigatório)
   - No **Mac/Linux**: `./dobro`

   Só agora o programa pede o número e mostra o resultado. Se você editar `dobro.cpp` depois
   disso, precisa repetir o passo 1 antes que a mudança apareça ao rodar o passo 2 de novo.

## Exercícios

### 1. Saudação personalizada

Escreva um programa que leia o nome digitado pelo usuário (como texto) e imprima uma saudação
com esse nome.

### 2. Soma de dois números

Escreva um programa que leia dois números inteiros e imprima a soma deles.

### 3. Compilando e executando, documentando os dois momentos

Compile e execute o programa do exercício 2. No seu `respostas.md`, cole o comando de compilação
usado, o comando de execução usado, e a saída do programa — deixando claro, por escrito, qual
comando corresponde a "traduzir" e qual corresponde a "rodar".

### 4. Provocando overflow de propósito

Declare uma variável do tipo `short` (que usa menos bits que `int`) e tente guardar nela um valor
maior do que ela suporta (pesquise o limite de um `short` antes — em C++ dá pra conferir com
`std::numeric_limits<short>::max()`, do cabeçalho `<limits>`). Imprima o valor guardado e observe
o resultado. Explique, com suas palavras, por que o valor impresso não é o valor que você tentou
guardar.

### 5. Classificando uma nota (decisão)

Escreva um programa que leia uma nota (0 a 100) e imprima o conceito correspondente usando
`if`/`else if`/`else`, seguindo a mesma faixa do exemplo da teoria (≥90 → A, ≥70 → B, ≥50 → C,
resto → D). Teste com pelo menos 4 valores diferentes, um pra cada conceito, documentando a
entrada e a saída de cada teste no `respostas.md`.

### 6. Somando com `for` e lendo até parar com `while`

Escreva dois programas:
- Um que leia um número `N` e some os `N` primeiros números inteiros usando `for` (adaptando o
  exemplo da teoria).
- Um que leia números digitados pelo usuário, um de cada vez, até ele digitar `-1`, e imprima
  quantos números (sem contar o `-1`) foram digitados, usando `while`.

### 7. Setup no Windows, documentado

Se você está usando Windows: escreva o programa do exercício 1 (Saudação personalizada) inteiro
no Bloco de Notas, salve com a extensão `.cpp` correta, compile pelo Prompt de Comando **ou**
PowerShell (escolha um) e rode o executável gerado. Tire um print da tela do terminal mostrando o
comando de compilação, o comando de execução e a saída do programa, e inclua esse print (ou o
texto copiado do terminal) no `respostas.md`. Se você usa Mac/Linux, documente o mesmo processo
no seu sistema, indicando isso claramente no `respostas.md`.

## Critérios de entrega

- Todo o conteúdo publicado em um repositório no GitHub.
- Um `README.md` na raiz do repositório, explicando como compilar e rodar cada exercício.
- Cada exercício com o enunciado copiado junto da resposta (código + explicação, quando pedido).

## Checklist de entrega

- [ ] Exercício 1 (saudação) resolvido, compilado e testado.
- [ ] Exercício 2 (soma) resolvido, compilado e testado.
- [ ] Exercício 3 (documentando compilação x execução) resolvido, com os dois comandos e a saída
      colados.
- [ ] Exercício 4 (overflow de propósito) resolvido, com o resultado explicado.
- [ ] Exercício 5 (classificando uma nota) resolvido, com os 4 testes documentados.
- [ ] Exercício 6 (soma com `for` e leitura com `while`) resolvido, os dois programas.
- [ ] Exercício 7 (setup no Windows/Mac/Linux documentado) resolvido, com print ou saída do
      terminal.
- [ ] Publicado no GitHub com README explicando como compilar e rodar.
