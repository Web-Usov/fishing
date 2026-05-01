---
title: Backlog (deprecated)
---

# Backlog (deprecated)

Этот документ больше не является каноническим operational-слоем delivery.

## Что изменилось

Раньше backlog использовался для декомпозиции крупных user stories и технических блоков. В новой модели эта декомпозиция должна жить в конкретных `PLAN.md` внутри `delivery/plans/<plan>/`.

Причина проста: когда стратегия, execution-план и фактический статус разнесены по разным документам, агентам и разработчикам сложнее держать одну правду. Мы уходим к plan-first модели:

1. product / architecture docs;
2. `PLAN.md`;
3. реализация;
4. `REVIEW.md`.

## Что использовать вместо backlog

- для крупных направлений — [Roadmap](roadmap.md);
- для operational-координации — [Plans Index](plans/index.md);
- для конкретной декомпозиции — `delivery/plans/<plan>/PLAN.md`.

## Transitional note

Старые ссылки на backlog могут ещё встречаться в истории репозитория или старых work cycles. Для новой работы этот документ использовать не нужно.
