# S 

###### **Exame Chunin** 

###### **Autor: Joab Guimarães** 

<mark>A Aldeia da Folha deu início ao Exame Chunin! Nele, dezenas de ninjas dividiram-se em trios para disputar dois pergaminhos. Cada equipe iniciará a etapa do exame com um pergaminho, precisando lutar para conquistar outro pergaminho, mas precisa ser um de cada tipo para que possam se classifcar para a segunda fase. Baseado nisso, seu programa deverá avisar se o trio de Naruto Uzumaki, Sasuke Uchiha e Sakura Haruno foram classifcados ou eliminados do Exame Chunin.</mark> 



###### **Entrada** 

A entrada é composta por dois caracteres “ **P1** ” e “ **P2** ”, dados em linhas diferentes e representando a característica de cada pergaminho. Portanto, “ **P1** ” e “ **P2** ” podem ser **“A” (azul)** , **“B” (branco)** e **“N” (sem pergaminho)** . 

###### **Saída** 

A saída será composta pela mensagem “classificado”, indicando que o trio foi classificado (dois pergaminhos distintos) ou “eliminado” (pergaminhos iguais ou pelo menos um pergaminho faltando), indicando a eliminação da equipe. 

###### **Exemplos** 

|**Entrada**|**Saída**<br>|
|---|---|
|A|classifcado|
|B||
|B|eliminado|
|B||
|A|eliminado|
|N||



### Continha 

O semestre já começou e as aulas já estão ai. Você que não é bobo(a), nem nada, decidiu treinar programação com os melhores professores da UFBA. E para mostrar seus conhecimentos, foi requisitado que você faça um programa para resolver a expressão matemática, dada por **((A + B) * (C - D) * (E + F)) / 2** e mostre para todos que você é fera nas continhas. 

###### **Entrada** 

A entrada contém 6 valores inteiros: **A, B, C, D, E, F (0 <= A, B, C, D, E, F <= 100)** . 

###### **Saída** 

Imprima a mensagem “Eu sou FERA nas continhas e o resultado é ”, sem as aspas, em seguida o resultado da expressão, que é um número real com uma casa decimal de precisão. 

||**Exemplos de Entrada**|**Exemplos de Saída**|
|---|---|---|
|7<br>3||Eu sou FERA nas continhas e o resultado é -150.0|
|15|||
|30|||
|0|||
|2|||
|1||Eu sou FERA nas continhas e o resultado é 30.0|
|2|||
|10|||
|5|||
|2|||
|2|||





<!-- Start of picture text -->
Boova0)=—lxon «SCMQEYPOTZBE<br>~<br>rT<br>rr<br>rrr<br>rrrryer<br>Crrrrr<br>rrr rrFr<br>Prrrrrryse<br><!-- End of picture text -->

###### **Incursão da Divisão de Reconhecimento** 

A Divisão de Reconhecimento se prepara para mais uma incursão além das muralhas em uma região de interesse infestada de titãs. Como em toda boa incursão, a preparação é algo vital para o sucesso e controle de eventuais baixas. Para isso o comandante Erwin Smith te incumbiu do processo de alocação de tropas, considerando a quantidade de inimigos na região e o tempo máximo de exposição das tropas. 

Sabendo que o tempo máximo de exposição das tropas nessa missão é de 1 hora e que Levi Ackerman também foi alocado para a incursão, implemente um programa que dado um número inteiro **X** de titãs, faz uma alocação de um número inteiro **Y** de tropas que deverão acompanhar Levi. 



###### **Considere as seguintes estatísticas:** 

(Levi Ackerman -> Mata 20 titãs por hora) (Soldado comum -> Mata 5 titãs por hora) 

###### **Entrada** 

A entrada possui **um único número inteiro ‘N’ (20 ≤ N ≤ 200)** , que representa **a quantidade de titãs** na região, e **será sempre um múltiplo de 5** . 

###### **Saída** 

A saída consiste em um **número inteiro X** que representa **a quantidade de soldados comuns necessários para eliminar todos os titãs durante 1 hora de missão** . 

|**Entrada**|**Saída**|
|---|---|
|100|16|
|30|2|
|20|0|



###### **Drone da Amazônia** 



