# `@dots-and-lines/react` exports

Proposed public surface, from [architecture-and-api.md](./architecture-and-api.md). Nothing is implemented yet.

Rules that apply to every component:

- Components accept **only the props listed here**. Nothing is spread onto them, and nothing is spread onto the elements they render.
- No `className` or `style` props, with one exception: `ElbowLine.className`.
- Coordinates are **CSS px at zoom 1**, relative to the Scene's top-left at pan 0. There is no unit prop.
- The library **measures** the size of `Dot` children and of line tips. Sizes are never passed in.

| Export                           | Kind      | Prop / arg / return           | Type                                               | Default                         | Notes                                                                                                                                            |
| -------------------------------- | --------- | ----------------------------- | -------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useSceneState(options?)`        | Hook      | arg: `defaultView`            | `View`                                             | `{ panX: 0, panY: 0, zoom: 1 }` | Initial camera                                                                                                                                   |
|                                  |           | arg: `zoom`                   | `{ min: number; max: number }`                     | `{ min: 0.1, max: 2 }`          | Zoom limits. `setView` and input are clamped to it                                                                                               |
|                                  |           | returns                       | `SceneState`                                       |                                 | A **stable object**: same identity on every render, so calling the hook never re-renders on pan or zoom. Pass it to `Scene`, and use it anywhere |
|                                  |           | returns: `state.getView`      | `() => View`                                       |                                 | Current camera. Does not subscribe                                                                                                               |
|                                  |           | returns: `state.setView`      | `(view: View) => void`                             |                                 | For zoom buttons, a pan joystick, reset                                                                                                          |
|                                  |           | returns: `state.getMode`      | `() => Mode`                                       |                                 | Does not subscribe                                                                                                                               |
|                                  |           | returns: `state.setMode`      | `(mode: Mode) => void`                             |                                 | e.g. an "Add lead" button sets `'connect'`                                                                                                       |
|                                  |           | returns: `state.subscribe`    | `(listener: () => void) => () => void`             |                                 | Calls `listener` after any camera or mode change. Returns an unsubscribe function. Use it to persist the camera                                  |
| `Scene`                          | Component | `state`                       | `SceneState`                                       | required                        | From `useSceneState`                                                                                                                             |
|                                  |           | `onConnect`                   | `(line: LineDraft) => void`                        |                                 | Fires when the second click completes a line in `'connect'` mode. The Scene then returns to `'select'`                                           |
|                                  |           | `inputBindings`               | `InputBinding[] \| false`                          | `defaultInputBindings`          | `false` disables pan/zoom. See the type below                                                                                                    |
|                                  |           | `children`                    | `ReactNode`                                        |                                 | `Dot`s and `ElbowLine`s                                                                                                                          |
| `useSceneView(state)`            | Hook      | arg: `state`                  | `SceneState`                                       | required                        |                                                                                                                                                  |
|                                  |           | returns                       | `View`                                             |                                 | Re-renders its component on **every camera change**                                                                                              |
| `useSceneMode(state)`            | Hook      | arg: `state`                  | `SceneState`                                       | required                        |                                                                                                                                                  |
|                                  |           | returns                       | `Mode`                                             |                                 | Re-renders its component only when the mode changes                                                                                              |
| `Dot`                            | Component | `id`                          | `string`                                           | required                        | Lines anchor to it                                                                                                                               |
|                                  |           | `x`, `y`                      | `number`                                           | required                        | Top-left corner                                                                                                                                  |
|                                  |           | `onMove`                      | `(x: number, y: number) => void`                   |                                 | Called on every pointer move while dragging                                                                                                      |
|                                  |           | `onMoveEnd`                   | `() => void`                                       |                                 |                                                                                                                                                  |
|                                  |           | `overlay`                     | `ReactNode`                                        |                                 | Rendered with the Dot, e.g. a toolbar                                                                                                            |
|                                  |           | `children`                    | `ReactNode`                                        | required                        | The visuals. The Dot is exactly as large as its children                                                                                         |
| `ElbowLine`                      | Component | `points`                      | `Point[]`                                          | required                        | Orthogonal path in absolute coordinates. See the type below                                                                                      |
|                                  |           | `start`, `end`                | `DotAnchor \| null`                                | `null`                          | Anchor to a Dot edge, or `null` for a free end. An anchor overrides the matching end point                                                       |
|                                  |           | `startTip`, `endTip`          | `ReactNode`                                        |                                 | Rendered at each end of the line, e.g. a plug                                                                                                    |
|                                  |           | `selected`                    | `boolean`                                          | `false`                         |                                                                                                                                                  |
|                                  |           | `onSelect`                    | `() => void`                                       |                                 |                                                                                                                                                  |
|                                  |           | `onChange`                    | `(next: LineChange) => void`                       |                                 | Fires once on pointer-up after a segment or tip drag                                                                                             |
|                                  |           | `overlay`                     | `ReactNode`                                        |                                 | Rendered at the line's anchor point, e.g. a toolbar                                                                                              |
|                                  |           | `className`                   | `string`                                           |                                 | Applied to **every segment element**                                                                                                             |
| `useDotsAndLines<TDot, TLine>()` | Hook      | arg: `defaultValue`           | `DotsAndLinesDocument<TDot, TLine>`                |                                 | Initial document (uncontrolled)                                                                                                                  |
|                                  |           | arg: `value`                  | `DotsAndLinesDocument<TDot, TLine>`                |                                 | The document (controlled). Same shape as `defaultValue`                                                                                          |
|                                  |           | arg: `onChange`               | `(doc: DotsAndLinesDocument<TDot, TLine>) => void` |                                 | Used with `value`                                                                                                                                |
|                                  |           | returns: `state`              | `DotsAndLinesDocument<TDot, TLine>`                |                                 |                                                                                                                                                  |
|                                  |           | returns: `selectedLineId`     | `string \| null`                                   |                                 | Ephemeral, not in the document                                                                                                                   |
|                                  |           | returns: `actions.addDot`     | `(dot: NewDot<TDot>) => string`                    |                                 | Returns the new id. Generates one if omitted                                                                                                     |
|                                  |           | returns: `actions.moveDot`    | `(id: string, x: number, y: number) => void`       |                                 |                                                                                                                                                  |
|                                  |           | returns: `actions.removeDot`  | `(id: string) => void`                             |                                 | Also deletes lines anchored to it                                                                                                                |
|                                  |           | returns: `actions.addLine`    | `(draft: LineDraft) => string`                     |                                 | Takes `onConnect`'s payload. Returns the new id and selects the line                                                                             |
|                                  |           | returns: `actions.updateLine` | `(id: string, patch: Partial<LineDraft>) => void`  |                                 | e.g. pass an `onChange` payload, or change `data`                                                                                                |
|                                  |           | returns: `actions.removeLine` | `(id: string) => void`                             |                                 |                                                                                                                                                  |
|                                  |           | returns: `actions.selectLine` | `(id: string \| null) => void`                     |                                 |                                                                                                                                                  |

## Types

Types are defined in `@dots-and-lines/core` and are **not re-exported** from `@dots-and-lines/react`. Import them from core:

```ts
import type { Point, DotAnchor, View } from '@dots-and-lines/core';
import { Scene, Dot, ElbowLine } from '@dots-and-lines/react';
```

### `Point`

```ts
/** CSS px at zoom 1, relative to the Scene's top-left at pan 0. */
type Point = { x: number; y: number };
```

An `ElbowLine`'s `points` is the whole path, in order, and every consecutive pair shares an `x` or a `y` (it is orthogonal). The first and last points are the line's two ends.

```ts
// An S-shaped path: right, up, right.
const points: Point[] = [
  { x: 385, y: 317 }, // start
  { x: 425, y: 317 }, // horizontal segment
  { x: 425, y: 200 }, // vertical segment
  { x: 465, y: 200 }, // end, horizontal segment
];
```

### `Edge` and `DotAnchor`

```ts
type Edge = 'left' | 'right' | 'top' | 'bottom';

