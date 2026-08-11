---
id: 00_indice
title: "Trilha de Estudo — AWS Cloud Practitioner"
sidebar_position: 0
slug: /
sidebar_label: "Início"
---

# Trilha de Estudo — AWS Cloud Practitioner

> Uma apostila, não uma lista de referência. Cada módulo assume que você não sabe nada do assunto e constrói o raciocínio até você saber operar o serviço com entendimento, não por decoreba.
> Preparação prática para a certificação **AWS Certified Cloud Practitioner (CLF-C02)**, apoiada em laboratórios reais no AWS Free Tier.
> Saída: um arquivo `.md` por módulo. Este arquivo é o índice, o mapa e o manual de uso da trilha.

---

## Por que esta trilha existe

A AWS tem uma quantidade de documentação, cursos e certificações grande o suficiente para ser paralisante. Esta trilha resolve isso escolhendo um caminho só: os catorze primeiros tópicos abaixo formam, na prática, o currículo do **AWS Academy Cloud Foundations** — o programa oficial que a própria AWS recomenda como porta de entrada, e que está por trás de cursos corporativos como o da Capgemini. Não é um recorte arbitrário: é o consenso do que alguém precisa saber antes de tocar em qualquer arquitetura AWS séria, e é também, quase módulo a módulo, o conteúdo cobrado no exame CLF-C02. A eles se soma um módulo 15 sobre IA e Machine Learning, cobrindo exatamente o que o exame cobra sobre o assunto — nem mais, nem menos.

A trilha termina no módulo 16 com um projeto que amarra tudo numa arquitetura só e com uma revisão organizada pelos domínios oficiais do exame. Se em algum momento você quiser ir além do Cloud Practitioner, os módulos marcam claramente onde o conteúdo já está "vazando" para o nível seguinte, o **Solutions Architect Associate** — assim você sabe o que é fundação e o que é aprofundamento. Já o assunto de IA generativa e agentes de IA (o que a AWS chama de *agentic AI*) fica de fora de propósito: é conteúdo de uma certificação irmã e independente, a **AWS Certified AI Practitioner (AIF-C01)**, e não faz parte do escopo do Cloud Practitioner. O módulo 15 marca exatamente essa fronteira.

---

## Como usar

Leia os módulos em ordem. Diferente de uma trilha de especialização com ramificações, esta é linear: o módulo 4 assume que você entende o módulo 2, o módulo 13 assume o módulo 9, e assim por diante — cada apostila abre lembrando o que ela herda do módulo anterior e fecha apontando para onde o assunto continua. Pular módulo aqui costuma custar caro lá na frente, porque a AWS é uma disciplina em que os serviços se combinam (uma decisão de banco de dados no módulo 13 só faz sentido se você já entendeu VPC no módulo 4).

Cada módulo termina com uma seção **Práticas**, dividida em duas partes que servem propósitos diferentes. A **prática isolada** é um exercício autocontido daquele módulo especificamente — cria (quando aplicável) e destrói dentro do próprio módulo, sem deixar nada pendente. A **contribuição ao projeto integrador** é uma peça real e permanente de um projeto único, o **TrilhaShop**, construído aos poucos ao longo dos módulos 3 a 15 — não uma metáfora, um recurso de verdade, que o módulo seguinte reaproveita. A ideia é que você tenha uma conta AWS aberta ao lado enquanto lê, e execute os passos conforme chega neles, não que leia tudo primeiro e pratique depois.

---

## O projeto integrador: TrilhaShop

A partir do módulo 3, esta trilha constrói, em paralelo à teoria, uma loja virtual fictícia chamada **TrilhaShop** — não como narrativa, como infraestrutura real que cresce módulo a módulo: o IAM do módulo 3 protege a VPC do módulo 4; o ALB e o Auto Scaling Group do módulo 6 rodam dentro dessa VPC; o EC2 do módulo 9 é o que o ASG efetivamente gerencia; o container do módulo 10 é um segundo serviço na mesma rede; o RDS e o DynamoDB do módulo 13 são os bancos que a API do módulo 14 usa; e assim por diante, até o módulo 16 amarrar tudo numa arquitetura só e desmontar o que foi construído.

