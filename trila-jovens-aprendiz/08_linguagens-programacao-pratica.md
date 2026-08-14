# Módulo 08 — Linguagens de Programação — Prática

> **Objetivo da prática:** escrever, compilar e executar programas simples em C, entendendo
> compilação e execução como dois momentos distintos.
> **Pré-requisito:** [08_linguagens-programacao-teoria.md](08_linguagens-programacao-teoria.md)
> **Entregáveis:** os arquivos `.c` desta prática, mais um `README.md` explicando como compilar e
> rodar cada um.
> **Formato de entrega:** publicado no GitHub, com README contendo o passo a passo de execução.

---

## Exemplo resolvido

**Programa que lê um número e imprime o dobro dele:**
```c
#include <stdio.h>

int main() {
    int numero;
    printf("Digite um número: ");
    scanf("%d", &numero);
    printf("O dobro é: %d\n", numero * 2);
    return 0;
}
```

Salve como `dobro.c`. Agora, dois momentos **distintos**:

1. **Compilar** (traduzir o texto inteiro pra um executável, uma vez só):
   ```
   gcc dobro.c -o dobro
   ```
   Nada é executado aqui — só é gerado o arquivo `dobro` (o executável).

2. **Executar** (rodar o executável já traduzido, quantas vezes quiser, sem recompilar):
   ```
   ./dobro
   ```
   Só agora o programa pede o número e mostra o resultado. Se você editar `dobro.c` depois disso,
   precisa repetir o passo 1 antes que a mudança apareça ao rodar o passo 2 de novo.

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
maior do que ela suporta (pesquise o limite de um `short` antes). Imprima o valor guardado e
observe o resultado. Explique, com suas palavras, por que o valor impresso não é o valor que você
tentou guardar.

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
- [ ] Publicado no GitHub com README explicando como compilar e rodar.
