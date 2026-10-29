---
id: "11_armazenamento"
title: "Módulo 11 — Armazenamento"
sidebar_label: "11 · Armazenamento"
sidebar_position: 11
---

# Módulo 11 — Armazenamento

> **Objetivo**: dominar o Cloud Storage — buckets, classes de armazenamento, lifecycle, versionamento, controle de acesso e URLs assinadas — conhecer Persistent Disk e Filestore e hospedar o front estático do TrilhaShop.
>
> **Pré-requisitos**: módulos 02 (multirregião), 04 e 06 (IAM, backend bucket).
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre "Planning and implementing storage" do **Associate Cloud Engineer** e armazenamento do **Cloud Digital Leader**. Referência: https://cloud.google.com/storage/docs

---

## Três tipos de armazenamento

A primeira decisão é o **tipo** de dado e de acesso:

| Tipo | Serviço | Analogia | Uso |
|---|---|---|---|
| **Objeto** | **Cloud Storage** | Armário de caixas etiquetadas | Arquivos não estruturados: imagens, backups, logs, sites estáticos |
| **Bloco** | **Persistent Disk / Hyperdisk** | HD da máquina | Discos de VM e bancos em VM |
| **Arquivo** | **Filestore** | Pasta de rede compartilhada | NFS compartilhado entre VMs/GKE |

O **Cloud Storage** é o mais usado: guarda **objetos** em **buckets**, com durabilidade altíssima (11 noves), acesso por HTTP/API, escala sem limite e cobrança por GB armazenado + operações + saída de dados.

## Buckets: localização e classes

O **nome** do bucket é **globalmente único**. A **localização** é escolhida na criação e **não muda**: **região** (`southamerica-east1`), **dual-region** (duas regiões específicas) ou **multirregião** (`US`, `EU`, `ASIA`). Mais redundância geográfica = mais durabilidade/disponibilidade e custo maior (e residência de dados menos precisa).

As **classes** diferem por preço de armazenar x preço de acessar e **duração mínima**:

| Classe | Acesso | Duração mínima | Uso |
|---|---|---|---|
| **Standard** | Frequente | — | Dados "quentes", sites |
| **Nearline** | ~1 vez/mês | 30 dias | Backups acessados raramente |
| **Coldline** | ~1 vez/trimestre | 90 dias | Recuperação de desastre |
| **Archive** | ~1 vez/ano | 365 dias | Retenção de longo prazo, compliance |

Todas têm **acesso imediato** (milissegundos), diferente de "frios" de outros provedores com horas de espera. Quanto mais fria a classe, **mais barato guardar** e **mais caro ler**.

> `[TEORIA]` Prova: o objeto pode **mudar de classe** sem mudar de bucket. A classe se define por objeto (a do bucket é só o padrão), e o **Autoclass** move objetos automaticamente conforme o padrão de acesso. Apagar antes da duração mínima ainda cobra o mínimo.

```bash
PROJETO=$(gcloud config get project)
BUCKET=trilhashop-site-$RANDOM

gcloud storage buckets create gs://$BUCKET --location=southamerica-east1 \
  --default-storage-class=STANDARD --uniform-bucket-level-access --public-access-prevention \
  --labels=projeto=trilhashop

gcloud storage cp logo.png gs://$BUCKET/imagens/logo.png
gcloud storage cp -r ./site gs://$BUCKET/
gcloud storage ls gs://$BUCKET/** --long
gcloud storage objects describe gs://$BUCKET/imagens/logo.png --format="yaml(name,storageClass,size,updated)"
gcloud storage objects update gs://$BUCKET/imagens/logo.png --storage-class=NEARLINE
gcloud storage du -s gs://$BUCKET
```

## Controle de acesso

Três mecanismos, e a escolha importa:

1. **IAM** (recomendado): roles como `roles/storage.objectViewer`, `objectAdmin`. Com **uniform bucket-level access**, **só** o IAM controla o acesso (as ACLs antigas são desativadas).
2. **ACLs** (legado): permissões por objeto; só para casos específicos.
3. **URLs assinadas (signed URLs)**: um link com **permissão e prazo** limitados para quem não tem conta Google.

