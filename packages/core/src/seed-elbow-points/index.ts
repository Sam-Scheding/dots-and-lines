import type { Point } from '../types';

const EPSILON = 1e-9;

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON;
}

/** Seed a minimal orthogonal L (or straight) path between two points. */
export function seedElbowPoints(start: Point, end: Point): Point[] {
  if (nearlyEqual(start.x, end.x) || nearlyEqual(start.y, end.y)) {
    return [
      { x: start.x, y: start.y },
      { x: end.x, y: end.y },
    ];
  }

  return [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
  ];
}
