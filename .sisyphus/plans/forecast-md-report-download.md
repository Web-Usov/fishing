# Forecast 7-day Markdown Report Download

## TL;DR
> **Summary**: Добавляем кнопку скачивания локализованного Markdown-отчёта рядом с 7-дневным прогнозом для выбранной точки. Отчёт формируется client-side из текущих данных `FishingDemo`.
> **Deliverables**:
> - Кнопка Download Report в forecast panel
> - Локализованный MD builder (RU/EN)
> - Browser download flow (Blob/object URL)
> - Web test setup + unit/integration tests + Playwright QA scenario
> **Effort**: Medium
> **Parallel**: YES - 2 waves
> **Critical Path**: T1 (spec + keys) → T2 (MD builder) → T3 (UI/download wiring) → T5 (tests)

## Context
### Original Request
Добавить рядом с прогнозом на 7 дней кнопку скачивания подробного отчёта прогноза выбранной точки в MD-формате с учётом текущей локали.

### Interview Summary
- Отчёт включает **все 7 дней**.
- Используется **полный шаблон** (метаданные точки/локали/времени + 7 дней + детали факторов + дисклеймер).
- В этом же потоке включаем **web test setup + unit/integration + agent QA**.

### Metis Review (gaps addressed)
- Зафиксированы guardrails против scope creep (никаких PDF/CSV/server storage).
- Явно выбран источник локализации: `useLocale().t(...)` + новые словарные ключи.
- Добавлен отдельный pure markdown builder для тестируемости и стабильного формата.
- Добавлены негативные сценарии: отсутствие выбранной точки/неполная серия прогноза.

## Work Objectives
### Core Objective
Дать пользователю возможность скачивать корректный локализованный 7-дневный прогноз выбранной точки в `.md`, без изменения API-контуров.

### Deliverables
- UI-кнопка скачивания в `FishingDemo` рядом с `forecast_7d`.
- Новый модуль report builder (pure function) + download helper.
- Локализованные ключи для заголовков отчёта, секций, дисклеймера и filename prefix.
- Полный test setup для `apps/web` и тесты на builder + download flow.

### Definition of Done (verifiable)
- `pnpm --filter @fishing/web typecheck` проходит.
- `pnpm --filter @fishing/web test` проходит.
- `pnpm test` проходит без регрессий в монорепо.
- Кнопка недоступна при отсутствии валидных данных и активна при наличии 7 дней.
- Скачиваемый файл имеет `.md` и локализованное содержимое (RU/EN).

### Must Have
- Отчёт по **всем 7 дням**.
- Локализация на базе текущей `locale` из `LocaleProvider`.
- Явный `URL.revokeObjectURL` cleanup.

### Must NOT Have
- Нет PDF/CSV/email/export history.
- Нет server-side хранения отчётов.
- Нет изменений API endpoint’ов и доменной модели.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after + new web test framework (Vitest + RTL) + Playwright QA scenario
- QA policy: Каждый task включает автоматические критерии и failure path
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
Wave 1: спецификация формата и инфраструктурная подготовка тестов
- T1 report contract & i18n key map
- T4 web test setup

Wave 2: реализация и проверки
- T2 markdown builder
- T3 UI + download integration
- T5 web unit/integration tests
- T6 Playwright QA scenario

### Dependency Matrix
- T1 blocks T2, T3, T5
- T4 blocks T5
- T2 blocks T3, T5, T6
- T3 blocks T6

### Agent Dispatch Summary
- Wave 1: 2 tasks (`unspecified-high`, `quick`)
- Wave 2: 4 tasks (`visual-engineering`, `quick`, `unspecified-high`)

## TODOs

- [x] 1. Define report contract and localization key set

  **What to do**:
  - Зафиксировать структуру markdown (sections order):
    1) title, 2) generation metadata, 3) selected point metadata, 4) 7-day summary table/list,
    5) per-day details (score/level/confidence/explanation/factors), 6) disclaimer.
  - Добавить ключи в `apps/web/app/components/locale/LocaleProvider.tsx` для всех секций, labels и filename prefix.
  - Зафиксировать формат filename: `{prefix}-{lat}-{lng}-{YYYY-MM-DD}-{locale}.md` (sanitize non-latin and symbols).

  **Must NOT do**:
  - Не хардкодить строки секций напрямую в `FishingDemo`.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: ограниченный объём в одном модуле словаря
  - Skills: `[]`
  - Omitted: `frontend-ui-ux` - не требуется дизайн-переосмысление

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T2,T3,T5 | Blocked By: none

  **References**:
  - Pattern: `apps/web/app/components/locale/LocaleProvider.tsx` - текущая typed dictionary модель
  - Pattern: `apps/web/app/components/FishingDemo.tsx` - текущие localized labels и locale-aware formatting

  **Acceptance Criteria**:
  - [ ] Все новые report keys типизированы и доступны через `t(key)`.
  - [ ] Filename policy задокументирован в коде (helper const/comments) и используется downstream.

  **QA Scenarios**:
  ```
  Scenario: Locale keys wired
    Tool: Bash
    Steps: pnpm --filter @fishing/web typecheck
    Expected: 0 ошибок типов по новым locale keys
    Evidence: .sisyphus/evidence/task-1-locale-keys.txt

  Scenario: Missing key safety
    Tool: Bash
    Steps: pnpm --filter @fishing/web test
    Expected: Нет runtime падений из-за undefined translation keys
    Evidence: .sisyphus/evidence/task-1-locale-keys-test.txt
  ```

  **Commit**: YES | Message: `feat(web): define localized markdown report contract` | Files: `apps/web/app/components/locale/LocaleProvider.tsx`

