import { describe, expect, it } from 'vitest';

import { seedElbowPoints } from './index';

describe('seedElbowPoints', () => {
  it('returns a straight segment when both points share an axis', () => {
    expect(seedElbowPoints({ x: 1, y: 2 }, { x: 5, y: 2 })).toEqual([
      { x: 1, y: 2 },
      { x: 5, y: 2 },
    ]);
  });

  it('returns an L path otherwise', () => {
    expect(seedElbowPoints({ x: 0, y: 0 }, { x: 3, y: 4 })).toEqual([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 4 },
    ]);
  });
});
