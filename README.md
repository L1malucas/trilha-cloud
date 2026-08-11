# Trilha AWS

Preparação prática para a certificação **AWS Certified Cloud Practitioner (CLF-C02)** — 16 módulos em Markdown, publicados como site com [Docusaurus](https://docusaurus.io/).

Cada módulo abre linkando o domínio oficial do exame ao qual pertence, mistura prosa explicativa com laboratórios reais no Console (com prints do próprio Console intercalados no texto) e marca com tags o que é `[TEORIA]` pura exigida pela prova, `[APROFUNDAMENTO]` além do escopo do Cloud Practitioner, `[ATENÇÃO]` para pegadinhas comuns e `[CUSTO]` para avisos de Free Tier.

Site publicado: https://L1malucas.github.io/trilha-cloud/

## Desenvolvimento local

```bash
npm install
npm run start
```

Abre um servidor local com live reload em `http://localhost:3000`.

## Build

```bash
npm run build
```

Gera o site estático em `build/`.

```bash
npm run serve
```

Serve o build gerado localmente, para conferir antes de publicar.

## Versionamento dos docs

O conteúdo publicado vive em `versioned_docs/version-v1/`, cortado a partir de `docs/` com:

```bash
npm run docusaurus docs:version v1
```

Para editar o conteúdo já publicado, edite diretamente em `versioned_docs/version-v1/` (editar `docs/` só afeta uma futura próxima versão, ainda não publicada no site).

## Deploy

O deploy é automático: a cada push na branch `main`, o workflow `.github/workflows/deploy.yml` builda o site e publica no GitHub Pages via GitHub Actions.
