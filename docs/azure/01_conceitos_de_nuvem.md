---
id: "01_conceitos_de_nuvem"
title: "Módulo 01 — Conceitos de Nuvem"
sidebar_label: "01 · Conceitos de Nuvem"
sidebar_position: 1
---

# Módulo 01 — Conceitos de Nuvem

> **Objetivo**: entender o que a nuvem muda, de fato, na forma de comprar e operar tecnologia — modelos de implantação, de serviço, responsabilidade compartilhada e as propriedades (elasticidade, alta disponibilidade) — e sentir isso criando um recurso IaaS e um PaaS.
>
> **Pré-requisitos**: módulo 00 (conta e `az` funcionando).
>
> **Tempo de referência (não prazo)**: uma semana em ritmo moderado.
>
> Cobre o domínio **Describe cloud concepts** do AZ-900 (https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900), base de tudo que vem no AZ-104.

---

## Da obra própria ao aluguel

Para ter energia em casa você pode instalar um gerador (compra cara, manutenção sua, capacidade fixa) ou ligar-se à rede elétrica e pagar pelo consumo. Computação em nuvem é a segunda opção aplicada a servidores: em vez de comprar hardware para o pico de vendas de Natal e deixá-lo ocioso o resto do ano, você aluga capacidade e paga pelo que usa.

Isso muda a natureza do gasto, e é a distinção que mais cai em prova:

- **CapEx (despesa de capital)**: compra antecipada de ativo (servidores, datacenter). Alto custo inicial, depreciação.
- **OpEx (despesa operacional)**: pagamento recorrente pelo uso. Sem investimento inicial, custo variável.

A nuvem é, em essência, a troca de CapEx por OpEx — com o bônus de que a capacidade pode crescer e encolher em minutos.

> `[TEORIA]` O **modelo baseado em consumo** (pay-as-you-go) é o que torna isso possível: você paga pelo que usa, por segundo/minuto/hora conforme o serviço. A contrapartida é que um recurso esquecido ligado continua a cobrar — daí o hábito de limpeza desta trilha.

## Propriedades que justificam a mudança

| Propriedade | Significa | Exemplo no TrilhaShop |
|---|---|---|
| **Elasticidade** | Aumentar e reduzir recursos conforme a demanda, automaticamente | API escala de 2 para 10 instâncias na Black Friday |
| **Escalabilidade** | Capacidade de crescer: *vertical* (máquina maior) ou *horizontal* (mais máquinas) | Passar de `B1s` para `D4s` (vertical) ou 1 para 5 VMs (horizontal) |
| **Alta disponibilidade** | O sistema continua respondendo mesmo com falhas | VMs em duas zonas de disponibilidade |
| **Tolerância a falhas** | Sobreviver à falha de um componente sem interromper | Disco com cópias em várias máquinas |
| **Previsibilidade** | Custos e desempenho estimáveis | Calculadora de preços, budgets |

> `[ATENÇÃO]` Escalabilidade e elasticidade não são sinônimos. Escalabilidade é *poder* crescer; elasticidade é crescer *e encolher* automaticamente com a demanda. Uma banca de prova adora trocar uma pela outra.

## Modelos de implantação: de quem é o datacenter

- **Nuvem pública**: hardware do provedor (Microsoft), compartilhado logicamente entre clientes, acesso pela internet. É o Azure "padrão".
- **Nuvem privada**: infraestrutura dedicada a uma única organização, no datacenter dela ou hospedada. Controle máximo, custo e operação sua.
- **Nuvem híbrida**: privada + pública conectadas, com dados e cargas movendo-se entre elas. Ferramentas: **Azure Arc** (gerenciar servidores fora do Azure como se estivessem nele) e **Azure Stack**.

Quando cada uma faz sentido: regulação que exige dado em solo próprio empurra para privada/híbrida; start-up sem infraestrutura legada vai direto de pública.

## Modelos de serviço: o que você ainda administra

Essa é a ideia central do módulo e o seu mapa mental pelo resto da trilha. Pense em pizza:

- **IaaS** — você compra a massa pronta e faz em casa: alugamos a **infraestrutura** (VM, rede, disco); o SO, o runtime e a aplicação são seus. *Ex.: Azure Virtual Machines.*
- **PaaS** — encomenda a pizza sem sair do sofá: a plataforma cuida de SO e runtime; você traz só o código. *Ex.: Azure App Service, Azure SQL Database.*
- **SaaS** — vai a uma pizzaria: consome o software pronto. *Ex.: Microsoft 365, Dynamics 365.*

```
                IaaS            PaaS            SaaS
Aplicação       você            você            Microsoft
Dados           você            você            você (*)
Runtime         você            Microsoft       Microsoft
SO              você            Microsoft       Microsoft
Virtualização   Microsoft       Microsoft       Microsoft
Hardware/Rede   Microsoft       Microsoft       Microsoft
(*) os dados e as identidades são sempre sua responsabilidade.
```

Existe ainda a **computação serverless** (Azure Functions): você nem pensa em servidor; escreve a função e é cobrado por execução.

## Responsabilidade compartilhada

Segurança na nuvem é dividida por contrato. A Microsoft cuida da **segurança *da* nuvem** (datacenter, hardware, rede física, host); você cuida da **segurança *na* nuvem** (dados, identidades, configuração, acesso). Quanto mais perto de SaaS, mais a Microsoft assume; quanto mais perto de IaaS, mais é seu.

> `[ATENÇÃO]` Independentemente do modelo, **dados, contas/identidades e dispositivos de ponta são sempre responsabilidade do cliente**. "Está no Azure" não significa "a Microsoft garante que ninguém acesse meus dados". O Módulo 04 mostra como controlar isso.

