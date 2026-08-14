---
id: 05_arquitetura-computadores-teoria
title: "Módulo 05 — Arquitetura de Computadores"
sidebar_position: 50
---

# Módulo 05 — Arquitetura de Computadores

> **Objetivo:** entender os componentes de um computador (CPU, memória, E/S, barramentos) e como
> uma instrução é buscada e executada.
> **Pré-requisitos:** Módulo 04 (Circuitos Digitais).
> **Tempo de referência:** 3 a 4 horas.
> **Prática correspondente:** [05_arquitetura-computadores-pratica.md](05_arquitetura-computadores-pratica.md)

---

## Por que isso importa

No módulo 04 você montou, na teoria, um meio-somador — duas portas lógicas (XOR e AND) somando
dois bits. Este módulo responde a pergunta natural que fica depois disso: como uma pilha de
circuitos desse tipo vira uma máquina que executa um programa inteiro? A resposta conecta os
bits e portas dos módulos 03 e 04 a uma arquitetura funcional, e prepara o terreno para entender
o papel do sistema operacional (módulo 06) como intermediário entre esse hardware e as
aplicações.

## `[TEORIA]` Componentes básicos

- **CPU**: contém a ULA (Unidade Lógica e Aritmética — literalmente uma coleção de circuitos como
  o meio-somador do módulo 04, combinados para somar, comparar, fazer operações lógicas) e a
  Unidade de Controle (que coordena o ciclo de execução), além de registradores (memória
  ultrarrápida dentro da própria CPU).
- **Memória (RAM)**: armazena temporariamente programas e dados em execução — é volátil (perde o
  conteúdo ao desligar).
- **Dispositivos de E/S**: teclado, tela, disco, rede — tudo que entra ou sai da máquina.
- **Barramentos**: os "fios" que conectam esses componentes, divididos em barramento de dados
  (o que é transportado), de endereço (para onde) e de controle (sinais de coordenação).

## `[TEORIA]` Arquitetura de Von Neumann

Imagine cozinhar numa bancada onde a receita escrita e os ingredientes ficam no mesmo espaço
físico — você usa a mesma bancada tanto para ler o próximo passo quanto para pegar o próximo
ingrediente. Na arquitetura de Von Neumann — a base da maioria dos computadores atuais —
acontece algo parecido: programa (a "receita", em forma de instruções) e dados (os
"ingredientes") compartilham a mesma memória.

Isso simplifica o projeto do hardware (uma única forma de acessar memória serve pros dois casos),
mas cria um gargalo: CPU e memória se comunicam por um único barramento compartilhado, então a
velocidade da CPU fica sempre limitada pela velocidade de acesso a essa memória — do mesmo jeito
que, na cozinha, você não consegue ler a receita e pegar um ingrediente ao mesmo tempo se os dois
estão no mesmo espaço apertado.

## `[TEORIA]` Ciclo de busca e execução (fetch–decode–execute)

Uma dúvida comum de quem está começando é imaginar que o computador "carrega o programa inteiro e
roda tudo de uma vez". Não é assim: toda instrução passa, uma de cada vez, por três etapas
repetidas continuamente:

1. **Busca (fetch)**: a Unidade de Controle busca a próxima instrução na memória, no endereço
   apontado pelo *Program Counter* (PC) — um registrador que guarda "qual instrução vem agora".
2. **Decodificação (decode)**: a instrução é interpretada — o que ela pede para fazer.
3. **Execução (execute)**: a ULA executa a operação (ex: somar dois valores de registradores) e
   o resultado é armazenado onde a instrução indicar.

**Exemplo narrado:** suponha a instrução "some o valor do registrador A com o registrador B, e
guarde o resultado em C". No fetch, a Unidade de Controle busca essa instrução na memória, no
endereço apontado pelo PC. No decode, ela identifica: "isso é uma soma, os operandos são A e B, o
destino é C". No execute, a ULA (que, no fundo, é feita de somadores como o do módulo 04) executa
a soma de fato, e o resultado é escrito no registrador C. Só depois disso o PC avança para a
próxima instrução, e o ciclo recomeça — instrução por instrução, nunca "tudo de uma vez".

`[TENTE VOCÊ]` Descreva as três etapas do ciclo para a instrução "compare o valor do registrador
X com zero". Resposta esperada: fetch busca essa instrução no endereço do PC; decode identifica
que é uma comparação, com X e a constante 0 como operandos; execute manda a ULA comparar os dois
valores e guarda o resultado da comparação (ex: em uma flag de status).

