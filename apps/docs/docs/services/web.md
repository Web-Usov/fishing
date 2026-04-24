---
title: Web
---

# Web

## Назначение

`apps/web` — текущая основная публичная поверхность продукта и главный носитель map-first MVP-сценария.

## Что делает сервис

- отображает карту;
- позволяет выбрать произвольную координату;
- получает погодный контекст;
- запрашивает прогноз клёва;
- показывает 7-дневную сводку и детализацию факторов;
- управляет runtime UX: locale, theme, loading/error states.

## Архитектура

Внутри web сейчас выделяются:

- app shell (`layout`, `page`);
- карта через provider adapter pattern;
- forecast UI orchestration;
- locale/theme providers;
- same-origin route `/api/weather/forecast` для проксирования погодных данных.

## Стек

- `Next.js`
- `React`
- `TypeScript`
- `@fishing/api-client`
- `@fishing/shared-ui`

## Паттерны

- optimistic loading;
- query-state через URL;
- hydration-safe first render;
- typed i18n keys;
- weather proxy route;
- provider adapters для карт.

## Инфраструктура

- сервис `web` в Docker Compose;
- LAN-доступ;
- зависимость от API;
- watch-синхронизация в dev-контуре.

## Качество

- обязательны build/typecheck;
- поведение внешних погодных данных контролируется через same-origin proxy и fallback warning;
- следующие шаги качества — e2e пользовательского сценария.

## Направление развития

- довести demo-слой до продуктовой зрелости;
- вынести повторяемые UI/state части в shared;
- добавить историю точек и журнал улова;
- добиться смыслового паритета с mobile.
