// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const GITHUB_USER = 'L1malucas';
const REPO_NAME = 'trilha-cloud';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Trilha AWS',
  tagline: 'Preparação prática para a AWS Certified Cloud Practitioner (CLF-C02)',
  favicon: 'img/favicon.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: `https://${GITHUB_USER}.github.io`,
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: `/${REPO_NAME}/`,

  // GitHub pages deployment config.
  organizationName: GITHUB_USER, // Usually your GitHub org/user name.
  projectName: REPO_NAME, // Usually your repo name.

  onBrokenLinks: 'throw',

  // Os módulos são Markdown puro (com blocos de código YAML/Python/JSON,
  // tabelas e `<placeholders>` em prosa, ex.: "http://<ip-publico>") — não
  // foram escritos para MDX/JSX. 'detect' mantém arquivos .md como
  // Commonmark tradicional, evitando que esses `<...>` sejam interpretados
  // como tags JSX.
  markdown: {
    format: 'detect',
    hooks: {
      // Os 62 prints do Console referenciados pelos módulos ainda não
      // foram capturados (ficam para um agente dedicado rodar depois,
      // seguindo as instruções `[PRINT]` de cada módulo) — os links de
      // imagem existem, os arquivos ainda não. 'warn' deixa o build
      // passar mesmo assim; assim que os PNGs forem adicionados em
      // versioned_docs/version-v1/screenshots/, eles resolvem sozinhos.
      onBrokenMarkdownImages: 'warn',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: `https://github.com/${GITHUB_USER}/${REPO_NAME}/tree/main/docs/`,
          // A v1 acabou de ser cortada a partir de docs/ — manter docs/
          // como uma entrada "Next" separada só duplicaria a v1 no
          // dropdown sem nenhum conteúdo novo ainda.
          includeCurrentVersion: false,
          versions: {
            v1: {
              label: 'v1 — AWS',
              banner: 'none',
            },
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Trilha AWS',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Trilha AWS',
          },
          {
            type: 'docsVersionDropdown',
            position: 'left',
          },
          {
            href: 'https://l1malucas.github.io/trilha-jovem-aprendiz/',
            label: 'Jovem Aprendiz',
            position: 'left',
          },
          {
            href: `https://github.com/${GITHUB_USER}/${REPO_NAME}`,
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Trilha',
            items: [
              {
                label: 'Início',
                to: '/',
              },
            ],
          },
          {
            title: 'Mais',
            items: [
              {
                label: 'GitHub',
                href: `https://github.com/${GITHUB_USER}/${REPO_NAME}`,
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Trilha AWS. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
