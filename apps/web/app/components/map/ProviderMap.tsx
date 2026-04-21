"use client";

import { useEffect, useRef, useState } from 'react';

import { useLocale } from '../locale/LocaleProvider';
import { createMapAdapter } from './adapter-factory';
import type { MapPoint, MapProvider } from './types';

type ProviderMapProps = {
  provider: MapProvider;
  yandexApiKey: string | undefined;
  selectedPoint: MapPoint | null;
  defaultCenter: [number, number];
  onSelectCoordinates: (coordinates: [number, number]) => void;
  className?: string;
};

export function ProviderMap({
  provider,
  yandexApiKey,
  selectedPoint,
  defaultCenter,
  onSelectCoordinates,
  className,
}: ProviderMapProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const adapterRef = useRef<ReturnType<typeof createMapAdapter> | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const adapter = createMapAdapter(provider, { yandexApiKey });
    adapterRef.current = adapter;
    setStatus('loading');
    setErrorMessage('');

    let disposed = false;

    void adapter
      .init({
        container,
        selectedPoint,
        center: selectedPoint ? [selectedPoint.lat, selectedPoint.lng] : defaultCenter,
        zoom: selectedPoint ? 10 : 8,
        onSelectCoordinates,
      })
      .then(() => {
        if (!disposed) {
          setStatus('ready');
        }
      })
      .catch((error: unknown) => {
        if (!disposed) {
          const message = error instanceof Error ? error.message : 'Не удалось инициализировать карту.';
          setStatus('error');
          setErrorMessage(message);
        }
      });

    return () => {
      disposed = true;
      adapter.destroy();
      adapterRef.current = null;
    };
  }, [defaultCenter, onSelectCoordinates, provider, yandexApiKey]);

  useEffect(() => {
    if (!adapterRef.current || status !== 'ready') {
      return;
    }

    adapterRef.current.update({
      selectedPoint,
      center: selectedPoint ? [selectedPoint.lat, selectedPoint.lng] : defaultCenter,
    });
  }, [defaultCenter, selectedPoint, status]);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 420,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--panel-muted)',
        cursor: 'crosshair',
      }}
      className={className}
    >
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      <button
        type="button"
        onClick={() => {
          if (!window.isSecureContext) {
            setErrorMessage(t('geolocation_secure_required'));
            return;
          }

          if (!navigator.geolocation || locating) {
            return;
          }

          setLocating(true);
          navigator.geolocation.getCurrentPosition(
            (position) => {
              onSelectCoordinates([position.coords.latitude, position.coords.longitude]);
              setLocating(false);
            },
            () => {
              setLocating(false);
              setErrorMessage(t('geolocation_failed'));
            },
            { enableHighAccuracy: true, timeout: 8000 },
          );
        }}
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          zIndex: 3,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--panel)',
          color: 'var(--text)',
          padding: '6px 10px',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {locating ? t('locating') : t('my_location')}
      </button>

      {status === 'loading' ? (
        <OverlayMessage title={t('map_loading')} body={t('map_init')} />
      ) : null}

      {status === 'error' ? <OverlayMessage title={t('map_error')} body={errorMessage} tone="error" /> : null}

      {provider === 'yandex' && !yandexApiKey ? (
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: 16,
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12,
            color: 'var(--warning)',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            zIndex: 3,
          }}
        >
          {t('missing_yandex_key')}
        </div>
      ) : null}
    </div>
  );
}

function OverlayMessage({
  title,
  body,
  tone = 'neutral',
}: {
  title: string;
  body: string;
  tone?: 'neutral' | 'error';
}) {
  return (
    <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          background: tone === 'error' ? 'rgba(185,28,28,.15)' : 'rgba(15,23,42,.10)',
          zIndex: 2,
        }}
      >
        <div
          style={{
            borderRadius: 10,
            padding: 14,
            maxWidth: 320,
            textAlign: 'center',
            color: 'var(--text)',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>{body}</div>
        </div>
      </div>
    );
}