```bash
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:sa-trilhashop-api@$PROJETO.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Dar leitura pública (APENAS para o bucket do site estático)
gcloud storage buckets add-iam-policy-binding gs://$BUCKET --member=allUsers --role=roles/storage.objectViewer

# URL assinada por 10 minutos (usando impersonação de uma SA com permissão)
gcloud storage sign-url gs://$BUCKET/imagens/logo.png --duration=10m \
  --impersonate-service-account=sa-trilhashop-api@$PROJETO.iam.gserviceaccount.com
```

> `[ATENÇÃO]` Buckets públicos por engano são uma das maiores causas de vazamento de dados. Mantenha **`--public-access-prevention`** ativado e **uniform bucket-level access** em tudo que não for deliberadamente público. A Org Policy `constraints/storage.publicAccessPrevention` impõe isso na organização (Módulo 03).

Para o site estático público, você *desativa* a prevenção só nesse bucket e documenta por quê.

![Console do Cloud Storage mostrando o bucket com localização southamerica-east1, classe Standard e o acesso público desativado](screenshots/11-armazenamento/01-bucket-configuracao.png)
> `[PRINT]` Passo a passo para capturar: Console → Cloud Storage → Buckets → o bucket → aba Configuração. Capturar localização, classe e prevenção de acesso público.

## Versionamento, retenção e lifecycle

- **Versionamento**: cada alteração/exclusão cria uma **versão** (a anterior fica "noncurrent"); protege contra apagar/sobrescrever por engano.
- **Retention policy / Bucket Lock**: impede apagar antes de um prazo (compliance, WORM).
- **Soft delete**: objetos apagados ficam recuperáveis por um período (padrão de 7 dias).
- **Lifecycle**: regras automáticas por idade/condição — mover de classe ou apagar.

```bash
gcloud storage buckets update gs://$BUCKET --versioning

cat > lifecycle.json <<'EOF'
{ "rule": [
  { "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
    "condition": {"age": 30, "matchesPrefix": ["imagens/"]} },
  { "action": {"type": "SetStorageClass", "storageClass": "ARCHIVE"},
    "condition": {"age": 365} },
  { "action": {"type": "Delete"},
    "condition": {"numNewerVersions": 3, "isLive": false} } ] }
EOF
gcloud storage buckets update gs://$BUCKET --lifecycle-file=lifecycle.json
gcloud storage buckets describe gs://$BUCKET --format="yaml(lifecycle_config,versioning)"
gcloud storage ls --all-versions gs://$BUCKET/imagens/logo.png
```

## Site estático e CDN

O bucket serve HTML/CSS/JS direto, sem servidor. Configure página principal/404 e coloque o **Cloud CDN** na frente (Módulo 06):

```bash
gcloud storage buckets update gs://$BUCKET --web-main-page-suffix=index.html --web-error-page=404.html
gcloud storage cp -r ./site/* gs://$BUCKET/
echo "https://storage.googleapis.com/$BUCKET/index.html"
# Para um domínio próprio com HTTPS: backend bucket + Application LB (Módulo 06)
gcloud compute backend-buckets create bb-site --gcs-bucket-name=$BUCKET --enable-cdn
```

## Transferência e sincronização

```bash
gcloud storage rsync ./site gs://$BUCKET/site --recursive --delete-unmatched-destination-objects
gcloud storage cp gs://origem/obj gs://destino/obj           # entre buckets (sem baixar)
```

Para grandes volumes: **Storage Transfer Service** (de S3, Azure Blob, on-premises ou entre buckets, agendado) e **Transfer Appliance** (dispositivo físico para petabytes).

## Persistent Disk e Filestore

- **Persistent Disk/Hyperdisk**: armazenamento em bloco para VMs (Módulo 08) — zonal ou regional; snapshots e redimensionamento a quente.
- **Filestore**: NFS gerenciado (tiers Basic, Zonal, Regional/Enterprise) para cargas que precisam de sistema de arquivos compartilhado (CMS, renderização, GKE com `ReadWriteMany`).

