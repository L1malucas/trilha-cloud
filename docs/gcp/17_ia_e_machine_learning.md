---
id: "17_ia_e_machine_learning"
title: "Módulo 17 — IA e Machine Learning"
sidebar_label: "17 · IA e Machine Learning"
sidebar_position: 17
---

# Módulo 17 — IA e Machine Learning

> **Objetivo**: conhecer a oferta de IA do GCP — Vertex AI, APIs pré-treinadas, Gemini, AutoML e IA generativa —, saber quando usar um serviço pronto ou treinar um modelo, entender IA responsável e chamar um serviço de IA a partir do terminal para o TrilhaShop.
>
> **Pré-requisitos**: módulos 04 (SA, segredos) e 13 (dados).
>
> **Tempo de referência (não prazo)**: uma semana.
>
> Cobre "Innovating with Google Cloud AI" do **Cloud Digital Leader**. Para especialização: *Professional Machine Learning Engineer*. Referência: https://cloud.google.com/vertex-ai/docs

---

## Contratar um especialista ou formar um

Para traduzir um texto você pode contratar um tradutor pronto (chamar uma API) ou formar um do zero (treinar um modelo). A maioria das aplicações precisa do primeiro. A decisão central do módulo é essa: **usar serviço pronto** ou **construir/treinar o seu modelo**.

| Necessidade | Opção no GCP | Esforço |
|---|---|---|
| Visão, fala, linguagem, tradução, documentos — tarefas comuns | **APIs pré-treinadas** (Vision, Speech, Natural Language, Translation, Document AI) | Baixo: chamar uma API |
| Texto/imagem/código gerativo, chat, resumo, embeddings | **Gemini** (via Vertex AI / AI Studio), modelos do Model Garden | Médio: prompt, RAG |
| Modelo próprio com dados próprios, sem programar ML | **AutoML** (Vertex AI) | Médio |
| Modelo totalmente customizado | **Vertex AI Custom Training** (+ notebooks, pipelines, MLOps) | Alto |
| ML direto em SQL sobre dados do BigQuery | **BigQuery ML** (Módulo 13) | Baixo/médio |

> `[TEORIA]` Prova (CDL): "reconhecer objetos em imagens, transcrever fala, traduzir" → **APIs pré-treinadas**; "treinar modelo com dados da empresa sem código" → **AutoML**; "gerar texto/imagens e conversar" → **IA generativa (Gemini/Vertex AI)**; "plataforma unificada para todo o ciclo de ML" → **Vertex AI**. Regra: comece pelo mais simples que resolve.

## Conceitos essenciais

- **IA** (o campo), **Machine Learning** (aprender padrões dos dados), **Deep Learning** (redes neurais profundas), **IA generativa** (cria texto, imagem, código).
- **Aprendizado supervisionado** (com rótulos), **não supervisionado** (sem rótulos), **por reforço**.
- **Prompt**, **token** (unidade de cobrança e contexto), **janela de contexto**, **alucinação** (resposta plausível, porém falsa).
- **Embeddings**: vetores que representam significado, base da busca semântica.
- **RAG** (*retrieval-augmented generation*): o modelo responde consultando **os seus documentos**, reduzindo alucinações e permitindo respostas sobre dados privados.
- **Fine-tuning** x **engenharia de prompt** x **RAG**: do mais barato e rápido (prompt) ao mais caro (fine-tuning).

## IA responsável

O Google publica **princípios de IA** (ser socialmente benéfica, evitar vieses injustos, segurança, responsabilidade, privacidade, excelência científica). Na prática: avaliar vieses, proteger dados, explicar limites do sistema, manter **humanos responsáveis** por decisões importantes e filtrar conteúdo nocivo (os modelos vêm com *safety filters* configuráveis). Referência: https://ai.google/responsibility/principles/

> `[ATENÇÃO]` Dados enviados a um serviço de IA são **dados do seu cliente**. Defina o que pode ser enviado (nada de CPF, senha ou segredo em prompt) e leia a política de uso/retenção de dados do serviço antes de usar com dados reais. No Vertex AI, os dados do cliente não são usados para treinar os modelos base sem consentimento — confirme a política vigente.

## APIs pré-treinadas pelo terminal

```bash
PROJETO=$(gcloud config get project)
gcloud services enable language.googleapis.com vision.googleapis.com translate.googleapis.com aiplatform.googleapis.com

# Análise de sentimento (Natural Language API)
gcloud ml language analyze-sentiment --content="Chegou rápido e o produto é ótimo!" --format="yaml(documentSentiment)"

# Rótulos de uma imagem (Vision API)
gcloud ml vision detect-labels gs://<BUCKET>/imagens/logo.png --format="value(responses.labelAnnotations.description)"

# Tradução via REST
curl -s -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"q":"camiseta de algodão","target":"en","format":"text"}' \
  "https://translation.googleapis.com/language/translate/v2" | jq '.data.translations[0].translatedText'
```

## Gemini no Vertex AI

O **Vertex AI** é a plataforma unificada de IA do GCP (modelos, treino, implantação, MLOps). **Gemini** é a família de modelos multimodais do Google (texto, imagem, áudio, vídeo, código). Você os chama por API/SDK, com autenticação IAM (a SA do Módulo 04, com `roles/aiplatform.user`).

```bash
# REST: gerar descrição de produto (nomes de modelo/regiões mudam; confira em https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models)
REGIAO=us-central1
MODELO=gemini-2.0-flash
curl -s -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json" \
  "https://$REGIAO-aiplatform.googleapis.com/v1/projects/$PROJETO/locations/$REGIAO/publishers/google/models/$MODELO:generateContent" \
  -d '{"contents":[{"role":"user","parts":[{"text":"Escreva uma descrição de 2 frases para uma camiseta de algodão orgânico."}]}]}' \
  | jq -r '.candidates[0].content.parts[0].text'
```

