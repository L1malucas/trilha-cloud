---
id: 07_redes-computadores-web-teoria
title: "Módulo 07 — Redes de Computadores e Web"
sidebar_position: 70
---

# Módulo 07 — Redes de Computadores e Web

> **Objetivo:** entender como dados trafegam entre computadores em rede, da camada física até o
> protocolo que faz a Web funcionar (HTTP).
> **Pré-requisitos:** Módulo 06 (Sistemas Operacionais).
> **Tempo de referência:** 3 a 4 horas.
> **Prática correspondente:** [07_redes-computadores-web-pratica.md](07_redes-computadores-web-pratica.md)

---

## Por que isso importa

No módulo 06 você viu que o sistema operacional intermedia o acesso a dispositivos como disco e
tela através de drivers e interrupções — a aplicação nunca fala direto com o hardware. O acesso à
rede segue exatamente essa lógica: o SO oferece uma abstração chamada **socket**, que uma
aplicação usa para mandar e receber dados pela rede, sem precisar saber nada sobre cabos,
sinalização elétrica ou roteamento. Este módulo entende o que acontece depois que esse socket
manda dados para fora da sua máquina, até chegar a outro computador do outro lado do mundo.

## `[TEORIA]` Arquitetura em camadas

Pense em enviar uma encomenda pelos Correios. Você escreve uma carta (o conteúdo), coloca dentro
de um envelope endereçado, a agência local despacha para um centro de distribuição, que roteia
para outro centro, até chegar ao endereço final — onde cada camada de embalagem é removida na
ordem inversa em que foi colocada. Redes de computadores funcionam de forma parecida: cada camada
empacota o que a camada de cima entrega, adiciona sua própria informação de controle (como um
envelope dentro de outro envelope), e entrega para a camada de baixo — do lado de quem recebe,
cada camada desempacota sua parte, na ordem inversa.

O modelo mais usado na prática é o TCP/IP, com (numa visão simplificada) 4 camadas:

```
Aplicação  (HTTP — o "conteúdo da carta")
Transporte (TCP — garante que a entrega seja confiável)
Rede       (IP — o "endereço" de destino)
Física     (o meio real: cabo, wifi, fibra)
```

`[TENTE VOCÊ]` Se um app de streaming reconecta sozinho, sem você perceber, depois de um
pequeno soluço na sua wifi, qual camada está fazendo esse trabalho de "garantir que os dados
continuem chegando"? Resposta: a camada de transporte (TCP) — é o papel dela garantir entrega
confiável mesmo quando a rede física tem falhas momentâneas.

## `[TEORIA]` TCP/IP

**IP** (Internet Protocol) é o sistema de endereçamento: cada dispositivo numa rede tem um
endereço IP, análogo ao endereço de uma casa. **TCP** (Transmission Control Protocol) garante que
os dados cheguem completos e na ordem certa, mesmo que a rede física real embaralhe pacotes ou
perca pedaços no caminho — ele confere o que chegou, pede reenvio do que faltou, e remonta tudo
na ordem original antes de entregar para a aplicação.

Por que dois protocolos separados, e não um só cuidando de tudo? Porque são preocupações
diferentes, e separá-las permite trocar uma peça sem mexer na outra: IP resolve "pra onde
mandar"; TCP resolve "como garantir que chegou direito". Existe até uma alternativa ao TCP — o
UDP — que abre mão dessa garantia de entrega em troca de velocidade, usada em situações onde um
pacote perdido importa menos que atraso (chamadas de vídeo, por exemplo: preferível perder um
quadro do que travar esperando o reenvio).

`[ATENÇÃO]` Confundir IP com TCP é comum no início. Fixe assim: IP é **"pra onde"**, TCP é
**"como garantir que chegou"**.

## `[TEORIA]` Internet x Web

Assim como uma estrada não é a mesma coisa que os caminhões que rodam nela, **Internet** não é a
mesma coisa que **Web**. Internet é a infraestrutura física e os protocolos de transporte
(TCP/IP) que conectam bilhões de dispositivos no mundo. Web é um serviço específico que roda por
cima dessa infraestrutura, usando um protocolo de aplicação particular: o **HTTP**, para
transmitir páginas, imagens e vídeos.

E-mail, por exemplo, também roda sobre a Internet — mas usa outros protocolos de aplicação (não
HTTP), então não é "Web".

## `[TEORIA]` HTTP, URL e HTML

HTTP funciona em ciclos de **requisição-resposta**: seu navegador monta uma requisição pedindo um
recurso, e o servidor responde com esse recurso (ou com um erro, se algo deu errado).

**Exemplo narrado:** você digita uma URL na barra de endereços. O navegador identifica, a partir
dela, com qual servidor conversar, monta uma requisição HTTP pedindo aquela página, e envia. O
servidor recebe, processa o pedido, e responde com HTML — a estrutura da página — que o navegador
então interpreta e renderiza na tela.

Uma URL se decompõe em partes, cada uma com um papel específico:
```
https://exemplo.com/produtos?categoria=livros
  |         |            |          |
protocolo  domínio    caminho   query string
(como conversar) (com quem) (o quê especificamente) (parâmetros extras)
```

`[TENTE VOCÊ]` Decomponha `https://learngitbranching.js.org/?locale=pt_BR` nas suas partes.
Resposta: protocolo `https`, domínio `learngitbranching.js.org`, caminho `/` (a raiz do site),
query string `locale=pt_BR`.

## `[TEORIA]` Aplicações web atuais

A maioria das aplicações web modernas segue um padrão parecido: o servidor expõe uma **API**
(um conjunto de URLs que respondem com dados, geralmente em formato JSON, em vez de HTML pronto
para exibir), e uma aplicação separada — rodando no navegador — consome essa API e monta a
interface do lado do cliente. É a base do que você vai construir no módulo 13 (JavaScript/Node),
consumindo e expondo esse tipo de API.

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Confundir Internet (infraestrutura) com Web (um serviço específico que roda sobre ela).
- Confundir IP ("pra onde") com TCP ("como garantir que chegou").
- Achar que uma URL é só o domínio, esquecendo caminho e query string.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Sockets e gerência de E/S | Módulo 06 — Sistemas Operacionais (pré-requisito, revisão) |
| Requisições HTTP e APIs | Módulo 13 — JavaScript/Node.js (consumo de APIs) |
| Estrutura de uma página (HTML) | Módulo 10 — HTML & CSS |

## `[REFERÊNCIA]`

- KUROSE, J. F.; ROSS, K. W. *Redes de Computadores e a Internet — Uma Nova Abordagem*, 3ª ed.,
  Pearson Education / Makron Books, 2005.

## Checklist de saída

- [ ] Explico a arquitetura em camadas usando uma analogia própria.
- [ ] Diferencio IP de TCP, sabendo dizer o papel de cada um.
- [ ] Diferencio Internet de Web.
- [ ] Decomponho uma URL em protocolo, domínio, caminho e query string.
- [ ] Descrevo o ciclo de requisição-resposta do HTTP.
