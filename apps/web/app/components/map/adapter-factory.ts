import { createGoogleMapAdapter } from './google-adapter';
import type { MapAdapter, MapProvider } from './types';
import { createYandexMapAdapter } from './yandex-adapter';

export function createMapAdapter(provider: MapProvider, options: { yandexApiKey: string | undefined }): MapAdapter {
  if (provider === 'google') {
    return createGoogleMapAdapter();
  }

  return createYandexMapAdapter({ apiKey: options.yandexApiKey });
}
