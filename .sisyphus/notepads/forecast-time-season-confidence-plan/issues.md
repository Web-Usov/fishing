## 2026-04-25T21:20:00Z Task: qa-issues
- В ходе QA выявлено предупреждение линтера в тестах (`noNonNullAssertion`); устранено заменой на явную проверку и throw.
- После прогона `pnpm build` появился служебный `apps/web/tsconfig.tsbuildinfo`; исключён из diff обратным checkout.
