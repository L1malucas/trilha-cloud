---
id: 06_sistemas-operacionais-teoria
title: "Módulo 06 — Sistemas Operacionais"
sidebar_position: 60
---

# Módulo 06 — Sistemas Operacionais

> **Objetivo:** entender o papel do sistema operacional como intermediário entre hardware e
> aplicações, e como ele gerencia processos, memória e dispositivos de E/S.
> **Pré-requisitos:** Módulo 05 (Arquitetura de Computadores).
> **Tempo de referência:** 3 a 4 horas.
> **Prática correspondente:** [06_sistemas-operacionais-pratica.md](06_sistemas-operacionais-pratica.md)

---

## Por que isso importa

No módulo 05 você viu que a CPU executa uma instrução de cada vez, seguindo o ciclo
fetch-decode-execute. Mas o seu computador roda dezenas de programas "ao mesmo tempo" — navegador,
editor de texto, música tocando. Como isso é possível, se a CPU só faz uma coisa por vez? A
resposta é a camada de software que fica entre o hardware e cada programa, decidindo quem usa a
CPU e quando: o sistema operacional. Entender o que ele faz explica, por exemplo, por que dois
programas não conseguem "invadir" a memória um do outro, e por que a sensação de simultaneidade é
uma ilusão bem construída, não algo real.

## `[TEORIA]` Níveis de organização da máquina

```
Hardware (CPU, memória, dispositivos — o que você viu no módulo 05)
  → Sistema Operacional (kernel)
    → Aplicações (navegador, editor de texto, seu programa)
```

O sistema operacional abstrai o hardware: uma aplicação pede "leia este arquivo" sem precisar
saber em qual setor físico do disco os dados estão — do mesmo jeito que você dirige um carro sem
precisar entender a injeção eletrônica por baixo do capô.

## `[TEORIA]` Funções do sistema operacional

- **Gerência de processos**: decidir quem usa a CPU e quando.
- **Gerência de memória**: alocar e proteger a memória usada por cada processo.
- **Gerência de arquivos**: organizar dados em disco de forma estruturada (sistema de arquivos).
- **Gerência de E/S**: intermediar o acesso a teclado, tela, rede, disco.
- **Interface com o usuário**: linha de comando ou interface gráfica.

## `[TEORIA]` Gerência de processos

**Processo** é um programa em execução (com seu próprio espaço de memória, estado, etc.) —
diferente de **programa**, que é apenas o arquivo executável parado em disco, sem nenhuma dessas
coisas ainda alocadas.

`[ATENÇÃO]` É fácil tratar "processo" e "programa" como sinônimos — mas o programa é só o arquivo;
o processo só existe enquanto está rodando, com memória e estado próprios.

Como você viu no módulo 05, a CPU só executa uma instrução por vez. Com mais processos do que
núcleos de CPU disponíveis, o sistema operacional não roda tudo em paralelo de verdade — ele
alterna rapidamente entre os processos (escalonamento), dando fatias curtas de tempo pra cada um,
como uma pessoa alternando a atenção entre várias conversas tão rápido que parece estar em todas
ao mesmo tempo. A simultaneidade que você percebe é essa troca acontecendo rápido demais para o
olho humano notar.

Um processo passa por estados ao longo de sua vida:

```
Novo → Pronto → Executando → (Bloqueado ↔ Executando) → Terminado
```

**Exemplo narrado:** um processo entra em "Pronto" assim que está preparado, mas só passa a
"Executando" quando o escalonador decide dar a vez a ele. Se, no meio da execução, ele precisar
esperar algo lento (ex: uma resposta de disco), o sistema operacional o tira de "Executando" e
coloca em "Bloqueado" — assim a CPU não fica parada esperando, e pode dar a vez a outro processo
"Pronto" nesse meio tempo. Quando o disco responde, o processo volta para "Pronto", na fila para
executar de novo.

`[TENTE VOCÊ]` Um processo está em "Executando" e faz uma leitura de arquivo, que demora. Pra
qual estado ele vai, e por quê? Resposta: "Bloqueado" — ele está esperando uma operação lenta de
E/S, e fica parado até ela terminar, liberando a CPU para outro processo nesse meio tempo.

## `[TEORIA]` Gerência de memória