A loja virtual e mundialmente famosa Amazônia decidiu fazer suas entregas utilizando drones. Porém, ainda é necessário implementar a parte do código que irá dizer ao drone se ele está na coordenada determinada para a entrega ou não. Você deve escrever um programa que dadas as coordenadas para a entrega e as coordenadas atuais do drone, diga se o drone pode ou não soltar o pacote. 

###### **Entrada** 

A primeira linha da entrada consiste de dois inteiros, **X1** e **Y1** , que correspondem às coordenadas para a entrega. A segunda linha consiste de dois inteiros, **X2** e **Y2** , correspondentes às coordenadas atuais do drone. Saiba que **1 <= X1, Y1, X2, Y2 <= 1000** . 

###### **Saída** 

Seu programa deve imprimir em uma única linha “ **Soltar pacote** ” (sem aspas), caso as coordenadas da entrega e do drone sejam iguais, ou “ **Nao soltar pacote** ” (sem aspas e sem til), caso as coordenadas sejam diferentes. 

|**Entrada**|**Saída**|
|---|---|
|5 20|Soltar pacote|
|5 20||
|3 4|Nao soltar pacote|
|2 4||



###### **Média Ponderada** 

Em uma disciplina da UFBA, as notas dos alunos são compostas por 3 avaliações: duas provas online com peso 4 e um trabalho final com peso 2. Sabendo disso, escreva um programa que leia as notas dos alunos e calcule a média ponderada das notas. 

###### **Entrada** 

A entrada contém uma linha com três números decimais, representando as notas das duas provas e do trabalho final, respectivamente. 

###### **Saída** 

Imprima a média ponderada das notas do aluno **com duas casas decimais** após a vírgula. 

|**Entrada**|**Saída**|
|---|---|
|8.0 7.5 9.0|8.00|
|6.5 6.0 6.5|6.30|
|5.0 10.0 8.0|7.60|





##### **Escolha do Campeão** 



League of Legends está cheio de campeões de vários tipos, de mentes malignas a monstros épicos. Diferentes campeões assumem diferentes papéis e usam diferentes estratégias. Lucas sempre joga LOL e gosta de variar na sua escolha de campeão, **dessa vez ele quer jogar com o campeão de maior nível de poder** dentre os que ele mais gosta. 

**Dado um número ‘N’, que representa a quantidade de campeões favoritos de Lucas, ajude ele a decidir qual deles tem o maior nível** . 

###### **Entrada** 

A entrada consiste na primeira linha de um número inteiro **‘N’ (1 < N < 100)** que representa **o número de campeões favoritos de Lucas** . Nas próximas **‘N’** linhas será fornecido em cada uma, um número inteiro **‘P’ (0 <= P <= 10000)** que representa **o nível de poder de cada um dos ‘N’ campeões** . 

###### **Saída** 

A saída deverá **conter apenas o nível de poder do campeão mais forte** . 

|**Entrada :**|**Saída :**|
|---|---|
|3|3600|
|1500||
|3600||
|500||
|7|5200|
|300||
|5200||
|540||
|729||
|3567||
|480||
|4000||



###### **Contabilizando Pokémons** 

Autor: João Pedro Rodrigues 

A Pokédex, também conhecida como PokéAgenda, é uma enciclopédia virtual portátil de alta tecnologia que os treinadores Pokémon transportam para registrar todas as espécies diferentes de Pokémon que são encontradas durante a sua viagem como treinadores. 

O novo modelo de Pokédex está sendo desenvolvido e registra monstrinhos das regiões de Kanto, Johto e Hoenn. Sempre que Pokémons de 



uma nova espécie são capturados, a Pokédex deve adicionar a quantidade de Pokémons capturados ao contador das regiões em que eles são originários. Sua missão é desenvolver um programa que implemente essa funcionalidade. 

###### **<mark>Entrada</mark>** 

A entrada é composta de 2 linhas. A primeira linha contém três inteiros que representam o número de pokémons já registrados na Pokédex de cada região, na ordem **‘K’** (Kanto), **‘J’** (Johto) e **‘H’** (Hoenn).  A segunda linha contém o número de novos pokémons capturados de cada região na mesma ordem da primeira linha. 

Restrições: 

(0 <= K,J,H <= 100) 

