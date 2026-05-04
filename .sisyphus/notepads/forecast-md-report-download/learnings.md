## 2026-05-01
- Markdown report sections should be fully label-driven via `labels` object in `buildForecastMarkdownReport` to avoid mixed-language output.
- Locale dictionary in `LocaleProvider` is the single source for UI/report text keys consumed by `FishingDemo`.
- Final audit: T1-T6 evidence is present in code/tests (`LocaleProvider`, `forecast-report`, `FishingDemo`, vitest setup, unit/integration tests, Playwright smoke).
- 7-day scope is strictly enforced in both runtime and builder with `dayOffset` set validation against `0..6`.
- Download/report path is locale-driven (`t('report_*')` labels + `report_filename_prefix`) with no hardcoded section labels in report generation flow.
- F3 manual QA gate evidence: `pnpm --filter @fishing/web e2e:smoke` passed in real Playwright browser; download button is disabled before selecting location and shows disabled reason.
- After selecting location, the same button becomes enabled, triggers a Playwright `download` event, saves a `.md` file, and downloaded content includes report title, 7-day section, and informational disclaimer (EN/RU match).

- F2 review: filename sanitation and object URL cleanup are implemented correctly (`sanitizeFilenamePart` + `URL.revokeObjectURL` in `finally`), but test coverage does not assert sanitized filename or `anchor.download` value.
- F2 review: maintainability risk from duplicated 7-day completeness rule (`REQUIRED_DAY_OFFSETS` + set-check exists in both `FishingDemo.tsx` and `forecast-report.ts`), which can drift.
- F2 review: hardcoded localized error strings remain in `FishingDemo.tsx` (forecast fetch error and markdown build error) instead of locale dictionary keys, violating single-source i18n pattern.
- F4 scope check: current working-tree changes are limited to `apps/web/app/components/FishingDemo.tsx`, `apps/web/app/components/locale/LocaleProvider.tsx`, `apps/web/package.json`, and `apps/web/tsconfig.json`; no API endpoints/domain models/server storage additions detected in changed set.
- Required scope artifacts are present in web app: locale-aware markdown builder (`app/components/forecast-report.ts`), download button wiring with Blob URL cleanup (`FishingDemo.tsx`), unit tests (`app/__tests__/forecast-report.test.ts`), and Playwright smoke download scenario (`e2e/forecast-download-smoke.spec.ts`).
- Must-not-have extras (PDF/CSV/export history/email/report persistence) are not introduced by the reviewed changed files.