- [x] 2. Implement pure markdown report builder module

  **What to do**:
  - Создать модуль (например `apps/web/app/components/forecast-report.ts`) с pure function:
    `buildForecastMarkdownReport(input)`.
  - Input включает: `selectedLocation`, `forecastDays(7)`, `locale`, generation timestamp.
  - Output: строгая markdown строка по контракту из T1.
  - Использовать locale-aware date/time formatting (`Intl.DateTimeFormat` based on locale).

  **Must NOT do**:
  - Не выполнять скачивание внутри builder (только генерация content).

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: pure logic module
  - Skills: `[]`
  - Omitted: `playwright` - не требуется в task реализации

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T3,T5,T6 | Blocked By: T1

  **References**:
  - Pattern: `apps/web/app/components/FishingDemo.tsx` - source data fields
  - API/Type: `packages/shared-zod/src/index.ts` - `BiteForecastResponse`, `WeatherSnapshot`

  **Acceptance Criteria**:
  - [ ] Builder возвращает non-empty markdown для валидных 7 дней.
  - [ ] Markdown содержит все секции и per-day блоки для dayOffset 0..6.

  **QA Scenarios**:
  ```
  Scenario: Happy path markdown generation
    Tool: Bash
    Steps: pnpm --filter @fishing/web test -- report-builder
    Expected: Тесты проверяют заголовки, 7 day blocks, factors, disclaimer
    Evidence: .sisyphus/evidence/task-2-builder-tests.txt

  Scenario: Incomplete data handling
    Tool: Bash
    Steps: pnpm --filter @fishing/web test -- report-builder
    Expected: Явная ошибка/guard при неполной серии, без silent-fail
    Evidence: .sisyphus/evidence/task-2-builder-error-tests.txt
  ```

  **Commit**: YES | Message: `feat(web): add pure markdown forecast report builder` | Files: `apps/web/app/components/forecast-report.ts`

- [x] 3. Wire download button and browser file export flow in FishingDemo

  **What to do**:
  - Добавить кнопку рядом с заголовком `forecast_7d` в `aside` блоке `FishingDemo`.
  - Добавить `data-testid`:
    - `forecast-download-md-btn`
    - `forecast-download-md-disabled-reason` (если нужно показать причину disabled)
  - Реализовать helper `downloadMarkdownFile(content, filename)` с Blob/createObjectURL/click/revoke.
  - Кнопка активна только когда есть selected location + 7 day data.
  - При отсутствии валидных данных: disabled + локализованный tooltip/text.

  **Must NOT do**:
  - Не дублировать markdown-логику в JSX; только через builder from T2.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI placement + interaction behavior
  - Skills: [`frontend-ui-ux`] - Reason: аккуратное встраивание в текущий panel layout
  - Omitted: `playwright` - это QA task

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T6 | Blocked By: T1,T2

  **References**:
  - Pattern: `apps/web/app/components/FishingDemo.tsx` - layout/forecast panel
  - Pattern: `apps/web/app/components/runtime.ts` - selected point runtime semantics

  **Acceptance Criteria**:
  - [ ] Кнопка рендерится рядом с `forecast_7d` и соблюдает текущий визуальный стиль.
  - [ ] Нажатие инициирует download `.md` файла с корректным filename policy.
  - [ ] `URL.revokeObjectURL` вызывается гарантированно.

  **QA Scenarios**:
  ```
  Scenario: Download trigger happy path
    Tool: Bash
    Steps: pnpm --filter @fishing/web test -- download-flow
    Expected: createObjectURL/click/revoke вызваны 1 раз
    Evidence: .sisyphus/evidence/task-3-download-flow-tests.txt

  Scenario: No selected point / incomplete days
    Tool: Bash
    Steps: pnpm --filter @fishing/web test -- download-flow
    Expected: Кнопка disabled, download не триггерится
    Evidence: .sisyphus/evidence/task-3-download-flow-error-tests.txt
  ```

  **Commit**: YES | Message: `feat(web): add markdown forecast report download button` | Files: `apps/web/app/components/FishingDemo.tsx`, `apps/web/app/components/forecast-report-download.ts`

