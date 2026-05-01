"use client";

import { useEffect, useState } from 'react';

import { useLocale } from './locale/LocaleProvider';
import { resolveApiBaseUrl } from './runtime';

export function AppRuntimeInfo() {
  const { t } = useLocale();
  const [apiBase, setApiBase] = useState<string | null>(null);

  useEffect(() => {
    setApiBase(resolveApiBaseUrl());
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        margin: '0 16px 8px',
        border: '1px solid var(--border)',
        borderRadius: 10,
        background: 'var(--panel)',
        color: 'var(--text-muted)',
        boxShadow: 'var(--shadow)',
        padding: '8px 10px',
        fontSize: 12,
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <span>
        {t('api_endpoint')}: <strong style={{ color: 'var(--text)' }}>/forecast/calculate</strong>
      </span>
      <span>
        {t('base_url')}: <strong style={{ color: 'var(--text)' }}>{apiBase ? apiBase.replace(/^https?:\/\//, '') : '...'}</strong>
      </span>
    </div>
  );
}
