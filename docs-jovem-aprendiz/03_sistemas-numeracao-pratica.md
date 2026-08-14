---
id: 03_sistemas-numeracao-pratica
title: "Módulo 03 — Sistemas de Numeração — Prática"
sidebar_position: 31
---

# Módulo 03 — Sistemas de Numeração — Prática

> **Objetivo da prática:** treinar conversões entre decimal, binário e hexadecimal até
> conseguir justificar cada passo — não só chegar na resposta certa por mecânica.
> **Pré-requisito:** [03_sistemas-numeracao-teoria.md](03_sistemas-numeracao-teoria.md)
> **Entregáveis:** um arquivo `respostas.md` neste módulo, no seu repositório do GitHub.
> **Formato de entrega:** publicado no GitHub, com README explicando a organização do repositório.

---

## Exemplo resolvido (para você seguir o mesmo raciocínio nos exercícios)

**Convertendo `50` para binário, pelo método das moedas (`1, 2, 4, 8, 16, 32...`):**

```
Maior moeda que cabe em 50? → 32 (sobra 18)
Maior moeda que cabe em 18? → 16 (sobra 2)
Maior moeda que cabe em 2?  → 2  (sobra 0)
```
Moedas usadas: `32, 16, 2`. Marcando `1` nessas casas e `0` nas demais:
```
32  16   8   4   2   1
 1   1   0   0   1   0   →  110010
```
Conferindo com o terminal: `python3 -c "print(bin(50))"` → `0b110010`. Bate.

Agora é a sua vez — nos exercícios abaixo, mostre o raciocínio (não só a resposta final), do
mesmo jeito que foi feito acima.

## Exercícios

### 1. Decimal → binário

Converta pelo método das moedas, mostrando cada passo: `13`, `41`, `100`, `255`.

### 2. Binário → decimal

Converta somando o valor de cada casa (posição), mostrando a soma: `1010`, `101010`, `11111111`.

### 3. Binário ↔ hexadecimal

1. Converta `11010110` para hexadecimal, mostrando o agrupamento em blocos de 4 bits.
2. Converta `0x3F` para binário e depois para decimal.

### 4. Soma binária

Some, mostrando coluna por coluna e o vai-um explicitamente (como no exemplo da teoria):
1. `0110 + 0011`
2. `1011 + 0111`

### 5. Quantos bits são necessários?

Quantos bits, no mínimo, são necessários para representar todos os números inteiros de `0` até
`1000`? Não vale só dar o número — explique o raciocínio: quantos valores diferentes `n` bits
conseguem representar, e a partir de qual `n` esse total passa de 1000.

### 6. Conferindo com o terminal

`[CLI]` Depois de resolver os exercícios 1 a 3 na mão, confira cada resposta rodando:
```
python3 -c "print(bin(N), hex(N))"          # decimal -> binário/hex
python3 -c "print(int('BINARIO', 2))"       # binário -> decimal
python3 -c "print(int('HEX', 16))"          # hex -> decimal
```
Cole, no seu arquivo de respostas, a saída do terminal ao lado de cada resposta manual. Se algo
não bater, o objetivo não é só corrigir a resposta — é achar em qual passo do raciocínio manual
o erro aconteceu, e anotar isso também.

## Critérios de entrega

- Todo o conteúdo publicado em um repositório no GitHub.
- Um `README.md` na raiz do repositório, explicando a organização dos arquivos.
- Cada exercício com o enunciado copiado junto da resposta, **incluindo o raciocínio passo a
  passo** — uma resposta só com o número final, sem o caminho até ela, não é considerada completa.
- No exercício 6, se alguma resposta manual não bateu com o terminal, documente onde foi o erro.

## Checklist de entrega

- [ ] Exercício 1 (decimal → binário) resolvido com o passo a passo das moedas.
- [ ] Exercício 2 (binário → decimal) resolvido com a soma das posições explícita.
- [ ] Exercício 3 (binário ↔ hexadecimal) resolvido nos dois sentidos, com o agrupamento mostrado.
- [ ] Exercício 4 (soma binária) resolvido com o vai-um explícito, coluna por coluna.
- [ ] Exercício 5 (quantos bits) resolvido com justificativa, não só o número.
- [ ] Exercício 6 (conferência via terminal) com as saídas coladas e qualquer divergência explicada.