###### **<mark>Saída</mark>** 

Imprima, na ordem da entrada (K J H), o número total de pokémons de cada região após a nova contagem, separados por espaço. Imprima uma quebra de linha no fim. 

|**Exemplo de entrada**|**Saída**|
|---|---|
|92 40 54|93 40 54|
|1 0 0||
|12 1 0|12 3 2|
|0 2 2||



###### **Fazendo um gol** 

Autor: Julio Cesar 



O jogo favorito de Lucas é Bomba Patch. Atualmente, ele está desenvolvendo uma forma de saber qual é o melhor lado para driblar o zagueiro adversário e chutar para o gol. Por isso ele pediu sua ajuda para desenvolver um programa que vai receber as direções que o zagueiro e o goleiro tentarão defender, e as direções que o atacante irá tentar driblar o zagueiro e chutar para gol, e diga se o atacante terá sucesso ou não. 

###### **Entrada** 

A entrada é composta por apenas duas linhas contendo dois caracteres em cada. Na primeira linha temos " **z** " e " **g** ", sendo " **z** " a direção que o zagueiro irá para tentar bloquear o drible do atacante e " **g** " a direção que o goleiro irá tentar defender o chute do atacante. A segunda linha contém dois caracteres " **d** " e " **c** ", que são respectivamente, a direção que o atacante irá tentar driblar o zagueiro, e se passar pelo zagueiro, a direção que o atacante irá chutar para o gol. Saiba que os valores possíveis para “ **z** ”, ” **g** ”, “ **d** ” e “ **c** ” são esquerda ou direita, representados pelos caracteres ‘ **e** ’ e ‘ **d** ’, respectivamente. 

###### **Saída** 

A saída depende das seguintes situações: 1) no caso do zagueiro e atacante irem na mesma direção, só haverá uma linha na saída e deve-se imprimir a frase " **Bloqueado** "; 2) no caso de zagueiro e atacante irem em direções opostas, a frase impressa na primeira linha será " **Driblado** "; 3) caso o atacante tenha passado pelo zagueiro e o atacante chute na mesma direção que o goleiro foi para tentar defender, a frase impressa na segunda linha será " **...e o goleiro pega** "; 4) caso o atacante chute para um lado e goleiro vá para o outro a frase na segunda linha será " **Gol** ". 

###### Obs.: **Só há a segunda linha na saída se o atacante passar pelo zagueiro. Sempre interprete os dados na perspectiva dos próprios jogadores, ou seja, para qual lado cada um vai.** 

|**Entrada**|**Saída**|
|---|---|
|e e|Driblado|
|e d|...e o goleiro pega|
|d d|Driblado|
|d d|Gol|
|e d<br>d d|Bloqueado|





<!-- Start of picture text -->
a Lae ee ><br>— eer ‘<br>f ‘<br>ae all Tet = |<br>: ~“ «ZF Gi owe<br><!-- End of picture text -->



<!-- Start of picture text -->
“ite 0 \. | %<br>é atk id \ ; Nh j<br><!-- End of picture text -->



<!-- Start of picture text -->
eg AUASh.eee WCayelh ele ARSRPR ANN\<br>CE ALY VAAN<br>eo. a I RRL 6 Wee)<br><!-- End of picture text -->

#### Altura 

###### Autor: Pedro Vidal 

Trˆes amigos estavam discutindo para saber quem era o mais alto, mas como um n˜ao queria ouvir o outro, eles n˜ao conseguiram chegar a um consenso, e por isso pediram que vocˆe escrevesse um programa que dissesse qual a altura do maior dos trˆes amigos, dado a altura de cada um deles. 

###### **Entrada** 

A entrada ´e composta por trˆes n´umeros inteiros diferentes, _A_ , _B_ e _C_ , a altura de cada um dos amigos (em cent´ımetros) respectivamente, separados por um espa¸co em branco. 

###### **Sa´ıda** 

Vocˆe deve imprimir em uma ´unica linha a altura do maior dos trˆes amigos. 

###### **Limites** 

- 100 _≤ A ≤_ 200 

- 100 _≤ B ≤_ 200 

- 100 _≤ C ≤_ 200 

###### **Exemplos** 

