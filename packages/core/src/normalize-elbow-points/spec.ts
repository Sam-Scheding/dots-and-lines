import { describe, expect, it } from 'vitest';

import { normalizeElbowPoints } from './index';

describe('normalizeElbowPoints', () => {
  it('removes duplicate consecutive points', () => {
    expect(
      normalizeElbowPoints([
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 2, y: 0 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ]);
  });

  it('merges colinear segments', () => {
    expect(
      normalizeElbowPoints([
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 3 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 3 },
    ]);
  });

  it('keeps elbows intact', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
    ];
    expect(normalizeElbowPoints(points)).toEqual(points);
  });
});
