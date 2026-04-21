# Fishing monorepo

MVP scaffold for a fishing platform with Expo mobile, Next web/admin, Nest API, Prisma/Postgres and shared domain packages.

## Run via Docker Compose

```bash
docker compose up --build
```

Map provider env (web):

```bash
export NEXT_PUBLIC_MAP_PROVIDER=yandex
export NEXT_PUBLIC_YANDEX_MAPS_API_KEY=<your-yandex-api-key>
```

> In docker-compose, `apps/web/.env` is loaded via `env_file`, so this key can be stored there.

Services:

- Web: http://localhost:3010
- Admin: http://localhost:3012
- API: http://localhost:3001
- Docs: http://localhost:8000
- Postgres: localhost:5433
- Expo (mobile): ports 8081, 19000, 19001, 19002

## LAN links

For devices in the same local network (replace IP with your host IP):

- Web: http://192.168.1.110:3010
- Admin: http://192.168.1.110:3012
- API: http://192.168.1.110:3001
- Docs: http://192.168.1.110:8000
- Expo: http://192.168.1.110:8081

## Runtime notes (current)

- API has permissive CORS headers enabled for MVP (`Access-Control-Allow-Origin: *`).
- Web resolves API base URL from the current browser host (`<current-host>:3001`) for LAN compatibility.
- Web map uses provider adapter (`yandex`/`google`); MVP provider is `yandex`.
- Web map works by click on any coordinate (no predefined points).
- Forecast is calculated for 7 days after coordinate selection.
- During forecast refresh after a new map click, previous forecast data is kept visible until new data is ready (no hard reset flicker).
- Selected coordinate is stored in URL query params (`?lat=...&lng=...`) for sharing.
- URL updates preserve current scroll position to avoid page jump during coordinate changes.
- Web UI has theme switcher with modes: `light`, `dark`, `system` (default = `system`).
- Web UI has locale switcher with modes: `auto`, `ru`, `en` (default = `auto`, based on browser locale).
- Runtime info block (`API: /forecast/calculate`, `Base URL`) is shown globally on all routes in non-production mode.
- Map UI includes “My location” action (uses browser geolocation API).
- Geolocation requires secure context (`https://...`) or `http://localhost`; plain LAN `http://192.168.x.x` may be blocked by browser policy.
- Waterbody type attempts to resolve from Yandex geocode (`kind: hydro`) with fallback to heuristic pattern if unavailable.
- Expo mobile entrypoint in monorepo uses `apps/mobile/index.js` and `metro.config.js` with workspace watch folders and symlink support.

## Current web behavior (MVP)

1. User opens map and clicks any coordinate.
2. App updates URL with `lat/lng` and requests 7-day forecast.
3. Right panel shows day list and detailed summary for selected day.
4. Day details include explanation, weather snapshot, waterbody type, and factor impacts.
5. Factor impact rows can be expanded to show detailed explanation for each weight/factor.

## Shared code strategy

We use layered sharing:

- `packages/domain-*`, `packages/shared-zod`, `packages/api-client` - full sharing across apps.
- `packages/shared-ui` - cross-platform UI primitives for both mobile and web.
- app screens/routes stay platform-specific (`apps/web`, `apps/mobile`) while reusing shared blocks.

Detailed roadmap: `apps/docs/docs/shared-code-plan.md`.

## Documentation viewer (Docusaurus 3.10)

The repository uses Docusaurus 3.10 for local Markdown docs browsing from `apps/docs/docs`.
Docusaurus source lives in `apps/docs` (`docusaurus.config.js`, `sidebars.js`), build output is generated into `apps/docs/site`.

Install docs dependencies:

```bash
pnpm docs:install
```

Run docs locally:

```bash
pnpm docs:serve
```

Build docs:

```bash
pnpm docs:build
```
