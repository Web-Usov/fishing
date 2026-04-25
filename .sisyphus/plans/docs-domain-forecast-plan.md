# План: документация по доменной модели, модели прогноза и журналу улова

## Execution checklist (tracker-compatible)

- [x] Проверить контекст и ограничения
- [x] Подготовить `domain-model.md`
- [x] Подготовить `bite-forecast-model.md`
- [x] Подготовить `catch-journal.md`
- [x] Обновить `product-overview.md`
- [x] Обновить sidebar и прогнать `pnpm docs:build`

_Источник: вывод subagent `plan` по запросу на 4 документационные задачи._

## 1) Scope confirmation

Покрываем только документационные изменения в `apps/docs/docs/*` и навигацию docs:

1. Новый документ `domain-model.md`.
2. Новый документ `bite-forecast-model.md`.
3. Новый документ `catch-journal.md` + ссылка из `product-overview.md`.
4. Расширение сегментов и сценариев в `product-overview.md`.
5. Обновление sidebar (`apps/docs/sidebars.js`) для доступности новых страниц.

## 2) Пошаговый план (execution order)

1. [x] **Проверить контекст и ограничения**
   - Сверить с `apps/docs/docs/product-start.md`, `apps/docs/docs/develop-start.md`.
   - Проверить пересечения в `apps/docs/docs/delivery/task-state.md`.

2. [x] **Сделать доменную опору (`domain-model.md`)**
   - Добавить фронтматтер (`title: Доменная модель`, `sidebar_position` в продуктовой секции).
   - Описать сущности: `Waterbody`, `Spot`, `Forecast`, `Trip/Session`, `Catch`.
   - Для каждой: назначение, high-level атрибуты, ключевые связи.
   - Добавить блок про соотношение с MVP: сейчас в реализации только `Spot` (координатный уровень) и `Forecast`; `Trip/Catch/Waterbody` — target-модель в docs.

3. [x] **Зафиксировать текущую модель прогноза (`bite-forecast-model.md`)**
   - Добавить фронтматтер (`title: Модель прогноза клёва`, `sidebar_position: 7`).
   - Описать входные данные, факторы, расчёт `score/level/confidence`, ограничения.
   - Сохранить соответствие текущей реализации `@fishing/domain-bite-forecast`.

4. [x] **Описать будущий журнал улова (`catch-journal.md`)**
   - Добавить фронтматтер (`title: Журнал улова и калибровка модели`, `sidebar_position: 8`).
   - Описать роль журнала, связи с доменной моделью, контур калибровки и ограничения этапа MVP.

5. [x] **Обновить `product-overview.md`**
   - Расширить «Для кого продукт» до 3–4 архетипов.
   - Добавить раздел «Сценарии использования по сегментам» (MVP сейчас + future слой).
   - Расширить блок про «Журнал улова» ссылкой на `catch-journal.md`.
   - Проверить «Что читать дальше»: `mvp-scope.md`, `domain-model.md`, `catch-journal.md`.

6. [x] **Обновить sidebar и верифицировать docs**
   - Внести новые страницы в `apps/docs/sidebars.js`.
   - Запустить `pnpm docs:build`.

## 3) File change matrix

- **Создать** `apps/docs/docs/domain-model.md`
  - Сущности + связи + MVP alignment.

- **Создать** `apps/docs/docs/bite-forecast-model.md`
  - Назначение, входы, факторы, расчёт, ограничения, связанные документы.

- **Создать** `apps/docs/docs/catch-journal.md`
  - Роль журнала, связка `forecast -> conditions -> result`, калибровка, приоритеты этапов.

- **Изменить** `apps/docs/docs/product-overview.md`
  - Сегменты (архетипы), сценарии по сегментам, ссылки на новые docs.

- **Изменить** `apps/docs/sidebars.js`
  - Добавить новые документы в навигацию Docusaurus.

## 4) Validation plan

Минимум:

```bash
pnpm docs:build
```

Доп. sanity-check:

- Проверить, что новые документы доступны в sidebar.
- Проверить, что ссылки между docs не битые.
- Проверить согласованность заявлений с `mvp-scope.md`.

### QA-сценарии по задачам (tool / steps / expected)

