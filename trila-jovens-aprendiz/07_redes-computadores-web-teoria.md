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

## `[TEORIA]` IPv4 e IPv6

Você acabou de ver que todo dispositivo tem um endereço IP — mas "endereço IP" não é uma coisa só:
existem duas versões em uso, e a razão da segunda existir é exatamente o mesmo tipo de limite que
você já viu no módulo 03 sobre quantos valores `n` bits conseguem representar.

O **IPv4** (a versão mais antiga, ainda a mais comum) escreve o endereço como 4 números de 0 a
255 separados por ponto, por exemplo `192.168.1.1`. Cada um desses números é 1 byte (8 bits), e o
endereço inteiro tem 32 bits — o que dá `2³²`, pouco mais de 4,3 bilhões de endereços possíveis.
Parece muito, até você lembrar que cada celular, notebook, smart TV, câmera de segurança e
lâmpada "inteligente" do planeta precisa de um — 4,3 bilhões não é páreo pra bilhões de pessoas
com vários dispositivos cada. Esse esgotamento é real: os blocos de IPv4 livres praticamente
acabaram.

A solução foi o **IPv6**, com endereços de 128 bits em vez de 32 — `2¹²⁸`, um número tão grande
que não há risco realista de esgotar tão cedo. Escrito em grupos de 4 dígitos hexadecimais
separados por dois-pontos, por exemplo `2001:0db8:85a3:0000:0000:8a2e:0370:7334`. Repare: é
hexadecimal, não decimal — a mesma notação que você já pratica desde o módulo 03, aqui aplicada a
um endereço em vez de um número solto.

`[TENTE VOCÊ]` Por que 32 bits (IPv4) só dão ~4,3 bilhões de endereços, mas 128 bits (IPv6) já
resolvem o problema por décadas? Resposta: porque a quantidade de valores representáveis cresce
como potência de 2 conforme o número de bits — `2³²` é grande, mas `2¹²⁸` é astronomicamente
maior (seria como comparar o número de grãos de areia numa praia com o número de átomos no
universo observável). Cada bit a mais *dobra* a quantidade de endereços possíveis, não soma um
pouco — é o mesmo princípio de "`n` bits representam `2ⁿ` valores" do módulo 03, só que aplicado
a um endereço de rede em vez de um número.

## `[TEORIA]` Internet x Web

Assim como uma estrada não é a mesma coisa que os caminhões que rodam nela, **Internet** não é a
mesma coisa que **Web**. Internet é a infraestrutura física e os protocolos de transporte
(TCP/IP) que conectam bilhões de dispositivos no mundo. Web é um serviço específico que roda por
cima dessa infraestrutura, usando um protocolo de aplicação particular: o **HTTP**, para
transmitir páginas, imagens e vídeos.

E-mail, por exemplo, também roda sobre a Internet — mas usa outros protocolos de aplicação (não
HTTP), então não é "Web".

## `[TEORIA]` DNS: traduzindo nomes em endereços IP

Você já viu que pacotes na rede são roteados usando endereços IP — não nomes. Mas ninguém digita
`142.250.219.174` na barra de endereços; todo mundo digita `google.com`. Alguma coisa precisa
traduzir o nome legível pro endereço numérico que a rede de fato usa — essa é a única função do
**DNS** (Domain Name System).

A analogia mais direta é a agenda de contatos do seu celular: você toca em "Mãe" pra ligar, não
digita o número decorado — o telefone traduz o nome pro número por trás, sem você perceber. O DNS
faz exatamente isso para domínios: seu dispositivo (ou o provedor de internet) mantém acesso a
servidores DNS que guardam a tradução `nome → IP`, e consultam essa tradução toda vez que você
digita um domínio.

