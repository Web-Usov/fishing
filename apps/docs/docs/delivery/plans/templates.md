---
title: Plan & Review Templates
---

# Plan & Review Templates

Ниже — рекомендуемые шаблоны для новых plan-папок в `delivery/plans/<plan-id>-<slug>/`.

## Folder layout

```text
delivery/plans/<plan-id>-<slug>/
  PLAN.md
  REVIEW.md
  artifacts/   # optional
  adr/         # optional
```

## `PLAN.md` template

```md
---
title: <Human title>
status: draft | proposed | approved | in_progress | implemented | reviewed | closed | blocked | deferred
plan_id: <yyyy-mm-slug>
owner: <person or agent-session>
updated_at: <YYYY-MM-DD>
services: [api, web, mobile, admin, docs, shared, db]
docs:
  - product-overview.md
  - architecture.md
review: REVIEW.md
---

# <Human title>

## 1. Why

Почему этот поток нужен и какую проблему он решает.

## 2. Scope

- Что входит.
- Что не входит.

## 3. Doc gates passed

- Какие canonical docs уже подтверждают решение.
- Какие docs нужно обновить до реализации.
- Какие docs будут обновлены в том же work cycle.

## 4. Architecture / product decisions

- Ключевые решения.
- Выбранные компромиссы.
- Почему выбран именно этот путь.

## 5. Implementation plan

Пошаговый execution plan.

## 6. Files / modules

- Какие сервисы и модули затрагиваются.
- Какие контракты или runtime-границы нельзя сломать.

## 7. Risks and dependencies

- Технические риски.
- Продуктовые риски.
- Внешние и внутренние зависимости.

## 8. Validation

- `pnpm docs:build`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- дополнительные проверки при необходимости

## 9. Definition of done

Явный список условий завершения.
```

## `REVIEW.md` template

```md
---
title: Review — <Human title>
plan_id: <yyyy-mm-slug>
status: reviewed | closed | rework_needed
updated_at: <YYYY-MM-DD>
---

# Review — <Human title>

## 1. Summary

Что реально реализовано.

## 2. Conformance to PLAN

- Что совпало с планом.
- Что отклонилось.
- Почему отклонение было допустимо или почему нужен follow-up.

## 3. Docs updated

Какие canonical docs были обновлены.

## 4. Verification evidence

- `pnpm docs:build`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- ручные или browser-проверки

## 5. Risks / follow-ups

- Что осталось на потом.
- Какие follow-up планы нужны.

## 6. Final disposition

- `accepted changes`
- `accepted with follow-ups`
- `rework required`
```

## Naming convention

Рекомендуемый формат plan-id:

- `2026-04-forecast-quality`
- `2026-04-mobile-forecast-port`
- `2026-05-catch-journal-foundation`

Это даёт хронологический порядок, читаемость и устойчивые ссылки.

## Practical OmO rule

Для OmO-сессий правило простое:

1. вход через `product-start.md` и/или `develop-start.md`;
2. чтение canonical docs;
3. создание или обновление `PLAN.md`;
4. реализация;
5. обновление docs;
6. `REVIEW.md` с доказательствами.
