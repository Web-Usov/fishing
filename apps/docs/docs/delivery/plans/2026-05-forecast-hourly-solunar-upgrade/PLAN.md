---
title: Hourly solunar forecast upgrade (formula v1)
status: reviewed
plan_id: 2026-05-forecast-hourly-solunar-upgrade
owner: hephaestus-session
updated_at: 2026-05-06
services: [shared, api, web, docs]
docs:
  - product-start.md
  - develop-start.md
  - mvp-scope.md
  - bite-forecast-model.md
  - architecture.md
  - services/api.md
  - services/web.md
  - catch-journal.md
  - delivery/plans/index.md
review: REVIEW.md
---

# Hourly solunar forecast upgrade (formula v1)

## 1. Why

Текущая MVP-модель прогноза клёва даёт дневной индекс и базовую explainability, но не учитывает солунарные окна и работает с погодой как со снимком, а не как с почасовой динамикой. Это ограничивает практическую ценность сценария «когда именно ехать» и не создаёт удобную основу для будущей калибровки по логам уловов.

Цель потока: внедрить формульную **почасовую** модель (астрономия + свет + погодные тренды + сезонность), сохранить дневной индекс и уровни, добавить лучшие окна внутри суток и сделать выход модели пригодным для последующего перехода к data-driven калибровке.

## 2. Scope

### Входит

- Новый доменный расчёт `I_hour(t)` с последующей агрегацией `I_day`.
- Солунарный слой: major/minor окна на основе луны и транзитов.
- Световой слой: окна активности вокруг рассвета/заката.
- Погодный почасовой суб-индекс с трендами давления и ветра.
- Сезонный коэффициент (общий, без видо-специфики).
- Конфигурируемые коэффициенты/пороги (дефолт порога лучших окон = `72`).
- `confidence` на этапе 1 как функция полноты/качества входных данных.
- Explanation в двух формах: агрегированная строка + структурный `factors[]`.
- Локализация explainability на `ru` и `en`.
- Расширенный режим/debug в API-ответе с почасовой детализацией (без отдельного `v2` endpoint).
- Кэширование входных слоёв (погода/астрономия) и итогового расчёта.

### Не входит

- Учёт `water_type` и видо-специфическая логика (осознанно отложено).
- Обучаемая ML-модель и онлайн-обучение.
- Полноценный production-контур catch-log калибровки (только подготовка интерфейсов/расширяемости).
- Полная переработка UX поверх web/mobile hourly-таймлайна (UI адаптация только в объёме debug/расширенного режима).

## 3. Doc gates passed

- Подтверждены входные документы: `product-start.md`, `develop-start.md`.
- Подтверждён текущий MVP-контекст и ограничения: `mvp-scope.md`, `architecture.md`, `services/web.md`, `services/api.md`.
- Подтверждена текущая модель и её границы: `bite-forecast-model.md`.

До/вместе с реализацией должны быть синхронизированы:

- `bite-forecast-model.md` — переход от snapshot-дневной формулы к hourly layered formula v1.
- `services/api.md` — расширенный формат ответа (debug/hourly), `confidence` и explainability block.
- `services/web.md` — режимы потребления daily + расширенный debug, поведение окон клёва.
- `mvp-scope.md` — уточнить, что в MVP остаётся daily decision-loop, но расчёт внутри становится hourly.
- `catch-journal.md` — обновить интерфейс «прогноз → факт» под новые признаки и factor trace.
- `delivery/plans/index.md` — запись о новом потоке.

## 4. Architecture / product decisions

1. **Hourly-first inside, daily-compatible outside**
   - Внутренний движок считает почасовую активность.
   - Публичный daily-контур сохраняется как базовый, hourly выдаётся в расширенном/debug режиме.

2. **Слои расчёта с явными границами**
   - `AstronomyLayer` (луна/транзиты/окна), `LightLayer` (рассвет/закат), `MeteoLayer` (почасовой индекс + тренды), `SeasonLayer`, `AggregationLayer`, `ExplanationLayer`.

3. **Осознанное упрощение по водоёму**
   - `water_type` не участвует в формуле этапа 1.
   - В архитектуре закладывается extension seam для этапов 2/3.

4. **Drift-control против baseline**
   - Допустимый дрейф нового `I_day` против текущего baseline:
     - средний дрейф не более `±10` баллов;
     - смена текстового уровня не чаще `20–25%` дней на историческом пересчёте.

5. **Confidence как quality signal уже в v1**
   - Confidence зависит не только от удалённости score от центра, но и от полноты входных данных и деградации факторов.

6. **Config-driven tuning**
   - Пороги, множители и веса выносятся в конфиг с валидацией схемой; дефолт порога лучших окон `72`.

7. **Dual explanation contract**
   - Сохраняется агрегированная строка для отчёта.
   - Добавляется структурный `factors[]` для UI и отладки.

8. **Provider-agnostic weather/astronomy adapters**
   - Конкретные сервисы выбираются при реализации, но контракт входных полей фиксируется заранее.

## 5. Implementation plan

### F1 — Contract & formula spec freeze

1. Утвердить формулы и диапазоны:
   - `I_hour(t) = clip(I_meteo(t) * K_sol(t) * K_light(t) * K_season, 0..100)`.
   - `I_day = 0.7 * I_day_max + 0.3 * I_day_mean(>= threshold)`.
