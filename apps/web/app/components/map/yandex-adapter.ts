import type { MapAdapter, MapInitOptions, MapPoint, MapUpdateOptions } from './types';

type YandexConstructor = {
  Map: new (
    container: HTMLDivElement,
    options: { center: [number, number]; zoom: number; controls?: string[] },
  ) => {
    geoObjects: {
      add: (object: unknown) => void;
      removeAll: () => void;
    };
    events: {
      add: (
        eventName: string,
        callback: (event: { get: (key: 'coords') => [number, number] }) => void,
      ) => void;
    };
    setCenter: (center: [number, number], zoom?: number, options?: { duration?: number }) => void;
    destroy: () => void;
  };
  Placemark: new (
    coordinates: [number, number],
    properties: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => {
    events: {
      add: (eventName: string, callback: () => void) => void;
    };
  };
  ready: (callback: () => void) => void;
  geocode: (coords: [number, number], options: { kind?: string; results?: number }) => Promise<{
    geoObjects: {
      get: (index: number) => {
        properties: {
          get: (key: string) => string | undefined;
        };
      } | undefined;
    };
  }>;
};

declare global {
  interface Window {
    ymaps?: YandexConstructor;
  }
}

const scriptPromises = new Map<string, Promise<void>>();

function loadYandexMapsScript(apiKey: string | undefined) {
  const keyPart = apiKey ? `&apikey=${encodeURIComponent(apiKey)}` : '';
  const src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${keyPart}`;

  if (scriptPromises.has(src)) {
    return scriptPromises.get(src) as Promise<void>;
  }

  const promise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Yandex Maps доступен только в браузере.'));
      return;
    }

    if (window.ymaps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Не удалось загрузить скрипт Yandex Maps API.'));
    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

function applyMapCursor() {
  if (typeof document === 'undefined') {
    return;
  }

  const pane = document.querySelector('.ymaps-2-1-79-events-pane') as HTMLElement | null;
  if (pane) {
    pane.style.cursor = 'crosshair';
  }
}

function createPlacemark(
  ymaps: YandexConstructor,
  point: MapPoint,
) {
  const placemark = new ymaps.Placemark(
    [point.lat, point.lng],
    {
      hintContent: point.name,
      balloonContentHeader: point.name,
      balloonContentBody: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
    },
    {
      preset: 'islands#greenCircleDotIcon',
    },
  );

  return placemark;
}

export function createYandexMapAdapter(options: { apiKey: string | undefined }): MapAdapter {
  let mapInstance: InstanceType<YandexConstructor['Map']> | null = null;
  let latestOnSelectCoordinates: ((coordinates: [number, number]) => void) | null = null;

  function renderSelectedPoint(ymaps: YandexConstructor, selectedPoint: MapPoint | null) {
    if (!mapInstance) {
      return;
    }

    mapInstance.geoObjects.removeAll();

    if (selectedPoint) {
      const placemark = createPlacemark(ymaps, selectedPoint);
      mapInstance.geoObjects.add(placemark);
    }
  }

  return {
    async init(initOptions: MapInitOptions) {
      await loadYandexMapsScript(options.apiKey);

      const ymaps = window.ymaps;
      if (!ymaps) {
        throw new Error('Yandex Maps API не инициализировался.');
      }

      latestOnSelectCoordinates = initOptions.onSelectCoordinates;

      await new Promise<void>((resolve) => {
        ymaps.ready(() => {
          mapInstance = new ymaps.Map(initOptions.container, {
            center: initOptions.center,
            zoom: initOptions.zoom,
            controls: ['zoomControl', 'fullscreenControl'],
          });
          applyMapCursor();

          mapInstance.events.add('click', (event) => {
            const coords = event.get('coords');
            if (latestOnSelectCoordinates) {
              latestOnSelectCoordinates(coords);
            }
          });

          renderSelectedPoint(ymaps, initOptions.selectedPoint);
          resolve();
        });
      });
    },

    update(updateOptions: MapUpdateOptions) {
      if (!mapInstance || !window.ymaps) {
        return;
      }

      mapInstance.setCenter(updateOptions.center, undefined, { duration: 300 });
      renderSelectedPoint(window.ymaps, updateOptions.selectedPoint);
    },

    destroy() {
      if (mapInstance) {
        mapInstance.destroy();
        mapInstance = null;
      }

      latestOnSelectCoordinates = null;
    },
  };
}
