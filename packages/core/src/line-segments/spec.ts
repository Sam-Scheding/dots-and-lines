import { describe, expect, it } from 'vitest';

import { lineSegments } from './index';

describe('lineSegments', () => {
  it('returns no segments for fewer than two points', () => {
    expect(lineSegments([])).toEqual([]);
    expect(lineSegments([{ x: 1, y: 1 }])).toEqual([]);
  });

  it('describes each segment', () => {
    const segments = lineSegments([
      { x: 10, y: 20 },
      { x: 4, y: 20 },
      { x: 4, y: 50 },
    ]);

    expect(segments).toEqual([
      {
        index: 0,
        orientation: 'h',
        start: { x: 10, y: 20 },
        end: { x: 4, y: 20 },
        midpoint: { x: 7, y: 20 },
        x: 4,
        y: 20,
        length: 6,
      },
      {
        index: 1,
        orientation: 'v',
        start: { x: 4, y: 20 },
        end: { x: 4, y: 50 },
        midpoint: { x: 4, y: 35 },
        x: 4,
        y: 20,
        length: 30,
      },
    ]);
  });
});