Essa escolha — construir de verdade, não só descrever — tem uma consequência que precisa ficar explícita desde já: alguns dos recursos que o TrilhaShop usa **cobram por hora enquanto existem**, independentemente de você estar estudando naquele momento ou não. Se você leva semanas ou meses para terminar a trilha, precisa pausar esses recursos entre uma sessão de estudo e outra — não é opcional, é parte do próprio aprendizado de operar AWS com responsabilidade financeira.

### Pausando o projeto integrador entre sessões de estudo

| Recurso | Cobra parado/ocioso? | O que fazer entre sessões |
|---|---|---|
| NAT Gateway (módulo 4) | Sim, por hora, mesmo sem tráfego | Excluir ao final da sessão; recriar (leva poucos minutos) quando for testar conectividade privada de novo |
| Application Load Balancer (módulo 6) | Sim, por hora | Não existe "pausar" um ALB — excluir e recriar quando for retomar essa parte |
| Auto Scaling Group / instâncias EC2 (módulos 6, 9) | As instâncias sim, o ASG em si não | Reduzir `desired capacity` para 0 (o ASG encerra as instâncias sozinho); ou `stop` direto nas instâncias se não usar ASG |
| RDS (módulo 13) | Sim, por hora | `Stop` a instância — atenção: a AWS reinicia automaticamente uma instância RDS parada depois de 7 dias, então em pausas mais longas é preciso parar de novo |
| ECS/Fargate — task/service (módulo 10) | Sim, enquanto a task roda | Reduzir o `desired count` do service para 0, ou parar a task diretamente |
| Route 53 — hosted zone e health check (módulo 11) | Sim, mas **valor fixo mensal**, não por hora — pausar não ajuda | Só reduz custo se excluído e recriado depois (leva menos de um minuto) |
| VPC, subnets, route tables, Security Groups (módulo 4) | Não | Deixar como está |
| Tabelas DynamoDB em modo on-demand (módulo 13) | Não, cobra só por uso real | Deixar como está |
| Bucket S3 (módulo 12) | Não, cobra só pelo volume armazenado (baixo nesta escala) | Deixar como está |
| Funções Lambda (módulo 14, 15) | Não, cobra só por invocação | Deixar como está |
| Usuários, grupos, roles e policies do IAM (módulo 3) | Não | Deixar como está |

Cada seção de "Contribuição ao projeto integrador", nos módulos seguintes, termina com uma lembrança curta apontando de volta para esta tabela — vale marcá-la para consulta rápida. O módulo 16 fecha a trilha com o roteiro completo de desmontagem de tudo, na ordem certa, para quem termina os estudos e não vai mais usar o TrilhaShop.

---

## Convenções (badges)

Sem emoji — os marcadores abaixo aparecem em texto, sempre entre colchetes, no meio da prosa:

| Badge | Significado |
|---|---|
| `[LABORATÓRIO]` | Roteiro prático executável no Console e/ou AWS CLI/CloudShell. |
| `[TEORIA]` | Teoria pura exigida pela prova — definição, comparação, número a decorar — sem uma tela de Console correspondente para ilustrar. É para saber de cabeça, mesmo tendo praticado tudo o resto. |
| `[CUSTO]` | Aviso sobre o que é coberto pelo Free Tier e como evitar cobrança inesperada (geralmente, destruir o recurso ao final do laboratório). |
| `[ATENÇÃO]` | Erro comum de uso real ou pegadinha típica de prova. |
| `[APROFUNDAMENTO]` | Conteúdo que ultrapassa o escopo do Cloud Practitioner e entra em nível Solutions Architect Associate. Opcional na primeira leitura. |
| `[REFERÊNCIA]` | Fontes oficiais e curadas — documentação AWS, AWS Skill Builder, whitepapers. Sem blogpost genérico, sem fórum. |
| `[PRINT]` | Instrução de captura de tela — ver a seção "Prints do Console" logo abaixo. |

