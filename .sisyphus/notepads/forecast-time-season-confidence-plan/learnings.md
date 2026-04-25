## 2026-04-25T21:20:00Z Task: plan-execution-summary
- В `domain-bite-forecast` добавлены 2 новых фактора (`timeOfDay`, `season`) без изменения API-контракта.
- Для локального часа используется `Intl.DateTimeFormat(..., { timeZone })` с fallback на UTC-час при ошибке таймзоны.
- Confidence переведён на правило `offset = abs(score - 50)` с порогами `25/15`.
- Регрессии покрыты unit-тестами: сценарные кейсы + границы по времени суток и сезонам.
