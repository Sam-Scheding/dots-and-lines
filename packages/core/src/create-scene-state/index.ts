import { applyViewAction } from '../apply-view-action';
import type { Mode, Point, View, ZoomLimits } from '../types';
import {
  DEFAULT_VIEW,
  DEFAULT_ZOOM_LIMITS,
  clampZoom,
  isFiniteView,
  viewsEqual,
} from '../view';

export type SceneState = {
  getView(): View;
  /** Clamped to the zoom limits. Ignored if any number is not finite. */
  setView(view: View): void;
  getMode(): Mode;
  setMode(mode: Mode): void;
  /** Pan by screen px. */
  panBy(dx: number, dy: number): void;
  /**
   * Multiply zoom by `factor` (clamped to the zoom limits). `origin` is a
   * Scene-local screen point that stays fixed; omit it to keep pan unchanged.
   */
  zoomBy(factor: number, origin?: Point): void;
  /** Called after any camera or mode change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
};

export type CreateSceneStateOptions = {
  defaultView?: View;
  zoom?: ZoomLimits;
};

/**
 * The store behind `useSceneState`. Framework-agnostic: the object it returns
 * never changes identity, and `getView()` returns the same object until the
 * camera actually changes (so it is safe as a `useSyncExternalStore` snapshot).
 */
export function createSceneState(
  options: CreateSceneStateOptions = {},
): SceneState {
  const limits = options.zoom ?? DEFAULT_ZOOM_LIMITS;
  const listeners = new Set<() => void>();

  const normalize = (view: View): View => ({
    panX: view.panX,
    panY: view.panY,
    zoom: clampZoom(view.zoom, limits),
  });

  let view = normalize(
    options.defaultView && isFiniteView(options.defaultView)
      ? options.defaultView
      : DEFAULT_VIEW,
  );
  let mode: Mode = 'select';

  const notify = () => {
    for (const listener of [...listeners]) {
      listener();
    }
  };

  const commitView = (next: View) => {
    if (viewsEqual(view, next)) return;
    view = next;
    notify();
  };

  return {
    getView: () => view,
    setView(next) {
      if (!isFiniteView(next)) return;
      commitView(normalize(next));
    },
    getMode: () => mode,
    setMode(next) {
      if (mode === next) return;
      mode = next;
      notify();
    },
    panBy(dx, dy) {
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
      commitView(
        applyViewAction(view, { type: 'pan', deltaX: dx, deltaY: dy }, limits),
      );
    },
    zoomBy(factor, origin) {
      if (!Number.isFinite(factor) || factor <= 0) return;
      commitView(
        applyViewAction(
          view,
          { type: 'zoomBy', factor, originX: origin?.x, originY: origin?.y },
          limits,
        ),
      );
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
