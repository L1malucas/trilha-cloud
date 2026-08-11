---
id: 16_projeto_final_e_preparacao_certificacao
title: "Módulo 16 — Projeto Final e Preparação para Certificação"
sidebar_position: 16
---

# Módulo 16 — Projeto Final e Preparação para Certificação

> **Objetivo**: fechar o último domínio ainda não coberto (Billing, Pricing e Support), amarrar os quinze módulos anteriores num projeto único que você constrói com as próprias mãos, e sair com um plano de revisão organizado exatamente como o exame CLF-C02 está estruturado.
>
> **Pré-requisitos**: todos os módulos 01 a 15 — este é, deliberadamente, o módulo que assume o resto da trilha inteira como base.
>
> **Tempo de referência (não prazo)**: duas a três semanas, incluindo o projeto prático e simulados.
>
> Este módulo fecha o **Domínio 4 — Billing, Pricing, and Support** (12% do conteúdo pontuado), o único ainda não coberto em profundidade — o módulo 9 tocou nos modelos de compra (Task 4.1) ao falar de EC2, mas as Tasks 4.2 e 4.3 (ferramentas de billing e planos de suporte) ficaram para aqui. Página oficial: https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain4.html. Trilha construída sobre o CLF-C02 vigente, não o CLF-C01 (aposentado em 18/09/2023).

---

## Fechando o domínio que faltava: Billing, Pricing e Support

## Ferramentas de acompanhamento de custo

Você já usa duas dessas ferramentas desde o módulo 1: o **Billing and Cost Management** (o painel geral) e a **AWS Pricing Calculator** (estimativas antes de criar algo). Faltam duas peças para completar o quadro. O **AWS Cost Explorer** visualiza, retroativamente, para onde o dinheiro já foi gasto — com gráficos filtráveis por serviço, por período, por tag — respondendo "o que eu já gastei e em quê", diferente da Pricing Calculator, que responde "quanto algo vai custar antes de existir". O **AWS Budgets** vai além do billing alarm simples que você configurou na preparação da conta: permite definir orçamentos por serviço, por tag, ou por conta inteira, com alertas configuráveis em múltiplos limiares (por exemplo, avisar em 50%, 80% e 100% do orçamento previsto), e até ações automáticas quando um limite é ultrapassado.

![Console do AWS Budgets na tela de criação de um orçamento, com o campo de valor-limite e as opções de alerta por percentual configuráveis](screenshots/16-projeto-final-e-preparacao-certificacao/01-aws-budgets-criar-orcamento.png)
> `[PRINT]` Passo a passo para capturar: no Console, dentro de "Billing and Cost Management", clicar em "Budgets" no menu lateral e depois em "Create budget". Escolher o template "Zero spend budget" (que avisa em qualquer gasto acima de zero — apropriado para uma conta de estudo) ou "Customize" para configurar um valor manual. Capturar a tela mostrando os campos de configuração antes de concluir. Pode concluir a criação — um budget não gera custo algum por existir.

![Console do AWS Cost Explorer mostrando um gráfico de gastos por serviço ao longo do tempo, com a legenda de cores por serviço da AWS](screenshots/16-projeto-final-e-preparacao-certificacao/02-cost-explorer-grafico.png)
> `[PRINT]` Passo a passo para capturar: dentro de "Billing and Cost Management", clicar em "Cost Explorer" (pode ser necessário habilitar na primeira vez, sem custo). Capturar a tela mostrando o gráfico de gastos, mesmo que os valores sejam próximos de zero por a conta ser de estudo — o importante é a interface do gráfico e o filtro por serviço visível.

Para organizações com múltiplas equipes ou projetos numa mesma conta, **cost allocation tags** permitem marcar recursos (uma instância EC2, um bucket S3) com metadados como `projeto: trilha-cloud` ou `equipe: financeiro`, que depois aparecem como colunas filtráveis no **AWS Cost and Usage Report** — o relatório mais granular de billing que a AWS oferece, usado tipicamente por ferramentas de análise financeira automatizada, não lido manualmente linha a linha.

