---
title: Review — Hourly solunar forecast upgrade (formula v1)
plan_id: 2026-05-forecast-hourly-solunar-upgrade
status: reviewed
updated_at: 2026-05-06
---

# Review — Hourly solunar forecast upgrade (formula v1)

## 1. Summary

Реализован переход прогнозного контура на hourly-first модель с дневной агрегацией и окнами активности.

Независимый review проведён отдельным сабагентом (session_id: `ses_2033f4885ffex5mOhgF0K04mY5`) для исключения смешения контекста основной реализации.

Выполнено:

- в доменном расчёте добавлены hourly scoring, `bestWindows`, expanded/debug breakdown;
- добавлен astronomy adapter (`astronomy-engine`) для sunrise/sunset, moonrise/moonset и lunar transit windows;
- расширены shared-контракты (`hourlyWeather`, `locale`, `debug`, `expanded`, `explanationLocalized`);
- API boundary обновлён: `explanation` выбирается по locale, expanded отдаётся в debug-режиме;
- api-client и web обновлены под hourly ingestion и передачу `hourlyWeather` в `/forecast/calculate`;
- baseline daily UX сохранён, expanded/debug остаётся opt-in;
- обновлены unit/contract/ui тесты.

## 2. Conformance to PLAN

### Совпало с планом

- Hourly-first inside + daily-compatible outside.
- Добавлены solunar/light окна, погодный hourly слой и сезонный множитель.
- Реализованы `bestWindows` и расширенный debug-слой.
- Введена dual explainability (строка + структурные факторы, RU/EN).
- Добавлен confidence на этапе 1.

### Отклонения

- В этом цикле не выполнялся drift validation report против исторического baseline (`±10` и `<=25%` level-switch cap).
- Полная синхронизация всех product docs из списка PLAN выполнена частично (обновлены ключевые tech/model docs, но не закрыт весь набор документов потока).
- Config-driven параметризация закрыта частично: порог `BEST_WINDOW_THRESHOLD` пока зафиксирован в коде, а не вынесен в внешний конфиг.
- Не зафиксирован отдельный evidence по кэшированию/TTL и observability-полям (`engine_version`, `config_version`) в рамках этого цикла.

Отклонения допустимы как follow-up для следующего delivery-cycle (калибровка/аналитический прогон и полная документационная синхронизация).

## 3. Docs updated

- `apps/docs/docs/delivery/plans/2026-05-forecast-hourly-solunar-upgrade/PLAN.md`
- `apps/docs/docs/delivery/plans/2026-05-forecast-hourly-solunar-upgrade/REVIEW.md`
- `apps/docs/docs/delivery/plans/index.md`
- `apps/docs/docs/bite-forecast-model.md`
- `apps/docs/docs/services/api.md`

## 4. Verification evidence

Выполнены проверки:

- `pnpm typecheck` — passed
- `pnpm test` — passed
- `pnpm build` — passed
- `pnpm docs:build` — passed

Manual QA:

- Выполнен реальный прогон domain-расчёта через Node (`calculateBiteForecast`) с `debug=true`.
- Подтверждено, что возвращаются `score/level/confidence`, `bestWindows`, `tags`, локализованное explanation.

Ops/runtime:

- Выполнен `pnpm docker:rebuild` (compose rebuild + recreate), контейнеры подняты; `postgres` перешёл в `Healthy`, после чего стартовали `api/web/admin/mobile/docs`.

## 5. Risks / follow-ups

- Добавить формальный drift-report по историческим срезам против baseline.
- Досинхронизировать оставшиеся docs из плана (в т.ч. `services/web.md`, `mvp-scope.md`, `catch-journal.md`) при следующем цикле изменений модели.
- Вынести пороги/веса (включая `BEST_WINDOW_THRESHOLD`) в внешний конфиг с валидацией схемой.
- Добавить явный evidence по runtime-кэшу и минимальной observability (версия движка/конфига).
- При необходимости вынести expanded/debug часть в отдельный endpoint/режим при росте payload и нагрузке.

## 6. Final disposition

`accepted with follow-ups`