**Exemplo narrado:** você digita `exemplo.com` na barra de endereços. *Antes* de qualquer coisa
acontecer com HTTP, o navegador precisa saber pra qual IP mandar a requisição — então ele
pergunta pro DNS "qual é o IP de `exemplo.com`?". O DNS responde com um endereço (ex:
`93.184.216.34`). Só então o navegador monta a requisição HTTP e a envia para esse IP. Sem essa
tradução prévia, o navegador nem saberia com quem conversar.

`[TENTE VOCÊ]` Se você já sabe o IP de um servidor, é possível digitar o IP direto na barra de
endereços em vez do domínio? Resposta: sim — o DNS é uma etapa de conveniência (nomes são mais
fáceis de lembrar), não uma exigência técnica do protocolo. Digitar o IP diretamente pula a
consulta DNS e vai direto pro passo HTTP.

`[ATENÇÃO]` Quando um site muda de servidor (e portanto de IP), a tradução `nome → IP` guardada
nos servidores DNS espalhados pelo mundo precisa ser atualizada — e essa atualização não é
instantânea, leva tempo pra "propagar" por todos eles. É por isso que, logo depois de uma migração
de servidor, algumas pessoas conseguem acessar o site normalmente e outras (usando um servidor DNS
que ainda não recebeu a atualização) recebem erro ou veem a versão antiga por um tempo.

## `[CLI]` Diagnosticando rede na prática

Tudo que você viu até aqui (endereçamento, DNS, camadas) tem comandos de terminal correspondentes
que tornam esses conceitos visíveis, em vez de abstratos:

```
ping <host>       # testa se um host responde, e mede o tempo de ida e volta (latência)
tracert <host>    # Windows — mostra cada "salto" de roteador até o host de destino
traceroute <host> # Mac/Linux — mesma coisa que tracert
ipconfig          # Windows — mostra o seu próprio endereço IP
ifconfig / ip addr # Mac/Linux — mesma coisa que ipconfig
nslookup <domínio> # consulta o DNS manualmente e mostra o IP resolvido
```

`nslookup` é o mais direto de conectar com o que você acabou de ver: é literalmente o comando que
faz, na sua mão, a mesma consulta que o navegador faz sozinho antes de qualquer requisição HTTP —
"qual é o IP desse domínio?". Rodar `nslookup google.com` mostra na tela o mesmo tipo de resposta
que o DNS devolveria pro navegador, só que visível pra você em vez de escondida por trás dos
panos.

`[TENTE VOCÊ]` Rode `ping` e `nslookup` para um domínio real (ex: `google.com`) no seu terminal.
O `ping` respondeu? O IP que o `nslookup` mostrou bate com o que você esperava? Resposta esperada:
`ping` deve mostrar um tempo de resposta em milissegundos (ex: `time=12ms`); `nslookup` deve
mostrar um ou mais endereços IPv4 (e possivelmente IPv6) associados ao domínio — esse é
exatamente o IP que o navegador usaria por trás dos panos.

## `[TEORIA]` HTTP, URL e HTML

HTTP funciona em ciclos de **requisição-resposta**: seu navegador monta uma requisição pedindo um
recurso, e o servidor responde com esse recurso (ou com um erro, se algo deu errado).

**Exemplo narrado:** você digita uma URL na barra de endereços. O navegador primeiro resolve o
domínio via DNS (visto acima) para descobrir o IP do servidor; só então monta uma requisição HTTP
pedindo aquela página, e envia para esse IP. O servidor recebe, processa o pedido, e responde com
HTML — a estrutura da página — que o navegador então interpreta e renderiza na tela.

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

`[CLI]` Você não precisa de um navegador pra fazer uma requisição HTTP — é possível fazer a mesma
coisa direto do terminal, com o `curl`: uma ferramenta de linha de comando que monta e envia uma
requisição HTTP e mostra a resposta bruta na tela, sem renderizar nada (sem CSS, sem imagens, só
o texto puro que o servidor devolveu). É útil justamente por isso — pra ver exatamente o que o
servidor respondeu, sem o navegador "esconder" nada por trás da página já montada.

```
curl https://exemplo.com
```