```bash
gcloud services enable file.googleapis.com
gcloud filestore instances create fs-trilhashop --zone=southamerica-east1-a --tier=BASIC_HDD \
  --file-share=name=dados,capacity=1TB --network=name=vpc-trilhashop
# Monte numa VM:  sudo mount <IP-DO-FILESTORE>:/dados /mnt/dados
```

> `[TEORIA]` Escolha: **objeto** (Cloud Storage) para arquivos estáticos, backups e data lakes; **bloco** (Persistent Disk) para o SO/dados de uma VM; **arquivo** (Filestore) quando várias máquinas precisam do **mesmo diretório**.

## Práticas

### Prática isolada

1. Crie um bucket Standard na região de São Paulo com acesso uniforme e prevenção de acesso público.
2. Envie 3 arquivos, troque a classe de um deles para Nearline e confira com `objects describe`.
3. Ative versionamento, sobrescreva um objeto e liste as versões; recupere a anterior.
4. Gere uma signed URL de 5 minutos, abra no navegador, espere expirar e confirme o `403`.
5. Aplique um lifecycle e leia-o de volta.

**Limpeza:** `gcloud storage rm -r gs://$BUCKET` (inclui versões) e apague discos/Filestore do laboratório.

### Contribuição ao projeto integrador

Publique o front do TrilhaShop: bucket `trilhashop-site-*` com `index.html` e `404.html` (acesso público **somente** a este bucket, documentado), um bucket **separado e privado** `trilhashop-imagens-*` para as fotos de produtos (acesso só pela SA da API) com lifecycle (Standard → Nearline aos 30 dias) e versionamento. O CDN/LB do Módulo 06 pode ser colocado na frente do site.

`[CUSTO]` Armazenamento é barato (centavos por GB/mês); **saída de dados (egress)**, operações e a recuperação de classes frias cobram. Dual/multirregião custa mais. O Always Free inclui uma quantidade mensal de Standard em regiões específicas dos EUA.

## Erros comuns nesta fase

- Deixar bucket público sem intenção.
- Esquecer que a localização do bucket não pode ser alterada.
- Usar Archive para dado lido toda semana (custos de leitura e mínimo de 365 dias).
- Misturar ACLs e IAM sem uniform access.
- Signed URL com validade enorme.
- Esquecer o versionamento e perder dados ao sobrescrever.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Backend bucket e CDN | Load Balancing — Módulo 06 |
| Eventos de Storage | Serverless — Módulo 10 |
| Storage como data lake | BigQuery — Módulo 13 |
| Classes e lifecycle | Custos — Módulo 16 |
| Blob Storage no Azure | Azure, Módulo 10 |

## `[REFERÊNCIA]`

- Google Cloud — *Cloud Storage*: https://cloud.google.com/storage/docs
- Google Cloud — *Storage classes*: https://cloud.google.com/storage/docs/storage-classes
- Google Cloud — *Object Lifecycle Management*: https://cloud.google.com/storage/docs/lifecycle
- Google Cloud — *Uniform bucket-level access*: https://cloud.google.com/storage/docs/uniform-bucket-level-access
- Google Cloud — *Signed URLs*: https://cloud.google.com/storage/docs/access-control/signed-urls
- Google Cloud — *Hosting a static website*: https://cloud.google.com/storage/docs/hosting-static-website
- Google Cloud — *Persistent Disk* e *Filestore*: https://cloud.google.com/compute/docs/disks · https://cloud.google.com/filestore/docs

**Como aprofundar:** estude *Autoclass*, *Storage Transfer Service* e o *Storage Insights*; e compare custo entre classes na Pricing Calculator.

## Checklist de saída

- [ ] Diferenciar armazenamento de objeto, bloco e arquivo e escolher o serviço certo.
- [ ] Comparar Standard, Nearline, Coldline e Archive e as durações mínimas.
- [ ] Explicar localização do bucket (região, dual-region, multirregião) e que não muda.
- [ ] Controlar acesso com IAM (uniform), e explicar signed URLs.
- [ ] Usar versionamento, retenção e regras de lifecycle.
- [ ] Hospedar um site estático e explicar os riscos de bucket público.
- [ ] Ter publicado o front e o bucket de imagens do TrilhaShop.
