---
title: MVP scope
sidebar_position: 3
---

# MVP scope

Current implementation includes a working map-first forecast MVP:

- Real web map (Yandex Maps provider via adapter layer)
- Coordinate-first interaction (user clicks any point)
- 7-day forecast calculation for selected coordinate
- Forecast refresh keeps previous data visible while loading new point (optimistic UX)
- URL-shareable coordinate state (`?lat=...&lng=...`)
- URL update preserves scroll position to reduce page jump on map click
- Per-day detailed summary panel
- Expandable factor-impact rows with per-factor explanation
- Theme modes: light / dark / system (default system)
- Locale modes: auto / ru / en (browser locale auto-detection + explicit user choice)
- Browser geolocation action for quick coordinate selection
- Waterbody type resolution attempts real hydro geocode first, then falls back
- Global non-production runtime info block for API endpoint/base URL is visible on all routes
- Direct open/refresh of `?lat=...&lng=...` preserves coordinates (no query wipe)

## MVP operational notes

- Main local run mode: Docker Compose from repository root.
- LAN usage is supported (web/admin/api/expo exposed on dedicated ports).
- Hydration-safe behavior is required for web UI pieces that depend on browser-only values.

Out of scope for current MVP:

- social feed / posts / recommendations
- full catch journal workflows
- production-grade weather ingestion pipeline