1. **Задача 1 — `domain-model.md`**
   - **Tool**: `pnpm docs:build` + визуальная проверка через docs preview (`pnpm docs:serve` при необходимости).
   - **Steps**:
     1) Создать `apps/docs/docs/domain-model.md`.
     2) Добавить документ в `apps/docs/sidebars.js`.
     3) Запустить `pnpm docs:build`.
     4) Открыть страницу и убедиться, что сущности и связи отображаются.
   - **Expected**:
     - Сборка успешна (exit code 0).
     - Страница доступна в sidebar.
     - Есть блок про соответствие MVP (Spot/Forecast сейчас; Trip/Catch/Waterbody — target).

2. **Задача 2 — `bite-forecast-model.md`**
   - **Tool**: `pnpm docs:build` + ручная сверка с `packages/domain-bite-forecast/src/index.ts`.
   - **Steps**:
     1) Создать документ с нужной структурой.
     2) Проверить, что диапазоны/impact/score-level-confidence описаны без расхождений с кодом.
     3) Запустить `pnpm docs:build`.
   - **Expected**:
     - Сборка успешна.
     - В документе есть все факторы, формула score и правила level/confidence.
     - Ограничения явно перечислены и не противоречат текущей реализации.

3. **Задача 3 — `catch-journal.md` + update `product-overview.md`**
   - **Tool**: `pnpm docs:build` + проверка внутренних markdown-ссылок.
   - **Steps**:
     1) Создать `catch-journal.md`.
     2) Добавить ссылку на документ в разделе «Журнал улова» в `product-overview.md`.
     3) Убедиться, что в тексте явно сказано: это future-слой, не MVP.
     4) Запустить `pnpm docs:build`.
   - **Expected**:
     - Сборка успешна.
     - Ссылки из `product-overview.md` в `catch-journal.md` рабочие.
     - Чётко зафиксировано, что журнал пока не реализован в MVP.

4. **Задача 4 — сегменты и сценарии в `product-overview.md`**
   - **Tool**: `pnpm docs:build` + контент-проверка по чеклисту.
   - **Steps**:
     1) Расширить «Для кого продукт» до 3–4 архетипов.
     2) Добавить раздел «Сценарии использования по сегментам» (по 3–5 шагов на архетип).
     3) Проверить «Что читать дальше»: ссылки на `mvp-scope.md`, `domain-model.md`, `catch-journal.md`.
     4) Запустить `pnpm docs:build`.
   - **Expected**:
     - Сборка успешна.
     - Есть 4 понятных архетипа и сценарии MVP/future.
     - Раздел «Что читать дальше» содержит все требуемые ссылки.

## 5) Definition of done

- Новые docs созданы и видны в навигации.
- `product-overview.md` обновлён по сегментам/сценариям и ссылкам.
- Описание модели прогноза не расходится с текущей реализацией.
- Ограничения MVP и future-слоя сформулированы явно.
- `pnpm docs:build` проходит успешно.

---

## Уточнения из фактического scan-а репозитория

### Терминология

- В `domain-model.md` явно указать соответствие: `Spot` (продуктовый термин) ↔ существующий тех. термин `FishingPoint`/«точка», чтобы избежать drift в именах.

### Точные правила модели в текущей реализации

Источник: `packages/domain-bite-forecast/src/index.ts`.

- Давление: `1008..1022 => +12`, иначе `-10`.
- Ветер: `<=3 => +10`, `<=7 => +2`, иначе `-12`.
- Температура: `12..22 => +11`, `5..28 => +3`, иначе `-14`.
- Облачность: `20..70 => +6`, иначе `0`.
- Осадки: `0 => +4`, `<2 => +1`, иначе `-8`.
- Луна: `25..75 => +5`, иначе `-3`.
- Тип водоёма: `lake +5`, `reservoir +3`, `pond +2`, `river 0`.

Итоги:

- `score = clamp(round(50 + sum(impacts)), 0..100)`.
- `level`: `excellent >=80`, `good >=60`, `moderate >=40`, иначе `poor`.
- `confidence`: `high` при `score >=70 || score <=30`; `medium` при `score >=45`; иначе `low`.

### Risk checks

- Не утверждать, что `Trip`/`Catch` уже реализованы в коде.
- Не заявлять как текущие возможности: species-specific модель, сезонность, self-learning/региональная калибровка.
- Все утверждения «что есть в MVP сейчас» сверять с `apps/docs/docs/mvp-scope.md`.

### Рекомендованная последовательность коммитов (когда дойдёт до реализации)

1. `docs(domain): add domain model and bite forecast model docs`
2. `docs(product): add catch journal doc and expand product overview scenarios`
3. `docs(nav): wire new product docs in sidebar and pass docs build`