Em Python, com o SDK:

```python
from google import genai
client = genai.Client(vertexai=True, project="SEU-PROJETO", location="us-central1")
resp = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Resuma esta avaliação em uma frase: 'Chegou rápido, mas a embalagem veio amassada.'")
print(resp.text)
```

> `[ATENÇÃO]` Nomes de modelos, regiões disponíveis e SDKs mudam com frequência (e modelos são descontinuados). Confira sempre o catálogo atual antes de implantar, e **fixe a versão do modelo** em produção para evitar mudanças de comportamento.

**RAG** na prática (conceito): gerar *embeddings* dos seus documentos, guardá-los num índice (Vertex AI Search / Vector Search / pgvector no Cloud SQL), buscar os trechos mais próximos da pergunta e **injetá-los no prompt**. O Vertex AI oferece componentes gerenciados para isso (*Vertex AI Search*, *grounding*).

![Vertex AI Studio com um prompt para gerar a descrição de um produto e a resposta do modelo Gemini](screenshots/17-ia-e-machine-learning/01-vertex-ai-studio-gemini.png)
> `[PRINT]` Passo a passo para capturar: Console → Vertex AI → Vertex AI Studio (ou Google AI Studio). Enviar o prompt de descrição de produto e capturar a resposta.

## Vertex AI: treinar e implantar (visão)

O fluxo de ML clássico, que a Vertex AI cobre ponta a ponta (**MLOps**): **dados** → **preparar** → **treinar** (AutoML ou código próprio) → **avaliar** → **registrar** no *Model Registry* → **implantar** num *endpoint* → **monitorar** (desvio de dados/desempenho). **AutoML** treina modelos para imagens, texto e dados tabulares sem código; **Vertex AI Pipelines** automatiza o fluxo.

```bash
gcloud ai models list --region=us-central1
gcloud ai endpoints list --region=us-central1
```

> `[CUSTO]` **Endpoints de modelo** e **treinamento** cobrem por hora de computação (GPU é caro). Chamadas a APIs/Gemini cobram por **uso** (caracteres/tokens/imagens). Defina cotas, apague endpoints ociosos e prefira APIs prontas em estudo.

## Práticas

### Prática isolada

1. Habilite as APIs e rode a análise de sentimento com 3 frases (positiva, negativa, neutra) por `gcloud ml language`.
2. Use a Vision API para rotular uma imagem do seu bucket e compare com o que você esperava.
3. No Vertex AI Studio, escreva um prompt para gerar a descrição de um produto; refine-o 3 vezes e anote o que melhorou.
4. Identifique, para cada princípio de IA responsável, um risco real num e-commerce.

**Limpeza:** desabilite APIs não usadas e apague endpoints/recursos criados.

### Contribuição ao projeto integrador

Dê "inteligência" ao TrilhaShop: um endpoint da API que recebe avaliações de clientes, usa **análise de sentimento** (Natural Language API) para marcar positiva/negativa e grava o resultado no banco, com a SA e **sem chave** (ADC). Opcional: gerar descrições de produto com Gemini **com revisão humana** antes de publicar. Documente no `decisoes.md` quais dados são enviados à IA e por quê.

`[CUSTO]` Natural Language e Vision têm cota gratuita mensal; Gemini cobra por token. Defina **quota/budget** e não deixe endpoints de ML ligados.

## Erros comuns nesta fase

- Treinar um modelo quando uma API pronta resolvia.
- Enviar dados pessoais sensíveis a um serviço sem avaliar privacidade.
- Tratar a saída de IA generativa como verdade (alucinação) sem validação humana.
- Não fixar versão do modelo e ter o comportamento alterado.
- Deixar endpoints/GPUs ligados.
- Usar chave de API/JSON em vez de SA e ADC.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| SA, ADC | Módulo 04 e 07 |
| BigQuery ML, dados | Dados e analytics — Módulo 13 |
| Custo por token/uso | Custos — Módulo 16 |
| Azure AI/OpenAI | Azure, Módulo 17 |
| IA na AWS | Trilha AWS, Módulo 15 |

## `[REFERÊNCIA]`

- Google Cloud — *Vertex AI*: https://cloud.google.com/vertex-ai/docs
- Google Cloud — *Generative AI on Vertex AI*: https://cloud.google.com/vertex-ai/generative-ai/docs
- Google Cloud — *Natural Language API*: https://cloud.google.com/natural-language/docs · *Vision API*: https://cloud.google.com/vision/docs
- Google Cloud — *Document AI*: https://cloud.google.com/document-ai/docs
- Google Cloud — *AutoML (Vertex AI)*: https://cloud.google.com/vertex-ai/docs/beginner/beginners-guide
- Google — *Responsible AI*: https://ai.google/responsibility/principles/
- Google Cloud Skills Boost — *Introduction to Generative AI*: https://www.cloudskillsboost.google/

**Como aprofundar:** o curso gratuito "Introduction to Generative AI" (Skills Boost), o *Machine Learning Crash Course* do Google e a certificação *Professional Machine Learning Engineer*.

## Checklist de saída

- [ ] Diferenciar IA, ML, Deep Learning e IA generativa.
- [ ] Escolher entre APIs pré-treinadas, AutoML, Vertex AI custom e BigQuery ML.
- [ ] Explicar prompt, token, alucinação, embedding e RAG.
- [ ] Citar os princípios de IA responsável e riscos de privacidade.
- [ ] Chamar uma API de IA pelo terminal com identidade IAM (sem chave).
- [ ] Descrever o ciclo de MLOps no Vertex AI.
- [ ] Ter integrado análise de sentimento ao TrilhaShop.
