import {
  moveElbowEnd,
  pointOnRectEdge,
  type Edge,
  type Point,
  type SnapTarget,
} from '@dots-and-lines/core';

import type { DotEntry } from '../dot-registry';

/** Where on a Dot a line end is attached. */
export type Binding = { dotKey: string; edge: Edge; t: number };

export type Bindings = { start: Binding | null; end: Binding | null };

export const NO_BINDINGS: Bindings = { start: null, end: null };

export type ResolvedRoute = {
  /** `points` with every bound end moved onto its Dot's current edge point. */
  route: Point[];
  /** Ends whose Dot is gone or no longer magnetic, so should be let go. */
  released: { start: boolean; end: boolean };
};

/**
 * Apply bindings to a route. A bound end goes to its Dot's edge; an end whose
 * Dot is missing (or not magnetic) is left alone and reported as released.
 */
export function resolveBoundRoute(
  points: readonly Point[],
  bindings: Bindings,
  dots: ReadonlyMap<string, DotEntry>,
  isMagnetic: boolean,
): ResolvedRoute {
  let route = points as Point[];
  const released = { start: false, end: false };

  for (const end of ['start', 'end'] as const) {
    const binding = bindings[end];
    if (!binding) continue;

    const entry = dots.get(binding.dotKey);
    if (!entry || !entry.isMagnetic || !isMagnetic) {
      released[end] = true;
      continue;
    }

    const target = pointOnRectEdge(entry.rect, binding.edge, binding.t);
    const current = end === 'start' ? route[0] : route[route.length - 1];
    if (current && current.x === target.x && current.y === target.y) continue;
    route = moveElbowEnd(route, end, target);
  }

  return { route, released };
}

/** Dots a line end may currently snap to. Unmeasured (zero-area) Dots can't be hit. */
export function magneticTargets(
  dots: ReadonlyMap<string, DotEntry>,
): SnapTarget[] {
  const targets: SnapTarget[] = [];
  dots.forEach(({ rect, isMagnetic }, key) => {
    if (isMagnetic && rect.width > 0 && rect.height > 0) {
      targets.push({ key, rect });
    }
  });
  return targets;
}