Assim como um processo precisa de um espaço isolado pra rodar sem interferir em outro, a memória
RAM inteira do computador precisa ser dividida entre todos os processos ativos — sem que um leia
ou sobrescreva o espaço do outro por acidente ou má-fé. É pra isso que existe a **memória
virtual**: cada processo enxerga um espaço de memória próprio e isolado, como se tivesse a
máquina inteira só pra ele, mesmo que fisicamente vários processos estejam dividindo a mesma RAM.

Isso é feito através de **paginação** — a memória é dividida em blocos (páginas), e o SO mapeia
páginas virtuais (o que o processo "acha" que está usando) para endereços físicos reais (onde os
dados realmente estão). Quando a RAM física está cheia, o SO pode mover páginas menos usadas para
o disco — o mesmo princípio de hierarquia de memória do módulo 05, só que aplicado ao contrário:
em vez de subir dados pra cache por serem muito usados, desce dados pra disco por serem pouco
usados no momento.

`[ATENÇÃO]` Memória virtual não é a mesma coisa que RAM física — é uma camada de abstração que
pode, inclusive, usar espaço em disco quando a RAM não é suficiente. Quando isso acontece, o
sistema fica visivelmente mais lento, porque disco é muito mais lento que RAM (lembra da
hierarquia de memória do módulo 05?).

## `[TEORIA]` Gerência de E/S

A gerência de E/S do sistema operacional usa exatamente o mecanismo de controladores e
interrupções que você viu no módulo 05: **drivers** (software específico para cada tipo de
dispositivo) traduzem os pedidos genéricos do SO ("leia este arquivo") em comandos que o
controlador daquele dispositivo entende, e o dispositivo avisa quando termina por interrupção —
sem o SO precisar ficar checando repetidamente.

## `[TEORIA]` Linux x Windows

| | Linux | Windows |
|---|---|---|
| Código-fonte | Aberto (open-source) | Fechado (proprietário) |
| Kernel | Monolítico, customizável | Monolítico híbrido |
| Uso comum | Servidores, desenvolvimento | Desktops, uso geral |
| Interface padrão | Linha de comando forte, GUI opcional | GUI como padrão |

## `[CLI]` Comandos básicos de gerência de processos

```
ps aux      # lista processos em execução (Linux/Mac)
top         # monitora processos em tempo real (Linux/Mac)
kill <PID>  # encerra um processo pelo seu identificador (Linux/Mac)
```
No Windows, o equivalente é o Gerenciador de Tarefas (`Ctrl+Shift+Esc`) ou o comando
`Get-Process` / `Stop-Process` no PowerShell.

`[TENTE VOCÊ]` Rode `ps aux` (ou abra o Gerenciador de Tarefas) agora mesmo e encontre um processo
do navegador que você está usando. O PID que aparece do lado dele identifica, de forma única,
aquele processo específico — mesmo que você tenha várias abas abertas, cada processo do navegador
tem seu próprio PID.

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Achar que "processo" e "programa" são a mesma coisa.
- Achar que fechar a janela de um aplicativo sempre encerra o processo imediatamente.
- Ignorar que memória virtual não é RAM física — pode envolver disco, que é muito mais lento.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Gerência de E/S | Módulo 07 — Redes de Computadores (sockets usam essa camada) |
| SO como camada intermediária | Módulo 08 — onde o interpretador/compilador roda |

## `[REFERÊNCIA]`

- TANENBAUM, Andrew S. *Sistemas Operacionais Modernos*, 2ª ed., Prentice Hall, 2007.
- BROOKSHEAR, J. Glenn. *Ciência da Computação — Uma Visão Abrangente*, 7ª ed., Bookman, 2005 —
  Capítulo 3 (Sistemas Operacionais).
- [The Linux Kernel documentation](https://www.kernel.org/doc/html/latest/) — documentação
  oficial do kernel Linux.
- [Microsoft Learn — Gerenciador de Tarefas](https://learn.microsoft.com/pt-br/windows/client-management/administrative-tools-in-windows#task-manager) —
  documentação oficial sobre gerência de processos no Windows.

## Checklist de saída

- [ ] Explico a diferença entre processo e programa.
- [ ] Descrevo os estados possíveis de um processo e narro, com um exemplo, o que causa a
      transição entre eles (não só listar os nomes dos estados).
- [ ] Explico, com minhas próprias palavras, por que memória virtual existe e como ela se
      relaciona com a hierarquia de memória do módulo 05.
- [ ] Comparo Linux e Windows em pelo menos 2 critérios.
- [ ] Uso comandos básicos de terminal para listar e encerrar processos, e sei o que um PID
      identifica.
