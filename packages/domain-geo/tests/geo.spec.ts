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
});
