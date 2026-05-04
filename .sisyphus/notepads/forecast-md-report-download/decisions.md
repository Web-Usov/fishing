## 2026-05-01
- Added `report_explanation_label`, `report_factors_label`, and `report_disclaimer_title` to locale dictionary (ru/en) and wired them through `FishingDemo` into report builder.
- Replaced hardcoded markdown strings (`Explanation`, `Factors`, `Disclaimer`) in `forecast-report.ts` with locale-provided labels to keep report locale-consistent.