O princípio por trás dessas duas últimas tags resume o objetivo da trilha inteira: o foco central é, ao mesmo tempo, **passar na prova** e **ganhar experiência real de uso do Console**. Um conceito só vira `[TEORIA]` quando genuinamente não existe tela que o ilustre — todo o resto do texto é construído para ser mostrado, não só descrito.

---

## Prints do Console: como funcionam nesta trilha

Esta trilha não é só teoria com CLI de apoio — é mão na massa de verdade. Sempre que um conceito tiver uma tela real do AWS Management Console que o ilustre, o módulo mostra essa tela em vez de só descrevê-la em texto. Os prints ainda não existem neste momento (os módulos são escritos primeiro, o texto e o roteiro de captura vêm juntos); um agente separado, dedicado a navegar o Console e capturar cada imagem, é executado depois, usando exatamente as instruções deixadas em cada bloco `[PRINT]`.

Cada módulo tem sua própria pasta de imagens: `screenshots/<NN>-<slug-do-módulo>/`, por exemplo `screenshots/02-infraestrutura-global-aws/`. Dentro dela, os arquivos são numerados na ordem em que aparecem no texto — `01-<descrição-curta>.png`, `02-<descrição-curta>.png`, e assim por diante. Sempre que o texto chega num ponto que precisa de print, aparecem duas linhas juntas:

```
![<legenda curta do que a imagem mostra>](screenshots/<NN>-<slug-do-módulo>/<NN>-<descrição-curta>.png)
> [PRINT] Passo a passo para capturar: <instruções exatas — em qual tela, depois de qual clique, com qual estado visível>.
```

A primeira linha já é a tag de imagem markdown, apontando para o caminho final do arquivo — até o agente de captura rodar, ela aparece como imagem quebrada, o que é esperado nesta fase. A segunda linha, em bloco de citação com a tag `[PRINT]`, é a instrução operacional para quem for capturar: precisa ser autossuficiente, sem depender de ter lido o resto do módulo, porque a captura pode ser feita fora de ordem.

---

## Antes do módulo 1: preparar a conta

Isto é feito uma única vez, e nenhum módulo vai repetir estas instruções:

1. Criar uma conta AWS no nível Free Tier (cartão de crédito é exigido no cadastro, mas os limites do Free Tier evitam cobrança se você respeitar os avisos `[CUSTO]` de cada laboratório).
2. Ativar MFA (autenticação multifator) no usuário **root** da conta — é o usuário mais privilegiado que existe e não deve ser usado no dia a dia.
3. Criar um usuário IAM com permissões administrativas para uso cotidiano, e passar a usar esse usuário em vez do root a partir daqui (o porquê disso é explicado com profundidade no módulo 3, sobre segurança).
4. Configurar um *billing alarm* no CloudWatch para ser avisado por e-mail caso a fatura estimada ultrapasse um valor pequeno (por exemplo, US$ 1) — é a rede de segurança contra um laboratório mal encerrado.

`[REFERÊNCIA]` AWS — *Set up MFA for the AWS account root user*: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user.html#id_root-user_manage_mfa
`[REFERÊNCIA]` AWS — *Creating your first IAM admin user and user group*: https://docs.aws.amazon.com/IAM/latest/UserGuide/getting-started_create-admin-group.html
`[REFERÊNCIA]` AWS — *Creating a billing alarm to monitor your estimated charges*: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html

---

## Sumário dos módulos

**[01 — Visão Geral dos Conceitos de Nuvem](01_visao_geral_conceitos_nuvem.md)** — *domínio: Cloud Concepts*
O que é computação em nuvem e o que ela substitui; modelos de implantação (pública, privada, híbrida); modelos de serviço (IaaS, PaaS, SaaS) e onde a responsabilidade do usuário começa e termina em cada um; a virada econômica de CAPEX para OPEX; os benefícios centrais da AWS (elasticidade, agilidade, alcance global, economia de escala); primeira aproximação ao AWS Well-Architected Framework.

