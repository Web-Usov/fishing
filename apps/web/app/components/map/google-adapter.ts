import type { MapAdapter, MapInitOptions, MapUpdateOptions } from './types';

export function createGoogleMapAdapter(): MapAdapter {
  const notImplementedError = new Error(
    'Google Maps adapter пока не реализован в этом MVP. Используйте provider="yandex".',
  );

  return {
    async init(_: MapInitOptions) {
      throw notImplementedError;
    },
    update(_: MapUpdateOptions) {
      // no-op, provider not implemented yet
    },
    destroy() {
      // no-op
    },
  };
}
