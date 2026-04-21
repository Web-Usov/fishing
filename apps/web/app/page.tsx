"use client";

import React from 'react';

import { FishingDemo } from './components/FishingDemo';
import { LocaleToggle } from './components/locale/LocaleToggle';
import { useLocale } from './components/locale/LocaleProvider';
import { ThemeToggle } from './components/theme/ThemeToggle';

export default function HomePage() {
  const { t } = useLocale();

  return (
    <main style={{ padding: 16, minHeight: '100vh' }}>
      <section
        style={{
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--panel)',
          color: 'var(--text)',
          marginBottom: 14,
          boxShadow: 'var(--shadow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{t('app_title')}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {t('app_subtitle')}
          </p>
        </div>

        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </section>

      <FishingDemo />
    </main>
  );
}
