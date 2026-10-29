---
id: "07_balanceamento_e_entrega_de_conteudo"
title: "Módulo 07 — Balanceamento e Entrega de Conteúdo"
sidebar_label: "07 · Balanceamento e Conteúdo"
sidebar_position: 7
---

# Módulo 07 — Balanceamento e Entrega de Conteúdo

> **Objetivo**: saber escolher entre Load Balancer, Application Gateway, Front Door, Traffic Manager e CDN — e colocar um Load Balancer na frente de duas VMs da API do TrilhaShop.
>
> **Pré-requisitos**: módulo 06 (VNet, NSG).
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre **Implement and manage virtual networking** (AZ-104) e **Describe Azure networking services** (AZ-900). Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104

---

## O maître que distribui as mesas

Num restaurante cheio, alguém na porta distribui os clientes entre as mesas livres e deixa de mandar gente a uma mesa que fechou. Um **balanceador de carga** faz o mesmo com requisições: espalha o tráfego entre várias instâncias e **tira de circulação** quem falha (via *health probe*). Resultado: mais capacidade e alta disponibilidade.

Os serviços de balanceamento do Azure se distinguem por duas perguntas:

1. **Em que camada?** L4 (TCP/UDP, só vê IP e porta) ou L7 (HTTP/HTTPS, entende URL, cabeçalho, cookie).
2. **Em que escopo?** Dentro de uma região ou global (entre regiões).

| Serviço | Camada | Escopo | Uso típico |
|---|---|---|---|
| **Load Balancer** | L4 | Regional | Distribuir TCP/UDP entre VMs, qualquer protocolo |
| **Application Gateway** | L7 | Regional | Roteamento por URL, terminação TLS, **WAF** |
| **Front Door** | L7 | Global | Entrada global de sites, CDN, WAF, failover entre regiões |
| **Traffic Manager** | DNS | Global | Direcionar por resposta DNS (prioridade, desempenho, geografia) |

> `[TEORIA]` Pergunta clássica de prova: "balancear HTTP com roteamento por caminho e WAF numa região" → **Application Gateway**; "entrada global com failover e aceleração" → **Front Door**; "balancear tráfego não-HTTP" → **Load Balancer**; "direcionar usuários à região mais próxima por DNS" → **Traffic Manager**.

> `[ATENÇÃO]` O Traffic Manager só responde DNS: ele **não** trafega os dados. Depois da resposta, o cliente conversa direto com o endpoint escolhido.

## Load Balancer, peça por peça

Para o Load Balancer funcionar você monta cinco peças que se conectam:

- **Frontend IP**: o endereço que o cliente enxerga (público ou privado).
- **Backend pool**: as VMs que recebem o tráfego.
- **Health probe**: pergunta periodicamente "você está vivo?" (TCP ou HTTP).
- **Load-balancing rule**: "o que chega no frontend:80 vai para o backend:8080".
- **SKU**: use **Standard** (zona-redundante, seguro por padrão, exige NSG liberando o tráfego). Evite o Basic, que está sendo aposentado.

```bash
RG=rg-trilhashop-dev
az network public-ip create -g $RG -n pip-lb --sku Standard --zone 1 2 3
az network lb create -g $RG -n lb-api --sku Standard \
  --public-ip-address pip-lb --frontend-ip-name fe-api --backend-pool-name be-api
az network lb probe create -g $RG --lb-name lb-api -n probe-8080 \
  --protocol Http --port 8080 --path /saude
az network lb rule create -g $RG --lb-name lb-api -n regra-80 \
  --protocol Tcp --frontend-port 80 --backend-port 8080 \
  --frontend-ip-name fe-api --backend-pool-name be-api --probe-name probe-8080
az network lb show -g $RG -n lb-api --query "{ip:frontendIPConfigurations[0].publicIPAddress.id}" -o json
```

As VMs entram no pool pela NIC (ou, com Scale Sets, automaticamente — Módulo 08).

> `[ATENÇÃO]` Se a probe falha para *todas* as VMs, o Load Balancer para de enviar tráfego a todas. Os dois erros mais comuns: o NSG bloqueia a porta da probe e o app não expõe a rota `/saude`.

![Load Balancer no portal com frontend, backend pool com duas VMs e health probe em estado saudável](screenshots/07-balanceamento-e-entrega-de-conteudo/01-load-balancer-visao-geral.png)
> `[PRINT]` Passo a passo para capturar: portal → Load balancers → `lb-api` → Backend pools e Health probes. Capturar a visão geral e as duas VMs no pool.

