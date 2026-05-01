import { geoPointSchema } from '@fishing/shared-zod';

export type SelectedLocation = {
  lat: number;
  lng: number;
};

export function resolveApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  return 'http://127.0.0.1:3001';
}

export function parseLocationFromUrl(): SelectedLocation | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  const latRaw = url.searchParams.get('lat');
  const lngRaw = url.searchParams.get('lng');
  if (!latRaw || !lngRaw) {
    return null;
  }

  const parsed = geoPointSchema.safeParse({
    lat: Number(latRaw),
    lng: Number(lngRaw),
  });

  return parsed.success ? parsed.data : null;
}
