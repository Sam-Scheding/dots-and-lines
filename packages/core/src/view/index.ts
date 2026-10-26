import type { View, ZoomLimits } from '../types';

export const DEFAULT_VIEW: View = { panX: 0, panY: 0, zoom: 1 };

export const DEFAULT_ZOOM_LIMITS: ZoomLimits = { min: 0.1, max: 2 };

export function clampZoom(zoom: number, limits: ZoomLimits): number {
  return Math.min(limits.max, Math.max(limits.min, zoom));
}

export function isFiniteView(view: View): boolean {
  return (
    Number.isFinite(view.panX) &&
    Number.isFinite(view.panY) &&
    Number.isFinite(view.zoom)
  );
}

export function viewsEqual(a: View, b: View): boolean {
  return a.panX === b.panX && a.panY === b.panY && a.zoom === b.zoom;
}
