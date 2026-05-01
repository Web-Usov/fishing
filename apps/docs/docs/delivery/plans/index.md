---
title: Plans Index
---

# Plans Index

`delivery/plans/*` — канонический operational-слой delivery в Fishing.

Идея простая: **сначала меняем или подтверждаем продуктовую/архитектурную документацию, затем создаём план, и только потом идём в реализацию**. После реализации обязательно появляется review-артефакт с доказательствами, что изменение действительно соответствует плану и docs.

## Зачем мы уходим от backlog/task-state как основных артефактов

Старый набор `backlog.md` + `task-state.md` был полезен как стартовый координационный слой, но в реальной агентной работе он создаёт лишний split между:

- стратегией;
- активной работой;
- фактическими артефактами реализации.

Новая модель делает operational source of truth линейным:

1. canonical product/architecture docs;
2. конкретный `PLAN.md`;
3. код и обновления docs;
4. `REVIEW.md`.

## Новая структура delivery

```text
delivery/
  roadmap.md
  plans/
    index.md
    templates.md
    <plan-id>-<slug>/
      PLAN.md
      REVIEW.md
      artifacts/         # optional
      adr/               # optional
```

## Что является каноном

- `roadmap.md` — только крупные направления и этапы.
- `delivery/plans/index.md` — единая точка навигации по активным и завершённым планам.
- `delivery/plans/<plan>/PLAN.md` — канонический документ подготовки и выполнения конкретного потока.
- `delivery/plans/<plan>/REVIEW.md` — канонический post-implementation review по этому потоку.

Если рабочие заметки ведутся во внешнем operational-контуре вроде `.sisyphus/`, они считаются **временным рабочим пространством**, а не источником истины. До завершения work cycle ключевые решения и итоговый статус должны быть синхронизированы в `apps/docs/docs/delivery/plans/*`.

## Lifecycle статусы плана

Рекомендуемый минимальный набор статусов:

- `draft` — набросок, ещё формируется scope;
- `proposed` — план сформирован и готов к обсуждению;
- `approved` — doc-gates пройдены, можно стартовать реализацию;
- `in_progress` — реализация идёт;
- `implemented` — код и docs внесены, ждём итоговый review;
- `reviewed` — review завершён, результаты подтверждены;
- `closed` — поток завершён полностью;
- `blocked` / `deferred` — временная остановка.

Важно: **реализация не должна стартовать из `draft` или `proposed`**, пока не пройдены doc-gates.

## Обязательные doc-gates перед кодом

Перед началом реализации агент или разработчик обязан:

1. определить тип задачи: Product / Develop / смешанная;
2. перечитать `product-start.md` и/или `develop-start.md`;
3. обновить или подтвердить релевантные canonical docs:
   - `product-overview.md`, `mvp-scope.md` — если меняется продуктовый смысл или сценарий;
   - `architecture.md`, `services/*` — если меняются архитектурные границы или сервисы;
   - `shared-code-plan.md` — если меняется shared-vs-platform граница;
4. создать `PLAN.md` и явно зафиксировать:
   - что уже подтверждено в docs;
   - какие документы будут обновлены до или вместе с кодом;
   - какие non-goals у потока;
5. добавить запись о плане в этот индекс.

## Как вести этот индекс

Для каждого активного или недавнего плана добавляйте короткую запись в таблицу.

| Plan ID | Статус | Scope | Сервисы | PLAN | REVIEW |
|---|---|---|---|---|---|
| `2026-05-forecast-production-hardening` | `reviewed` | Доведение прогноза до production-grade, удаление `waterbodyType`, отказ от synthetic fallback в расчёте | shared, api, web, docs | `delivery/plans/2026-05-forecast-production-hardening/PLAN.md` | `delivery/plans/2026-05-forecast-production-hardening/REVIEW.md` |
| `2026-04-forecast-quality` | `closed` | Улучшение модели прогноза | shared, api, docs | `delivery/plans/2026-04-forecast-quality/PLAN.md` | `delivery/plans/2026-04-forecast-quality/REVIEW.md` |

Если фактические файлы ещё не перенесены в `delivery/plans/*`, можно временно использовать запись со ссылкой на legacy-артефакты, но это transitional-состояние, а не целевая модель.

## Текущее transitional-состояние

На момент переосмысления процесса в репозитории уже есть legacy-планы в `.sisyphus/plans/`:

| Legacy plan | Фактический статус | Следующее действие |
|---|---|---|
| `docs-domain-forecast-plan` | `done` | при необходимости перенести итог в canonical `delivery/plans/<plan>/PLAN.md` и `REVIEW.md` |
| `forecast-time-season-confidence-plan` | `done` | при необходимости перенести итог в canonical `delivery/plans/<plan>/PLAN.md` и `REVIEW.md` |

Для новых потоков такую схему уже использовать не нужно: сразу создавайте plan-папку внутри `apps/docs/docs/delivery/plans/`.

## Правила для `PLAN.md`

Каждый `PLAN.md` должен отвечать минимум на вопросы:

- зачем нужен этот поток;
- какие docs подтверждают решение;
- какие сервисы и файлы затрагиваются;
- что входит и что не входит в scope;
- как будет проверяться результат;
- какие риски и зависимости есть;
- что считается завершением.

## Правила для `REVIEW.md`

`REVIEW.md` обязателен для завершённого значимого потока. Он фиксирует:

- что реально было сделано;
- какие docs были обновлены;
- какие проверки выполнены (`docs:build`, `typecheck`, `build`, `test`, browser/manual QA);
- какие отклонения от `PLAN.md` возникли;
- какие follow-up задачи остались.

## Как соотносится roadmap

`roadmap.md` остаётся, но перестаёт быть operational-реестром. Его задача — ответить на вопрос **«в какие большие этапы развивается продукт?»**, а не «что сейчас делает конкретная агент-сессия».

## Transitional note про legacy-документы

- `backlog.md` больше не является каноническим местом декомпозиции новой работы;
- `task-state.md` больше не является каноническим operational-статусом;
- старые ссылки сохранены временно только для мягкого перехода.

## Что читать дальше

- [Шаблоны планов и review](templates.md)
- [Roadmap](../roadmap.md)
- [OmO Agent Workflow Playbook](../../agent-workflow/omo-playbook.md)
- [Develop start](../../develop-start.md)
