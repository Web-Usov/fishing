## 2026-05-01
- In `FishingDemo.download.test.tsx`, inspecting raw markdown content via `Blob.text()`/`Response(blob).text()` is unreliable in current test runtime because created Blob payload is represented as `[object Blob]`.
- Localization assertions for section labels were kept in `forecast-report.test.ts`, where markdown string is deterministic and directly testable.
- F2 remediation: moved user-facing forecast/report error messages in `FishingDemo.tsx` to locale dictionary keys and strengthened `FishingDemo.download.test.tsx` to assert sanitized safe `anchor.download` filename format.
- Hang root cause: `useLocale` mock in `FishingDemo.download.test.tsx` recreated `t` on each render, retriggering `useEffect(...,[...,t])` and causing repeated forecast reload loops. Fixed by using a stable module-level dictionary + `stableT` function.
