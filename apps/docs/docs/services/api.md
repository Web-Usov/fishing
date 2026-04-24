---
title: API
---

# API

## Назначение

`apps/api` — серверный HTTP-сервис приложения. Он предоставляет клиентам стабильную серверную границу, принимает запросы, валидирует контекст и вызывает доменный слой.

## Доменный смысл и зона ответственности

Сейчас API покрывает прогноз клёва. В будущем сюда должны быть добавлены модули журнала улова, пользовательских данных, социальных сценариев и административных контуров.

## Входы и выходы

- **Входы:** HTTP-запросы от `apps/web`, в будущем от `apps/mobile` и внутренних admin-сценариев.
- **Выходы:** типизированные ответы по shared-контрактам (текущий основной контур — forecast).
- Детализация runtime-потока и связей с сервисами — в [Архитектуре](../architecture.md).

## Внутренняя структура

- bootstrap/runtime в `main.ts`;
- модуль прогнозного сценария в `modules/forecast/*`;
- orchestration через service layer;
- shared contracts и domain packages вне самого API-приложения.

## Стек

- `NestJS`
- `TypeScript`
- `Zod`
- `Vitest`

## Паттерны

- thin controller;
- orchestration в service layer;
- shared contracts как основной источник структуры запроса/ответа;
- доменная логика по возможности хранится в packages, а не внутри API.

## Зависимости

- `packages/domain-bite-forecast`, `packages/domain-geo`;
- `packages/shared-zod`;
- `packages/api-client` (клиентский слой использует контракты API);
- `postgres` через Prisma-слой в `packages/db` для будущих persisted-модулей.

## Инфраструктура

- отдельный сервис `api` в Docker Compose;
- зависимость от `postgres`;
- LAN-доступ для локальной работы.

## Тестирование и качество

- build/typecheck обязательны;
- e2e smoke для forecast endpoint;
- новые доменные модули должны приходить с контрактными и runtime-проверками.

## Что важно при развитии

- не дублировать доменную логику, которую можно держать в shared;
- не смешивать внешние интеграции и бизнес-смысл без границ;
- документировать новые модули одновременно в docs и backlog.

## Типовые сценарии изменений

- Добавить endpoint: контракт (shared-zod) → service orchestration → thin controller → smoke/e2e.
- Изменить структуру ответа: сначала обновить shared-контракты, затем runtime и клиентов.
- Добавить доменный модуль: по возможности вынести логику в `packages/domain-*`, а в API оставить orchestration.

## Что читать дальше

- [Архитектура](../architecture.md)
- [План разделяемого кода](../shared-code-plan.md)
- [Backlog](../delivery/backlog.md)
- [Task State](../delivery/task-state.md)
