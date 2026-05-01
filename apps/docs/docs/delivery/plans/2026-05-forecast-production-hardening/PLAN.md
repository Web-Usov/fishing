---
title: Forecast production hardening (без waterbodyType)
status: implemented
plan_id: 2026-05-forecast-production-hardening
owner: hephaestus-session
updated_at: 2026-05-01
services: [shared, api, web, docs]
docs:
  - mvp-scope.md
  - bite-forecast-model.md
  - services/api.md
  - services/web.md
review: REVIEW.md
---

# Forecast production hardening (без waterbodyType)

## 1. Why

Текущий прогноз клёва стабилен на уровне MVP, но не соответствует целевому критерию «production-ready без заглушек/подставных данных». В погодном pipeline есть fallback-сценарии и placeholder-значения, а фактор `waterbodyType` добавляет дополнительный шум и зависимость от слабонадежного определения типа водоёма на фронте.

Цель потока: повысить надёжность и предсказуемость прогноза, убрать `waterbodyType` из вычислений и UI, а также перевести поведение системы в режим «только валидные входные данные без synthetic fallback в расчёте».

## 2. Scope

### Входит

- Удаление `waterbodyType` из доменного расчёта и explainability-контекста.
- Удаление `waterbodyType` из API/shared-контракта и клиентского payload.
- Удаление визуального отображения и runtime-логики, связанной с `waterbodyType` в web.
- Жёсткая стратегия работы с погодными данными: без синтетической генерации в продовом контуре расчёта.
- Обновление docs и тестов под новую модель.

### Не входит

- Переобучаемая ML-модель прогноза.
- Новый внешний погодный провайдер.
- Реализация полноценных fish-species/батиметрических факторов.

## 3. Doc gates passed

- Подтверждены входные документы: `product-start.md`, `develop-start.md`.
- Подтверждён контекст MVP: `mvp-scope.md` (допускает fallback как временный режим).
- Подтверждён текущий roadmap-фокус: этап стабилизации прогнозного продукта.

Перед реализацией нужно обновить/уточнить:

- `mvp-scope.md` — убрать двусмысленность про synthetic fallback в целевом режиме.
- `bite-forecast-model.md` — факторная модель: 9 → 8 факторов, без `waterbodyType`.
- `services/api.md` и `services/web.md` — обновить runtime-поток и контракт запроса.

## 4. Architecture / product decisions

1. **Убираем фактор `waterbodyType` полностью**
   - из `packages/domain-bite-forecast`;
   - из `packages/shared-zod` request schema;
   - из payload, собираемого в web.

2. **Прогноз считается только при валидной погодной серии**
   - если реальная погода недоступна или неполна, не подставляем synthetic weather в расчёт;
   - UI показывает явную ошибку/деградацию без фейкового прогноза.

3. **Placeholder по луне закрывается как техдолг потока**
   - либо добавляем реальный источник/вычисление `moonIlluminationPct`,
   - либо временно исключаем фактор луны из формулы до появления достоверных данных.

Выбор между двумя вариантами по луне фиксируется отдельным ADR в рамках этого плана (при необходимости).

## 5. Implementation plan

1. **Контракты и домен**
   - Обновить `biteForecastRequestSchema` и типы: убрать `waterbodyType`.
   - Обновить `calculateBiteForecast`: удалить `scoreWaterbody(...)` и связанные label.
   - Пересмотреть baseline/пороги confidence при уменьшении числа факторов (если потребуется по тестам).

2. **API-слой**
   - Обновить e2e payload в `apps/api/tests/forecast.e2e.spec.ts`.
   - Проверить, что `ForecastController`/`ForecastService` не ожидают `waterbodyType`.

3. **Web-слой**
   - Удалить `resolveWaterbodyTypeFromReality(...)` и связанные типы/поля отображения.
   - Удалить synthetic weather fallback (`estimateWeatherByCoordinates`) из боевого сценария расчёта.
   - При отсутствии валидной погодной серии переводить экран в «нет достоверных данных для расчёта».

4. **Weather data integrity**
   - Убрать placeholder-подстановки, маскирующие отсутствие данных в прогнозе.
   - Закрыть `moonIlluminationPct` (реальные данные или исключение фактора).

5. **Документация и review**
   - Синхронно обновить docs из секции Doc gates.
   - После реализации оформить `REVIEW.md` с evidence.

## 6. Files / modules

- `packages/shared-zod/src/index.ts`
- `packages/domain-bite-forecast/src/index.ts`
- `packages/api-client/src/index.ts`
- `apps/api/src/modules/forecast/*`
- `apps/api/tests/forecast.e2e.spec.ts`
- `apps/web/app/components/FishingDemo.tsx`
- `apps/web/app/components/locale/LocaleProvider.tsx` (строки UX про fallback)
- `apps/docs/docs/mvp-scope.md`
- `apps/docs/docs/bite-forecast-model.md`
- `apps/docs/docs/services/api.md`
- `apps/docs/docs/services/web.md`

Нельзя ломать:

- `/forecast/calculate` как endpoint (маршрут сохраняется);
- валидацию request/response через shared Zod;
- совместимость фронта и API в рамках одного PR.

## 7. Risks and dependencies

- Риск просадки UX при отключении synthetic fallback (меньше «всегда доступных» прогнозов).
- Риск регрессии score distribution после удаления `waterbodyType`.
- Зависимость от качества/доступности погодного провайдера.
- Необходимость продуктового согласования: лучше честный «нет данных» вместо псевдопрогноза.

## 8. Validation

- `pnpm docs:build`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- e2e smoke `/forecast/calculate` с новым контрактом
- ручная web-проверка сценария:
  - валидная погода → прогноз строится;
  - недоступная/неполная погода → честная ошибка без synthetic прогноза.

## 9. Definition of done

- `waterbodyType` отсутствует в контракте, коде расчёта и UI.
- В runtime нет synthetic weather fallback для формирования прогноза.
- Нет placeholder-данных, влияющих на расчёт прогноза (включая луну).
- Тесты и сборки проходят.
- Docs синхронизированы с фактическим поведением.
- Заполнен `REVIEW.md` с evidence.
