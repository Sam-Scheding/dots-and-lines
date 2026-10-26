import type { Edge, Point, Rect } from '../types';

/**
 * The point `t` of the way along one edge of `rect`: 0 is the top (left and
 * right edges) or the left (top and bottom edges), 1 is the far end. `t` is
 * clamped to 0..1.
 */
export function pointOnRectEdge(rect: Rect, edge: Edge, t: number): Point {
  const clamped = Math.min(1, Math.max(0, t));
  switch (edge) {
    case 'left':
      return { x: rect.x, y: rect.y + rect.height * clamped };
    case 'right':
      return { x: rect.x + rect.width, y: rect.y + rect.height * clamped };
    case 'top':
      return { x: rect.x + rect.width * clamped, y: rect.y };
    case 'bottom':
      return { x: rect.x + rect.width * clamped, y: rect.y + rect.height };
  }
}
