# S 

##### **Campo de abóboras** 



Hagrid está tendo um dia cheio com Bicuço e pediu ajuda a Harry e Ron. Eles precisam ajudá-lo a coletar abóboras. **A plantação é grande e para acelerar o trabalho, Hagrid pede que Harry fique responsável pela colheita em uma determinada linha, começando na esquerda e indo até o fim dela na direita. Da mesma forma, Hagrid pede que Ron colha as abóboras em outra linha, porém agora, Ron começa em cima e vai até o fim dela na parte de baixo da plantação** . 

Hagrid quer saber ao fim da tarefa qual dos dois coletou mais abóboras, levando-se em consideração seu peso. **Só tome cuidado com o ponto de intersecção entre as duas linhas que Harry e Ron irão coletar as abóboras. Somente um deles fica com a abóbora que está lá, ela é do primeiro que lá chegar, ou seja, ela pertence àquele que estiver mais próximo dela a partir do ponto de início de sua colheita, e se der empate na distância, a abóbora fica com Ron** . 

##### **Entrada** 

Seu programa receberá primeiramente um inteiro **‘N’ (1 ≤ ‘N’ ≤ 100)** , representando o tamanho da plantação de abóboras, que é um campo de proporção NxN (N linhas horizontais por N linhas verticais). A seguir serão dadas **‘N’** linhas, onde em cada uma serão dados **‘N’** inteiros **‘P’ (1 <= P <= 100)** , que representam o peso de cada abóbora no campo. Há uma abóbora em cada posição do campo NxN. Por fim, a última linha da entrada contêm as linhas **‘X’** e **‘Y’ (0 <= X,Y < N)** que Harry e Ron irão coletar, respectivamente. **Cuidado que a linha de Ron na verdade se trata de uma coluna na matriz da plantação** . 

##### **Saída** 

Imprima o peso total da colheita de Harry e a seguir, na linha de baixo, imprima o peso total da colheita de Ron, como nos exemplos abaixo. 

|**Entrada**|**Saída**|
|---|---|
|4|Harry 19|
|1 2 3 4|Ron 21|
|5 6 7 8||
|1 3 5 7||
|2 4 6 8||
|1 2||
|4|Harry 16|
|1 2 3 4|Ron 12|
|5 6 7 8||
|1 3 5 7||
|2 4 6 8||
|2 1||
|3|Harry 10|
|1 2 3|Ron 15|
|4 5 6||
|7 8 9||
|1 1||



## Faxina 

###### Autor: Gabriel Dahia 

Vocˆe decidiu se livrar dos livros em sua casa. Seu crit´erio para decidir se um livro vai ser doado ou n˜ao ´e a quantidade de consoantes em seu t´ıtulo. Caso o t´ıtulo possua mais do que _T_ consoantes, ele ser´a doado; caso contr´ario, ele ficar´a em sua estante. 

Sua tarefa ´e determinar, dados os t´ıtulos dos livros, quais ser˜ao doados. 

##### **Entrada** 

A primeira linha da entrada cont´em dois inteiros _N_ e _T_ , respectivamente o n´umero de livros na estante e o n´umero m´aximo de consoantes permitidas no t´ıtulo de cada livro. As pr´oximas _N_ linhas contˆem os t´ıtulos dos livros, que tem no m´aximo 20 s´ımbolos. Estes s˜ao apenas letras min´usculas e espa¸cos. 

##### **Sa´ıda** 

Para cada livro, seu programa deve imprimir 0 caso o livro deva ser doado e 1 caso ele fique na estante, seguidos de um fim de linha. 

##### **Limites** 

- 1 _≤ N ≤_ 10<sup>5</sup> ; 

- _•_ 1 _≤ T ≤_ 20. 

##### **Exemplos** 

|Entrada||Sa´ıda|
|---|---|---|
|3 4<br>harry potter|0<br>0||
|senhor dos aneis|1||
|aleph|||



1 



<!-- Start of picture text -->
Seee<br>ao<br>‘stata<br><!-- End of picture text -->

## Pal´ındromos 

###### Autor: Ubiratan Neto 

Luiz e seus colegas est˜ao participando de uma s´erie de jogos na aula de portuguˆes em sua escola. Em um dos jogos, ´e dado uma palavra para cada um deles, e eles precisam dizer se ela ´e um pal´ındromo ou n˜ao. Uma palavra ´e um pal´ındromo se ela ´e a mesma palavra lida de tr´as pra frente. Por exemplo “arara”, “osso”, “ralar”, etc. Luiz deseja vencer o jogo mesmo que seja trapaceando, e pediu a vocˆe que fizesse um programa que respondesse se uma palavra era um pal´ındromo ou n˜ao. 

