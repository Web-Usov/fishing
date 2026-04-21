"use client";

import { useLocale } from './LocaleProvider';
import type { LocaleKey } from './LocaleProvider';

const options: Array<{ value: 'auto' | 'ru' | 'en'; labelKey: LocaleKey }> = [
  { value: 'auto', labelKey: 'locale_auto' },
  { value: 'ru', labelKey: 'locale_ru' },
  { value: 'en', labelKey: 'locale_en' },
];

export function LocaleToggle() {
  const { mode, setMode, t } = useLocale();

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
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
