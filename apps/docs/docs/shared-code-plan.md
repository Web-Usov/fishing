---
title: Shared code plan (web + mobile)
sidebar_position: 4
---

# Shared code plan (web + mobile)

## Goal

Maximize shared code between Next.js web and Expo mobile without forcing identical screens where platform UX differs.

## Current state

- Shared domain/contracts/client:
  - `packages/domain-geo`
  - `packages/domain-bite-forecast`
  - `packages/shared-zod`
  - `packages/api-client`
- Shared UI primitives:
  - `packages/shared-ui` (new)
    - `SharedCard`
    - `SharedHeading`
    - `SharedText`
- Web map adapters:
  - `apps/web/app/components/map/adapter-factory.ts`
  - `apps/web/app/components/map/yandex-adapter.ts` (MVP provider)
  - `apps/web/app/components/map/google-adapter.ts` (stub for future provider)
- Web UX state:
  - URL-shared coordinate state (`lat/lng` query params)
  - 7-day forecast list + per-day details panel
  - theme modes (`light`, `dark`, `system`)
  - locale modes (`auto`, `ru`, `en`) with browser locale auto-detection
  - optimistic forecast refresh (keep previous data while loading next point)
  - scroll-preserving URL updates during coordinate change
  - expandable factor-impact details in forecast panel
  - global non-production runtime info block (endpoint/base URL)
  - waterbody type from hydro geocode with fallback strategy
  - hydration-safe client initialization for locale/runtime/url-sensitive UI

## Sharing boundaries

### Fully shared

- business rules
- data contracts
- API client
- formatting/validation helpers
- base UI primitives

### Platform-specific

- routing/navigation
- map rendering and gestures
- page-level layout and adaptive UX
- platform-only integrations
- browser geolocation permissions/secure-context constraints
- browser locale detection and user locale preference persistence
- map-provider geocode integration details (Yandex-specific behavior)

## Implementation pattern

1. Build feature logic in shared packages first.
2. Create/extend UI primitives in `packages/shared-ui`.
3. Compose screens separately in `apps/web` and `apps/mobile`.
4. Keep adapters thin and avoid platform conditionals in domain code.
5. For web-only browser APIs, keep first render deterministic and move browser reads to post-mount effects.

## Documentation policy

- Source of truth for current project state: `apps/docs/docs/*`.
- After every fixed/merged change, update relevant docs in this folder in the same work cycle.
- Root-level docs (if present) may summarize, but must not drift from `apps/docs/docs/*`.

## Next milestones

1. Add shared forecast widgets (`ForecastScoreCard`, `FactorList`).
2. Extract shared loading/error states from web demo to `shared-ui`.
3. Introduce shared hooks package (`packages/shared-hooks`) for query/data state.
4. Align visual tokens (colors/spacing/typography) across web/mobile.
