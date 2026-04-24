---
title: Web
---

# Web

## Назначение

`apps/web` — текущая основная публичная поверхность продукта и главный носитель map-first MVP-сценария.

## Доменный смысл и зона ответственности

Web реализует пользовательский цикл выбора точки и чтения прогноза: карта → координата → 7-дневная сводка → объяснение факторов → решение о выезде.

## Входы и выходы

- отображает карту;
- позволяет выбрать произвольную координату;
- получает погодный контекст;
- запрашивает прогноз клёва;
- показывает 7-дневную сводку и детализацию факторов;
- управляет runtime UX: locale, theme, loading/error states.

Основные взаимодействия:

- **Входы:** координата пользователя, query-state URL (`lat/lng`), данные погоды.
- **Выходы:** визуализация прогноза, explainability по факторам, UI-состояния fallback/ошибок.

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

## Зависимости

- `apps/api` для расчёта прогноза;
- `@fishing/api-client`;
- `@fishing/shared-ui`;
- map provider adapters (`yandex`/`google`) и browser runtime.

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

## Типовые сценарии изменений

- Изменить UX прогноза: обновить UI orchestration и typed i18n-ключи без нарушения hydration-safe подхода.
- Изменить weather flow: сначала same-origin route и нормализация, затем UI fallback-режимы.
- Добавить новый пользовательский шаг: синхронизировать URL-state, loading/error и объяснение факторов.

## Что читать дальше

- [Архитектура](../architecture.md)
- [План разделяемого кода](../shared-code-plan.md)
- [API](api.md)
- [Backlog](../delivery/backlog.md)
- [Task State](../delivery/task-state.md)