> `[TEORIA]` Para a prova: Cost Explorer = análise retroativa visual de gastos já ocorridos. Pricing Calculator = estimativa prospectiva antes de criar algo. Budgets = alertas e limites configuráveis, incluindo ações automáticas. Cost and Usage Report = o relatório mais detalhado, geralmente consumido por ferramentas, não por leitura manual. Cost allocation tags = a forma de atribuir gasto a projetos/equipes dentro de uma conta compartilhada.

## Planos de suporte da AWS

A AWS oferece múltiplos níveis de suporte técnico, e a prova espera que você reconheça a escada completa. O plano **Basic** vem incluído automaticamente, sem custo, com qualquer conta AWS — dá acesso a documentação, fóruns e ao Trusted Advisor com um conjunto limitado de checagens, mas nenhum canal direto de suporte técnico. O plano **Developer** adiciona acesso a suporte técnico por e-mail durante horário comercial, indicado para quem está testando ou desenvolvendo, não para produção crítica. O plano **Business** adiciona suporte 24/7 por chat, telefone e e-mail, com tempo de resposta garantido conforme a severidade do problema, acesso completo às checagens do Trusted Advisor, e é o nível típico para cargas de trabalho de produção. O **Enterprise On-Ramp** e o **Enterprise Support** adicionam, progressivamente, um Technical Account Manager (TAM) dedicado (no Enterprise completo) e tempos de resposta ainda mais agressivos para incidentes críticos — voltados a organizações com operações de missão crítica na AWS.

![Página de comparação dos planos de suporte da AWS, mostrando as colunas Basic, Developer, Business, Enterprise On-Ramp e Enterprise lado a lado](screenshots/16-projeto-final-e-preparacao-certificacao/03-planos-de-suporte-comparacao.png)
> `[PRINT]` Passo a passo para capturar: no Console, buscar "Support" e abrir o "AWS Support Center", ou acessar a página pública de planos de suporte (link nas referências abaixo). Capturar a tela de comparação dos planos, mostrando as colunas lado a lado com os recursos de cada nível.

> `[TEORIA]` Para a prova: a ordem crescente de plano de suporte é Basic (gratuito, sem contato direto) → Developer (e-mail, horário comercial) → Business (24/7, todos os canais, Trusted Advisor completo) → Enterprise On-Ramp → Enterprise (TAM dedicado). Um cenário que menciona "aplicação de missão crítica, precisa de resposta em minutos" aponta para Business ou Enterprise; um cenário de "aprendendo/testando" aponta para Basic ou Developer.

## Onde encontrar ajuda além do suporte pago

Além dos planos de suporte, a AWS mantém uma rede de recursos técnicos gratuitos: o **AWS Knowledge Center** responde perguntas frequentes específicas por serviço; o **AWS re:Post** é a comunidade de perguntas e respostas oficial da AWS (o sucessor dos antigos fóruns); o **AWS Prescriptive Guidance** oferece orientação estruturada e opinativa sobre como resolver padrões comuns de migração e modernização. A **AWS Partner Network (APN)** conecta clientes a empresas terceiras certificadas pela AWS — integradores de sistema e fornecedores de software independentes (ISVs) — que oferecem implementação, consultoria e software complementar, com benefícios como treinamento e descontos por volume para quem participa formalmente do programa como parceiro.

`[APROFUNDAMENTO]` Diferenciar em detalhe os tiers de parceria da AWS (Select, Advanced, Premier) e os benefícios específicos de cada um foge do escopo do Cloud Practitioner — para a prova, basta reconhecer que a APN existe e o papel geral de um parceiro (implementação e consultoria complementares ao suporte direto da AWS).

## `[LABORATÓRIO]` Projeto integrador: juntando o que a trilha já construiu

