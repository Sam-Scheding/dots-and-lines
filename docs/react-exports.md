# `@dots-and-lines/react` exports

The v1 public surface, from [architecture-and-api.md](./architecture-and-api.md).

Rules that apply to every component:

- Components accept **only the props listed here**. Nothing is spread onto them, and nothing is spread onto the elements they render.
- No `className` or `style` props, with one exception: `ElbowLine.className`.
- Coordinates are **CSS px at zoom 1**, relative to the Scene's top-left at pan 0. There is no unit prop.
- Types come from `@dots-and-lines/core`. They are **not re-exported** from this package.

| Export                    | Kind      | Prop / arg / return          | Type                                           | Default                         | Notes                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | --------- | ---------------------------- | ---------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useSceneState(options?)` | Hook      | arg: `defaultView`           | `View`                                         | `{ panX: 0, panY: 0, zoom: 1 }` | Initial camera                                                                                                                                                                                                                                                                                                                                       |
|                           |           | arg: `defaultDots`           | `readonly DotState[]`                          | `[]`                            | Starting Dots `{ id, x, y }`, e.g. from a saved `toJSON()`. Untrusted: entries with a non-finite position, or an empty or repeated id, are dropped                                                                                                                                                                                                   |
|                           |           | arg: `defaultLines`          | `readonly LineState[]`                         | `[]`                            | Starting lines `{ id, route }`. Routes that are not valid and orthogonal are dropped                                                                                                                                                                                                                                                                 |
|                           |           | arg: `zoom`                  | `{ min: number; max: number }`                 | `{ min: 0.1, max: 2 }`          | Zoom limits. `setView` and pan/zoom input are clamped to it                                                                                                                                                                                                                                                                                          |
|                           |           | returns                      | `SceneState`                                   |                                 | A **stable object**: same identity on every render, so calling the hook never re-renders on pan or zoom. Pass it to `Scene`                                                                                                                                                                                                                          |
|                           |           | returns: `state.getView`     | `() => View`                                   |                                 | Current camera. Does not subscribe                                                                                                                                                                                                                                                                                                                   |
|                           |           | returns: `state.setView`     | `(view: View) => void`                         |                                 | For zoom buttons, a pan joystick, reset                                                                                                                                                                                                                                                                                                              |
|                           |           | returns: `state.getMode`     | `() => Mode`                                   |                                 | Does not subscribe                                                                                                                                                                                                                                                                                                                                   |
|                           |           | returns: `state.setMode`     | `(mode: Mode) => void`                         |                                 | e.g. an "Add lead" button sets `'connect'`                                                                                                                                                                                                                                                                                                           |
|                           |           | returns: `state.panBy`       | `(dx: number, dy: number) => void`             |                                 | Pan by screen px                                                                                                                                                                                                                                                                                                                                     |
|                           |           | returns: `state.zoomBy`      | `(factor: number, origin?: Point) => void`     |                                 | Multiply zoom by `factor` (clamped). `origin` is a Scene-local screen point that stays fixed; omit it to leave pan alone                                                                                                                                                                                                                             |
|                           |           | returns: `state.subscribe`   | `(listener: () => void) => () => void`         |                                 | Calls `listener` after any camera or mode change. Returns an unsubscribe function. Use it to persist the camera                                                                                                                                                                                                                                      |
| `Scene`                   | Component | `state`                      | `SceneState`                                   | required                        | From `useSceneState`                                                                                                                                                                                                                                                                                                                                 |
|                           |           | `onConnect`                  | `(line: { start: Point; end: Point }) => void` |                                 | Fires when the second click completes a line in `'connect'` mode. The Scene then returns to `'select'`. Each click within 16 screen px of a magnetic Dot's border snaps onto that border, so the line you render from the two points attaches to the Dot                                                                                             |
|                           |           | `previewClassName`           | `string`                                       |                                 | `className` for the line the Scene draws in `'connect'` mode after the first click: from that click to the pointer (snapped to a magnetic Dot, like a click), as the L an `ElbowLine` starts as. Give it the class you give your `ElbowLine`s so the two match. Without it the preview is drawn but has no colour, like a line without a `className` |
|                           |           | `panZoom`                    | `boolean`                                      | `true`                          | `false` turns off built-in pan and zoom                                                                                                                                                                                                                                                                                                              |
|                           |           | `children`                   | `ReactNode`                                    |                                 | `Dot`s and `ElbowLine`s. Pressing the Scene's background takes focus off whatever was selected                                                                                                                                                                                                                                                       |
| `useScene(state, select)` | Hook      | arg: `state`                 | `SceneState`                                   | required                        |                                                                                                                                                                                                                                                                                                                                                      |
|                           |           | arg: `select`                | `(state: SceneState) => T`                     | required                        | Picks one value, e.g. `(s) => s.getView().zoom`. Must return a primitive or an object the state already holds (`getView()`, `getDots()`, `getLines()`), never a freshly built object                                                                                                                                                                 |
|                           |           | returns                      | `T`                                            |                                 | Re-renders its component only when the picked value changes                                                                                                                                                                                                                                                                                          |
| `useSelected()`           | Hook      | returns                      | `boolean`                                      |                                 | Whether the nearest `Dot` or `ElbowLine` is selected (focus is inside it). Call it from a component rendered inside one, such as a Dot's children. Throws outside both                                                                                                                                                                               |
| `Dot`                     | Component | `x`, `y`                     | `number`                                       | required                        | Top-left corner                                                                                                                                                                                                                                                                                                                                      |
|                           |           | `onMove`                     | `(x: number, y: number) => void`               |                                 | Called on every pointer move while dragging                                                                                                                                                                                                                                                                                                          |
|                           |           | `onMoveEnd`                  | `() => void`                                   |                                 | Called on pointer-up after a drag                                                                                                                                                                                                                                                                                                                    |
|                           |           | `overlay`                    | `ReactNode`                                    |                                 | Rendered **only while the Dot is selected**: focus is inside it. Not a drag target, e.g. a toolbar                                                                                                                                                                                                                                                   |
|                           |           | `selectable`                 | `boolean`                                      | `true`                          | Whether a press selects the Dot. A selected Dot draws a 2px ring in `--dl-select-color` (default blue). Set `false` when the children handle selection themselves (e.g. a focusable Card with its own `:focus` style): the wrapper is then not focusable and draws nothing                                                                           |
|                           |           | `autoFocus`                  | `boolean`                                      | `false`                         | Selects the Dot as soon as it mounts, e.g. one made by an "Add" button                                                                                                                                                                                                                                                                               |
|                           |           | `isMagnetic`                 | `boolean`                                      | `true`                          | Whether line ends snap to this Dot's border and then follow it. A line can also opt out with its own `isMagnetic`. Turning it off releases any line attached to the Dot, leaving each end where it was                                                                                                                                               |
|                           |           | `children`                   | `ReactNode`                                    | required                        | The visuals. The Dot is exactly as large as its children                                                                                                                                                                                                                                                                                             |
| `ElbowLine`               | Component | `initialStart`, `initialEnd` | `Point`                                        | required                        | Where the line begins. Read **once, on mount**: it starts as an L (or a straight line if aligned) and the library owns the route after that. Change the component's `key` to start over                                                                                                                                                              |
|                           |           | `initialRoute`               | `readonly Point[]`                             |                                 | Instead of `initialStart` / `initialEnd` (passing both is a type error): restores a whole route, e.g. one saved from `onRouteChange`. Read **once, on mount**. At least two points, every segment along an axis; an invalid route falls back to an L between its first and last point                                                                |
|                           |           | `onRouteChange`              | `(route: Point[]) => void`                     |                                 | Called with the whole route whenever it changes: a handle drag, or an attached Dot moving. Not called on mount unless attaching to a Dot there moves an end. Pass the last value back as `initialRoute` to restore the line                                                                                                                          |
|                           |           | `className`                  | `string`                                       |                                 | Applied to **every segment element**. Thickness comes from `--dl-line-size`                                                                                                                                                                                                                                                                          |
|                           |           | `autoFocus`                  | `boolean`                                      | `false`                         | Selects the line as soon as it mounts, e.g. one just made by `onConnect`                                                                                                                                                                                                                                                                             |
|                           |           | `isMagnetic`                 | `boolean`                                      | `true`                          | Whether an end dragged within 16 screen px of a magnetic Dot snaps to its border, and then follows that Dot until it is dragged more than 24 screen px away. Also whether `initialStart` / `initialEnd` attach to a Dot they sit on when the line mounts. `false` makes the line ignore every Dot                                                    |
|                           |           | `handle`                     | `ReactNode`                                    |                                 | Rendered at every segment midpoint and every end while the line is selected (focus is inside it). Dragging it edits the line                                                                                                                                                                                                                         |
|                           |           | `overlay`                    | `ReactNode`                                    |                                 | Rendered while selected, e.g. a toolbar. Its top-left sits on the midpoint of the longest segment; offset it with your own CSS                                                                                                                                                                                                                       |

## Types

Defined in `@dots-and-lines/core`:

```ts
import type { Point, View, Mode, SceneState } from '@dots-and-lines/core';
import { Scene, Dot, ElbowLine } from '@dots-and-lines/react';
```

### `Point`

```ts
/** CSS px at zoom 1, relative to the Scene's top-left at pan 0. */
type Point = { x: number; y: number };
```

An `ElbowLine` takes two of them, `initialStart` and `initialEnd`. Any two points work: the line is an L between them, or straight if they share an `x` or `y`. The route after that belongs to the line, so there is no way to hand it an invalid path.

```tsx
<ElbowLine
  initialStart={{ x: 120, y: 80 }}
  initialEnd={{ x: 400, y: 260 }}
  className={styles.lead}