`[ATENÇÃO]` É fácil imaginar a CPU "executando o programa inteiro de uma vez" — mas o que
realmente acontece é esse ciclo de três etapas se repetindo, uma instrução por vez, várias
centenas de milhões (ou bilhões) de vezes por segundo. A sensação de "tudo ao mesmo tempo" é só
efeito da velocidade.

## `[TEORIA]` Conjunto de instruções: CISC x RISC

Pense em duas formas de dar instruções pra alguém montar um móvel: uma manual gigante, com poucas
instruções, cada uma cobrindo várias etapas de uma vez ("monte a lateral esquerda completa"); ou
um manual com muito mais passos, cada um bem simples e do mesmo tamanho ("pegue o parafuso A",
"encaixe na posição 1", "aperte"). A primeira abordagem é o espírito do **CISC**; a segunda, do
**RISC**.

| | CISC | RISC |
|---|---|---|
| Instruções | Muitas, complexas (uma instrução pode fazer várias coisas) | Poucas, simples e de tamanho fixo |
| Exemplo | x86 (Intel/AMD) | ARM (celulares, Apple Silicon) |
| Trade-off | Menos instruções por programa, decodificação mais complexa | Mais instruções por programa, decodificação mais simples e rápida |

Nenhuma abordagem "vence" — cada uma otimiza um lado diferente do mesmo ciclo fetch-decode-execute
que você acabou de ver: CISC economiza no número de instruções buscadas, RISC economiza no tempo
de decodificar cada uma.

## `[TEORIA]` Hierarquia de memória

Pense em como você organiza objetos pela frequência de uso: o que você usa a cada minuto fica em
cima da mesa; o que usa algumas vezes por dia, numa gaveta perto; o que usa raramente, num
armário longe. Quanto mais perto de você, menos cabe — mas mais rápido você alcança. A memória de
um computador segue exatamente essa lógica, do mais rápido/menor ao mais lento/maior:

```
Registradores → Cache (L1, L2, L3) → RAM → Armazenamento (SSD/HD)
```

O princípio por trás dessa hierarquia é a **localidade**: dados usados recentemente (ou perto de
dados usados recentemente) tendem a ser usados de novo em breve, então vale a pena mantê-los mais
perto da CPU — do mesmo jeito que vale a pena manter na mesa o que você vai usar de novo em
segundos, não guardar no armário.

`[TENTE VOCÊ]` Se um programa acabou de ler um valor da RAM e provavelmente vai precisar dele de
novo em milissegundos, pra onde faz sentido movê-lo? Resposta: para a cache — é exatamente o
princípio de localidade em ação.

## `[APROFUNDAMENTO]` Dispositivos de E/S: controladores

A CPU não conversa diretamente com um disco ou uma placa de rede — ela conversa com um
**controlador**, um chip dedicado que sabe operar aquele dispositivo específico. Quando o
dispositivo termina uma tarefa (ex: terminou de ler um setor do disco), ele avisa a CPU por meio
de uma **interrupção**, em vez de a CPU precisar ficar checando repetidamente se terminou — a
mesma lógica de eficiência que já apareceu na hierarquia de memória: gastar o mínimo de esforço
possível checando algo que ainda não mudou.

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Achar que a CPU "executa o programa inteiro de uma vez", em vez de instrução por instrução.
- Confundir RAM (memória volátil, temporária) com armazenamento permanente (disco/SSD).
- Achar que "mais cache" sempre resolve qualquer problema de performance, ignorando o princípio
  de localidade.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Gerência de memória e processos | Módulo 06 — Sistemas Operacionais |
| Ciclo de instrução | Módulo 08 — como código-fonte vira instrução de máquina |

## `[REFERÊNCIA]`

- BROOKSHEAR, J. Glenn. *Ciência da Computação — Uma Visão Abrangente*, 7ª ed., Bookman, 2005 —
  Capítulos 3 e 4 (Arquitetura de Máquina / Sistemas Operacionais).
- WHITE, Ron. *Como Funciona o Computador*, 8ª ed., Quark, 1998.

## Checklist de saída

- [ ] Nomeio os componentes básicos de um computador e o papel de cada um, sabendo ligar a ULA
      aos circuitos lógicos do módulo 04.
- [ ] Descrevo o ciclo fetch-decode-execute passo a passo, narrando a decisão em cada etapa (não
      só listando os nomes das três fases).
- [ ] Explico o gargalo de Von Neumann usando a analogia da bancada compartilhada.
- [ ] Comparo CISC e RISC com pelo menos 2 diferenças.
- [ ] Ordeno a hierarquia de memória do mais rápido ao mais lento, e explico o princípio de
      localidade por trás dela.
- [ ] Explico, em termos gerais, o que é uma interrupção e por que ela é mais eficiente que
      checagem repetida.