Ao longo desta trilha, você já criou, isoladamente, boa parte das peças de uma aplicação real: um bucket S3 (módulo 12), uma tabela DynamoDB (módulo 13), uma função Lambda exposta por URL (módulo 14). Este projeto final não pede recursos novos do zero — pede para você **conectar o que já existe** numa arquitetura coerente, a mesma tarefa que qualquer arquitetura real de produção enfrenta: não construir peças isoladas, mas fazê-las conversar.

A arquitetura de referência: um site estático (HTML simples) hospedado num bucket S3 (módulo 12), servido através de uma distribuição CloudFront (módulo 4) para aproveitar cache nas Edge Locations; esse site faz uma chamada JavaScript para a Function URL do Lambda (módulo 14); a função Lambda lê e escreve itens na tabela DynamoDB (módulo 13); e todo o acesso entre essas peças é protegido por políticas de IAM seguindo o princípio do menor privilégio (módulo 3), com CloudWatch (módulo 6) registrando as execuções.

Os passos práticos: primeiro, ajuste o código da função Lambda do módulo 14 para, em vez de só retornar uma mensagem fixa, gravar um item na tabela DynamoDB do módulo 13 a cada chamada (um registro simples, como `{"id": "<timestamp>", "nome": "<nome recebido>"}`), usando o SDK `boto3` já disponível no runtime Python do Lambda por padrão. Segundo, crie um arquivo `index.html` simples com um formulário e uma chamada `fetch()` em JavaScript para a Function URL do módulo 14. Terceiro, envie esse `index.html` para o bucket S3 do módulo 12, e habilite hospedagem de site estático nas propriedades do bucket. Quarto, opcionalmente, crie uma distribuição CloudFront (módulo 4) apontando para esse bucket como origem, para servir o site através da malha de Edge Locations em vez de diretamente do S3.

![Diagrama de arquitetura (desenhado à mão, no papel, ou numa ferramenta simples) representando o fluxo: usuário -> CloudFront -> S3 (site estático) e usuário -> Function URL do Lambda -> DynamoDB](screenshots/16-projeto-final-e-preparacao-certificacao/04-diagrama-arquitetura-projeto-final.png)
> `[PRINT]` Este item não é uma captura do Console — é a única exceção da trilha. Desenhar (à mão ou numa ferramenta simples de diagramação) a arquitetura final montada, com as setas de fluxo entre CloudFront, S3, Lambda e DynamoDB, e salvar como imagem neste caminho. O objetivo é ter um artefato visual próprio do projeto, não uma tela do Console.

`[CUSTO]` Todos os componentes deste projeto (S3, uma distribuição CloudFront de baixo tráfego, uma função Lambda de poucas invocações, uma tabela DynamoDB pequena em modo on-demand) ficam dentro da camada gratuita da AWS para o volume de uso de um projeto de estudo. Ainda assim, ao concluir a trilha, revise o Billing and Cost Management (módulo 1) e o Cost Explorer (acima) uma última vez, e desmonte o que não pretende manter: exclua a distribuição CloudFront, esvazie e exclua o bucket S3, exclua a função Lambda e a tabela DynamoDB, seguindo os mesmos passos de limpeza já praticados em cada módulo original.

## Revisão organizada pelos quatro domínios do exame

| Domínio | Peso | O que revisar, módulo por módulo |
|---|---|---|
| **1. Cloud Concepts** | 24% | Módulo 1 (definição de nuvem, CAPEX/OPEX, benefícios), módulo 2 (infraestrutura global), módulo 5 (Well-Architected, seis pilares) |
| **2. Security and Compliance** | 30% | Módulo 3 inteiro — Shared Responsibility Model, IAM, MFA, criptografia, GuardDuty/Inspector/Macie/Security Hub, Organizations/SCPs |
| **3. Cloud Technology and Services** | 34% | Módulos 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 — o domínio mais amplo, cobrindo rede, compute, containers, storage, banco de dados, serverless e IA/ML |
| **4. Billing, Pricing, and Support** | 12% | Módulo 9 (modelos de compra) e este módulo 16 (ferramentas de billing, planos de suporte) |

