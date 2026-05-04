import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

function buildWeatherResponse() {
  return {
    daily: {
      time: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07'],
      temperature_2m_mean: [12, 13, 14, 15, 16, 17, 18],
      pressure_msl_mean: [1008, 1009, 1010, 1011, 1012, 1013, 1014],
      wind_speed_10m_mean: [3, 4, 5, 4, 3, 5, 4],
      cloud_cover_mean: [30, 35, 40, 45, 50, 45, 40],
      precipitation_sum: [0, 0.2, 0, 0.1, 0, 0, 0.3],
    },
  };
}

function buildForecastResponse() {
  return {
    score: 76,
    level: 'good',
    confidence: 'high',
    factors: [{ id: 'pressure', label: 'Pressure', impact: 8 }],
    explanation: 'Stable period.',
  };
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/weather/forecast?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildWeatherResponse()),
    });
  });

  await page.route('**/forecast/calculate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildForecastResponse()),
    });
  });
});

test('scenario 1: disabled initially, enabled after point selection, downloads valid markdown', async ({ page }) => {
  await page.goto('/');

  const downloadBtn = page.getByTestId('forecast-download-md-btn');
  await expect(downloadBtn).toBeDisabled();
  await expect(page.getByTestId('forecast-download-md-disabled-reason')).toBeVisible();

  await page.getByRole('button', { name: /My location|Моё местоположение/ }).click();

  await expect(downloadBtn).toBeEnabled();
  await expect(page.getByTestId('forecast-download-md-disabled-reason')).toHaveCount(0);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    downloadBtn.click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/\.md$/i);

  const filePath = await download.path();
  expect(filePath).toBeTruthy();

  if (!filePath) {
    throw new Error('Playwright download path is missing.');
  }

  const content = await readFile(filePath, 'utf-8');
  expect(content).toMatch(/Bite forecast report|Отчёт по прогнозу клёва/);
  expect(content).toMatch(/7-day forecast|Прогноз на 7 дней/);
  expect(content).toMatch(
    /This report is informational and does not guarantee fishing results\.|Отчёт носит информационный характер и не гарантирует результат рыбалки\./,
  );
});

test('scenario 2: no selected point keeps markdown download button disabled', async ({ page }) => {
  await page.goto('/');

  const downloadBtn = page.getByTestId('forecast-download-md-btn');
  await expect(downloadBtn).toBeDisabled();
  await expect(page.getByTestId('forecast-download-md-disabled-reason')).toBeVisible();
});