## Application Gateway e WAF

O **Application Gateway** entende HTTP: roteia `/api/*` para um pool e `/` para outro, termina TLS, mantém sessão por cookie e, com a SKU **WAF_v2**, bloqueia ataques web comuns.

```bash
az network application-gateway create -g $RG -n agw-trilhashop \
  --sku WAF_v2 --capacity 2 --vnet-name vnet-trilhashop --subnet snet-agw \
  --public-ip-address pip-agw --priority 100
```

> `[CUSTO]` O Application Gateway v2 cobra por hora mesmo ocioso (algumas dezenas de dólares por mês). Em laboratório, crie, teste e apague.

## Front Door, Traffic Manager e CDN

```bash
# Front Door (perfil Standard)
az afd profile create -g $RG --profile-name fd-trilhashop --sku Standard_AzureFrontDoor
az afd endpoint create -g $RG --profile-name fd-trilhashop --endpoint-name trilhashop --enabled-state Enabled

# Traffic Manager por prioridade (failover)
az network traffic-manager profile create -g $RG -n tm-trilhashop \
  --routing-method Priority --unique-dns-name tm-trilhashop-$RANDOM
```

**CDN** (rede de entrega de conteúdo) guarda cópias de arquivos estáticos em pontos de presença próximos do usuário. Hoje o produto recomendado é o **Front Door (com cache)**; o Azure CDN clássico segue em operação, mas o investimento da Microsoft é no Front Door.

## Práticas

### Prática isolada

1. Crie o Load Balancer da seção acima, sem VMs ainda, e inspecione suas peças: `az network lb show`, `az network lb rule list`, `az network lb probe list`.
2. Quando tiver duas VMs (Módulo 08), adicione-as ao pool e derrube uma (`az vm deallocate`); observe que a outra segue atendendo:
   ```bash
   for i in 1 2 3 4 5 6; do curl -s http://$(az network public-ip show -g $RG -n pip-lb --query ipAddress -o tsv)/; done
   ```
3. Escreva em duas linhas quando você usaria Application Gateway em vez de Load Balancer.

**Limpeza:** apague o RG do lab (`az group delete`).

### Contribuição ao projeto integrador

Posicione o balanceamento do TrilhaShop: `lb-api` (Load Balancer Standard) na frente da API em `snet-app`, com probe em `/saude`. O front estático, no Módulo 10, usará Front Door/CDN.

`[CUSTO]` O Load Balancer Standard cobra por regra e por dado processado; o IP público Standard também. Desaloque as VMs e apague o LB ao fim da sessão.

## Erros comuns nesta fase

- Usar SKU Basic para novos projetos.
- Esquecer de liberar no NSG a porta de probe e do tráfego.
- Confundir Load Balancer (L4) com Application Gateway (L7).
- Achar que o Traffic Manager encaminha o tráfego.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Backend pool | VM Scale Sets — Módulo 08 |
| Front Door/CDN | Site estático no Storage — Módulo 10 |
| Probe e saúde | Monitoramento/alertas — Módulo 15 |
| WAF | Segurança — Módulo 05 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Load-balancing options*: https://learn.microsoft.com/azure/architecture/guide/technology-choices/load-balancing-overview
- Microsoft Learn — *Azure Load Balancer*: https://learn.microsoft.com/azure/load-balancer/load-balancer-overview
- Microsoft Learn — *Application Gateway*: https://learn.microsoft.com/azure/application-gateway/overview
- Microsoft Learn — *Azure Front Door*: https://learn.microsoft.com/azure/frontdoor/front-door-overview
- Microsoft Learn — *Traffic Manager*: https://learn.microsoft.com/azure/traffic-manager/traffic-manager-overview

**Como aprofundar:** a árvore de decisão oficial "Load-balancing options" resume a escolha em quatro perguntas; refaça-a para três cenários inventados.

## Checklist de saída

- [ ] Explicar a diferença entre L4 e L7, regional e global.
- [ ] Escolher, entre os quatro serviços, o adequado para cinco cenários.
- [ ] Listar as peças de um Load Balancer e o papel de cada uma.
- [ ] Explicar o que ocorre quando a probe falha.
- [ ] Explicar por que o Traffic Manager não carrega tráfego.
- [ ] Ter criado o `lb-api` do TrilhaShop.