Isso imprime no terminal o HTML bruto da resposta. Adicionando a opção `-v` (verbose), o `curl`
também mostra a requisição enviada e os cabeçalhos da resposta — não só o conteúdo:

```
curl -v https://exemplo.com
```

## `[TEORIA]` Protocolos de aplicação além do HTTP

HTTP é só *um* protocolo de aplicação entre vários — o que você escolhe usar depende da tarefa.
Assim como TCP e IP resolvem preocupações diferentes (visto na seção de TCP/IP), cada protocolo de
aplicação resolve um tipo de tarefa diferente, na mesma camada onde HTTP vive.

**SMTP** (Simple Mail Transfer Protocol) é o protocolo por trás do *envio* de e-mail — quando você
aperta "enviar", seu cliente de e-mail conversa com um servidor usando SMTP para entregar a
mensagem até o servidor de destino (que depois a entrega ao destinatário via outros protocolos,
como IMAP ou POP3, usados para *ler* a caixa de entrada — SMTP cuida só do envio). Assim como HTTP
tem seu ciclo de requisição-resposta próprio, SMTP tem o dele, especializado em transportar
mensagens de um servidor a outro até chegar ao destino.

**FTP** (File Transfer Protocol) é mais antigo que HTTP e serve para um propósito bem específico:
transferir arquivos entre um cliente e um servidor — por exemplo, publicar os arquivos de um site
num servidor de hospedagem tradicional. Diferente de HTTP (pensado pra "pedir uma página e
receber de volta"), FTP foi desenhado em torno de operações de arquivo: enviar, baixar, listar,
apagar.

`[TENTE VOCÊ]` Você precisa enviar um e-mail com um relatório em anexo. Dois protocolos diferentes
estão envolvidos nessa tarefa — quais, e o que cada um faz? Resposta: SMTP entrega a mensagem
(incluindo o anexo) até o servidor de destino; se depois você acessar essa mesma caixa de entrada
por um app de e-mail, a leitura usa IMAP ou POP3 — SMTP só cobre o envio.

`[ATENÇÃO]` Não confunda "protocolo de aplicação" com "a aplicação em si": FTP e um cliente FTP
(o programa que você abre pra usar FTP) não são a mesma coisa, exatamente como HTTP e um
navegador não são a mesma coisa — o protocolo é a regra de comunicação; a aplicação é a
ferramenta que fala essa regra por você.

## `[TEORIA]` Aplicações web atuais

A maioria das aplicações web modernas segue um padrão parecido: o servidor expõe uma **API**
(um conjunto de URLs que respondem com dados, geralmente em formato JSON, em vez de HTML pronto
para exibir), e uma aplicação separada — rodando no navegador — consome essa API e monta a
interface do lado do cliente. É a base do que você vai construir no módulo 13 (JavaScript/Node),
consumindo e expondo esse tipo de API.

## Conceitos Fundamentais de Rede — Referência Rápida

| Conceito | O que é | Para aprofundar |
|---|---|---|
| HTTP/HTTPS | Protocolo de transferência de hipertexto. Define como cliente e servidor trocam mensagens. HTTPS adiciona criptografia TLS sobre o HTTP. | [MDN — Visão geral do HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Overview) |
| URL | Uniform Resource Locator. Endereço completo de um recurso: `scheme://user:pass@host:port/path?query#hash` | [MDN — O que é uma URL?](https://developer.mozilla.org/pt-BR/docs/Learn/Common_questions/Web_mechanics/What_is_a_URL) |
| DNS | Domain Name System. Traduz nomes legíveis (google.com) em endereços IP. É a "agenda telefônica" da internet. | [Cloudflare — O que é DNS?](https://www.cloudflare.com/pt-br/learning/dns/what-is-dns/) |
| Domínio e Subdomínio | Domínio: github.com. Subdomínio: api.github.com. O subdomínio aponta para um servidor ou serviço diferente. | [MDN — Nomes de domínio](https://developer.mozilla.org/pt-BR/docs/Learn/Common_questions/Web_mechanics/What_is_a_domain_name) |
| TCP/IP | Protocolos de transporte da internet. TCP garante entrega ordenada e confiável de pacotes; IP cuida do roteamento. | [Cloudflare — O que é TCP/IP?](https://www.cloudflare.com/pt-br/learning/ddos/glossary/tcp-ip/) |
| Porta | Número que identifica um serviço específico em um host. HTTP=80, HTTPS=443, Node local=3000, PostgreSQL=5432. | [MDN — Portas TCP e UDP](https://developer.mozilla.org/en-US/docs/Glossary/Port) |
| Status HTTP | 1xx=informativo, 2xx=sucesso, 3xx=redirecionamento, 4xx=erro do cliente, 5xx=erro do servidor. | [MDN — Códigos de status HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status) |
| Headers | Metadados enviados junto com requisições e respostas: Content-Type, Authorization, Cache-Control, etc. | [MDN — HTTP Headers](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers) |

## Erros comuns

Você já viu estes avisos ao longo do módulo — aqui vai só a revisão rápida:

- Confundir Internet (infraestrutura) com Web (um serviço específico que roda sobre ela).
- Confundir IP ("pra onde") com TCP ("como garantir que chegou").
- Achar que uma URL é só o domínio, esquecendo caminho e query string.
- Achar que "endereço IP" é uma coisa só, sem diferenciar IPv4 (32 bits) de IPv6 (128 bits).
- Esquecer que, antes de qualquer requisição HTTP, o navegador precisa resolver o domínio via DNS
  — o nome não vai direto pra rede, o IP é que vai.
- Achar que HTTP é o único protocolo de aplicação que existe — e-mail (SMTP) e transferência de
  arquivos (FTP) usam protocolos completamente diferentes, com propósitos diferentes.

## Conexão com os próximos módulos

| Conceito deste módulo | Reaparece em |
|---|---|
| Sockets e gerência de E/S | Módulo 06 — Sistemas Operacionais (pré-requisito, revisão) |
| `n` bits → `2ⁿ` valores (aplicado a endereços IPv4/IPv6) | Módulo 03 — Sistemas de Numeração (revisão) |
| Requisições HTTP e APIs | Módulo 13 — JavaScript/Node.js (consumo de APIs) |
| Estrutura de uma página (HTML) | Módulo 10 — HTML & CSS |

## `[REFERÊNCIA]`

- KUROSE, J. F.; ROSS, K. W. *Redes de Computadores e a Internet — Uma Nova Abordagem*, 3ª ed.,
  Pearson Education / Makron Books, 2005.
- [MDN — Visão geral do HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Overview)
- [Cloudflare Learning Center — o que é DNS, TCP/IP, DDoS glossário](https://www.cloudflare.com/pt-br/learning/)
- [curl — documentação oficial](https://curl.se/docs/manpage.html)

## Checklist de saída

- [ ] Explico a arquitetura em camadas usando uma analogia própria.
- [ ] Diferencio IP de TCP, sabendo dizer o papel de cada um.
- [ ] Diferencio IPv4 de IPv6 (formato do endereço e por que o IPv6 existe).
- [ ] Explico o que o DNS faz e em que momento do fluxo (antes do HTTP) ele entra em ação.
- [ ] Diferencio Internet de Web.
- [ ] Decomponho uma URL em protocolo, domínio, caminho e query string.
- [ ] Descrevo o ciclo de requisição-resposta do HTTP.
- [ ] Nomeio pelo menos dois protocolos de aplicação além do HTTP (SMTP, FTP) e digo pra que cada
      um serve.
- [ ] Uso `ping`, `tracert`/`traceroute`, `ipconfig`/`ifconfig` e `nslookup` pra diagnosticar
      conectividade e resolução de DNS na prática.
- [ ] Sei o que `curl` faz e uso pra inspecionar uma requisição HTTP direto do terminal.