##### **Entrada** 

A primeira linha da entrada possui uma palavra _S_ , contendo apenas letras min´usculas, a palavra dada por Luiz. 

##### **Sa´ıda** 

A sa´ıda deve conter numa ´unica linha a palavra “Sim”, caso _S_ seja um pal´ındromo, e “Nao” caso “S” n˜ao seja um pal´ındromo. 

##### **Limites** 

_•_ 1 _≤ S ≤_ 100 

##### **Exemplos** 

||Entrada||Sa´ıda|
|---|---|---|---|
|arara||Sim||
||Entrada||Sa´ıda|
|reviver||Sim||
||Entrada||Sa´ıda|
|rezar||Nao||



1 

### Xeroque Rolmes 

Autora: Laila Mota 

Xeroque Rolmes é um primo distante de um detetive renomado e agora quer seguir os passos do seu primo. Em seu primeiro caso, uma testemunha lhe disse que na casa do suspeito existe um cofre com uma pasta com várias provas de seus vários crimes. Ao investigar lugar, Xeroque Rolmes percebe que do lado do cofre existem 6 pedaços de papel colados na parede com palavras escritas e, mais que isso, ele descobriu que a quantidade de letras de cada palavra corresponde a um dígito da senha do cofre. 

##### **Entrada** 

A entrada é composta por 6 linhas, cada linha contém uma palavra encontrada. 

##### **Saída** 

A saída é composta por uma linha com a senha do cofre. 

##### **Limites** 

1≤ _N_ ≤10 

##### **Exemplos** 

||Entrada||Saída|
|---|---|---|---|
|sh<br>embhtots<br>m<br>qgexyzbcu<br>wwhzzw<br>rdfxs||281965||
||Entrada||Saída|
|a<br>a<br>yni<br>xbzaxh<br>lyg<br>q||113631||



#### **Caçando Pokémons** 



Ash e seus amigos estão em uma aventura em busca de novos pokémons. Além disso, decidiram ver ao final da busca quem conseguiu mais pokémons de um certo tipo. Sua tarefa é criar um programa que **diga quantos pokémons de um certo tipo Ash pegou** . Para isso será dada uma matriz representado a área onde ele está. Para cada posição (x ; y) da matriz, **se o valor for 0 (zero), significa que não tem nenhum pokémon naquela posição** e **se o valor for um número ‘T’, diferente de zero, significa que tem um pokémon do tipo ‘T’ naquela posição** que pode ser pego por Ash. 

#### **Entrada** 

Na primeira linha serão dados dois inteiros **‘N’ e ‘M’ (1 <= N, M <= 100)** que diz a quantidade de linhas e colunas da matriz, respectivamente. As próximas **‘N’** linhas terão **‘M’** inteiros **‘T’ (0 <= T <= 100)** em cada, representando o tipo do pokémon ou se não há pokémon. Por fim, na última linha, será dado um inteiro **‘P’ (1 <= P <= 100)** , representando o tipo do pokémon a ser pego por Ash. 

#### **Saída** 

A saída consiste em 1 linha contendo a frase “ **Ash pegou ‘Q’ pokemon** ” onde **‘Q’** deve ser a quantidade de pokémons do tipo **‘P’** pegos por Ash, podendo ser inclusive 0 (zero). 

|**Entrada**|**Saída**|
|---|---|
|4 4<br>0 1 0 0<br>2 0 2 0<br>0 1 0 0<br>0 0 0 2<br>2|Ash pegou 3 pokemon|
|5 10<br>0 1 0 0 0 3 0 0 0 0<br>0 2 0 0 0 1 0 0 0 2<br>0 3 0 0 0 0 2 0 0 0<br>8 0 1 0 0 3 0 8 0 0<br>0 0 0 0 0 0 0 0 1 0<br>1|Ash pegou 4 pokemon|



#### **Inventário caótico** 

###### **Autor: Gustavo Amaral** 

Jônatas da Silva após várias horas jogando Dark Souls III percebeu que seu inventário está caótico e não consegue encontrar seus itens. **Seu objetivo é identificar se um item está no inventário** . 

#### **Entrada** 



A entrada cosistirá de várias linhas, onde em cada uma teremos **uma string representando o nome de determinado item** . **A entrada com o nome dos itens termina** quando for digitado **a palavra “fim”** . Por fim, **será dado o nome do item que Jônatas quer saber se está no inventário** dele. 

#### **Saída** 

