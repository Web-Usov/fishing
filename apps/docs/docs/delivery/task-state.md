---
title: Task State
---

# Task State

Этот документ нужен для фиксации текущего состояния крупных блоков и для параллельной работы агент-сессий.

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

### Журнал улова

- Статус: `planned`

### История точек / избранное

- Статус: `planned`

### Социальный слой

- Статус: `idea`

### Platform maturity

- Статус: `in_progress`

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
