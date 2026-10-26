import { describe, expect, it } from 'vitest';

import { pointOnRectEdge } from './index';

const rect = { x: 10, y: 20, width: 100, height: 50 };

describe('pointOnRectEdge', () => {
  it('walks each edge from 0 to 1', () => {
    expect(pointOnRectEdge(rect, 'left', 0)).toEqual({ x: 10, y: 20 });
    expect(pointOnRectEdge(rect, 'left', 1)).toEqual({ x: 10, y: 70 });
    expect(pointOnRectEdge(rect, 'right', 0.5)).toEqual({ x: 110, y: 45 });
    expect(pointOnRectEdge(rect, 'top', 0.25)).toEqual({ x: 35, y: 20 });
    expect(pointOnRectEdge(rect, 'bottom', 1)).toEqual({ x: 110, y: 70 });
  });

  it('clamps t to the edge', () => {
    expect(pointOnRectEdge(rect, 'top', -3)).toEqual({ x: 10, y: 20 });
    expect(pointOnRectEdge(rect, 'top', 7)).toEqual({ x: 110, y: 20 });
  });
});
