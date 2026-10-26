import { pointOnRectEdge } from '../point-on-rect-edge';
import type { Edge, Point, Rect } from '../types';

/** How close (screen px) a point must be to a rect's edge to snap to it. */
export const MAGNET_DISTANCE = 16;
/** How far (screen px) a point can drift from the edge it is already snapped to. */
export const MAGNET_RELEASE = 24;

export type SnapTarget = { key: string; rect: Rect };

export type RectSnap = {
  key: string;
  edge: Edge;
  /** Position along the edge, 0..1. See `pointOnRectEdge`. */
  t: number;
  /** The snapped point, on the edge. */
  point: Point;
  /** How far the original point was from it. */
  distance: number;
};

export type SnapOptions = {
  /** Snap when within this distance of an edge (same unit as the rects). */
  distance: number;
  /** Larger distance that still holds a snap to `currentKey`. */
  release?: number;
  /** The target the point is already snapped to, if any. */
  currentKey?: string;
};

const EDGES: readonly Edge[] = ['left', 'right', 'top', 'bottom'];

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Where along `edge` the closest point to `point` is, as `t`. */
function tOnEdge(rect: Rect, edge: Edge, point: Point): number {
  if (edge === 'left' || edge === 'right') {
    return rect.height === 0 ? 0 : clamp01((point.y - rect.y) / rect.height);
  }
  return rect.width === 0 ? 0 : clamp01((point.x - rect.x) / rect.width);
}

function isInside(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Snap `point` to the nearest edge of the nearest rect that is close enough.
 * A point inside a rect always snaps to that rect's nearest edge. Ties go to
 * the earlier target, then to left, right, top, bottom in that order.
 */
export function snapPointToRects(
  point: Point,
  targets: readonly SnapTarget[],
  options: SnapOptions,
): RectSnap | null {
  let best: RectSnap | null = null;

  for (const { key, rect } of targets) {
    const reach =
      key === options.currentKey
        ? Math.max(options.release ?? options.distance, options.distance)
        : options.distance;
    const inside = isInside(rect, point);

    for (const edge of EDGES) {
      const t = tOnEdge(rect, edge, point);
      const onEdge = pointOnRectEdge(rect, edge, t);
      const distance = Math.hypot(point.x - onEdge.x, point.y - onEdge.y);

      if (!inside && distance > reach) continue;
      if (!best || distance < best.distance) {
        best = { key, edge, t, point: onEdge, distance };
      }
    }
  }

  return best;
}