/** A point on the edge of a Dot, identified by the Dot's `id`. */
type DotAnchor = {
  dotId: string;
  edge: Edge;
  /** 0–1 along that edge: top to bottom for left/right, left to right for top/bottom. */
  t: number;
};
```

```ts
const start: DotAnchor = { dotId: 'pedal-1', edge: 'right', t: 0.5 }; // middle of its right edge
const end: DotAnchor = { dotId: 'pedal-2', edge: 'top', t: 0.25 }; // a quarter along its top edge
```

When `start` or `end` is non-null, the line is drawn from the anchor's current position, which is derived from the Dot's `x`, `y` and measured size, and the stored end point is ignored. With `null`, the end sits at the stored point.

### `View`, `Mode`

```ts
/** Pan is in screen px; zoom is unitless (1 = 100%). */
type View = { panX: number; panY: number; zoom: number };

type Mode =
  | 'select' // drag Dots, select and edit lines (default)
  | 'connect'; // clicking creates a new line: first click is the start, second is the end
```

### `SceneState`

```ts
type SceneState = {
  getView(): View;
  setView(view: View): void; // clamped to the zoom limits
  getMode(): Mode;
  setMode(mode: Mode): void;
  /** Called after any camera or mode change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
};
```

The handle never changes identity, so it is safe to create in a top-level component, pass around, and use as an effect dependency. Reading from it does not re-render anything. Components that need to react to changes use `useSceneView(scene)` or `useSceneMode(scene)`.

```tsx
function Board() {
  const scene = useSceneState({ defaultView: viewFromUrl() });

  // Persist the camera. `scene` is stable, so this runs once.
  useEffect(
    () => scene.subscribe(() => saveViewToUrl(scene.getView())),
    [scene],
  );

  return (
    <>
      <AddLeadButton scene={scene} />{' '}
      {/* outside the Scene, no provider needed */}
      <ZoomLabel scene={scene} />
      <Scene state={scene}>…</Scene>
    </>
  );
}

