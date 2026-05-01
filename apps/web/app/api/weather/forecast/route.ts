import { NextRequest, NextResponse } from 'next/server';
import { geoPointSchema } from '@fishing/shared-zod';

function buildOpenMeteoUrl(lat: number, lng: number) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    timezone: 'auto',
    forecast_days: '7',
    wind_speed_unit: 'ms',
    daily: [
      'temperature_2m_mean',
      'pressure_msl_mean',
      'wind_speed_10m_mean',
      'cloud_cover_mean',
      'precipitation_sum',
    ].join(','),
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coordinates = geoPointSchema.safeParse({
    lat: Number(searchParams.get('lat')),
    lng: Number(searchParams.get('lng')),
  });

  if (!coordinates.success) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const { lat, lng } = coordinates.data;

  try {
    const response = await fetch(buildOpenMeteoUrl(lat, lng), {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Weather provider error' }, { status: 502 });
    }

    const payload = await response.json();
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Weather provider unavailable' }, { status: 503 });
  }
}
