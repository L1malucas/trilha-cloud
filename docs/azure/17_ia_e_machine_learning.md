---
id: "17_ia_e_machine_learning"
title: "Módulo 17 — IA e Machine Learning"
sidebar_label: "17 · IA e Machine Learning"
sidebar_position: 17
---

# Módulo 17 — IA e Machine Learning

> **Objetivo**: conhecer a oferta de IA do Azure — Azure AI Services, Azure OpenAI, Azure Machine Learning — saber quando usar um serviço pronto ou treinar um modelo, entender IA responsável e chamar um serviço de IA a partir do terminal para o TrilhaShop.
>
> **Pré-requisitos**: módulos 04 e 05 (identidade e segredos).
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre **Fundamentals of AI** e a parte de IA do **AZ-900** (https://learn.microsoft.com/credentials/certifications/azure-fundamentals/). Para especialização em IA, ver AI-900 e AI-102.

---

## Contratar um especialista ou formar um

Para traduzir um texto você pode contratar um tradutor pronto (chamar uma API) ou formar um tradutor do zero (treinar um modelo). A maioria das aplicações precisa do primeiro. A decisão central do módulo é essa: **usar serviço pronto** ou **construir/treinar o seu modelo**.

| Necessidade | Opção no Azure | Esforço |
|---|---|---|
| Visão, fala, linguagem, tradução, documentos — tarefas comuns | **Azure AI Services** (APIs prontas) | Baixo: chamar uma API |
| Texto gerativo, chat, resumo, embeddings | **Azure OpenAI** e Azure AI Foundry | Médio: engenharia de prompt, RAG |
| Modelo próprio, dados próprios | **Azure Machine Learning** | Alto: dados, treino, MLOps |

> `[TEORIA]` Prova: "reconhecer texto em imagens, detectar objetos, transcrever fala, traduzir" → **Azure AI Services**; "treinar, rastrear e implantar modelos próprios" → **Azure Machine Learning**; "geração de texto/imagem e chat com modelos GPT" → **Azure OpenAI**.

## Conceitos que você precisa saber

- **IA** (o campo), **Machine Learning** (aprender padrões a partir de dados), **Deep Learning** (redes neurais profundas), **IA generativa** (cria texto, imagem, código).
- Cargas de trabalho comuns: **visão computacional**, **processamento de linguagem natural (NLP)**, **reconhecimento de fala**, **detecção de anomalias**, **IA generativa**.
- **Prompt**, **token** (a unidade de cobrança e de contexto), **RAG** (*retrieval-augmented generation*: o modelo responde consultando os *seus* documentos, reduzindo "alucinações"), **embeddings** (vetores que representam significado, base da busca semântica).

## IA responsável

A Microsoft organiza seis princípios que aparecem na prova: **justiça** (*fairness*), **confiabilidade e segurança**, **privacidade e segurança dos dados**, **inclusão**, **transparência** e **responsabilidade** (*accountability*). Na prática: avaliar vieses, proteger dados de usuários, explicar limites do sistema e manter humanos responsáveis pelas decisões importantes. Referência: https://learn.microsoft.com/azure/machine-learning/concept-responsible-ai

> `[ATENÇÃO]` Dados enviados a um serviço de IA são **dados do seu cliente**. Defina o que pode ser enviado (nada de CPF e senha em prompt) e leia a política de retenção do serviço antes de usar com dados reais.

## Chamando um serviço de IA pelo terminal

Cada serviço vive numa conta **Azure AI** (Foundry/Cognitive Services). Exemplo com um recurso multi-serviço:

```bash
RG=rg-trilhashop-dev
az cognitiveservices account create -g $RG -n ai-trilhashop-$RANDOM \
  --kind CognitiveServices --sku S0 -l brazilsouth --yes

ENDPOINT=$(az cognitiveservices account show -g $RG -n <nome> --query properties.endpoint -o tsv)
CHAVE=$(az cognitiveservices account keys list -g $RG -n <nome> --query key1 -o tsv)

# Análise de sentimento (serviço Language)
curl -s -X POST "${ENDPOINT}language/:analyze-text?api-version=2023-04-01" \
  -H "Ocp-Apim-Subscription-Key: $CHAVE" -H "Content-Type: application/json" \
  -d '{"kind":"SentimentAnalysis","analysisInput":{"documents":[{"id":"1","language":"pt","text":"Chegou rápido e o produto é ótimo!"}]}}' | jq '.results.documents[0].sentiment'
```

Prefira **autenticação por Entra ID** (role *Cognitive Services User*) à chave quando possível — mesma lógica de Managed Identity do Módulo 04.

> `[ATENÇÃO]` Versões de API e nomes de produto mudam depressa (Cognitive Services → Azure AI Services → Azure AI Foundry). Confira sempre o *quickstart* atual do serviço escolhido: https://learn.microsoft.com/azure/ai-services/

### Azure OpenAI em uma olhada

Azure OpenAI hospeda modelos (GPT, embeddings, imagem) com a segurança e a rede do Azure. Você cria o recurso, **implanta (*deployment*) um modelo** e chama a API; o acesso a alguns modelos exige solicitação.

```bash
az cognitiveservices account create -g $RG -n aoai-trilhashop-$RANDOM --kind OpenAI --sku S0 -l eastus --yes
az cognitiveservices account deployment create -g $RG -n <conta> --deployment-name chat \
  --model-name gpt-4o-mini --model-version "2024-07-18" --model-format OpenAI --sku-name Standard --sku-capacity 10
```

(Disponibilidade e modelos variam por região e assinatura.)

![Azure AI Foundry/Language Studio mostrando uma análise de sentimento sobre uma frase de exemplo](screenshots/17-ia-e-machine-learning/01-language-studio-sentimento.png)
> `[PRINT]` Passo a passo para capturar: abrir o estúdio do serviço (Language Studio / AI Foundry) → Sentiment analysis → colar uma frase e capturar o resultado com as pontuações.

## Azure Machine Learning, em uma olhada

O **Azure ML** é o ambiente completo de ciclo de vida de modelos: workspaces, *notebooks*, **AutoML** (testa algoritmos automaticamente), pipelines de treino, registro de modelos e **endpoints** de inferência. Tenha a ideia do fluxo: dados → treino → avaliar → registrar → implantar → monitorar (MLOps).

```bash
az extension add --name ml
az ml workspace create -g $RG -n mlw-trilhashop -l brazilsouth
az ml workspace show -g $RG -n mlw-trilhashop --query "{nome:name,regiao:location}" -o table
```

## Práticas

### Prática isolada

1. Crie um recurso Azure AI multi-serviço e faça uma chamada de **análise de sentimento** por `curl` com 3 frases (positiva, negativa, neutra).
2. Teste também **tradução** ou **detecção de idioma** e compare a facilidade com treinar um modelo.
3. No estúdio, experimente *Content Safety* e observe como o serviço trata conteúdo sensível.
4. Escreva, para cada princípio de IA responsável, um risco real num e-commerce.

**Limpeza:** apague o RG do lab (as chaves ficam expostas enquanto o recurso existir).

### Contribuição ao projeto integrador

Dê "inteligência" ao TrilhaShop: um endpoint da API que recebe avaliações de clientes e usa **análise de sentimento** para marcar positiva/negativa, guardando o resultado no banco; **chave no Key Vault** e leitura pela Managed Identity (Módulos 04 e 05). Opcional: gerar descrições de produto com Azure OpenAI e passar por revisão humana.

`[CUSTO]` Serviços de IA cobram por **transação/token**; existe camada gratuita limitada (F0). Azure OpenAI e Azure ML (computação) podem gerar custo alto: defina quotas e apague os recursos de teste.

## Erros comuns nesta fase

- Treinar um modelo quando uma API pronta resolvia.
- Enviar dados pessoais sensíveis a um serviço sem avaliar privacidade.
- Deixar a chave do serviço em código ou no Git.
- Tratar a saída de IA generativa como verdade, sem validação.
- Ignorar o limite de quota/taxa da API.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Managed Identity, Key Vault | Módulos 04 e 05 |
| Custo por transação/token | Custos — Módulo 16 |
| IA no GCP (Vertex AI) | Trilha GCP, Módulo 17 |
| IA na AWS | Trilha AWS, Módulo 15 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Azure AI Services*: https://learn.microsoft.com/azure/ai-services/what-are-ai-services
- Microsoft Learn — *Azure OpenAI Service*: https://learn.microsoft.com/azure/ai-services/openai/overview
- Microsoft Learn — *Azure Machine Learning*: https://learn.microsoft.com/azure/machine-learning/overview-what-is-azure-machine-learning
- Microsoft Learn — *Responsible AI*: https://learn.microsoft.com/azure/machine-learning/concept-responsible-ai
- Microsoft Learn — *AI-900: Azure AI Fundamentals*: https://learn.microsoft.com/credentials/certifications/azure-ai-fundamentals/
- Microsoft Responsible AI principles: https://www.microsoft.com/ai/responsible-ai

**Como aprofundar:** o curso gratuito "AI-900" no Microsoft Learn e o *Azure AI Foundry* para experimentar modelos sem escrever código.

## Checklist de saída

- [ ] Diferenciar IA, Machine Learning, Deep Learning e IA generativa.
- [ ] Escolher entre Azure AI Services, Azure OpenAI e Azure ML.
- [ ] Explicar token, prompt, RAG e embedding.
- [ ] Listar os seis princípios de IA responsável.
- [ ] Chamar uma API de IA pelo terminal com a chave guardada no Key Vault.
- [ ] Ter integrado análise de sentimento ao TrilhaShop.
