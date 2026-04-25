# AGENTS Guide (Fishing Monorepo)

Этот файл задаёт правила работы агентов в репозитории.

## 1. Источник истины

- Каноническая документация проекта находится в `apps/docs/docs/*`.
- Основные документы, от которых агент должен отталкиваться:
  - `apps/docs/docs/index.mdx` — главная страница с картой документации
  - `apps/docs/docs/product-start.md` — входная точка для продуктовых задач
  - `apps/docs/docs/develop-start.md` — входная точка для технических задач
  - `apps/docs/docs/product-overview.md`
  - `apps/docs/docs/mvp-scope.md`
  - `apps/docs/docs/architecture.md`
  - `apps/docs/docs/shared-code-plan.md`
  - `apps/docs/docs/delivery/roadmap.md`
  - `apps/docs/docs/delivery/backlog.md`
  - `apps/docs/docs/delivery/task-state.md`
- Если описание в коде, заметках или root-level документах расходится с `apps/docs/docs/*`, приоритет у `apps/docs/docs/*`.

## 2. Карта репозитория

- `apps/web` — публичный web-клиент
- `apps/mobile` — mobile-клиент на Expo
- `apps/admin` — административная поверхность
- `apps/api` — HTTP API
- `apps/docs` — документационный сервис (Docusaurus)
- `packages/domain-bite-forecast` — доменная логика прогноза клёва
- `packages/domain-geo` — доменная логика геолокации
- `packages/api-client` — типизированный HTTP-клиент к API
- `packages/db` — Drizzle-схема и клиент базы данных
- `packages/shared-ui` — shared UI-компоненты
- `packages/shared-zod` — shared Zod-схемы и контракты
- `packages/ui` — базовые UI-примитивы
- `packages/config-eslint` — shared ESLint-конфиг
- `packages/config-prettier` — shared Prettier-конфиг
- `packages/config-typescript` — shared TypeScript-конфиг
- `docker-compose.yaml` — локальная инфраструктура и контейнерный dev/runtime контур

## 3. Обязательный порядок работы агента

1. Определить тип задачи и прочитать соответствующий входной документ:
   - **Продуктовая задача** (сценарий, UX, бизнес-логика, roadmap) → начать с `apps/docs/docs/product-start.md`
   - **Техническая задача** (код, архитектура, инфра, контракты, сервисы) → начать с `apps/docs/docs/develop-start.md`
   - **Смешанная** → читать оба
2. Следовать ссылкам из входного документа и дочитать релевантные docs.
3. Определить, к какому верхнеуровневому блоку относится задача:
   - продукт/сценарий;
   - архитектура/infra;
   - конкретный сервис;
   - roadmap/backlog/task-state.
4. Проверить `delivery/task-state.md`, нет ли пересечения с уже активным потоком.
5. Выполнить изменение в коде или документации.
6. Обновить релевантные документы в `apps/docs/docs/*` в той же work cycle.
7. Выполнить проверку (`docs:build`, а при необходимости `typecheck/build/test`).
8. В финальном отчёте явно перечислить, какие документы были обновлены.

## 4. Как агенту работать с roadmap/backlog/task-state

- `roadmap.md` — большие этапы, не для ежедневной детализации.
- `backlog.md` — декомпозиция на крупные user stories и технические блоки.
- `task-state.md` — актуальное состояние и точка координации между параллельными сессиями.

Если задача:

- меняет продуктовый сценарий — обновить `mvp-scope.md` и/или `product-overview.md`;
- меняет архитектуру, runtime, infra или связи сервисов — обновить `architecture.md` и service docs;
- меняет decomposition, sequencing или ownership — обновить `roadmap.md`, `backlog.md`, `task-state.md`.

## 5. Параллельная работа агентов

- По возможности одна агент-сессия должна брать один логический блок или одну подзадачу из backlog.
- Для многосервисных изменений ownership делится по сервисам или по отдельным документам/модулям.
- Перед началом новой параллельной ветки агент обязан проверить, что не конфликтует с существующим task-state.
- Если агент берёт новый поток, он должен явно обновить `task-state.md`.

## 6. Что проверять перед завершением

- Изменение соответствует актуальной документации.
- Документация обновлена вместе с изменением.
- Все новые маршруты, env, UX-правила и ограничения отражены в docs.
- Если менялась документация — `pnpm docs:build` обязателен.
- Если менялась навигация или MDX-структура — дополнительно проверить визуально через `pnpm docs:serve`.
- Если менялся код — запускать релевантные `typecheck/build/test`.

## 7. Минимальный набор команд

- `pnpm install` — установка зависимостей (обязательно в новом окружении)
- `pnpm docs:serve` — локальный запуск документации для визуальной проверки
- `pnpm docs:build` — сборка документации (обязательна после любых правок docs)
- `pnpm typecheck` — проверка типов
- `pnpm build` — сборка всех пакетов и приложений
- `pnpm test` — запуск тестов
- `pnpm docker:dev` — локальный запуск через Docker
- `pnpm docker:rebuild` — пересборка Docker-образов

## 8. Scope discipline

- Делать только то, что запросил пользователь.
- Не придумывать новые фичи без явного запроса.
- Не считать документацию вторичной: если поведение меняется, docs меняются обязательно.
