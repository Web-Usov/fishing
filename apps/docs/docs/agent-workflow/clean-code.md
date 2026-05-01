---
title: Clean Code Standard
---

# Clean Code Standard (TypeScript / React)

Этот документ задаёт **обязательный** стандарт качества кода для Fishing monorepo.

Он применяется к:

- `apps/api`, `apps/web`, `apps/mobile`, `apps/admin`;
- `packages/*` (особенно `packages/domain-*`, `packages/shared-zod`, `packages/api-client`).

## Цель

Писать код, который:

- легко читать и безопасно менять;
- предсказуем в поведении;
- не ломает архитектурные границы.

## Non-negotiables

1. **Type safety без подавления ошибок**
   - Запрещены `any`, `@ts-ignore`, `@ts-expect-error` без отдельного обоснования в `PLAN.md`.
2. **Одна ответственность на функцию/модуль**
   - Если в функции смешаны разные этапы (валидация + I/O + форматирование) — разделять.
3. **Явные имена**
   - Имена отражают домен и поведение, а не реализацию.
4. **Никакого silent-fail**
   - Ошибки не проглатывать, `catch {}` без обработки запрещён.
5. **Проверки обязательны**
   - По scope изменений: `pnpm docs:build`, `pnpm typecheck`, `pnpm build`, `pnpm test`.

## Именование

- Переменные/функции: `camelCase`.
- Типы/классы/React-компоненты: `PascalCase`.
- Хуки: `use*`.
- Интерфейсы: без префикса `I`.
- Константы кросс-модульного уровня: `UPPER_SNAKE_CASE`.

Плохой пример: `data`, `handler2`, `process(order, true)`.

Хороший пример: `forecastResponse`, `buildForecastExplanation`, `processOrderWithNotification(order)`.

## Функции и побочные эффекты

- Предпочитать чистые функции в `packages/domain-*`.
- Методы с побочным эффектом называть явно (`save*`, `send*`, `publish*`).
- Избегать булевых флагов-переключателей поведения.

## Асинхронность и ошибки

- Использовать `async/await`.
- На boundary-слоях (`apps/api` controllers, app services, adapter layer) ошибки обрабатываются явно.
- Доменные ошибки маппить в понятные контрактные ответы, без утечки внутренних деталей.

## React-правила

- Компоненты — преимущественно презентационные.
- Логику данных держать в hooks/application-layer, а не в JSX.
- Не хранить производное состояние, если его можно вычислить.

## Что считать «код стал чище»

При каждом изменении минимум одно из:

- улучшено имя;
- уменьшена длина/сложность функции;
- удалён dead code;
- устранено дублирование;
- добавлен тест на ключевое правило.

## Проверка соблюдения

- ESLint/TypeScript должны проходить без suppress-хаков.
- Для значимых изменений в домене и use-cases нужны тесты.
- Если отклонение от стандарта неизбежно, оно фиксируется в `delivery/plans/<plan>/PLAN.md` и проверяется в `REVIEW.md`.

## Связанные документы

- [Clean Architecture Standard](clean-architecture.md)
- [OmO Agent Workflow Playbook](omo-playbook.md)
- [Plans Index](../delivery/plans/index.md)