> `[TEORIA]` Para a prova: classificar um serviço em IaaS/PaaS/SaaS e dizer quem administra SO, runtime, dados e identidades em cada caso. Referência: https://learn.microsoft.com/azure/security/fundamentals/shared-responsibility

![Diagrama oficial do modelo de responsabilidade compartilhada da Microsoft, mostrando local, IaaS, PaaS, SaaS](screenshots/01-conceitos-de-nuvem/01-responsabilidade-compartilhada.png)
> `[PRINT]` Passo a passo para capturar: abrir a página https://learn.microsoft.com/azure/security/fundamentals/shared-responsibility e capturar o diagrama de responsabilidade por modelo.

## Práticas

### Prática isolada — sentindo a diferença entre IaaS e PaaS

Objetivo: criar um servidor que você administra (IaaS) e um app que a plataforma administra (PaaS), e comparar o esforço.

```bash
RG=rg-lab-conceitos
az group create -n $RG -l brazilsouth

# IaaS: uma VM. Você é responsável pelo SO (atualizações, firewall, serviços).
az vm create -g $RG -n vm-iaas --image Ubuntu2204 --size Standard_B1s \
  --admin-username azureuser --generate-ssh-keys --public-ip-sku Standard

# PaaS: App Service. A plataforma cuida do SO e do runtime.
az appservice plan create -g $RG -n plan-paas --sku F1 --is-linux
az webapp create -g $RG -p plan-paas -n app-paas-$RANDOM --runtime "PYTHON:3.12"
```

Agora compare. Na VM você precisa entrar (`ssh azureuser@<ip>`), instalar o runtime e aplicar patches; no App Service você só envia o código. Anote 3 tarefas que seriam suas na VM e da plataforma no PaaS.

```bash
az vm list-sizes -l brazilsouth -o table | head      # tamanhos disponíveis para IaaS
az vm show -g $RG -n vm-iaas --query "hardwareProfile.vmSize" -o tsv
az webapp list -g $RG --query "[].{nome:name, estado:state}" -o table
```

![Terminal mostrando a criação da VM e do App Service, com os JSONs de retorno](screenshots/01-conceitos-de-nuvem/02-iaas-vs-paas.png)
> `[PRINT]` Passo a passo para capturar: capturar a saída de `az vm list -g rg-lab-conceitos -o table` e `az webapp list -g rg-lab-conceitos -o table` lado a lado.

**Limpeza:**

```bash
az group delete -n rg-lab-conceitos --yes --no-wait
```

`[CUSTO]` `Standard_B1s` tem horas gratuitas por 12 meses em contas novas; `F1` do App Service é gratuito. Mesmo assim, apague ao terminar.

### Contribuição ao projeto integrador

Sem criar nada ainda, classifique cada peça do TrilhaShop e justifique, em um arquivo `decisoes.md` no seu repositório de estudo:

| Peça | Modelo escolhido | Por quê | Quem opera o SO/runtime |
|---|---|---|---|
| Front estático | ? | ? | ? |
| API de catálogo | ? | ? | ? |
| Banco de dados | ? | ? | ? |
| Fila de pedidos | ? | ? | ? |

Dica: não existe resposta única. O exercício é justificar a troca entre controle (IaaS) e conveniência (PaaS).

## Erros comuns nesta fase

- **Achar que "nuvem é sempre mais barata".** Ela troca CapEx por OpEx e dá elasticidade; uma carga estável e previsível pode custar menos reservada (Módulo 16).
- **Confundir elasticidade e escalabilidade** (ver `[ATENÇÃO]` acima).
- **Achar que PaaS/SaaS tira toda a responsabilidade de segurança.** Dados e identidades continuam seus.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| IaaS (VM) | Módulo 08 — Máquinas Virtuais |
| PaaS (App Service) | Módulo 09 — App Services e Containers |
| Serverless | Módulo 12 |
| Responsabilidade compartilhada | Módulos 04 e 05 — identidade e segurança |
| CapEx x OpEx, modelo de consumo | Módulo 16 — Custos |

## `[REFERÊNCIA]`

- Microsoft Learn — *Describe cloud concepts* (AZ-900): https://learn.microsoft.com/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/
- Microsoft Learn — *Shared responsibility in the cloud*: https://learn.microsoft.com/azure/security/fundamentals/shared-responsibility
- Microsoft Learn — *Types of cloud computing*: https://azure.microsoft.com/resources/cloud-computing-dictionary/what-are-private-public-hybrid-clouds/
- Azure Well-Architected Framework: https://learn.microsoft.com/azure/well-architected/

**Como aprofundar:** o Cloud Adoption Framework (https://learn.microsoft.com/azure/cloud-adoption-framework/) descreve o ciclo completo de adoção em empresas; leia só a visão geral agora.

## Checklist de saída

Você está pronto para o módulo 02 quando consegue, sem consultar:

- [ ] Explicar CapEx x OpEx e por que a nuvem favorece OpEx.
- [ ] Diferenciar elasticidade de escalabilidade e escala vertical de horizontal.
- [ ] Explicar pública, privada e híbrida, e citar Azure Arc como exemplo de híbrida.
- [ ] Preencher de memória a tabela "quem administra o quê" em IaaS, PaaS e SaaS.
- [ ] Dizer o que é sempre responsabilidade do cliente (dados, identidades, dispositivos).
- [ ] Ter criado e apagado uma VM (IaaS) e um App Service (PaaS) e comparado o esforço.
- [ ] Ter classificado as peças do TrilhaShop em `decisoes.md`.
