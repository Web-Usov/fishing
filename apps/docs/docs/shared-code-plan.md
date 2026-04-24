---
title: План разделяемого кода (web + mobile)
sidebar_position: 5
---

# План разделяемого кода (web + mobile)

Этот документ отвечает на вопрос: что должно быть общим между платформами, а что не нужно преждевременно тащить в shared-слой.

## Цель

Максимально переиспользовать домен, контракты и низкоуровневые UI/infra части между web и mobile, не ломая platform-specific UX.

## Текущее состояние shared-слоя

### Общие domain/contracts/client пакеты

- `packages/domain-geo`
- `packages/domain-bite-forecast`
- `packages/shared-zod`
- `packages/api-client`

### Общие UI-примитивы

- `packages/shared-ui`
- `packages/ui`

### Что уже стабилизировано как shared-подход

- доменная логика прогноза;
- схемы и контракты данных;
- weather normalization в `api-client`;
- часть UI-примитивов;
- конфигурации инструментов;
- общая документационная модель проекта.

## Что остаётся платформенно-специфичным

- routing/navigation;
- page/screen-level композиция;
- карта, жесты и provider-specific интеграции;
- browser/mobile runtime особенности;
- геолокационные ограничения платформ;
- user-facing interaction design конкретной платформы.

## Паттерн реализации

1. Сначала строить фичевую логику в shared packages там, где это оправдано.
2. Сначала стабилизировать контракт, потом UI-реализации по платформам.
3. Держать адаптеры тонкими.
4. Не тащить platform-conditionals в domain code.
5. Browser-only данные читать post-mount.
6. Внешние данные сначала нормализовать в общем клиентском/infra-слое, потом использовать в сервисах.

## Что нельзя выносить слишком рано

- конкретные страницы и screen flows;
- UX-композицию прогнозных экранов;
- admin-specific интерфейсы;
- карту как визуальную и interaction-реализацию;
- любые abstraction-слои, которые появляются только ради «красоты архитектуры».

## Следующие шаги shared-слоя

1. Общие forecast widgets.
2. Общие loading/error состояния там, где это действительно повторяется.
3. Shared hooks для query/data состояния.
4. Синхронизация дизайн-токенов между web и mobile.

## Политика документации

- Источник истины: `apps/docs/docs/*`.
- После каждого изменения обновляются релевантные документы в той же work cycle.
- Если меняются границы shared-vs-platform, этот документ обновляется обязательно.

## Связанные документы

- [Архитектура](architecture.md)
- [Web](services/web.md)
- [Mobile](services/mobile.md)
- [Backlog](delivery/backlog.md)
