---
id: "06_load_balancing_e_entrega_de_conteudo"
title: "Módulo 06 — Load Balancing e Entrega de Conteúdo"
sidebar_label: "06 · Load Balancing e CDN"
sidebar_position: 6
---

# Módulo 06 — Load Balancing e Entrega de Conteúdo

> **Objetivo**: saber escolher entre os balanceadores do Google Cloud, entender as peças de um balanceador HTTP(S) (frontend, URL map, backend service, health check), usar Cloud CDN e Cloud Armor, e colocar um balanceador na frente da API do TrilhaShop.
>
> **Pré-requisitos**: módulo 05 (VPC, firewall). O laboratório completo usa VMs do Módulo 08 — leia este módulo, crie as peças de balanceamento e volte ao 08 para o teste de ponta a ponta.
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre "Configuring load balancing" do **Associate Cloud Engineer**. Referência: https://cloud.google.com/load-balancing/docs/choosing-load-balancer

---

## O maître que distribui as mesas

Um **balanceador de carga** distribui requisições entre várias instâncias e **tira de circulação** quem falha (*health check*): mais capacidade, mais disponibilidade. No GCP há uma família de balanceadores, e a escolha se resume a três perguntas:

1. **Externo** (internet) ou **interno** (dentro da VPC)?
2. **Que camada**: HTTP(S) (L7), TCP/SSL proxy ou passthrough (L4)?
3. **Escopo**: **global** ou **regional**?

| Balanceador | Camada | Escopo | Uso típico |
|---|---|---|---|
| **Application LB externo** (HTTP/S) | L7 | **Global** ou regional | Sites e APIs; roteamento por URL, TLS, CDN, Armor |
| **Application LB interno** | L7 | Regional | Microsserviços dentro da VPC |
| **Proxy Network LB** (TCP/SSL) | L4 proxy | Global/regional | TCP não-HTTP com terminação TLS |
| **Passthrough Network LB** | L4 | Regional | Qualquer protocolo/UDP, preserva IP do cliente |

> `[TEORIA]` Prova: "balancear HTTP/HTTPS para usuários no mundo todo com **um único IP**" → **Application LB externo global**; "balancear tráfego interno entre camadas" → **LB interno**; "UDP ou preservar IP de origem" → **passthrough Network LB**. O LB HTTP(S) global usa **IP anycast** e a rede do Google para levar o usuário ao backend mais próximo saudável.

## As peças de um Application LB (HTTP/S)

Para o balanceador funcionar, você monta peças encadeadas. Entender a cadeia evita se perder nos comandos:

```
Cliente → [Forwarding rule: IP+porta] → [Target HTTP(S) proxy (+ certificado SSL)]
        → [URL map: roteamento por host/caminho] → [Backend service (health check, CDN, Armor)]
        → [Backend: instance group (MIG) | NEG | bucket]
```

- **Forwarding rule**: o IP e a porta que o cliente alcança.
- **Target proxy**: termina a conexão (e o TLS).
- **URL map**: decide para qual backend vai cada URL.
- **Backend service**: define os backends, o **health check**, a política de balanceamento e CDN/Armor.
- **Instance group / NEG / backend bucket**: de onde vem a resposta.

```bash
PROJETO=$(gcloud config get project)
REGIAO=southamerica-east1

# 1) Health check (a API responde em /saude na 8080)
gcloud compute health-checks create http hc-api --port=8080 --request-path=/saude \
  --check-interval=10s --timeout=5s --healthy-threshold=2 --unhealthy-threshold=3

# 2) Backend service global (balanceador externo)
gcloud compute backend-services create be-api --protocol=HTTP --port-name=http \
  --health-checks=hc-api --global --load-balancing-scheme=EXTERNAL_MANAGED --enable-logging

# 3) Adicionar o grupo de instâncias (MIG do Módulo 08) como backend
gcloud compute backend-services add-backend be-api --global \
  --instance-group=mig-api --instance-group-region=$REGIAO \
  --balancing-mode=UTILIZATION --max-utilization=0.8

# 4) URL map, proxy e forwarding rule
gcloud compute url-maps create lb-trilhashop --default-service=be-api
gcloud compute target-http-proxies create proxy-http --url-map=lb-trilhashop
gcloud compute addresses create ip-lb --ip-version=IPV4 --global
gcloud compute forwarding-rules create fr-http --global --address=ip-lb \
  --target-http-proxy=proxy-http --ports=80 --load-balancing-scheme=EXTERNAL_MANAGED

gcloud compute addresses describe ip-lb --global --format="value(address)"
gcloud compute backend-services get-health be-api --global
```