Deverá ser impresso “ **item encontrado** ” caso o item esteja no inventário ou “ **voce ainda nao descobriu este item** ”, caso contrário. 

|**Entrada**|**Saída**|
|---|---|
|Storm Ruler<br>Scholar's Candlestick<br>Broadsword<br>Anri's Straight Sword<br>Sunlight Straight Sword<br>Gael's Greatsword|voce ainda nao descobriu este item|
|Ringed Knight Paired Greatswords<br>fm||
|Carthus Shotel||
|Frayed Blade<br>Follower Sabre|item encontrado|
|Sellsword Twinblades<br>Harald Curved Greatsword<br>Thrall Axe<br>Butcher Knife<br>fm||
|Sellsword Twinblades||



#### **Vamos jogar um jogo** 

_Autor: Danilo de A. Peleteiro_ 

E agora?!?! Você foi capturado por Jigsaw em mais um de seus planos contra aqueles que ele julga não valorizar a própria vida! Para provar que Jigsaw está enganado, você deverá resolver um de seus peculiares enigmas e assim garantir a sua liberdade (talvez). Você encontrou uma gravação que explica passo a passo o que deverá ser feito. Em sua sala, haverá um papel com uma frase acompanhada de um número e uma palavra. O que Jigsaw deseja é muito simples: **que você diga se a quantidade de ocorrências daquela palavra na frase é a mesma da escrita no papel** . Caso seja, você deverá dizer **“SIM!”** , do contrário, deverá falar **“NAO!”** . Um detalhe essencial é que **todas as letras são minúsculas** e **Jigsaw ignora espaços em branco na frase no momento de contar as ocorrências da palavra** . 

#### **Tarefa** 

Para sua sorte, você encontrou um computador velho na sala onde está, e como é conhecido por ser viciado em programar, decidiu desenvolver um programa que o auxiliasse (e, quem sabe, outros futuros prisioneiros) nesse enigma. Portanto, você deverá computar a frase solicitada por Jigsaw e posteriormente avaliar se existe a quantidade **‘Q’** de ocorrências de uma dada palavra **P.** 

#### **Entrada** 

A primeira linha da entrada consiste de uma string **S** , que indica a frase a ser avaliada. A segunda linha contém um inteiro **‘Q’ (1 <= Q <= 30)** , informando a quantidade de ocorrências, seguido de uma palavra **P** , que indica o que deve ser detectado na frase **S** . 

#### **Saída** 

Seu programa deverá imprimir a quantidade de ocorrências de **P** em uma linha. Na outra, deverá imprimir **“SIM!”** caso essa quantidade seja igual à **‘Q’** e **,** caso contrário, deverá imprimir **“NAO!”.** 

|**Entrada**|**Saída**|
|---|---|
|eu quero jogar um jogo jogando limpo|3|
|3 jog|SIM!|
|xhuisyd xnzyxe nxnzzz zx x ify zzuzzzz z zjx|6|
|4 zz|NAO!|
|eu adoro sao joao e eu amo suas comidas|3|
|3 ua|SIM!|





<!-- Start of picture text -->
SERGIPE<br>PONTAL MANGUE SECO‘<br>a<br>a<br>i=]<br>COSTA AZUL<br>JANDAIRA<br>SIRIBINHA<br>CONDE}— @ Sitiodociti Conde<br>BARRA DO ITARIRI<br>B 4SUBAUMAccong cnt<br>SAUIPE<br>COSTA DO SAUIPE<br>DIOGO P sae ANTONIOi<br>ACU DA TORRE > IMBASSAL<br>POJUQUINHA lee DO FORTE<br>Srracimrrim<br>MONTE GORDO J CUARAGGER<br>4AREMBEPEBARRA DO JACUIPE N<br>q JAVA |<br>genes<br>LAURO DE FREITAS<br>SALVADOR AERDPORTO<br>© portaidoconde.com<br><!-- End of picture text -->



<!-- Start of picture text -->
ae BATTLEFRONT<br>~ QQ Zi<br><~» a. a _ 2<br>a * i oar<br><!-- End of picture text -->

|ae<br>~<br><~»||QQ<br>a. a<br>a<br>*<br>i|BATT<br>Z<br>_<br>|LEFRONT<br>i<br> 2<br>oar|
|---|---|---|---|---|
|C<br>||S<br><br>|||
|tT|T|»A!<br>TTme|||
|<br>||<br><br>p=<br>4|<br> <br>|||
|we||E|||
|E||R|||





<!-- Start of picture text -->
CSS<br>tT tT TT me» A!<br>p= 4<br>|eT<br>weET<br>ERO<br><!-- End of picture text -->

