"use client";

import { useLocale } from '../locale/LocaleProvider';
import { useTheme } from './ThemeProvider';

const options: Array<{ value: 'light' | 'dark' | 'system' }> = [
  { value: 'light' },
  { value: 'dark' },
  { value: 'system' },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const { locale } = useLocale();

  const labels = {
    light: locale === 'ru' ? 'Светлая' : 'Light',
    dark: locale === 'ru' ? 'Тёмная' : 'Dark',
    system: locale === 'ru' ? 'Системная' : 'System',
  } as const;

  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 6,
        border: '1px solid var(--border)',
        background: 'var(--panel)',
        borderRadius: 10,
        padding: 4,
      }}
    >
      {options.map((option) => {
        const active = mode === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            style={{
              border: 'none',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              cursor: 'pointer',
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--text)',
              fontWeight: active ? 700 : 500,
            }}
          >
            {labels[option.value]}
          </button>
        );
      })}
    </div>
  );
}
