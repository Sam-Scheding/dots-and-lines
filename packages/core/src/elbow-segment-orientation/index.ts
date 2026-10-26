import type { Point } from '../types';

/** Whether the segment from `a` to `b` runs horizontally or vertically. */
export function elbowSegmentOrientation(a: Point, b: Point): 'h' | 'v' {
  return Math.abs(a.x - b.x) >= Math.abs(a.y - b.y) ? 'h' : 'v';
}