Uma boa forma de revisar antes da prova é percorrer, para cada módulo, apenas a seção de checklist de saída e os blocos `[TEORIA]` — eles concentram exatamente o que cada módulo julgou como "exigido pela prova, sem contrapartida visual", o material mais denso de fatos a ter na ponta da língua.

## Simulados e estratégia de prova

Fazer simulados antes da prova real cumpre um papel diferente de estudar conteúdo: ele treina o formato — 65 perguntas, 90 minutos, questões de múltipla escolha e de múltipla resposta — e revela lacunas específicas de conteúdo que a releitura passiva não revela. A própria AWS oferece um exame oficial de prática (pago, mas com o formato mais fiel ao exame real) através do AWS Skill Builder; a plataforma também mantém um conjunto de perguntas de amostra gratuitas.

Durante a prova em si, para questões de múltipla resposta (mais de uma alternativa correta), a interface do exame sempre indica quantas respostas são esperadas — não é preciso adivinhar. Para questões em que duas alternativas parecem plausíveis, volte ao vocabulário exato dos task statements desta trilha: a AWS costuma testar a definição precisa de um termo (como você viu repetidamente nos blocos `[TEORIA]`), então a alternativa que usa a terminologia oficial correta geralmente vence sobre uma que está "quase certa" em espírito, mas erra o termo técnico.

## Próximos passos além do Cloud Practitioner

Ao concluir esta trilha e obter a certificação, dois caminhos naturais se abrem, dependendo do interesse. Para quem quer aprofundar em arquitetura técnica — desenhar sistemas de verdade, não só reconhecer serviços — o próximo passo é a **AWS Certified Solutions Architect Associate (SAA)**, que retoma praticamente todo o vocabulário desta trilha (VPC, EC2, RDS, Lambda, Well-Architected) num nível de profundidade prática muito maior, exigindo desenhar arquiteturas completas, não apenas reconhecê-las. Para quem se interessou especificamente pelo módulo 15 e quer seguir em IA generativa, agentes de IA e aplicações de modelos de fundação, o caminho é a **AWS Certified AI Practitioner (AIF-C01)** — como já visto, uma certificação "fundamentals" irmã desta, não uma continuação dela.

## `[REFERÊNCIA]`

- AWS — Domínio 4 do exame CLF-C02 (Billing, Pricing, and Support): https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain4.html
- AWS — *AWS Cost Management*: https://aws.amazon.com/aws-cost-management/
- AWS — *Compare AWS Support Plans*: https://aws.amazon.com/premiumsupport/plans/
- AWS — *AWS Certified Cloud Practitioner (CLF-C02) Exam Guide* (página raiz, revisão final): https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html
- AWS Skill Builder — *Exam Prep: AWS Certified Cloud Practitioner*: https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials
- AWS — *AWS Certified Solutions Architect – Associate (SAA-C03) Exam Guide*: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html

## Checklist final da trilha

Antes de agendar o exame, confirme que você consegue, sem consultar nenhum módulo:

- [ ] Recitar os quatro domínios do exame e seus pesos (24/30/34/12).
- [ ] Diferenciar Cost Explorer, Pricing Calculator, Budgets e Cost and Usage Report.
- [ ] Listar os cinco planos de suporte da AWS em ordem crescente e o que cada um adiciona.
- [ ] Ter completado o projeto integrador — site estático em S3/CloudFront conectado a uma API Lambda gravando em DynamoDB — e o ter desmontado corretamente ao final.
- [ ] Ter revisado o checklist de saída e os blocos `[TEORIA]` de todos os módulos 01 a 15.
- [ ] Ter feito ao menos um simulado completo, no formato de 65 perguntas em 90 minutos.
- [ ] Saber para qual certificação seguir depois — Solutions Architect Associate ou AI Practitioner — dependendo do seu interesse.
