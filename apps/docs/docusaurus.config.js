// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Fishing Docs',
  tagline: 'Project documentation for Fishing monorepo',
  url: 'http://localhost',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn'
    }
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },
  future: {
    faster: {
      rspackBundler: true
    }
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js'
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css'
        }
      })
    ]
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Fishing Docs'
      }
    }),
  themes: [],
  plugins: [],
  staticDirectories: ['static'],
  customFields: {},
  titleDelimiter: '-',
  trailingSlash: false,
  organizationName: 'fishing',
  projectName: 'docs',
  deploymentBranch: 'gh-pages'
};

module.exports = config;