||Entrada||Sa´ıda|
|---|---|---|---|
|100 150 140||150||
||Entrada||Sa´ıda|
|100 137 140||140||
||Entrada||Sa´ıda|
|122 111 103||122||



1 

## COUNTERSTRIKE 





<!-- Start of picture text -->
ta<br>oie ng ee<br>. fs<br>x d'- obMy < “—o a<br>ps ? WE Inathe<br>vee Oo Jae<br>:<br>GAN,y | we Se<br>| 7% As<br><!-- End of picture text -->







###### **Entregas do Lobo Mau** 



O Lobo Mau resolveu parar um pouco com as maldades, decidiu abrir uma empresa de entregas e convidou Chapeuzinho Vermelho para ser sua sócia. 

Certo dia, Chapeuzinho precisou levar doces e bolos para sua vovozinha. Como todos sabem, ela mora longe, o caminho é deserto e o Coelho Mau mora ali por perto. Sim, como o Lobo virou empresário, alguém tinha que tomar seu lugar na floresta. Para passar pelo caminho da floresta, o Coelho passou a cobrar um valor **‘V’** por km e um valor **‘P’** por pedágio. Assim, Chapeuzinho pediu uma carona ao seu sócio e lá foi ela pela estrada a fora, já não tão sozinha, levar os bolos e doces para a vovozinha. 

Saiba que a estrada tem tamanho **‘T’** , que os pedágios estão a uma distância **‘D’** um dos outros ( **igualmente espaçados** ) e que **o primeiro pedágio está no km ‘D’** . Portanto, o começo da estrada não possui um pedágio, mas o seu final pode estar logo após um pedágio ( **por exemplo, se a distância entre dois pedágios consecutivos for de 20 km e a estrada tiver 60 km, Chapeuzinho deve pagar um pedágio aos 20 km, aos 40 km e aos 60 km** ). Assim, calcule quanto custará para a pobre Chapeuzinho passar pela floresta e levar os doces para a vovozinha. 

###### **Entrada** 

A entrada é composta na primeira linha por 2 inteiros, **‘T’ e ‘D’ (1 <= ‘T’,‘D’ <= 1000)** , representando o tamanho da estrada e a distância entre os pedágios. Na próxima linha serão fornecidos outros 2 inteiros, **‘V’ e ‘P’ (1 <= ‘V’,‘P’ <= 100)** , representando o valor por km de estrada e o valor por cada pedágio. 

###### **Saída** 

Na saída será apresentado o valor total pela travessia da floresta. 

|**Entrada**<br>**Saída**|
|---|
|60 20<br>90|
|1 10|
|100 51<br>250|
|2 50|





<!-- Start of picture text -->
ot<br><!-- End of picture text -->

###### **Restrições** 

1 **≤** A, M, C **≤** 100 



<!-- Start of picture text -->
Exemplos<br>Entrada Saída<br>4 6 10 2<br>Entrada Saída<br>2 100 40 1<br><!-- End of picture text -->



<!-- Start of picture text -->
|<br>eo<br>Sy<br>ae -<br><!-- End of picture text -->





<!-- Start of picture text -->
— Ae ‘ | ;<br>= ene y “Ae,<br><!-- End of picture text -->



<!-- Start of picture text -->
im FA .<br>B f<br><!-- End of picture text -->

###### **Desafio Tático** 

Em um jogo de estratégia, os jogadores possuem um exército de soldados numerados de 1 a N. Cada soldado possui um valor de ataque e um valor de defesa. Durante uma batalha, os jogadores podem escolher uma formação de soldados para enfrentar o exército inimigo. 

Escreva um programa que, dado o número de jogadores, a quantidade de soldados que cada jogador possui e as informações de ataque e defesa dos soldados, calcule a soma dos valores de ataque e defesa para cada jogador. 

###### **Entrada** 

Um número inteiro **'P'** , representando o número de jogadores. 

Um número inteiro **'S'** , representando a quantidade de soldados que cada jogador possui. 

**'P'** blocos de **'S'** linhas cada, onde cada linha contém dois números inteiros separados por espaço. O primeiro número representa o valor de ataque e o segundo número representa o valor de defesa de um soldado. Os valores de ataque e defesa estão na faixa de 1 a 100. 

###### **Saída** 

