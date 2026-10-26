import { elbowSegmentOrientation } from '../elbow-segment-orientation';
import { normalizeElbowPoints } from '../normalize-elbow-points';
import type { Point } from '../types';

/**
 * Move one end of the line to `to`, keeping the end segment orthogonal by
 * sliding the neighbouring point along with it.
 */
export function moveElbowEnd(
  points: readonly Point[],
  end: 'start' | 'end',
  to: Point,
): Point[] {
  const next = points.map((point) => ({ ...point }));
  if (next.length < 2) {
    return next;
  }

  if (end === 'start') {
    const orientation = elbowSegmentOrientation(next[0], next[1]);
    next[0] = { ...to };
    next[1] =
      orientation === 'h'
        ? { x: next[1].x, y: to.y }
        : { x: to.x, y: next[1].y };
    return normalizeElbowPoints(next);
  }

  const last = next.length - 1;
  const orientation = elbowSegmentOrientation(next[last - 1], next[last]);
  next[last] = { ...to };
  next[last - 1] =
    orientation === 'h'
      ? { x: next[last - 1].x, y: to.y }
      : { x: to.x, y: next[last - 1].y };
  return normalizeElbowPoints(next);
}
