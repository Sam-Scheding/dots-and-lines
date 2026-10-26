import type { Point } from '../types';

const EPSILON = 1e-9;

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON;
}

function pointsEqual(a: Point, b: Point): boolean {
  return nearlyEqual(a.x, b.x) && nearlyEqual(a.y, b.y);
}

function isColinear(a: Point, b: Point, c: Point): boolean {
  const abHorizontal = nearlyEqual(a.y, b.y);
  const abVertical = nearlyEqual(a.x, b.x);
  const bcHorizontal = nearlyEqual(b.y, c.y);
  const bcVertical = nearlyEqual(b.x, c.x);

  return (abHorizontal && bcHorizontal) || (abVertical && bcVertical);
}

/** Collapse zero-length and colinear adjacent segments. */
export function normalizeElbowPoints(points: readonly Point[]): Point[] {
  if (points.length === 0) {
    return [];
  }

  const deduped: Point[] = [{ ...points[0] }];
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (!pointsEqual(deduped[deduped.length - 1], point)) {
      deduped.push({ ...point });
    }
  }

  if (deduped.length < 3) {
    return deduped;
  }

  const merged: Point[] = [deduped[0]];
  for (let i = 1; i < deduped.length - 1; i += 1) {
    const prev = merged[merged.length - 1];
    const current = deduped[i];
    const next = deduped[i + 1];
    if (!isColinear(prev, current, next)) {
      merged.push(current);
    }
  }
  merged.push(deduped[deduped.length - 1]);

  return merged;
}
