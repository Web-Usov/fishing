---
title: Task State (deprecated)
---

# Task State (deprecated)

Этот документ больше не является каноническим источником статуса для новых delivery-потоков.

## Что использовать вместо него

Новая operational-модель такая:

- стратегический уровень — [Roadmap](roadmap.md);
- индекс активных и завершённых потоков — [Plans Index](plans/index.md);
- источник истины по конкретному потоку — `delivery/plans/<plan>/PLAN.md`;
- post-implementation evidence — `delivery/plans/<plan>/REVIEW.md`.

## Почему task-state уходит на второй план

Когда текущий статус живёт отдельно от самого execution-плана и review-артефакта, появляется риск расхождения. Plan-first модель делает статус частью одного потока, а не отдельной таблицей рядом.

## Transitional note

Исторические записи из старых work cycles могут оставаться в истории репозитория, но для новой работы нужно:

1. создавать запись в [Plans Index](plans/index.md);
2. заводить отдельный `PLAN.md`;
3. закрывать поток через `REVIEW.md`.

## Что читать дальше

- [Plans Index](plans/index.md)
- [Plan & Review Templates](plans/templates.md)
- [Roadmap](roadmap.md)
