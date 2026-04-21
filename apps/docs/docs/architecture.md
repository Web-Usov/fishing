---
title: Architecture
sidebar_position: 2
---

# Architecture

- apps/api: NestJS HTTP API for forecast and future map/favorites/auth modules
- apps/mobile: Expo mobile shell for map-first MVP
- apps/web: public web app with real Yandex map, 7-day forecast flow, URL-state and theme system
- apps/admin: admin shell
- packages/domain-bite-forecast: pure forecast engine with tests
- packages/shared-zod: shared contracts
- packages/domain-geo: geo primitives and helpers
- packages/shared-ui: cross-platform UI primitives for web + mobile
- apps/web map layer: provider adapter pattern (`yandex`/`google`) with MVP provider `yandex`
- apps/web locale layer: app-level locale provider with dictionary-based translations (`ru`/`en`) and auto locale mode

## Deployment and LAN

- Primary local orchestration is Docker Compose from repository root.
- Typical LAN entry points:
  - web: `http://<host-ip>:3010`
  - admin: `http://<host-ip>:3012`
  - api: `http://<host-ip>:3001`
  - expo: `http://<host-ip>:8081`
- Web resolves API host from current browser host for LAN compatibility.
- Geolocation in browsers requires secure context (`https://...`) or `http://localhost`.

## Hydration safety (web)

- Avoid SSR/CSR text mismatch by keeping initial render deterministic.
- Browser-only sources (`window`, `localStorage`, `navigator`, `location`) must be read after mount.
- Locale/theme/runtime-info UI should render stable initial placeholders and then hydrate client-specific values.
- URL state sync (`lat/lng`) must start only after initial URL parse to avoid accidental query reset on first render.

## Notes

- API exposes CORS headers for MVP LAN access.
- Web demo resolves API host from current browser host to support local network testing.
- Web supports 3 theme modes (light/dark/system) with system default.
- Web supports 3 locale modes (auto/ru/en) with browser-locale detection for auto mode.
- Web map selection is coordinate-first (no predefined points).
- Web forecast refresh is optimistic: previous forecast data remains visible while next request is loading.
- Web URL updates keep scroll position to prevent visual jump on map click.
- Web persists selected coordinate via query params (`lat`, `lng`).
- Web attempts waterbody detection from Yandex geocode (`kind: hydro`) and falls back to heuristic type.
- Web exposes a global runtime info block in non-production mode (API endpoint + resolved base URL).
- Web map has geolocation action; browser secure-context policy applies.
- Mobile Expo monorepo setup uses custom metro config with workspace watch folders.