**[02 — Infraestrutura Global da AWS](02_infraestrutura_global_aws.md)** — *domínio: Cloud Concepts*
Como a AWS organiza fisicamente o mundo: Regions, Availability Zones e Edge Locations; como a escolha de região afeta latência, custo e conformidade legal; como múltiplas AZs viabilizam alta disponibilidade; visão geral de Local Zones, Wavelength e Outposts; o Service Health Dashboard.

**[03 — Segurança na Nuvem AWS](03_seguranca_na_nuvem_aws.md)** — *domínio: Security and Compliance*
O Shared Responsibility Model; IAM em profundidade (users, groups, roles, policies) e o princípio do menor privilégio; MFA e proteção da conta root; AWS Organizations e Service Control Policies; panorama de GuardDuty, Inspector, Macie e Security Hub; criptografia em repouso e em trânsito e o papel do KMS; AWS Artifact e compliance.

**[04 — Redes e Entrega de Conteúdo](04_redes_e_entrega_de_conteudo.md)** — *domínio: Cloud Technology and Services*
VPC — subnets públicas e privadas, route tables, Internet Gateway, NAT Gateway; Security Groups vs. Network ACLs; Route 53 e DNS; CloudFront e CDN/edge caching; VPN e Direct Connect; introdução ao API Gateway.

**[05 — Arquitetura de Nuvem](05_arquitetura_de_nuvem.md)** — *domínios: Cloud Concepts e Cloud Technology and Services*
O AWS Well-Architected Framework por completo — os seis pilares; princípios de design que atravessam todos os pilares (desacoplamento, redundância, elasticidade, design para falha); padrões arquiteturais recorrentes (multi-AZ, multi-region, arquiteturas desacopladas com filas).

**[06 — Auto Scaling e Monitoramento](06_auto_scaling_e_monitoramento.md)** — *domínio: Cloud Technology and Services*
Elastic Load Balancing (Application, Network e Classic Load Balancer); Auto Scaling Groups e suas políticas; CloudWatch como sistema de observabilidade; a diferença entre CloudWatch e CloudTrail.

**[07 — AWS CLI e CloudShell](07_aws_cli_e_cloudshell.md)** — *domínio: Cloud Technology and Services*
Por que operar por linha de comando é diferente de clicar no Console; instalação, configuração e profiles do AWS CLI; estrutura de um comando; AWS CloudShell; boas práticas e riscos de Access Keys.

**[08 — CloudFormation](08_cloudformation.md)** — *domínio: Cloud Technology and Services*
Infrastructure as Code; anatomia de um template (Resources, Parameters, Outputs, Mappings); ciclo de vida de uma stack e change sets; drift detection; CloudFormation frente a Terraform.

**[09 — Amazon Elastic Compute Cloud](09_amazon_ec2.md)** — *domínio: Cloud Technology and Services*
Instâncias EC2 e AMIs; famílias de tipos de instância; modelos de compra (On-Demand, Reserved, Spot, Savings Plans); EBS; user data; composição do preço de uma instância.

**[10 — Introdução ao AWS Container Services e Networking](10_aws_container_services_networking.md)** — *domínio: Cloud Technology and Services*
Containers frente a VMs; conceitos básicos de Docker; ECS e a escolha entre EC2 e Fargate; ECR; panorama do EKS; rede de containers.

**[11 — Projetando para Uptime – Network](11_projetando_para_uptime_network.md)** — *domínio: Cloud Technology and Services*
Redundância multi-AZ na camada de rede; failover de DNS com Route 53; o papel do Load Balancer na disponibilidade; as quatro estratégias clássicas de disaster recovery e seu trade-off custo vs. RTO/RPO.

**[12 — Opções de Armazenamento](12_opcoes_de_armazenamento.md)** — *domínio: Cloud Technology and Services*
S3 — buckets, classes de armazenamento, versionamento e lifecycle policies; a diferença de propósito entre S3, EBS e EFS; Storage Gateway e AWS Backup.

**[13 — Opções de Banco de Dados](13_opcoes_de_banco_de_dados.md)** — *domínio: Cloud Technology and Services*
Relacional vs. não-relacional; RDS (engines, Multi-AZ, read replicas); Aurora; DynamoDB; ElastiCache; guia de decisão de qual banco usar em qual problema.