- [x] 4. Add web test setup (Vitest + RTL) in apps/web

  **What to do**:
  - Поднять minimal web test infra: vitest config + setup file + testing-library deps + script update.
  - Обеспечить запуск через `pnpm --filter @fishing/web test`.

  **Must NOT do**:
  - Не тащить e2e framework в unit layer setup.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: инфраструктурное изменение в app
  - Skills: `[]`
  - Omitted: `playwright` - отдельный tool для QA сценариев

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T5 | Blocked By: none

  **References**:
  - Test pattern: `packages/*/tests/*.spec.ts` - vitest style в репо
  - Manifest: `apps/web/package.json`

  **Acceptance Criteria**:
  - [ ] `apps/web` имеет реальный test runner, не заглушку.
  - [ ] `pnpm --filter @fishing/web test` возвращает success на baseline sample.

  **QA Scenarios**:
  ```
  Scenario: Runner setup
    Tool: Bash
    Steps: pnpm --filter @fishing/web test
    Expected: Тест-раннер стартует и завершает suite успешно
    Evidence: .sisyphus/evidence/task-4-web-test-setup.txt

  Scenario: Type safety for tests
    Tool: Bash
    Steps: pnpm --filter @fishing/web typecheck
    Expected: Нет type errors из test config/setup
    Evidence: .sisyphus/evidence/task-4-web-test-typecheck.txt
  ```

  **Commit**: YES | Message: `test(web): setup vitest and rtl for web app` | Files: `apps/web/package.json`, `apps/web/vitest.config.ts`, `apps/web/test/setup.ts`

- [x] 5. Add web unit/integration tests for report builder and download flow

  **What to do**:
  - Unit tests for builder (RU/EN snapshots/asserts by sections).
  - Integration tests for button behavior in `FishingDemo` using mocked forecast data.
  - Assert `URL.createObjectURL`, `URL.revokeObjectURL`, filename, and content prefix.

  **Must NOT do**:
  - Не делать brittle full-file snapshots без семантических asserts на секции.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: focused test cases on single feature
  - Skills: `[]`
  - Omitted: `frontend-ui-ux` - не нужно

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T6 | Blocked By: T2,T3,T4

  **References**:
  - Pattern: `apps/api/tests/forecast.controller.spec.ts` - regression-oriented assertions
  - Pattern: `packages/api-client/tests/weather-mapping.spec.ts` - negative cases pattern

  **Acceptance Criteria**:
  - [ ] Есть тесты RU/EN content.
  - [ ] Есть тесты disabled-state и incomplete-data path.
  - [ ] Есть тест на object URL cleanup.

  **QA Scenarios**:
  ```
  Scenario: RU/EN content integrity
    Tool: Bash
    Steps: pnpm --filter @fishing/web test -- report-builder
    Expected: Проверены обязательные секции и локализованные labels
    Evidence: .sisyphus/evidence/task-5-content-tests.txt

  Scenario: Browser API calls integrity
    Tool: Bash
    Steps: pnpm --filter @fishing/web test -- download-flow
    Expected: createObjectURL + revokeObjectURL assertions pass
    Evidence: .sisyphus/evidence/task-5-download-api-tests.txt
  ```

  **Commit**: YES | Message: `test(web): cover markdown report builder and download flow` | Files: `apps/web/**/__tests__/*`

- [x] 6. Add Playwright QA smoke for real download behavior

  **What to do**:
  - Добавить/обновить Playwright сценарий:
    - выбрать точку,
    - дождаться 7-day forecast,
    - нажать download,
    - подтвердить `.md` файл и базовые markdown секции.
  - Проверить edge path с disabled button до выбора точки.

  **Must NOT do**:
  - Не ограничиваться unit mocks; нужен реальный browser download event.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: end-to-end browser verification
  - Skills: [`playwright`] - Reason: reliable download assertions
  - Omitted: `frontend-ui-ux` - не про верстку

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: none | Blocked By: T3,T5

  **References**:
  - UI path: `apps/web/app/components/FishingDemo.tsx`

  **Acceptance Criteria**:
  - [ ] Playwright smoke детерминированно проходит.
  - [ ] Есть доказательство download-файла и контента.

  **QA Scenarios**:
  ```
  Scenario: End-to-end md download
    Tool: Playwright
    Steps: Open / -> select map point -> wait forecast list -> click [data-testid='forecast-download-md-btn'] -> capture download
    Expected: Filename ends with .md and file text contains report title + 7-day section + disclaimer
    Evidence: .sisyphus/evidence/task-6-playwright-download.txt

  Scenario: Precondition failure
    Tool: Playwright
    Steps: Open / without selecting point
    Expected: [data-testid='forecast-download-md-btn'] disabled
    Evidence: .sisyphus/evidence/task-6-playwright-disabled.txt
  ```

  **Commit**: YES | Message: `test(web): add playwright smoke for markdown report download` | Files: `apps/web/e2e/*`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy
- 1 commit per task (T1..T6), плюс отдельные fix commits при провале gate’ов.
- Conventional style: `feat(web): ...`, `test(web): ...`, `chore(web): ...`.

## Success Criteria
- Пользователь в любой локали (`ru|en`) может скачать полный 7-дневный MD отчёт выбранной точки.
- Отчёт содержит локализованные секции, корректные данные прогноза и дисклеймер.
- Download flow устойчив к отсутствию данных (без silent-fail).
- Web test setup внедрён и покрывает feature автоматически.
