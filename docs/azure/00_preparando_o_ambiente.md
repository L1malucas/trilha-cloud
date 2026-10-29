---
id: "00_preparando_o_ambiente"
title: "Módulo 00 — Preparando o ambiente"
sidebar_label: "00 · Preparando o ambiente"
sidebar_position: 0
---

# Módulo 00 — Preparando o ambiente

> **Objetivo**: ter, antes do primeiro conceito, um ambiente pronto para trabalhar em duas telas — a trilha de um lado e o terminal do outro: conta Azure criada, `az` instalado no WSL, login feito e um primeiro resource group criado e consultado por linha de comando.
>
> **Pré-requisitos**: nenhum de Azure. Para o terminal, ter o WSL2 instalado — o passo a passo está no Módulo 00 da trilha Linux; se ainda não fez, pode usar o **Azure Cloud Shell** (ver abaixo) e voltar ao WSL depois.
>
> **Tempo de referência (não prazo)**: meio dia.
>
> Este módulo não cai em prova, mas tudo que vem depois assume o que ele monta. Referência geral da CLI: https://learn.microsoft.com/cli/azure/

---

## Quatro portas para o mesmo prédio

Pense no Azure como um prédio comercial enorme. Tudo que você cria (máquina virtual, rede, banco) é uma sala nesse prédio, e quem administra o prédio é uma única central chamada **Azure Resource Manager (ARM)**. O que muda de uma ferramenta para outra é só a porta por onde você entra:

| Porta | O que é | Quando usar |
|---|---|---|
| **Portal** (portal.azure.com) | Interface web, visual | Explorar, entender o que cada serviço oferece |
| **Azure CLI** (`az`) | Comandos de terminal, saída em JSON | Scripts, automação, esta trilha |
| **Azure PowerShell** (`Az` module) | Cmdlets PowerShell | Quem já vive em PowerShell/Windows |
| **Cloud Shell** | Terminal no navegador, já logado | Começar sem instalar nada |

Por que isso importa: as quatro portas falam com a **mesma API do ARM**. Um recurso criado por clique no Portal aparece idêntico num `az ... list`, e vice-versa. Por isso a trilha ensina o conceito pelo Portal e a prática pelo `az`: o Portal mostra o mapa, a CLI deixa você repetir o caminho mil vezes sem clicar.

> `[TEORIA]` Regra prática (a mesma lógica da AWS): Portal para explorar e tarefas únicas; CLI/API para tarefas repetíveis; IaC (Bicep/Terraform, Módulo 14) para infraestrutura que precisa ser versionada e reproduzida.

## Criando a conta e entendendo o crédito

