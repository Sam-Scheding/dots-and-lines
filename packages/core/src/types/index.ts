/** CSS px at zoom 1, relative to the Scene's top-left at pan 0. */
export type Point = { x: number; y: number };

/** Pan is in screen px; zoom is unitless (1 = 100%). */
export type View = { panX: number; panY: number; zoom: number };

export type ZoomLimits = { min: number; max: number };

export type Mode =
  /** Drag Dots, select and edit lines (default). */
  | 'select'
  /** Clicking creates a new line: first click is the start, second is the end. */
  | 'connect';