> `[ATENÇÃO]` O erro nº 1: **o firewall não libera os IPs dos health checks e do balanceador** (`35.191.0.0/16` e `130.211.0.0/22`; para o LB externo gerenciado, também a faixa de proxies). Sem essa regra, todos os backends aparecem `UNHEALTHY` e o LB responde 502. Crie-a:
> ```bash
> gcloud compute firewall-rules create allow-health-checks --network=vpc-trilhashop \
>   --direction=INGRESS --action=ALLOW --rules=tcp:8080 \
>   --source-ranges=35.191.0.0/16,130.211.0.0/22 --target-tags=app
> ```

Os nomes de flags e *load-balancing schemes* (`EXTERNAL` clássico x `EXTERNAL_MANAGED`) evoluem; confira a documentação atual em https://cloud.google.com/load-balancing/docs/https/ext-https-lb-simple.

![Console de Load balancing mostrando o balanceador lb-trilhashop com o backend service be-api e as instâncias saudáveis](screenshots/06-load-balancing-e-entrega-de-conteudo/01-load-balancer-backend-healthy.png)
> `[PRINT]` Passo a passo para capturar: Console → Serviços de rede → Load balancing → `lb-trilhashop`. Capturar o detalhe com o backend e o status de saúde.

## HTTPS: certificado gerenciado

Para HTTPS, o Google pode emitir e renovar o certificado por você (certificado **gerenciado**), desde que o domínio aponte para o IP do LB:

```bash
gcloud compute ssl-certificates create cert-trilhashop \
  --domains=loja.exemplo.com --global
gcloud compute target-https-proxies create proxy-https --url-map=lb-trilhashop --ssl-certificates=cert-trilhashop
gcloud compute forwarding-rules create fr-https --global --address=ip-lb \
  --target-https-proxy=proxy-https --ports=443 --load-balancing-scheme=EXTERNAL_MANAGED
```

O provisionamento do certificado gerenciado leva de minutos a horas e só conclui quando o DNS aponta para o IP do balanceador.

## Cloud CDN: cache na borda

O **Cloud CDN** guarda cópias de respostas estáticas em **pontos de presença** perto do usuário, reduzindo latência e carga na origem. Liga-se no **backend service** (ou backend bucket):

```bash
gcloud compute backend-services update be-api --global --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC
gcloud compute backend-buckets create bb-site --gcs-bucket-name=<BUCKET-DO-SITE> --enable-cdn
```

Conceitos: **cache hit** (servido da borda) x **miss** (busca na origem), **TTL**, **invalidação** (`gcloud compute url-maps invalidate-cdn-cache lb-trilhashop --path="/*"`).

> `[ATENÇÃO]` Não coloque conteúdo **personalizado ou privado** em cache público. Defina cabeçalhos `Cache-Control` corretos na origem e use `CACHE_ALL_STATIC` apenas quando fizer sentido.

## Cloud Armor: WAF e proteção DDoS

O **Cloud Armor** é o WAF e a proteção contra DDoS do GCP, anexado ao backend service. Define **políticas de segurança** com regras por IP, país, expressões e **regras pré-configuradas** (OWASP Top 10: SQLi, XSS).

