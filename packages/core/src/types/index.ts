/** CSS px at zoom 1, relative to the Scene's top-left at pan 0. */
export type Point = { x: number; y: number };

/** Pan is in screen px; zoom is unitless (1 = 100%). */
export type View = { panX: number; panY: number; zoom: number };

/** A box in world space: top-left corner plus size, in CSS px at zoom 1. */
export type Rect = { x: number; y: number; width: number; height: number };

export type Edge = 'left' | 'right' | 'top' | 'bottom';

export type ZoomLimits = { min: number; max: number };

export type Mode =
  /** Drag Dots, select and edit lines (default). */
  | 'select'
  /** Clicking creates a new line: first click is the start, second is the end. */
  | 'connect';

/** A Dot as the Scene's state holds it. The consumer renders it as a `Dot`. */
export type DotState = { id: string; x: number; y: number };

/** A line as the Scene's state holds it: its whole orthogonal route. */
export type LineState = { id: string; route: Point[] };

/**
 * What `sceneState.toJSON()` returns. The keys are the options
 * `createSceneState` takes, so a saved snapshot can be passed straight back in.
 */
export type SceneSnapshot = {
  defaultView: View;
  defaultDots: DotState[];
  defaultLines: LineState[];
};
