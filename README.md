# Fishing monorepo

Монорепозиторий приложения для рыболовов.

Подробная документация проекта находится в `apps/docs/docs/*` и открывается через docs-сервис.

## Быстрый старт

```bash
pnpm docker:dev
```

или

```bash
pnpm docker:rebuild
```

## Локальные адреса

- Web: `http://localhost:3010`
- Admin: `http://localhost:3012`
- API: `http://localhost:3001`
- Docs: `http://localhost:8000`

## Где смотреть детали

- Главная документации: `apps/docs/docs/index.md`
- Продукт: `apps/docs/docs/product-overview.md`
- Архитектура: `apps/docs/docs/architecture.md`
- Сервисы: `apps/docs/docs/services/*`
- Планирование: `apps/docs/docs/delivery/*`

## Важное правило

Если изменяется поведение системы, документация в `apps/docs/docs/*` обновляется в том же цикле работ.
