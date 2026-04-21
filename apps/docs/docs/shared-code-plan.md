---
title: План разделяемого кода (web + mobile)
sidebar_position: 4
---

# План разделяемого кода (web + mobile)

## Цель

Максимально переиспользовать код между Next.js web и Expo mobile, не заставляя платформы иметь одинаковые экраны там, где UX должен отличаться.

## Текущее состояние

- Общие domain/contracts/client пакеты:
  - `packages/domain-geo`
  - `packages/domain-bite-forecast`
  - `packages/shared-zod`
  - `packages/api-client`
- Общие UI-примитивы:
  - `packages/shared-ui` (new)
    - `SharedCard`
    - `SharedHeading`
    - `SharedText`
- Адаптеры карт в web:
  - `apps/web/app/components/map/adapter-factory.ts`
  - `apps/web/app/components/map/yandex-adapter.ts` (MVP provider)
  - `apps/web/app/components/map/google-adapter.ts` (stub for future provider)
- Состояние и UX в web:
  - URL-shared coordinate state (`lat/lng` query params)
  - 7-day forecast list + per-day details panel
  - theme modes (`light`, `dark`, `system`)
  - locale modes (`auto`, `ru`, `en`) with browser locale auto-detection
  - optimistic forecast refresh (keep previous data while loading next point)
  - scroll-preserving URL updates during coordinate change
  - expandable factor-impact details in forecast panel
  - global non-production runtime info block (endpoint/base URL)
  - waterbody type from hydro geocode with fallback strategy
  - real-weather prefetch (Open-Meteo) with fallback strategy to local weather estimation
  - hydration-safe client initialization for locale/runtime/url-sensitive UI
  - typed i18n dictionary keys (`LocaleKey`) to avoid drift between UI and translation catalog

## Границы переиспользования

### Полностью разделяемое

- бизнес-правила
- контракты данных
- API-клиент
- форматирование/валидация
- базовые UI-примитивы

### Платформенно-специфичное

- роутинг/навигация
- рендеринг карт и жесты
- экранный layout и адаптивный UX
- платформенные интеграции
- разрешения геолокации и secure-context ограничения браузера
- определение локали браузера и хранение пользовательской локали
- детали интеграции геокодинга конкретного провайдера карт (поведение Яндекса)

## Паттерн реализации

1. Сначала реализовывать фичевую логику в shared-пакетах.
2. Создавать/расширять UI-примитивы в `packages/shared-ui`.
3. Собирать экраны отдельно в `apps/web` и `apps/mobile`.
4. Держать адаптеры тонкими и не тянуть platform-conditionals в domain-код.
5. Для browser-only API обеспечивать детерминированный первый рендер и переносить чтение браузерных данных в post-mount эффекты.
6. Внешние погодные поля сначала нормализовать в API-client слой, затем передавать в расчёт прогноза в стабильном контракте `WeatherSnapshot`.

## Политика документации

- Источник истины о текущем состоянии проекта: `apps/docs/docs/*`.
- После каждого исправления/изменения необходимо обновлять релевантные документы в этой папке в том же цикле работ.
- Root-level документы (если есть) могут быть краткими, но не должны расходиться с `apps/docs/docs/*`.

## Следующие этапы

1. Добавить общие виджеты прогноза (`ForecastScoreCard`, `FactorList`).
2. Вынести общие loading/error состояния из web-демо в `shared-ui`.
3. Ввести пакет shared hooks (`packages/shared-hooks`) для query/data состояния.
4. Синхронизировать визуальные токены (цвета/отступы/типографика) между web/mobile.
