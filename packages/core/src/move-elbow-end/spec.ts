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

  describe('on a two-point route', () => {
    const horizontal = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const vertical = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ];

    it('routes a Z when the end moves, leaving the start where it was', () => {
      expect(moveElbowEnd(horizontal, 'end', { x: 14, y: 6 })).toEqual([
        { x: 0, y: 0 },
        { x: 7, y: 0 },
        { x: 7, y: 6 },
        { x: 14, y: 6 },
      ]);
    });

    it('routes a Z when the start moves, leaving the end where it was', () => {
      expect(moveElbowEnd(horizontal, 'start', { x: -4, y: 6 })).toEqual([
        { x: -4, y: 6 },
        { x: 3, y: 6 },
        { x: 3, y: 0 },
        { x: 10, y: 0 },
      ]);
    });

    it('keeps a vertical line vertical at both ends', () => {
      expect(moveElbowEnd(vertical, 'end', { x: 3, y: 8 })).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 4 },
        { x: 3, y: 4 },
        { x: 3, y: 8 },
      ]);
      expect(moveElbowEnd(vertical, 'start', { x: 3, y: -2 })).toEqual([
        { x: 3, y: -2 },
        { x: 3, y: 4 },
        { x: 0, y: 4 },
        { x: 0, y: 10 },
      ]);
    });

    it('stays straight when the end moves along the line', () => {
      expect(moveElbowEnd(horizontal, 'end', { x: 20, y: 0 })).toEqual([
        { x: 0, y: 0 },
        { x: 20, y: 0 },
      ]);
    });

    it('is a no-op when the end is moved onto itself', () => {
      expect(moveElbowEnd(horizontal, 'end', { x: 10, y: 0 })).toEqual(
        horizontal,
      );
    });
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
