# AGENTS: работа с документацией (`apps/docs`)

Этот файл описывает локальные правила для агентов, которые меняют документацию внутри `apps/docs`.

## 1. Что является каноном

- Каноническая документация проекта находится в `apps/docs/docs/*`.
- Root `AGENTS.md` задаёт глобальные правила работы по репозиторию.
- Этот файл задаёт локальные правила именно для документационного контура.

## 2. Как устроена документация

Текущая структура:

- `index.md` — входная точка со split по режимам чтения Product / Develop
- `product-start.md` — входной документ Product-режима
- `develop-start.md` — входной документ Develop-режима
- `product-overview.md` — бизнесовая/продуктовая картина
- `mvp-scope.md` — текущая граница поставляемого MVP
- `architecture.md` — общая техническая картина
- `shared-code-plan.md` — границы shared-слоя
- `agent-workflow/clean-code.md` — обязательный стандарт чистого кода
- `agent-workflow/clean-architecture.md` — обязательный стандарт архитектурных границ
- `services/*` — отдельные документы по сервисам
- `delivery/roadmap.md` — большие этапы развития
- `delivery/plans/index.md` — единый индекс delivery-потоков
- `delivery/plans/*` — канонические `PLAN.md` / `REVIEW.md` по каждому значимому потоку

Навигационно docs разделены на два режима:

- **Product**: `index.md`, `product-start.md`, `product-overview.md`, `mvp-scope.md`, `delivery/roadmap.md`
- **Develop**: `develop-start.md`, `architecture.md`, `shared-code-plan.md`, `agent-workflow/clean-code.md`, `agent-workflow/clean-architecture.md`, `services/*`, `delivery/plans/index.md`

## 3. Что обновлять при изменениях

- Меняется продуктовый смысл/ценность/сценарий → `product-overview.md`, `mvp-scope.md`
- Меняется система, runtime, infra, связи сервисов → `architecture.md` + service docs
- Меняются границы переиспользования → `shared-code-plan.md`
- Меняется конкретный сервис → соответствующий файл в `services/*`
- Меняется последовательность разработки, decomposition или ownership → `delivery/roadmap.md`, `delivery/plans/index.md` и релевантный `delivery/plans/<plan>/PLAN.md`
- Меняется навигация по docs → `index.md` и `sidebars.js`

## 4. Правила оформления

- Основной язык документации — русский.
- Заголовки должны быть предметными и конкретными.
- Технические имена сервисов, файлов, пакетов и библиотек оставлять в оригинале.
- Не плодить дубли: обновлять существующий релевантный документ, а не создавать конкурирующую правду.

## 5. Правила для roadmap и plan-first delivery

- `roadmap` хранит только большие этапы.
- `delivery/plans/index.md` хранит актуальную карту активных и завершённых потоков.
- `delivery/plans/<plan>/PLAN.md` хранит operational-план конкретного потока.
- `delivery/plans/<plan>/REVIEW.md` фиксирует итоговую проверку и evidence.

Если агент начинает новую значимую ветку работы, он должен создать или обновить `PLAN.md` и отразить поток в `delivery/plans/index.md`.

## 6. Проверка перед завершением

Обязательно:

```bash
pnpm docs:build
```

Если изменения затрагивают код, runtime или monorepo процессы, дополнительно:

```bash
pnpm typecheck
pnpm build
pnpm test
```

## 7. Локальный запуск документации

```bash
pnpm docs:serve
```

или через Docker:

```bash
pnpm docker:dev
```

## 8. Практическое правило

Документация здесь — не «описание после факта», а рабочая система управления проектом. Если изменение нельзя уверенно отразить в этой структуре, значит задача ещё не до конца осмыслена.

## 9. Обязательные стандарты для кодовых задач

Если в рамках work cycle меняется код (а не только docs), агент обязан следовать:

- `apps/docs/docs/agent-workflow/clean-code.md`
- `apps/docs/docs/agent-workflow/clean-architecture.md`

Отклонения допускаются только при явной фиксации в `delivery/plans/<plan>/PLAN.md` и последующей проверке в `REVIEW.md`.
