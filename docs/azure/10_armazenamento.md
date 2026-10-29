---
id: "10_armazenamento"
title: "Módulo 10 — Armazenamento"
sidebar_label: "10 · Armazenamento"
sidebar_position: 10
---

# Módulo 10 — Armazenamento

> **Objetivo**: dominar a Storage Account e seus serviços (Blob, Files, Queue, Table), escolher redundância e tier de acesso, controlar acesso com RBAC e SAS, e hospedar o front estático do TrilhaShop.
>
> **Pré-requisitos**: módulos 02 (redundância/zonas), 04 e 05 (identidade, segurança).
>
> **Tempo de referência (não prazo)**: uma a duas semanas.
>
> Cobre **Implement and manage storage** (AZ-104) e **Describe Azure storage services** (AZ-900). Guia: https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-104

---

## Um prédio de armazéns, uma conta de condomínio

A **Storage Account** é o "condomínio": ela define o nome único global, a região, a **redundância** e o desempenho; dentro dela moram os serviços:

| Serviço | O que guarda | Analogia |
|---|---|---|
| **Blob** | Objetos/arquivos não estruturados (imagens, backups, logs) | Armazém de caixas |
| **Files** | Compartilhamento de arquivos SMB/NFS | Pasta de rede |
| **Queue** | Mensagens para desacoplar aplicações | Caixa de correio |
| **Table** | Dados NoSQL chave-valor | Planilha simples |
| **Managed Disks** | Discos de VM (conta separada, gerida pelo Azure) | HD da máquina |

Em Blob, o dado fica em **containers** (equivalente a um bucket/pasta de topo) e cada arquivo é um **blob**. Há três tipos: *block* (arquivos comuns), *append* (logs) e *page* (discos).

## Redundância: quantas cópias, onde

| Sigla | Significado | Protege contra |
|---|---|---|
| **LRS** | 3 cópias num datacenter | Falha de disco/rack |
| **ZRS** | 3 cópias em 3 zonas | Queda de datacenter |
| **GRS** | LRS + cópia assíncrona na região par | Desastre regional |
| **GZRS** | ZRS + cópia na região par | Os dois acima |
| **RA-GRS / RA-GZRS** | Acesso de *leitura* à cópia secundária | Leitura durante falha regional |

> `[TEORIA]` Mais redundância = mais durabilidade e mais custo. A cópia secundária (GRS) é assíncrona: pode haver perda dos últimos segundos em um failover. Cobre o tópico de AZ-104 "Configure storage accounts" e AZ-900.

> `[ATENÇÃO]` Nome da storage account: 3–24 caracteres, só minúsculas e números, **único no mundo**. Use `$RANDOM` ou sufixo próprio.

```bash
RG=rg-trilhashop-dev
SA=sttrilhashop$RANDOM
az storage account create -g $RG -n $SA -l brazilsouth \
  --sku Standard_ZRS --kind StorageV2 --min-tls-version TLS1_2 \
  --allow-blob-public-access false

az storage container create --account-name $SA -n imagens --auth-mode login
az storage blob upload --account-name $SA -c imagens -f logo.png -n logo.png --auth-mode login
az storage blob list --account-name $SA -c imagens -o table --auth-mode login
```

`--auth-mode login` usa sua identidade do Entra ID (RBAC), e não a chave da conta. Para isso o seu usuário precisa do role **Storage Blob Data Contributor** (Owner da assinatura **não** basta para os *dados*):

```bash
az role assignment create --assignee $(az ad signed-in-user show --query id -o tsv) \
  --role "Storage Blob Data Contributor" --scope $(az storage account show -g $RG -n $SA --query id -o tsv)
```

## Camadas de acesso: quente a gelado

| Tier | Armazenar | Acessar | Uso |
|---|---|---|---|
| **Hot** | Mais caro | Mais barato | Dados acessados com frequência |
| **Cool** | Mais barato | Mais caro (retenção mín. 30 dias) | Acesso raro |
| **Cold** | Ainda mais barato (mín. 90 dias) | — | Acesso muito raro |
| **Archive** | Barato (mín. 180 dias) | Caro e **leva horas** (reidratação) | Retenção de longo prazo |

Regras de **lifecycle management** movem ou apagam blobs automaticamente pela idade:

```bash
cat > lifecycle.json <<'EOF'
{ "rules": [ { "enabled": true, "name": "arquivar-antigos", "type": "Lifecycle",
  "definition": {
    "filters": { "blobTypes": ["blockBlob"], "prefixMatch": ["imagens/"] },
    "actions": { "baseBlob": {
      "tierToCool": {"daysAfterModificationGreaterThan": 30},
      "tierToArchive": {"daysAfterModificationGreaterThan": 180},
      "delete": {"daysAfterModificationGreaterThan": 730} } } } } ] }
EOF
az storage account management-policy create -g $RG --account-name $SA --policy @lifecycle.json
```

> `[ATENÇÃO]` Antes de mover para *Archive*, lembre que o blob fica **offline**: não dá para ler até reidratar (horas). E apagar antes do tempo mínimo de retenção gera cobrança proporcional.

## Controlando o acesso

1. **RBAC com Entra ID** (recomendado): quem pode ler/gravar *dados*.
2. **SAS (Shared Access Signature)**: um link com permissão, escopo e **prazo** limitados, para dar acesso temporário sem expor a chave da conta.
3. **Chave da conta**: acesso total — evite; desative se possível (`--allow-shared-key-access false`).
4. **Rede**: firewall e Private Endpoint (Módulo 06) restringem *de onde* se acessa.

