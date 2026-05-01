---
title: Clean Architecture Standard
---

# Clean Architecture Standard (Node.js / TypeScript / React)

Этот документ задаёт обязательные архитектурные правила для Fishing monorepo.

## Ключевая цель

Фреймворки, базы и UI — это детали. Бизнес-правила и use-cases должны быть устойчивыми к смене деталей.

## Dependency Rule (обязательное правило)

Зависимости направляются только внутрь:

- `domain` не зависит от `application`, `infrastructure`, `presentation`;
- `application` зависит от `domain` и абстракций;
- `infrastructure` реализует интерфейсы внутренних слоёв;
- `presentation` (web/mobile/admin/api controllers) вызывает application/use-cases, но не встраивает доменную логику в UI/transport.

## Как это маппится на наш репозиторий

- Доменные правила: `packages/domain-*`.
- Контракты и схемы: `packages/shared-zod`.
- Транспорт/оркестрация API: `apps/api`.
- UI и UX-слой: `apps/web`, `apps/mobile`, `apps/admin`.
- Документация и процесс: `apps/docs/docs/*`.

## Нельзя делать

1. Втаскивать ORM/HTTP/UI зависимости в доменный слой.
2. Хранить бизнес-правила внутри контроллеров или React-компонентов.
3. Обходить shared-контракты ad-hoc типами между frontend/backend.
4. Строить межсервисную интеграцию напрямую, когда должен быть контрактный слой.

## Нужно делать

1. Сначала выделять доменные инварианты и use-cases.
2. Определять порты (интерфейсы) во внутренних слоях.
3. Реализации портов размещать во внешних слоях.
4. На фронтенде разделять:
   - domain/shared types;
   - application hooks/services;
   - presentation components.

## Архитектурные гейты для изменений

Перед реализацией значимого изменения в `PLAN.md` должно быть явно зафиксировано:

- какой слой меняется;
- какие зависимости добавляются;
- почему не нарушается Dependency Rule;
- какие документы обновляются (`architecture.md`, `services/*`, `shared-code-plan.md`).

После реализации в `REVIEW.md` подтверждается, что:

- границы слоёв не нарушены;
- контракты синхронизированы;
- проверки (`typecheck/build/test`) пройдены.

## Тестируемость как архитектурный индикатор

Если домен/use-case нельзя протестировать без поднятия внешней инфраструктуры — архитектурная граница нарушена.

## Связанные документы

- [Clean Code Standard](clean-code.md)
- [Архитектура](../architecture.md)
- [План разделяемого кода](../shared-code-plan.md)
- [Plans Index](../delivery/plans/index.md)