**[14 — Computação Baseada em Funções (Lambda)](14_computacao_baseada_em_funcoes_lambda.md)** — *domínio: Cloud Technology and Services*
Serverless como remoção da gestão de servidor; Lambda — triggers, runtimes, limites, cold start; modelo de precificação; o padrão API Gateway + Lambda + DynamoDB; quando escolher Lambda frente a EC2 ou containers.

**[15 — IA e Machine Learning na AWS](15_ia_e_machine_learning_na_aws.md)** — *domínio: Cloud Technology and Services*
O que o exame realmente cobra sobre IA/ML (Task Statement 3.7): reconhecer o catálogo de serviços de IA/ML da AWS e para que problema cada um existe — Amazon SageMaker (treinar e servir modelos próprios), Rekognition (visão computacional), Comprehend (processamento de linguagem natural), Textract (extração de texto de documentos), Lex (chatbots e assistentes de voz), Kendra (busca inteligente); uma primeira aproximação ao Amazon Bedrock e ao conceito de modelo de fundação, no nível superficial que a prova exige; onde termina o escopo do Cloud Practitioner e começa o da AWS Certified AI Practitioner — inclusive o que é *agentic AI* e por que esse assunto pertence à outra trilha.

**[16 — Projeto Final e Preparação para Certificação](16_projeto_final_e_preparacao_certificacao.md)** — *síntese dos quatro domínios*
Projeto integrador amarrando vários serviços numa arquitetura só; revisão organizada pelos domínios do exame CLF-C02; simulados e estratégia de prova; próximos passos para quem quiser seguir ao Solutions Architect Associate ou ao AI Practitioner.

Todos os dezesseis módulos estão escritos. Os prints do Console referenciados em cada um ainda precisam ser capturados — ver a seção "Prints do Console" acima.

---

## Módulos por domínio do exame CLF-C02

| Domínio | Peso no exame | Módulos principais |
|---|---|---|
| Cloud Concepts | 24% | 01, 02, 05 |
| Security and Compliance | 30% | 03 |
| Cloud Technology and Services | 34% | 04, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15 |
| Billing, Pricing and Support | 12% | 09 (modelos de compra), 16 (revisão consolidada) |

Um ponto importante de atualidade: esta trilha é construída sobre o **CLF-C02**, a versão vigente do exame. A versão anterior, **CLF-C01**, foi aposentada pela AWS em 18 de setembro de 2023 — se você encontrar por aí um material de estudo que fala em CLF-C01, está desatualizado. O CLF-C02 trouxe pesos de domínio recalibrados, mais ênfase em segurança e governança, e passou a cobrar explicitamente reconhecimento de serviços de IA/ML (por isso o módulo 15 desta trilha).

Cada módulo desta trilha abre citando e linkando diretamente a página do domínio do exame ao qual ele pertence, em vez de deixar essa referência só para o final. As quatro páginas de domínio, para consulta central:

| Domínio | Link direto |
|---|---|
| Domínio 1 — Cloud Concepts | https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain1.html |
| Domínio 2 — Security and Compliance | https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain2.html |
| Domínio 3 — Cloud Technology and Services | https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain3.html |
| Domínio 4 — Billing, Pricing, and Support | https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain4.html |

`[REFERÊNCIA]` AWS — *AWS Certified Cloud Practitioner (CLF-C02) Exam Guide* (página raiz, com o índice completo do conteúdo do exame): https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html
`[REFERÊNCIA]` AWS Skill Builder — *AWS Cloud Practitioner Essentials* (curso oficial gratuito): https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials
`[REFERÊNCIA]` AWS — *AWS Well-Architected Framework*: https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html
`[REFERÊNCIA]` AWS — *AWS Free Tier*: https://aws.amazon.com/free/
`[REFERÊNCIA]` AWS — *AWS Certified AI Practitioner (AIF-C01) Exam Guide* (a certificação-irmã que cobre IA generativa e agentic AI em profundidade): https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html

---

## Próximo passo

Prepare a conta seguindo a seção acima e comece por `01_visao_geral_conceitos_nuvem.md`.