function AddLeadButton({ scene }: { scene: SceneState }) {
  // Does not subscribe, so it never re-renders on pan or zoom.
  return <button onClick={() => scene.setMode('connect')}>Add lead</button>;
}

function ZoomLabel({ scene }: { scene: SceneState }) {
  const { zoom } = useSceneView(scene); // re-renders on every camera change
  return <span>{Math.round(zoom * 100)}%</span>;
}
```

### `LineDraft`, `LineChange`

```ts
/** The payload of `Scene.onConnect`: a new line, before it has an id. */
type LineDraft<TLine = unknown> = Omit<ElbowLineData<TLine>, 'id'>;

/** The payload of `ElbowLine.onChange`. */
type LineChange = {
  points: Point[];
  start: DotAnchor | null;
  end: DotAnchor | null;
};
```

### `InputBinding`

Bindings are checked in order and the **first one that returns an action wins**. Return `null` to pass.

```ts
type InputEvent =
  | {
      source: 'wheel';
      deltaX: number;
      deltaY: number;
      ctrlKey: boolean;
      metaKey: boolean;
      shiftKey: boolean;
    }
  | {
      source: 'pointer';
      deltaX: number;
      deltaY: number;
      buttons: number; // bitmask; 1 = primary button held
      spaceKey: boolean;
    };

type InputAction =
  | { type: 'pan'; deltaX: number; deltaY: number } // screen px
  | { type: 'zoomBy'; factor: number }; // multiplier about the cursor

type InputBinding = {
  id: string;
  match: (event: InputEvent) => InputAction | null;
};
```

```ts
// Ctrl/Cmd + wheel zooms (this is how pinch-to-zoom arrives on a trackpad).
const ctrlWheelZoom: InputBinding = {
  id: 'ctrl-wheel-zoom',
  match(event) {
    if (event.source !== 'wheel') return null;
    if (!(event.ctrlKey || event.metaKey)) return null;
    return { type: 'zoomBy', factor: Math.exp(-event.deltaY * 0.01) };
  },
};

// Space + drag pans.
const spaceDragPan: InputBinding = {
  id: 'space-drag-pan',
  match(event) {
    if (event.source !== 'pointer' || !event.spaceKey) return null;
    if ((event.buttons & 1) === 0) return null;
    return { type: 'pan', deltaX: event.deltaX, deltaY: event.deltaY };
  },
};

<Scene state={scene} inputBindings={[ctrlWheelZoom, spaceDragPan]} />;
```

`defaultInputBindings` is pedal-party's four: ctrl/cmd + wheel zoom, shift + wheel horizontal pan, wheel pan, and space + drag pan.

### Document types

```ts
type DotData<TData = unknown> = {
  id: string;
  x: number; // top-left
  y: number;
  data?: TData; // consumer-owned, JSON-serialisable, never inspected by the library
};

type ElbowLineData<TData = unknown> = {
  id: string;
  type: 'elbow'; // leaves room for other line types later
  points: Point[];
  start: DotAnchor | null;
  end: DotAnchor | null;
  data?: TData;
};

type DotsAndLinesDocument<TDot = unknown, TLine = unknown> = {
  version: 1;
  dots: DotData<TDot>[];
  lines: ElbowLineData<TLine>[];
};

type NewDot<TDot = unknown> = Omit<DotData<TDot>, 'id'> & { id?: string };
```

`defaultValue` and `value` are a `DotsAndLinesDocument`: the full description of what is on the page. For example:

```ts
type PedalData = { name: string; image: string };
type LeadData = { color: 'blue' | 'red' | 'neutral' };

const defaultValue: DotsAndLinesDocument<PedalData, LeadData> = {
  version: 1,
  dots: [
    {
      id: 'pedal-1',
      x: 120,
      y: 90,
      data: { name: 'Boss DS-1', image: 'ds1.png' },
    },
    {
      id: 'pedal-2',
      x: 465,
      y: 40,
      data: { name: 'MXR Phase 90', image: 'phase90.png' },
    },
  ],
  lines: [
    {
      id: 'lead-1',
      type: 'elbow',
      points: [
        { x: 385, y: 317 },
        { x: 425, y: 317 },
        { x: 425, y: 200 },
        { x: 465, y: 200 },
      ],
      start: { dotId: 'pedal-1', edge: 'right', t: 0.5 },
      end: { dotId: 'pedal-2', edge: 'left', t: 0.5 },
      data: { color: 'blue' },
    },
  ],
};
```

The camera is not in the document. It lives in `SceneState` (`useSceneState()`).