/>
```

### `View` and `Mode`

```ts
/** Pan is in screen px; zoom is unitless (1 = 100%). */
type View = { panX: number; panY: number; zoom: number };

type Mode =
  | 'select' // drag Dots, select and edit lines (default)
  | 'connect'; // clicking creates a new line: first click is the start, second is the end
```

### `DotState`, `LineState` and `SceneSnapshot`

What the Scene's state holds, all plain JSON:

```ts
type DotState = { id: string; x: number; y: number };
type LineState = { id: string; route: Point[] }; // orthogonal, at least two points
type SceneSnapshot = {
  defaultView: View;
  defaultDots: DotState[];
  defaultLines: LineState[];
}; // sceneState.toJSON()
```

State-driven use, with every prop passed explicitly:

```tsx
const sceneState = useSceneState(initialBoard); // e.g. JSON.parse(saved)
const dots = useScene(sceneState, (s) => s.getDots());
const lines = useScene(sceneState, (s) => s.getLines());

<Scene state={sceneState}>
  {dots.map((dot) => (
    <Dot
      key={dot.id}
      x={dot.x}
      y={dot.y}
      onMove={(x, y) => sceneState.moveDot(dot.id, x, y)}
    >
      …
    </Dot>
  ))}
  {lines.map((line) => (
    <ElbowLine
      key={line.id}
      initialRoute={line.route}
      onRouteChange={(route) => sceneState.setLineRoute(line.id, route)}
    />
  ))}
