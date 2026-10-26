import { applyViewAction } from '../apply-view-action';
import { parseElbowRoute } from '../parse-elbow-route';
import type {
  DotState,
  LineState,
  Mode,
  Point,
  SceneSnapshot,
  View,
  ZoomLimits,
} from '../types';
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
  /**
   * The Dots in the state, in draw order (later is on top). The array and each
   * entry keep their identity until they change.
   */
  getDots(): readonly DotState[];
  /**
   * Add a Dot. Returns its id (generated if `id` is omitted), or `null` if
   * nothing was added: a non-finite position or an id already in use.
   */
  addDot(dot: { id?: string; x: number; y: number }): string | null;
  /** Ignored for an unknown id or a non-finite position. */
  moveDot(id: string, x: number, y: number): void;
  removeDot(id: string): void;
  /** The lines in the state, in draw order. Same identity rules as `getDots`. */
  getLines(): readonly LineState[];
  /**
   * Add a line with a whole route (see `parseElbowRoute` for what is valid).
   * Returns its id (generated if omitted), or `null` if nothing was added: an
   * invalid route or an id already in use.
   */
  addLine(line: { id?: string; route: readonly Point[] }): string | null;
  /** Ignored for an unknown id or an invalid route. */
  setLineRoute(id: string, route: readonly Point[]): void;
  removeLine(id: string): void;
  /**
   * The camera, Dots and lines, so `JSON.stringify(sceneState)` saves them.
   * Pass the parsed result back as the options of `createSceneState` (or
   * `useSceneState`) to restore it. The mode is not included.
   */
  toJSON(): SceneSnapshot;
  /**
   * Called after any camera, mode, Dot or line change. Returns an unsubscribe
   * function.
   */
  subscribe(listener: () => void): () => void;
};

export type CreateSceneStateOptions = {
  defaultView?: View;
  /**
   * Starting Dots and lines, typically from a saved `toJSON()`. Treated as
   * untrusted: an entry that isn't valid (a non-finite position, a route that
   * isn't orthogonal, a missing or repeated id) is dropped.
   */
  defaultDots?: readonly DotState[];
  defaultLines?: readonly LineState[];
  zoom?: ZoomLimits;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDots(input: unknown): DotState[] {
  const dots: DotState[] = [];
  if (!Array.isArray(input)) return dots;
  const seen = new Set<string>();
  for (const item of input) {
    if (!isRecord(item)) continue;
    const { id, x, y } = item;
    if (typeof id !== 'string' || id === '' || seen.has(id)) continue;
    if (typeof x !== 'number' || typeof y !== 'number') continue;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    seen.add(id);
    dots.push({ id, x, y });
  }
  return dots;
}

function parseLines(input: unknown): LineState[] {
  const lines: LineState[] = [];
  if (!Array.isArray(input)) return lines;
  const seen = new Set<string>();
  for (const item of input) {
    if (!isRecord(item)) continue;
    const { id } = item;
    if (typeof id !== 'string' || id === '' || seen.has(id)) continue;
    const route = parseElbowRoute(item.route);
    if (!route) continue;
    seen.add(id);
    lines.push({ id, route });
  }
  return lines;
}

function routesEqual(a: readonly Point[], b: readonly Point[]): boolean {
  return (
    a.length === b.length &&
    a.every((point, i) => point.x === b[i].x && point.y === b[i].y)
  );
}

let idCounter = 0;

/** A fresh id that is not in `taken`. */
function makeId(prefix: string, taken: readonly { id: string }[]): string {
  for (;;) {
    idCounter += 1;
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `${prefix}-${idCounter.toString(36)}`;
    if (!taken.some((entry) => entry.id === id)) return id;
  }
}

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
  let dots = parseDots(options.defaultDots);
  let lines = parseLines(options.defaultLines);

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
    getDots: () => dots,
    addDot({ id, x, y }) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      if (id !== undefined && (id === '' || dots.some((d) => d.id === id))) {
        return null;
      }
      const dotId = id ?? makeId('dot', dots);
      dots = [...dots, { id: dotId, x, y }];
      notify();
      return dotId;
    },
    moveDot(id, x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const current = dots.find((d) => d.id === id);
      if (!current || (current.x === x && current.y === y)) return;
      dots = dots.map((d) => (d === current ? { id, x, y } : d));
      notify();
    },
    removeDot(id) {
      if (!dots.some((d) => d.id === id)) return;
      dots = dots.filter((d) => d.id !== id);
      notify();
    },
    getLines: () => lines,
    addLine({ id, route }) {
      const parsed = parseElbowRoute(route);
      if (!parsed) return null;
      if (id !== undefined && (id === '' || lines.some((l) => l.id === id))) {
        return null;
      }
      const lineId = id ?? makeId('line', lines);
      lines = [...lines, { id: lineId, route: parsed }];
      notify();
      return lineId;
    },
    setLineRoute(id, route) {
      const current = lines.find((l) => l.id === id);
      const parsed = parseElbowRoute(route);
      if (!current || !parsed || routesEqual(current.route, parsed)) return;
      lines = lines.map((l) => (l === current ? { id, route: parsed } : l));
      notify();
    },
    removeLine(id) {
      if (!lines.some((l) => l.id === id)) return;
      lines = lines.filter((l) => l.id !== id);
      notify();
    },
    toJSON: () => ({
      defaultView: view,
      defaultDots: dots,
      defaultLines: lines,
    }),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
