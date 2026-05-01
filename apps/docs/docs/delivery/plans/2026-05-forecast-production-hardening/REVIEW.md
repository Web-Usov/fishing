---
title: Review — Forecast production hardening (без waterbodyType)
plan_id: 2026-05-forecast-production-hardening
status: reviewed
updated_at: 2026-05-01
---

# Review — Forecast production hardening (без waterbodyType)

## 1. Summary

Реализован production-hardening прогнозного контура: из контракта, доменного расчёта и web-UI удалён `waterbodyType`; synthetic weather fallback исключён из runtime-расчёта; placeholder-фактор луны убран из контракта и модели прогноза.

## 2. Conformance to PLAN

- Совпало с планом:
  - удалён `waterbodyType` в shared contracts, domain, API e2e и web payload/UI;
  - удалён synthetic fallback (`estimateWeatherByCoordinates`) и fallback-ветка расчёта;
  - обновлены docs под новое поведение «нет псевдопрогноза при недоступной погоде».
- Отклонений, требующих rework, нет.

## 3. Docs updated

- `apps/docs/docs/mvp-scope.md`
- `apps/docs/docs/bite-forecast-model.md`
- `apps/docs/docs/services/api.md`
- `apps/docs/docs/services/web.md`
- `apps/docs/docs/architecture.md`
- `apps/docs/docs/delivery/plans/index.md`
- `apps/docs/docs/delivery/plans/2026-05-forecast-production-hardening/PLAN.md`
- `apps/docs/docs/delivery/plans/2026-05-forecast-production-hardening/REVIEW.md`

## 4. Verification evidence

- `pnpm test` — passed
- `pnpm typecheck` — passed
- `pnpm build` — passed
- `pnpm docs:build` — passed
- Manual QA API:
  - `POST /forecast/calculate` вернул `201`
  - в ответе факторы без `waterbody` и `moon`, только валидные runtime-факторы

## 5. Risks / follow-ups

- При недоступности погодного провайдера теперь отсутствует «всегда доступный» прогноз: это осознанный компромисс в пользу достоверности.
- Для дальнейшего повышения качества потребуется отдельный поток по устойчивости внешнего погодного источника (retry/cache/multi-provider).

## 6. Final disposition

accepted with follow-ups
