---
title: Task State
---

# Task State

Этот документ нужен для фиксации текущего состояния крупных блоков и для параллельной работы агент-сессий.

**Для кого:** Develop (в первую очередь) + Product (для прозрачности статусов).

**Навигация внутри delivery:** [Roadmap](roadmap.md) · [Backlog](backlog.md)

## Статусы

- `idea`
- `planned`
- `in_progress`
- `parallel`
- `blocked`
- `done`

## Текущее состояние блоков

### Прогноз клёва

- Статус: `in_progress`
- Причина: core loop уже реализован, но блок ещё развивается по качеству, mobile-переносу и стабильности.
- Допустимые параллельные потоки:
  - API/domain quality
  - Web UX
  - Mobile adaptation
  - Admin/support tooling

### Суточный и сезонный скоринг в модели прогноза

- Родительский блок: Прогноз клёва
- Статус: `done`
- Затрагиваемые сервисы: shared / docs / api
- Зависимости: `packages/domain-bite-forecast/src/index.ts`, `packages/domain-bite-forecast/tests/calculate-bite-forecast.spec.ts`
- Документы для обновления: `apps/docs/docs/bite-forecast-model.md`, `apps/docs/docs/domain-model.md`, `apps/docs/docs/delivery/task-state.md`
- Комментарий: добавлены факторы времени суток и сезонности, confidence переведён на правило по удалённости от 50, сохранён API-контракт и обновлена explainability-документация.

### Журнал улова

- Статус: `planned`

### История точек / избранное

- Статус: `planned`

### Социальный слой

- Статус: `idea`

### Platform maturity

- Статус: `in_progress`

### OmO Agent Workflow Playbook

- Родительский блок: Platform maturity
- Статус: `done`
- Затрагиваемые сервисы: docs
- Зависимости: `apps/docs/docs/develop-start.md`, `apps/docs/docs/index.mdx`
- Документы для обновления: `apps/docs/docs/agent-workflow/omo-playbook.md`, `apps/docs/sidebars.js`, `apps/docs/docs/delivery/task-state.md`
- Комментарий: добавлен практический playbook по выбору агентов, skills и режимов OmO для продуктивной работы в монорепозитории Fishing.

## Формат записи новой подзадачи

```md
### <Название подзадачи>

- Родительский блок: <например, Прогноз клёва>
- Статус: planned | in_progress | blocked | done
- Затрагиваемые сервисы: api / web / mobile / admin / shared / docs
- Зависимости: <если есть>
- Документы для обновления: <список>
- Комментарий: <что именно делает эта сессия>
```

## Практическое правило для агент-сессий

- если меняется продуктовый сценарий — обновлять `mvp-scope.md` и соответствующий service doc;
- если меняется архитектура/infra — обновлять `architecture.md` и релевантный service doc;
- если меняется sequencing/ownership/decomposition — обновлять `roadmap.md`, `backlog.md` или `task-state.md`.

## Что читать дальше

- [Объём MVP](../mvp-scope.md)
- [Архитектура](../architecture.md)
