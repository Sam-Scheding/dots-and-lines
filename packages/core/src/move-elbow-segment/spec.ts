import { describe, expect, it } from 'vitest';

import { moveElbowSegment } from './index';

describe('moveElbowSegment', () => {
  it('moves an interior vertical segment horizontally', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 6 },
      { x: 8, y: 6 },
    ];

    expect(moveElbowSegment(points, 1, 2, 0)).toEqual([
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 6 },
      { x: 8, y: 6 },
    ]);
  });

  it('moves an interior horizontal segment vertically', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 3 },
      { x: 5, y: 3 },
      { x: 5, y: 7 },
    ];

    expect(moveElbowSegment(points, 1, 0, -1)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 2 },
      { x: 5, y: 2 },
      { x: 5, y: 7 },
    ]);
  });

  it('inserts a segment when dragging a start-adjacent horizontal segment vertically', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
    ];

    expect(moveElbowSegment(points, 0, 0, 2)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 3 },
    ]);
  });

  it('inserts a segment when dragging an end-adjacent vertical segment horizontally', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
    ];

    expect(moveElbowSegment(points, 1, -1, 0)).toEqual([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
    ]);
  });

  it('ignores parallel drag on interior segments', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 6 },
      { x: 8, y: 6 },
    ];

    expect(moveElbowSegment(points, 1, 0, 2)).toEqual(points);
  });
});
