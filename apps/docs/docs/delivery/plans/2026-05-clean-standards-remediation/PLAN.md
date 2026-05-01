---
title: Clean standards remediation plan (code + architecture)
status: closed
plan_id: 2026-05-clean-standards-remediation
owner: hephaestus-session
updated_at: 2026-05-01
services: [shared, api, web, docs]
docs:
  - develop-start.md
  - agent-workflow/clean-code.md
  - agent-workflow/clean-architecture.md
  - architecture.md
  - shared-code-plan.md
  - services/api.md
  - services/web.md
review: REVIEW.md
---

# Clean standards remediation plan (code + architecture)

## 1. Why

Последний поток обновил обязательный engineering-подход: все кодовые изменения должны соответствовать `Clean Code Standard` и `Clean Architecture Standard`.

По итогам ревью текущей кодовой базы критичных suppress-паттернов не обнаружено, но есть системные архитектурные риски: смешение слоёв, дублирование контрактов и недостаточный unit-слой в `apps/api`. Без устранения этих проблем регрессии будут возвращаться в следующих PR.

Цель потока: привести код и границы модулей к устойчивому baseline, который автоматически защищается архитектурными гейтами.

## 2. Scope

### Входит

- Устранение нарушений Dependency Rule в forecast-цепочке.
- Очистка доменного слоя от presentation/contract-зависимостей.
- Удаление ad-hoc контрактов и дублированной валидации в web/api-client.
- Рефакторинг инфраструктурных переключателей в `api-client`.
- Усиление тестовой пирамиды: domain + api unit/integration + e2e smoke.
- Обновление docs и фиксация результатов в `REVIEW.md`.

### Не входит

- Новые продуктовые фичи и UX-эксперименты вне исправления архитектуры.
- Замена погодного провайдера или изменение бизнес-модели прогноза.
- Глобальный рефакторинг всех модулей монорепо вне затронутого scope.

## 3. Doc gates passed

- Подтверждены входные документы: `develop-start.md`.
- Подтверждены стандарты: `agent-workflow/clean-code.md`, `agent-workflow/clean-architecture.md`.
- Подтверждён delivery-процесс: `delivery/plans/index.md`.

До/вместе с реализацией должны быть синхронизированы:

- `architecture.md` — зафиксировать целевую схему ответственности слоёв для forecast-потока.
- `shared-code-plan.md` — зафиксировать границы shared-контрактов и домена.
- `services/api.md` и `services/web.md` — отразить контрактные и runtime-изменения.

## 4. Architecture / product decisions

1. **Dependency governance как обязательный gate**
   - Добавляем архитектурный контроль зависимостей в CI.
   - Новые нарушения границ блокируют merge.

2. **Domain остаётся независимым от contract/presentation деталей**
   - `packages/domain-*` не импортируют `shared-zod` и не формируют пользовательские локализованные сообщения.
   - Domain возвращает структурированные факторы/коды, а рендеринг текста выполняется во внешних слоях.

3. **Контракты и валидация — единый источник истины**
   - Удаляем ad-hoc типы/ограничения в UI и клиенте.
   - Все границы синхронизируются через shared contracts.

4. **Явная стратегия клиентского runtime-поведения**
   - Убираем скрытые endpoint-эвристики (mode-switch по строке).
   - Поведение клиента определяется явным конфигом/стратегией.

## 5. Implementation plan

1. **ARCH-01 — Dependency gate**
   - Ввести проверку архитектурных импорт-правил и циклов в CI.
   - Зафиксировать разрешённые/запрещённые направления зависимостей.

2. **ARCH-02 — Domain purity remediation**
   - В `packages/domain-bite-forecast` убрать зависимость от `shared-zod`.
   - Вынести локализованный explanation-текст из domain в adapter/presentation слой.

3. **ARCH-03 — Contract convergence**
   - Удалить локальные копии request/response-типов в `apps/web/app/components/FishingDemo.tsx`.
   - Убрать дубли coordinate validation в UI/route и дубли bounds в `packages/api-client`.

4. **ARCH-04 — API client runtime cleanup**
   - Заменить `endpoint.includes(...)` switch на явную конфигурацию.
   - Объединить дубли `resolveApiBaseUrl` в единый helper.

5. **TST-01..05 — Test pyramid hardening**
   - Добавить unit/integration тесты `apps/api` для `forecast.service` и `forecast.controller`.
   - Добавить domain-тест timezone fallback в `domain-bite-forecast`.
   - Добавить domain-инварианты distance (zero-distance, symmetry, boundaries) в `domain-geo`.
   - Оставить e2e как smoke-слой, не как единственный уровень защиты.

## 6. Files / modules

- `packages/domain-bite-forecast/src/index.ts`
- `packages/domain-geo/src/index.ts`
- `packages/shared-zod/src/index.ts`
- `packages/api-client/src/index.ts`
- `apps/web/app/components/FishingDemo.tsx`
- `apps/web/app/components/AppRuntimeInfo.tsx`
- `apps/api/src/modules/forecast/forecast.service.ts`
- `apps/api/src/modules/forecast/forecast.controller.ts`
- `apps/api/tests/forecast.e2e.spec.ts`
- `apps/docs/docs/architecture.md`
- `apps/docs/docs/shared-code-plan.md`
- `apps/docs/docs/services/api.md`
- `apps/docs/docs/services/web.md`
- `apps/docs/docs/delivery/plans/2026-05-clean-standards-remediation/REVIEW.md`

Нельзя ломать:

- контрактную совместимость web↔api в рамках одного поставочного цикла;
- публичный endpoint `/forecast/calculate`;
- прохождение `typecheck/build/test` и `docs:build`.

## 7. Risks and dependencies

- Риск роста объёма изменений из-за каскадного удаления дублей.
- Риск скрытых циклов при неявных импорт-цепочках между shared/domain/client.
- Риск временной нестабильности UI при распиле `FishingDemo.tsx`.
- Зависимость от строгого CI gate: без него регрессии границ быстро вернутся.

## 8. Validation

- `pnpm docs:build`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- проверка CI-архгейта на негативном сценарии (нарушающий импорт должен падать)

## 9. Definition of done

- Dependency Rule закреплён в CI и реально защищает от регрессий.
- `domain-*` не зависят от `shared-zod`/presentation-деталей.
- В web/api-client нет ad-hoc дублей контрактов и валидационных правил.
- API client использует явную runtime-стратегию без строковых эвристик.
- Тестовая пирамида для forecast-потока сбалансирована (domain + api unit/integration + e2e smoke).
- Обновлены релевантные canonical docs.
- Заполнен `REVIEW.md` с evidence.
