import { normalizeElbowPoints } from '../normalize-elbow-points';
import type { Point } from '../types';

/** How far from orthogonal a segment may be, to forgive rounding in saved data. */
const TOLERANCE = 1e-6;

function isPoint(value: unknown): value is Point {
  if (typeof value !== 'object' || value === null) return false;
  const { x, y } = value as Record<string, unknown>;
  return (
    typeof x === 'number' &&
    typeof y === 'number' &&
    Number.isFinite(x) &&
    Number.isFinite(y)
  );
}

/**
 * Turn untrusted data (a saved URL, parsed JSON) into a valid elbow route, or
 * `null`. A valid route has at least two finite points, every segment running
 * along an axis (within a tiny tolerance, which is then snapped away), and at
 * least two distinct points once zero-length and colinear segments collapse.
 * Only `x` and `y` are read: other fields are dropped.
 */
export function parseElbowRoute(input: unknown): Point[] | null {
  if (!Array.isArray(input) || input.length < 2) return null;
  if (!input.every(isPoint)) return null;

  const points: Point[] = input.map(({ x, y }) => ({ x, y }));
  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    const alignedX = Math.abs(from.x - to.x) <= TOLERANCE;
    const alignedY = Math.abs(from.y - to.y) <= TOLERANCE;
    if (!alignedX && !alignedY) return null;
    // Snap onto the axis the segment runs along, so it is exactly orthogonal.
    if (alignedX) to.x = from.x;
    if (alignedY) to.y = from.y;
  }

  const route = normalizeElbowPoints(points);
  return route.length >= 2 ? route : null;
}