```bash
gcloud compute security-policies create sp-trilhashop --description="WAF do TrilhaShop"
gcloud compute security-policies rules create 1000 --security-policy=sp-trilhashop \
  --expression="evaluatePreconfiguredExpr('sqli-v33-stable')" --action=deny-403
gcloud compute security-policies rules create 2000 --security-policy=sp-trilhashop \
  --src-ip-ranges="203.0.113.0/24" --action=deny-403
gcloud compute backend-services update be-api --global --security-policy=sp-trilhashop
```

## Práticas

### Prática isolada

1. Com o MIG do Módulo 08 em funcionamento, crie health check, backend service, URL map, proxy e forwarding rule HTTP.
2. Obtenha o IP e faça `curl` em loop; observe as respostas de instâncias diferentes (devolva o hostname na resposta da API).
3. Derrube uma instância e acompanhe `get-health` até ela sair de rotação.
4. Ative o Cloud CDN e compare o cabeçalho `Age`/`X-Cache` entre duas requisições (`curl -I`).

```bash
IP=$(gcloud compute addresses describe ip-lb --global --format="value(address)")
for i in $(seq 1 6); do curl -s http://$IP/; done
```

**Limpeza:** apague, nesta ordem, forwarding rules → proxies → URL map → backend service → health check → IP; depois o MIG.

### Contribuição ao projeto integrador

Coloque o balanceamento do TrilhaShop: LB HTTP(S) global `lb-trilhashop` na frente do MIG da API (`/saude` como health check), com a regra de firewall para os IPs de health check. O front estático (Módulo 11) usará um **backend bucket** com Cloud CDN. Registre no `decisoes.md` por que escolheu LB global em vez de regional.

`[CUSTO]` Cada **forwarding rule**, o tráfego processado e o IP reservado cobram. Cloud Armor cobra por política e por regra. Apague o balanceador entre as sessões de estudo.

## Erros comuns nesta fase

- Backends `UNHEALTHY` por falta de regra de firewall para os health checks.
- Esquecer o `--port-name`/named port no instance group.
- Health check numa porta/rota que a aplicação não responde.
- Colocar conteúdo privado em cache público do CDN.
- Esquecer o domínio apontando para o IP e ficar esperando o certificado gerenciado.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| MIG como backend | Compute Engine — Módulo 08 |
| Backend bucket + CDN | Armazenamento — Módulo 11 |
| NEG e serverless NEG | Cloud Run — Módulo 10 |
| LB L4/L7 (teoria) | Trilha Linux, Módulo 18 |
| Application Gateway/Front Door | Azure, Módulo 07 |

## `[REFERÊNCIA]`

- Google Cloud — *Choose a load balancer*: https://cloud.google.com/load-balancing/docs/choosing-load-balancer
- Google Cloud — *Application Load Balancer overview*: https://cloud.google.com/load-balancing/docs/application-load-balancer
- Google Cloud — *Setting up an external ALB com backend de MIG*: https://cloud.google.com/load-balancing/docs/https/ext-https-lb-simple
- Google Cloud — *Cloud CDN*: https://cloud.google.com/cdn/docs/overview
- Google Cloud — *Cloud Armor*: https://cloud.google.com/armor/docs/cloud-armor-overview
- Google Cloud — *Health checks*: https://cloud.google.com/load-balancing/docs/health-check-concepts

**Como aprofundar:** estude os *Network Endpoint Groups (NEG)*, balanceamento para Cloud Run/Functions (serverless NEG) e o roteamento avançado do URL map (host rules, path matchers).

## Checklist de saída

- [ ] Escolher o balanceador para cinco cenários (externo/interno, L4/L7, global/regional).
- [ ] Listar as peças de um Application LB e o papel de cada uma.
- [ ] Explicar por que os health checks exigem regra de firewall específica.
- [ ] Configurar HTTPS com certificado gerenciado e explicar a dependência do DNS.
- [ ] Explicar Cloud CDN (hit/miss, TTL, invalidação) e quando não cachear.
- [ ] Descrever o que o Cloud Armor protege.
- [ ] Ter montado o LB do TrilhaShop.
