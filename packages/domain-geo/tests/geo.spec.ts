import { describe, expect, it } from 'vitest';

import { calculateDistanceKm, geoPointSchema } from '../src/index';

describe('domain-geo', () => {
  it('validates geo point bounds', () => {
    expect(geoPointSchema.safeParse({ lat: 55.75, lng: 37.61 }).success).toBe(true);
    expect(geoPointSchema.safeParse({ lat: 155.75, lng: 37.61 }).success).toBe(false);
  });

  it('calculates distance between two points', () => {
    const distance = calculateDistanceKm(
      { lat: 55.751244, lng: 37.618423 },
      { lat: 59.93428, lng: 30.335099 },
    );

    expect(distance).toBeGreaterThan(600);
    expect(distance).toBeLessThan(650);
  });

  it('returns zero distance for identical points', () => {
    const point = { lat: 55.751244, lng: 37.618423 };
    expect(calculateDistanceKm(point, point)).toBe(0);
  });

  it('is symmetric for point pairs', () => {
    const from = { lat: 55.751244, lng: 37.618423 };
    const to = { lat: 59.93428, lng: 30.335099 };

    expect(calculateDistanceKm(from, to)).toBeCloseTo(calculateDistanceKm(to, from), 10);
  });

  it('accepts boundary coordinates', () => {
    expect(geoPointSchema.safeParse({ lat: -90, lng: -180 }).success).toBe(true);
    expect(geoPointSchema.safeParse({ lat: 90, lng: 180 }).success).toBe(true);
  });
});