```bash
# SAS de leitura por 1 hora para um blob, assinada com o Entra ID (user delegation)
EXP=$(date -u -d "+1 hour" +%Y-%m-%dT%H:%MZ)
az storage blob generate-sas --account-name $SA -c imagens -n logo.png \
  --permissions r --expiry $EXP --https-only --as-user --auth-mode login --full-uri
```

![Storage Account no portal, aba Containers com o container imagens e a configuração de redundância ZRS visível](screenshots/10-armazenamento/01-storage-account-containers.png)
> `[PRINT]` Passo a passo para capturar: portal → Storage accounts → a conta → Overview (redundância) e Data storage → Containers.

## Azure Files, AzCopy e Storage Explorer

- **Azure Files**: compartilhamento SMB/NFS montável por VMs (e **Azure File Sync** sincroniza com servidores Windows locais).
- **AzCopy**: ferramenta de linha de comando para copiar grandes volumes: `azcopy copy './pasta' 'https://<conta>.blob.core.windows.net/imagens' --recursive`.
- **Storage Explorer**: app gráfico para navegar nos dados.

```bash
az storage share-rm create -g $RG --storage-account $SA -n compartilhado --quota 10
sudo mkdir -p /mnt/compartilhado
sudo mount -t cifs //$SA.file.core.windows.net/compartilhado /mnt/compartilhado \
  -o vers=3.0,username=$SA,password=$(az storage account keys list -g $RG -n $SA --query "[0].value" -o tsv),dir_mode=0777,file_mode=0777
```

## Site estático no Blob

O Blob serve HTML/CSS/JS direto, sem servidor:

```bash
az storage blob service-properties update --account-name $SA --static-website \
  --index-document index.html --404-document 404.html --auth-mode login
az storage blob upload-batch --account-name $SA -d '$web' -s ./site --auth-mode login
az storage account show -g $RG -n $SA --query "primaryEndpoints.web" -o tsv
```

## Práticas

### Prática isolada

1. Crie a conta (ZRS), um container e envie 3 arquivos.
2. Gere uma SAS de 5 minutos, abra no navegador, espere expirar e confirme o erro `403`.
3. Aplique uma regra de lifecycle e leia-a de volta: `az storage account management-policy show`.
4. Mude o tier de um blob (`az storage blob set-tier --tier Cool`) e confira com `az storage blob show --query properties.blobTier`.

**Limpeza:** `az group delete -n rg-lab-storage --yes --no-wait`.

### Contribuição ao projeto integrador

Publique o front do TrilhaShop: conta `sttrilhashop*`, site estático em `$web` com `index.html` + `404.html`, container `imagens` para fotos de produtos com a regra de lifecycle (Hot → Cool aos 30 dias), e a conta com HTTPS obrigatório, TLS 1.2 e sem acesso público a blobs. O Front Door do Módulo 07 pode ser colocado na frente depois.

`[CUSTO]` Armazenamento é barato (centavos por GB/mês), mas **GRS dobra o custo** e operações/saída de dados cobram à parte.

## Erros comuns nesta fase

- Ser Owner e receber `AuthorizationPermissionMismatch` — falta role de **dados**.
- SAS com validade de anos ou permissões `rwdl` desnecessárias.
- Escolher Archive para dado que será lido toda semana.
- Deixar acesso público de blob ligado "para facilitar".
- Esquecer que nomes de conta são globais.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Queue | Serverless e mensageria — Módulo 12 |
| Redundância e DR | Resiliência — Módulo 15 |
| Tiers/lifecycle | Custos — Módulo 16 |
| SAS, RBAC, Private Endpoint | Módulos 04, 05 e 06 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Storage account overview*: https://learn.microsoft.com/azure/storage/common/storage-account-overview
- Microsoft Learn — *Azure Storage redundancy*: https://learn.microsoft.com/azure/storage/common/storage-redundancy
- Microsoft Learn — *Access tiers*: https://learn.microsoft.com/azure/storage/blobs/access-tiers-overview
- Microsoft Learn — *Lifecycle management*: https://learn.microsoft.com/azure/storage/blobs/lifecycle-management-overview
- Microsoft Learn — *SAS*: https://learn.microsoft.com/azure/storage/common/storage-sas-overview
- Microsoft Learn — *Static website hosting*: https://learn.microsoft.com/azure/storage/blobs/storage-blob-static-website
- AzCopy: https://learn.microsoft.com/azure/storage/common/storage-use-azcopy-v10

**Como aprofundar:** monte uma tabela de decisão própria "qual redundância para cada tipo de dado do TrilhaShop" e compare custo na calculadora.

## Checklist de saída

- [ ] Descrever os serviços da Storage Account e dar um caso de uso para cada.
- [ ] Comparar LRS, ZRS, GRS, GZRS e RA-GRS.
- [ ] Comparar Hot, Cool, Cold e Archive e a reidratação do Archive.
- [ ] Explicar por que ser Owner não dá acesso aos dados do blob.
- [ ] Gerar uma SAS curta e explicar quando usá-la.
- [ ] Criar uma regra de lifecycle.
- [ ] Ter publicado o front estático do TrilhaShop.
