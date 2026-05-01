---
title: Review — Clean standards remediation plan (code + architecture)
plan_id: 2026-05-clean-standards-remediation
status: closed
updated_at: 2026-05-01
---

# Review — Clean standards remediation plan (code + architecture)

## 1. Summary

Реализован remediation-поток по clean-code/clean-architecture для forecast-цепочки:

- `domain-bite-forecast` отвязан от `shared-zod` и перестал формировать пользовательский `explanation`.
- `explanation` перенесён в API boundary (`ForecastController`) перед контрактной валидацией ответа.
- В web убраны ad-hoc контрактные типы прогноза, добавлено использование shared-контрактов.
- В `api-client` убран скрытый mode-switch через `endpoint.includes(...)`, добавлен явный `provider`.
- Дубли `resolveApiBaseUrl` вынесены в общий runtime helper.
- Добавлены unit/integration тесты API и расширены domain-тесты инвариантов.

## 2. Conformance to PLAN

- **Совпало с планом:**
  - ARCH-02: domain purity достигнута в `packages/domain-bite-forecast`.
  - ARCH-03: web перешёл на shared-контракты; координатная валидация в web route переведена на shared schema.
  - ARCH-04: mode-switch в `api-client` сделан явным (`provider`), runtime helper унифицирован.
  - TST-01..05: добавлены тесты service/controller + доменные инварианты timezone fallback и geo-свойств.
- **Отклонения:**
  - ARCH-01 (полноценный CI dependency governance gate) не внедрён в этом цикле как отдельный инструментальный шаг; оставлен как follow-up для infra-потока.

## 3. Docs updated

- `apps/docs/docs/architecture.md`
- `apps/docs/docs/shared-code-plan.md`
- `apps/docs/docs/services/api.md`
- `apps/docs/docs/services/web.md`
- `apps/docs/docs/delivery/plans/index.md`
- `apps/docs/docs/delivery/plans/2026-05-clean-standards-remediation/PLAN.md`

## 4. Verification evidence

Выполнены обязательные проверки и все успешны:

- `pnpm typecheck` ✅
- `pnpm build` ✅
- `pnpm test` ✅
- `pnpm docs:build` ✅

Ключевые подтверждения по тестам:

- `apps/api/tests/forecast.controller.spec.ts` (3 tests) ✅
- `apps/api/tests/forecast.service.spec.ts` (1 test) ✅
- `apps/api/tests/forecast.e2e.spec.ts` (1 test) ✅
- `packages/domain-bite-forecast/tests/calculate-bite-forecast.spec.ts` (8 tests) ✅
- `packages/domain-geo/tests/geo.spec.ts` (5 tests) ✅

## 5. Risks / follow-ups

- Остаётся отдельный infra-follow-up: автоматический dependency governance gate в CI (запрет нарушающих импортов/циклов).
- `FishingDemo.tsx` всё ещё крупный компонент; дальнейший безопасный распил на presentation/application слои стоит выделить в следующий рефакторинг-план.
- Дополнительные guardrails закрыты в этом потоке: добавлены тесты bounds/schema-согласованности и негативные provider-сценарии в `api-client`.

## 6. Final disposition

- `accepted changes`