</Scene>;

// Save: JSON.stringify(sceneState) (the encoding and the debounce are yours).
```

### Selection

Selection is the browser's own **focus**. `Scene`, `Dot` and `ElbowLine` each render an element with `tabindex="-1"`, so a press focuses it (and the press-to-focus rules of the browser pick the nearest focusable ancestor of whatever was pressed). A Dot or line is **selected** while focus is anywhere inside it, which is what `:focus-within` means.

- Pressing a Dot or a line selects it. Pressing the Scene's background focuses the Scene instead, which deselects.
- Pressing a handle or an overlay stays inside the line or Dot, so it stays selected. A `<button>` in an overlay keeps its own focus; focus is still inside.
- The elements are `tabindex="-1"`, so they are not in the Tab order. A selected `Dot` draws a ring (`outline: 2px solid var(--dl-select-color, #3b82f6)`, drawn from its tracked focus state, since inline styles can't express `:focus-within`); `selectable={false}` turns it off. The `Scene` and `ElbowLine` draw nothing: a line's selected look is its handles and overlay plus your own CSS.
- Pressing while panning with space, or while in `'connect'` mode, is cancelled before the browser would focus anything, so the selection doesn't change.
- Like any focus, the selection is lost when the user focuses something else (including a button outside the Scene) or leaves the window. Controls that need to act on the selection should live in an `overlay`.

Change the Dot's ring colour with `--dl-select-color` on any ancestor, or restyle further with plain CSS. The Dot's wrapper is `[data-dl-dot]` and the line's root is `[data-dl-line]`. The ring is an inline style, so to replace it outright use `selectable={false}` and style `:focus-within` yourself:

```css
[data-dl-dot]:focus-within .card {
  background: #eff6ff; /* in addition to the Dot's ring */
}
[data-dl-line]:focus-within .lead {
  background: royalblue;
}
```

If the content of a Dot is itself focusable (a `<div tabindex="0">` Card with its own `:focus` style), a press focuses that element instead of the Dot's wrapper, and the Dot still counts as selected (focus is inside it), so its ring would stack on the Card's own look. Pass `selectable={false}` to the Dot in that case: no ring, and the Card's `:focus` / `:active` styles do the work. `overlay` and `useSelected()` still follow focus inside the Dot. `autoFocus` needs `selectable`, since a non-selectable Dot's wrapper can't take focus.

To react in JavaScript, call `useSelected()` inside the Dot or line:

```tsx
function Card() {
  const selected = useSelected();
  return <div className={selected ? styles.cardSelected : styles.card}>…</div>;
}
```

To select from code, pass `autoFocus` (selects on mount). Outside that, focus the element yourself.

### The two hooks

There are two, and they do different jobs. One makes the store; the other reads from it.

| Hook                             | What it does                                                                                                                                                                           | Re-renders?                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `useSceneState(options)`         | Creates the store once (`useState(() => createSceneState(options))`) and returns the same handle on every render. Options are read only on the first render. It subscribes to nothing. | Never.                        |
| `useScene(sceneState, selector)` | Subscribes to the store (`useSyncExternalStore`) and returns the one value the selector picks.                                                                                         | Only when that value changes. |

`useSceneState` is not state you read: it returns a handle. So calling it in a top-level component never re-renders that component on pan, zoom or mode changes. To show a value (the zoom, the mode), read it with `useScene`. To act (set the mode, pan, zoom) or to read without subscribing, call the handle's methods directly.

```tsx
const sceneState = useSceneState({ defaultView }); // create once
const zoom = useScene(sceneState, (s) => s.getView().zoom); // re-renders when zoom changes
<button onClick={() => sceneState.setMode('connect')}>Add line</button>; // no hook needed
```

### `SceneState`

```ts
type SceneState = {
  getView(): View;
  setView(view: View): void; // clamped to the zoom limits
  getMode(): Mode;
  setMode(mode: Mode): void;
  /** Pan by screen px. */
  panBy(dx: number, dy: number): void;
  /** Multiply zoom by `factor`, clamped. `origin` (Scene-local screen px) stays fixed. */
  zoomBy(factor: number, origin?: Point): void;
  /** Dots, in draw order. The array and each entry keep their identity until they change. */
  getDots(): readonly DotState[];
  /** Returns the id (generated if omitted), or `null` for a non-finite position or an id in use. */
  addDot(dot: { id?: string; x: number; y: number }): string | null;
  moveDot(id: string, x: number, y: number): void; // ignored: unknown id, non-finite
  removeDot(id: string): void;
  getLines(): readonly LineState[];
  /** Returns the id (generated if omitted), or `null` for an invalid route or an id in use. */
  addLine(line: { id?: string; route: readonly Point[] }): string | null;
  setLineRoute(id: string, route: readonly Point[]): void; // ignored: unknown id, invalid route
  removeLine(id: string): void;
  /** `{ defaultView, defaultDots, defaultLines }`: JSON.stringify(sceneState) saves it. */
  toJSON(): SceneSnapshot;
  /** Called after any camera, mode, Dot or line change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
};
```

The handle never changes identity, so it is safe to create in a top-level component, pass around, and use as an effect dependency. Reading from it does not re-render anything. Components that need to react to changes use `useScene(sceneState, select)`, which re-renders only when the value it picks changes.

```tsx
function Board() {
  const sceneState = useSceneState({ defaultView: viewFromUrl() });

  // Persist the camera. `sceneState` is stable, so this runs once.
  useEffect(
    () => sceneState.subscribe(() => saveViewToUrl(sceneState.getView())),
    [sceneState],
  );

  return (
    <>
      <AddLeadButton sceneState={sceneState} />{' '}
      {/* outside the Scene, no provider needed */}
      <ZoomLabel sceneState={sceneState} />
      <Scene state={sceneState}>…</Scene>
    </>
  );
}

function AddLeadButton({ sceneState }: { sceneState: SceneState }) {
  // Does not subscribe, so it never re-renders on pan or zoom.
  return (
    <button onClick={() => sceneState.setMode('connect')}>Add lead</button>
  );
}

function ZoomLabel({ sceneState }: { sceneState: SceneState }) {
  // Re-renders when the zoom changes, not on pan.
  const zoom = useScene(sceneState, (s) => s.getView().zoom);
  return <span>{Math.round(zoom * 100)}%</span>;
}
```

### Magnetic connections

Line ends snap to the borders of `Dot`s and then follow them. It is on by default; `isMagnetic={false}` on a `Dot` or an `ElbowLine` turns it off.

- **Snapping.** While an end handle is dragged, an end within **16 screen px** of a magnetic Dot's border (so `16 / zoom` world px) snaps to the nearest point on that border. A handle inside a Dot snaps to the nearest edge.
- **Following.** The attachment is remembered as an edge and a position along it, so the end keeps its place on the edge when the Dot moves. Only the attached end moves; the other end stays put.
- **Letting go.** Dragging the end more than **24 screen px** from the Dot detaches it. The gap between 16 and 24 stops it flickering on and off at the threshold. Removing the Dot, or turning `isMagnetic` off on the Dot or the line, also detaches: the end stays where it last was.
- **Attaching on mount.** When an `ElbowLine` mounts, each of `initialStart` and `initialEnd` that is within 16 screen px of a magnetic Dot's border attaches to it. Dots mounted later do not pull in existing lines. This is how a line from `onConnect` ends up attached.
- **Routing.** The end segment keeps its orientation. A line with only two points routes a Z so the far end never moves. The end segment is not forced to leave the Dot perpendicular, so it can run along or through the Dot's border.
- **No ids, no callbacks.** The attachment is internal. Nothing tells the consumer which Dot a line is attached to, and it is not saved. A line that remounts starts free, and attaches again if its `initialStart` / `initialEnd` (or the ends of its `initialRoute`) sit on a Dot. That is how a saved route comes back attached.

## Also exported by `@dots-and-lines/core`

Used by `@dots-and-lines/react` and intended for framework adapters, not for app code:

```ts
createSceneState(options?): SceneState                    // the store behind useSceneState
resolveInput(event: InputEvent): ViewAction | null        // built-in wheel / space-drag bindings
seedElbowPoints(start: Point, end: Point): Point[]        // the L (or straight) path an ElbowLine starts as
parseElbowRoute(input: unknown): Point[] | null           // validates a saved route (orthogonal, 2+ points), or null
moveElbowSegment(points, segmentIndex, dx, dy): Point[]   // what dragging a segment does
moveElbowEnd(points, 'start' | 'end', to: Point): Point[] // what dragging an end does
lineSegments(points): ElbowSegment[]                      // geometry of each segment
snapPointToRects(point, targets, options): RectSnap | null // nearest point on the nearest rect edge within a distance
pointOnRectEdge(rect, edge, t): Point                     // the point t (0..1) along one edge of a rect
MAGNET_DISTANCE = 16, MAGNET_RELEASE = 24                 // screen px: snap distance, and how far a snapped end holds on
```
