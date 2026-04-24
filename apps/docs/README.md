# Docs app (Docusaurus 3.10)

This app contains the Docusaurus source for the Fishing monorepo documentation.

Canonical project documentation lives in `apps/docs/docs/*`.

Start from `index.md` (`/` in the running docs app): it provides two role-oriented entry modes:

- **Product** — via `product-start.md` (product/business context, MVP scope, roadmap)
- **Develop** — via `develop-start.md` (architecture, shared code rules, services, delivery execution docs)

- Config: `apps/docs/docusaurus.config.js`
- Sidebar config: `apps/docs/sidebars.js`
- Markdown source: `apps/docs/docs/`
- Build output: `apps/docs/site`

Run via root scripts:

```bash
pnpm docs:install
pnpm docs:serve
pnpm docs:build
```

Run via Docker dev contour:

```bash
pnpm docker:dev
```
