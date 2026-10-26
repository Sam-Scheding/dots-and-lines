import { elbowSegmentOrientation } from '../elbow-segment-orientation';
import { normalizeElbowPoints } from '../normalize-elbow-points';
import type { Point } from '../types';

/**
 * Move one end of the line to `to`, keeping the end segment orthogonal by
 * sliding the neighbouring point along with it.
 */
/**
 * With only two points there is no inner point to slide, and sliding the
 * other end instead would drag it along. Route a Z so only `end` moves, with
 * both end segments keeping the orientation the line had.
 */
function rerouteTwoPoints(
  a: Point,
  b: Point,
  end: 'start' | 'end',
  to: Point,
): Point[] {
  const orientation = elbowSegmentOrientation(a, b);
  const from = end === 'start' ? to : a;
  const target = end === 'start' ? b : to;
  const route =
    orientation === 'h'
      ? [
          from,
          { x: (from.x + target.x) / 2, y: from.y },
          { x: (from.x + target.x) / 2, y: target.y },
          target,
        ]
      : [
          from,
          { x: from.x, y: (from.y + target.y) / 2 },
          { x: target.x, y: (from.y + target.y) / 2 },
          target,
        ];
  return normalizeElbowPoints(route.map((point) => ({ ...point })));
}

export function moveElbowEnd(
  points: readonly Point[],
  end: 'start' | 'end',
  to: Point,
): Point[] {
  const next = points.map((point) => ({ ...point }));
  if (next.length < 2) {
    return next;
  }

  if (next.length === 2) {
    return rerouteTwoPoints(next[0], next[1], end, to);
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