Uma conta gratuita (https://azure.microsoft.com/free/) dá, na data desta escrita, **US$200 de crédito por 30 dias**, mais um conjunto de serviços **sempre gratuitos** e alguns gratuitos por 12 meses. Confira os valores atuais na página oficial, que mudam com o tempo.

![Página de criação de conta gratuita do Azure, com os campos de dados pessoais e verificação por cartão](screenshots/00-preparando-o-ambiente/01-criacao-conta-gratuita.png)
> `[PRINT]` Passo a passo para capturar: abrir https://azure.microsoft.com/free/ → "Comece gratuitamente". Capturar a página de criação com os campos preenchidos (ocultar dados pessoais e número do cartão).

> `[ATENÇÃO]` O cartão serve para verificação de identidade. Ao fim dos 30 dias, a conta **não** vira paga automaticamente: ela é suspensa até você migrar manualmente para pay-as-you-go. Mesmo assim, crie um *budget* no Módulo 16 e use o comando de limpeza de cada módulo.

Três conceitos para fixar já, que reaparecem no Módulo 03: o **tenant** (a "empresa" no Microsoft Entra ID, dona das identidades), a **subscription** (a "conta de cobrança" onde os recursos vivem) e o **resource group** (a "gaveta" que agrupa recursos do mesmo projeto).

## Instalando o `az` no WSL

No terminal do WSL (Ubuntu), o script oficial instala tudo:

```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az version
```

`az version` mostra a versão instalada e das extensões. Se o comando não for encontrado, feche e reabra o terminal.

> `[CLI]` Autenticar. No WSL, o navegador do Windows nem sempre abre sozinho; use o código de dispositivo:
> ```bash
> az login --use-device-code
> ```
> Abra https://microsoft.com/devicelogin no navegador, digite o código mostrado no terminal e entre com a conta. Documentação: https://learn.microsoft.com/cli/azure/authenticate-azure-cli

Depois do login, confirme quem você é e em qual assinatura está operando — o equivalente ao `sts get-caller-identity` da AWS:

```bash
az account show -o table
az account list -o table
az account set --subscription "<nome-ou-id-da-assinatura>"
```

![Terminal do WSL mostrando a saída de `az account show -o table` com nome da assinatura, tenant e estado Enabled](screenshots/00-preparando-o-ambiente/02-az-account-show.png)
> `[PRINT]` Passo a passo para capturar: no WSL, rodar `az account show -o table`. Capturar o comando e a saída (ocultar o ID da assinatura se for compartilhar).

## Aprendendo a ler a saída: `--output` e `--query`

Todo comando `az` devolve JSON por padrão, que é ótimo para máquinas e cansativo para humanos. Dois parâmetros resolvem:

```bash
az group list -o table                       # tabela legível
az group list -o json                        # JSON completo (padrão)
az group list --query "[].name" -o tsv       # só os nomes, uma linha cada, ideal para scripts
az group list --query "[?location=='brazilsouth'].{nome:name, local:location}" -o table
```

`--query` usa **JMESPath**, uma linguagem de consulta para JSON. Leia `[?location=='brazilsouth']` como "filtre a lista por itens cuja `location` é brazilsouth" e `.{nome:name}` como "monte um objeto novo só com estes campos". Aprender isso uma vez evita `grep`/`jq` em quase todo script.

> `[TENTE VOCÊ]` Liste só os nomes das *assinaturas* em formato TSV. Resposta: `az account list --query "[].name" -o tsv`.

## Configurando padrões e achando comandos

```bash
az configure --defaults location=brazilsouth        # evita repetir --location
az find "az vm create"                              # exemplos de uso reais
az vm create -h                                     # ajuda de qualquer comando
az extension add --name <nome>                      # extensões (ex.: containerapp, bicep via 'az bicep install')
```

`-h` funciona em qualquer nível (`az -h`, `az vm -h`, `az vm create -h`) e é a documentação mais rápida que existe: ela mostra todos os parâmetros e exemplos sem sair do terminal.

## Práticas

### Prática isolada

1. Faça login e confirme a assinatura (`az account show`).
2. Defina a região padrão (`az configure --defaults location=brazilsouth`).
3. Crie um grupo de testes com tags e consulte:
   ```bash
   az group create --name rg-lab-teste --tags projeto=lab dono=$USER
   az group show --name rg-lab-teste --query "{nome:name, local:location, tags:tags}" -o json
   ```
4. Delete-o (limpeza é hábito, não opcional):
   ```bash
   az group delete --name rg-lab-teste --yes --no-wait
   ```

![Saída de `az group show` mostrando nome, localização e tags do resource group](screenshots/00-preparando-o-ambiente/03-az-group-show.png)
> `[PRINT]` Passo a passo para capturar: rodar o `az group show` do passo 3 e capturar a saída JSON antes de apagar.

### Contribuição ao projeto integrador

A partir do próximo módulo, tudo do **TrilhaShop** (o e-commerce fictício que a trilha constrói módulo a módulo) vive no mesmo resource group, com a mesma tag. Crie-o agora:

```bash
az group create --name rg-trilhashop-dev --location brazilsouth \
  --tags projeto=trilhashop ambiente=dev
az group list --query "[?tags.projeto=='trilhashop'].name" -o tsv
```

A tag `projeto=trilhashop` é o que permite, no fim, encontrar e apagar tudo que a trilha criou com um comando só.

`[CUSTO]` Resource groups e tags não custam nada. O custo começa nos recursos dentro deles.

## Erros comuns nesta fase

- **Operar na assinatura errada.** Quem tem mais de uma assinatura cria recurso onde não queria. Sempre cheque `az account show` antes de comandos que criam algo.
- **Esquecer de apagar.** Um resource group esquecido, com uma VM ligada, consome o crédito em dias. Anote o comando de limpeza no começo da prática, não no fim.
- **Confundir tenant e subscription.** Tenant é identidade; subscription é cobrança. Uma pessoa pode ter várias subscriptions no mesmo tenant.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Resource group + tags | Governança e Policy — Módulo 03; custos por tag — Módulo 16 |
| `az` + `--query` | Todos os labs; scripts completos — Módulo 13 |
| Login e identidade | Entra ID, RBAC e Managed Identity — Módulo 04 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Introdução à CLI do Azure*: https://learn.microsoft.com/cli/azure/get-started-with-azure-cli
- Microsoft Learn — *Instalar a CLI do Azure no Linux (apt)*: https://learn.microsoft.com/cli/azure/install-azure-cli-linux
- Microsoft Learn — *Consultar a saída com JMESPath*: https://learn.microsoft.com/cli/azure/query-azure-cli
- JMESPath — tutorial: https://jmespath.org/tutorial.html
- Azure Free Account: https://azure.microsoft.com/free/

**Como aprofundar:** os módulos "Get started with Azure CLI" no Microsoft Learn têm sandbox grátis; reproduza-os no seu WSL em vez do sandbox.

## Checklist de saída

Você está pronto para o módulo 01 quando consegue, sem consultar:

- [ ] Explicar por que Portal, CLI e PowerShell mostram os mesmos recursos (todos usam o ARM).
- [ ] Ter feito `az login` no WSL e confirmado a assinatura com `az account show`.
- [ ] Usar `-o table` e `--query` para extrair só o que precisa.
- [ ] Usar `-h` para descobrir os parâmetros de um comando desconhecido.
- [ ] Ter criado `rg-trilhashop-dev` com tags e listado por query.