2. Зафиксировать default-порог лучших окон = `72` (config).
3. Зафиксировать API-расширение без отдельного `v2`.

### F2 — Hourly meteo + trend engine

1. Ввести hourly weather input contract (1–3h step).
2. Реализовать `I_meteo(t)` с компонентами:
   - pressure comfort corridor + penalty за `|ΔP|` (6–12ч lookback);
   - season-aware temperature comfort;
   - wind speed + trend/volatility;
   - clouds/precipitation effects.
3. Нормировать в `0..100` и добавить factor trace.

### F3 — Astronomy/light layer

1. Подключить astronomy adapter (sunrise/sunset, moon phase, moonrise/moonset, transit high/low).
2. Рассчитать major/minor solunar windows и `K_sol(t)`.
3. Рассчитать окна вокруг рассвета/заката и `K_light(t)`.
4. Добавить fallback-политику при неполных astronomy данных (с quality downgrade).

### F4 — Aggregation, windows, confidence

1. Считать `I_hour` для всего дня.
2. Собирать `best_windows[]` как непрерывные интервалы `I_hour >= threshold`.
3. Рассчитать `I_day`, уровень и confidence с учётом качества входных данных.
4. Присваивать теги окнам (`solunar`, `sunrise`, `stable_pressure`, и т.д.).

### F5 — API and client compatibility

1. Сохранить текущий daily response path.
2. Добавить расширенный/debug блок с hourly breakdown и окнами.
3. Добавить `factors[]` и агрегированную строку explanation (RU/EN).
4. Обновить `api-client` и web-потребление расширенного режима без ломки baseline UX.

### F6 — Cache, perf, observability

1. Кэш weather/astronomy (TTL 1–3ч).
2. Кэш итогового прогноза до смены входных данных.
3. Логи и debug trace: `engine_version`, `config_version`, factor breakdown.
4. Проверить SLA: 7 дней по одной координате ≤ 1–2 секунды при кэшированных входах.

### F7 — Drift validation and rollout gate

1. Dual-run: старый baseline vs новый расчёт на исторических срезах.
2. Проверить drift constraints (`±10`, 20–25% level-change cap).
3. Принять решение о включении нового расчёта по результатам evidence.

## 6. Files / modules

Планируемые зоны изменений:

- `packages/domain-bite-forecast/src/*` (новый layered hourly kernel)
- `packages/domain-bite-forecast/tests/*`
- `packages/shared-zod/src/index.ts` (расширение контрактов debug/hourly/factors)
- `packages/api-client/src/index.ts`
- `apps/api/src/modules/forecast/*`
- `apps/api/tests/*` (unit/integration/e2e for extended contract)
- `apps/web/app/components/FishingDemo.tsx` и связанные UI/adapters расширенного режима
- `apps/web/app/api/weather/forecast/route.ts` (если потребуется расширение hourly payload)
- `apps/docs/docs/bite-forecast-model.md`
- `apps/docs/docs/mvp-scope.md`
- `apps/docs/docs/services/api.md`
- `apps/docs/docs/services/web.md`
- `apps/docs/docs/catch-journal.md`

Нельзя ломать:

- базовый endpoint `/forecast/calculate`;
- существующий daily-контур web UX;
- валидацию request/response через shared Zod;
- честное поведение без synthetic-прогноза при недоступности критичных входных данных.

## 7. Risks and dependencies

- Риск drift по дневным баллам и уровням при переходе на hourly-агрегацию.
- Риск деградации latency без кэша на astronomy/weather слоях.
- Риск нестабильного explanation при множестве новых факторов.
- Риск неполных/неровных входных данных при шаге 3 часа и смешанных провайдерах.
- Зависимость от выбора weather и astronomy провайдеров с гарантированными полями.
- Риск переусложнения этапа 1 задачами этапов 2/3 (water_type/species/ML).

Контрмеры:

- dual-run + drift-gates;
- config validation + safe defaults;
- quality flags/confidence downgrade;
- feature-flagged expanded/debug output;
- строгая этапность и фиксация non-goals.

## 8. Validation

- `pnpm docs:build`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- unit-тесты доменной формулы по слоям (`meteo`, `solunar`, `light`, `season`, `aggregation`)
- contract-тесты API (daily baseline + expanded/debug)
- drift validation report against baseline (исторический прогон)
- perf-проверка SLA (7 дней ≤ 1–2 сек при warm cache)
- ручная проверка RU/EN explainability и корректности window tags

## 9. Definition of done

- Реализован hourly расчёт с солунарными и световыми окнами, погодными трендами и сезонностью.
- Сохранены daily индекс `0..100` и уровни (`слабый/средний/хороший/отличный`).
- В ответе доступны две формы explainability: строка + `factors[]` (RU/EN).
- Добавлены `best_windows[]` с `from/to/peak_score/tags`.
- Добавлен confidence как функция полноты/качества данных.
- Все коэффициенты/пороги вынесены в конфиг, default threshold лучших окон = `72`.
- Выполнены drift-критерии (`±10` mean drift, `<=25%` level-switch frequency).
- Документация синхронизирована с фактическим поведением.
- Оформлен `REVIEW.md` с evidence после реализации.