**'N'** linhas com dois números inteiros separados por espaço, representando a soma dos valores de ataque e defesa para cada jogador. 

|**Entrada**|**Saída**|
|---|---|
|3|45 23|
|4|32 21|
|10 5|37 21|
|15 8||
|8 3||
|12 7||
|5 2||
|9 6||
|7 4||
|11 9||
|6 1||
|13 10||
|10 4||
|8 6||



###### **INTERVALOS** 

Em matemática, podemos representar conjuntos, subconjuntos e soluções de equações pela notação de intervalo. Intervalo significa que o conjunto possui cada número real entre dois extremos indicados, seja numericamente ou geometricamente. Não é possível representar subconjuntos ou conjuntos que não sejam reais (ou contidos nos reais) pela notação de intervalo. Para este problema, considere apenas intervalos de números inteiros. 

Dizemos que um intervalo é aberto quando seus extremos não estão incluídos, por exemplo, o intervalo ]3,8[ representa o conjunto: {4,5,6,7}. Um intervalo fechado é aquele em que seus extremos são incluídos, por exemplo, o intervalo [3,8] representa o conjunto: {3,4,5,6,7,8}. Por fim, dizemos que um intervalo é semiaberto ou semifechado quando um de seus extremos são incluídos, por exemplo, o intervalo ]3,8] representa o conjunto: {4,5,6,7,8}. 

Considerando dois intervalos semiabertos ou semifechados, sendo o primeiro sempre no formato ]x,y] (assuma x<y) e o segundo sempre no formato [w,z[ (assuma w<z), faça um programa que, dado dois intervalos de inteiros e dado um número inteiro, informe em qual ou quais intervalos o número  está, ou se não está em nenhum dos dois intervalos. 

###### **Entrada** 

A entrada contém três linhas: a primeira corresponde ao primeiro intervalo (]x,y]); a segunda corresponde ao segundo intervalo ([w,z[); e a terceira corresponde ao número inteiro que se quer descobrir o intervalo ao qual pertence. 

###### **Saída** 

A saída deve ser conforme exemplos abaixo. 

###### **Exemplos** 

||**Entrada**|**Saída**|
|---|---|---|
|3 8<br>11 19<br>12||Segundo intervalo!|
|4 13<br>16 28<br>13||Primeiro intervalo!|
|13 29<br>34 53<br>53||Nenhum!|
|1 9<br>7 15<br>7||Ambos!|
|10 20<br>30 40<br>25||Nenhum!|
|40 50<br>40 50<br>45||Ambos!|



###### **Pirâmide de limonadas Autor: Vinicius Martins** 



Sanji é um cozinheiro dedicado, que sempre busca atender os desejos da sua tripulação e hoje ele decidiu fazer algo diferente. Sanji decidiu organizar taças de limonada em uma pilha em forma de pirâmide, onde a altura é de **‘N’** níveis e cada nível da pirâmide terá **‘J * 2 -1’ (1 <= J <= N)** taças, sendo **‘J’** o nível na pirâmide, sendo **o topo como 1** e **a base como ‘N’** . Note que as taças de cada nível devem ser representadas pelo número (algarismo numérico) que indica seu nível **‘J’** na pirâmide, ou seja, as taças da base são representadas pelo algarismo **‘N’** e a taça do topo pelo algarismo **‘1’** . Vamos ajudar Sanji a impressionar seus companheiros? 

###### **Entrada** 

A entrada possui um número inteiro **‘N’ (1 <= N <= 9)** representando o número de níveis da pilha piramidal. 

###### **Saída** 

A saída consiste em **‘N’** linhas que representam os níveis da pirâmide **em ordem crescente** , ou seja, **nível com mais taças por último** . Cada nível **começa com ‘N – J’** espaços em branco, seguidos pelos **‘J * 2 - 1’ algarismos** que **representam as taças** daquela fileira. 

|**Entrada**|**Saída**|
|---|---|
|**2**|**1**|
||**222**|
|**7**|**1**|
||**222**|
||**33333**|
||**4444444**|
||**555555555**<br>**66666666666**|
||**7777777777777**|
|**1**|**1**|





<!-- Start of picture text -->
= sn p> ra ea<br>> Ab: vu €.’ Milde:<br><!-- End of picture text -->

