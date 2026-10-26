import { describe, expect, it } from 'vitest';

import { moveElbowEnd } from './index';

describe('moveElbowEnd', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 6 },
    { x: 8, y: 6 },
  ];

  it('moves the start and keeps the first (horizontal) segment horizontal', () => {
    expect(moveElbowEnd(points, 'start', { x: -2, y: 2 })).toEqual([
      { x: -2, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 6 },
      { x: 8, y: 6 },
    ]);
  });

  it('moves the end and keeps the last (horizontal) segment horizontal', () => {
    expect(moveElbowEnd(points, 'end', { x: 10, y: 9 })).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 9 },
      { x: 10, y: 9 },
    ]);
  });

  it('keeps a vertical end segment vertical', () => {
    expect(
      moveElbowEnd(
        [
          { x: 0, y: 0 },
          { x: 0, y: 5 },
        ],
        'end',
        { x: 3, y: 8 },
      ),
    ).toEqual([
      { x: 3, y: 0 },
      { x: 3, y: 8 },
    ]);
  });

  it('collapses points that become colinear', () => {
    expect(moveElbowEnd(points, 'start', { x: 0, y: 6 })).toEqual([
      { x: 0, y: 6 },
      { x: 8, y: 6 },
    ]);
  });

  it('does not mutate the input', () => {
    const copy = points.map((p) => ({ ...p }));
    moveElbowEnd(points, 'start', { x: 1, y: 1 });
    expect(points).toEqual(copy);
  });
});
