# `@dots-and-lines/react` exports

The v1 public surface, from [architecture-and-api.md](./architecture-and-api.md).

Rules that apply to every component:

- Components accept **only the props listed here**. Nothing is spread onto them, and nothing is spread onto the elements they render.
- No `className` or `style` props, with one exception: `ElbowLine.className`.
- Coordinates are **CSS px at zoom 1**, relative to the Scene's top-left at pan 0. There is no unit prop.
- Types come from `@dots-and-lines/core`. They are **not re-exported** from this package.

| Export                    | Kind      | Prop / arg / return          | Type                                           | Default                         | Notes                                                                                                                                                                                                                                                                      |
| ------------------------- | --------- | ---------------------------- | ---------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useSceneState(options?)` | Hook      | arg: `defaultView`           | `View`                                         | `{ panX: 0, panY: 0, zoom: 1 }` | Initial camera                                                                                                                                                                                                                                                             |
|                           |           | arg: `zoom`                  | `{ min: number; max: number }`                 | `{ min: 0.1, max: 2 }`          | Zoom limits. `setView` and pan/zoom input are clamped to it                                                                                                                                                                                                                |
|                           |           | returns                      | `SceneState`                                   |                                 | A **stable object**: same identity on every render, so calling the hook never re-renders on pan or zoom. Pass it to `Scene`                                                                                                                                                |
|                           |           | returns: `state.getView`     | `() => View`                                   |                                 | Current camera. Does not subscribe                                                                                                                                                                                                                                         |
|                           |           | returns: `state.setView`     | `(view: View) => void`                         |                                 | For zoom buttons, a pan joystick, reset                                                                                                                                                                                                                                    |
|                           |           | returns: `state.getMode`     | `() => Mode`                                   |                                 | Does not subscribe                                                                                                                                                                                                                                                         |
|                           |           | returns: `state.setMode`     | `(mode: Mode) => void`                         |                                 | e.g. an "Add lead" button sets `'connect'`                                                                                                                                                                                                                                 |
|                           |           | returns: `state.panBy`       | `(dx: number, dy: number) => void`             |                                 | Pan by screen px                                                                                                                                                                                                                                                           |
|                           |           | returns: `state.zoomBy`      | `(factor: number, origin?: Point) => void`     |                                 | Multiply zoom by `factor` (clamped). `origin` is a Scene-local screen point that stays fixed; omit it to leave pan alone                                                                                                                                                   |
|                           |           | returns: `state.subscribe`   | `(listener: () => void) => () => void`         |                                 | Calls `listener` after any camera or mode change. Returns an unsubscribe function. Use it to persist the camera                                                                                                                                                            |
| `Scene`                   | Component | `state`                      | `SceneState`                                   | required                        | From `useSceneState`                                                                                                                                                                                                                                                       |
|                           |           | `onConnect`                  | `(line: { start: Point; end: Point }) => void` |                                 | Fires when the second click completes a line in `'connect'` mode. The Scene then returns to `'select'`                                                                                                                                                                     |
|                           |           | `panZoom`                    | `boolean`                                      | `true`                          | `false` turns off built-in pan and zoom                                                                                                                                                                                                                                    |
|                           |           | `children`                   | `ReactNode`                                    |                                 | `Dot`s and `ElbowLine`s. Pressing the Scene's background takes focus off whatever was selected                                                                                                                                                                             |
| `useScene(state, select)` | Hook      | arg: `state`                 | `SceneState`                                   | required                        |                                                                                                                                                                                                                                                                            |
|                           |           | arg: `select`                | `(state: SceneState) => T`                     | required                        | Picks one value, e.g. `(s) => s.getView().zoom`. Must return a primitive or an object the state already holds (`getView()`, `getSelection()`), never a freshly built object                                                                                                |
|                           |           | returns                      | `T`                                            |                                 | Re-renders its component only when the picked value changes                                                                                                                                                                                                                |
| `useSelected()`           | Hook      | returns                      | `boolean`                                      |                                 | Whether the nearest `Dot` or `ElbowLine` is selected (focus is inside it). Call it from a component rendered inside one, such as a Dot's children. Throws outside both                                                                                                     |
| `Dot`                     | Component | `x`, `y`                     | `number`                                       | required                        | Top-left corner                                                                                                                                                                                                                                                            |
|                           |           | `onMove`                     | `(x: number, y: number) => void`               |                                 | Called on every pointer move while dragging                                                                                                                                                                                                                                |
|                           |           | `onMoveEnd`                  | `() => void`                                   |                                 | Called on pointer-up after a drag                                                                                                                                                                                                                                          |
|                           |           | `overlay`                    | `ReactNode`                                    |                                 | Rendered **only while the Dot is selected**: focus is inside it. Not a drag target, e.g. a toolbar                                                                                                                                                                         |
|                           |           | `selectable`                 | `boolean`                                      | `true`                          | Whether a press selects the Dot. A selected Dot draws a 2px ring in `--dl-select-color` (default blue). Set `false` when the children handle selection themselves (e.g. a focusable Card with its own `:focus` style): the wrapper is then not focusable and draws nothing |
|                           |           | `autoFocus`                  | `boolean`                                      | `false`                         | Selects the Dot as soon as it mounts, e.g. one made by an "Add" button                                                                                                                                                                                                     |
|                           |           | `children`                   | `ReactNode`                                    | required                        | The visuals. The Dot is exactly as large as its children                                                                                                                                                                                                                   |
| `ElbowLine`               | Component | `initialStart`, `initialEnd` | `Point`                                        | required                        | Where the line begins. Read **once, on mount**: it starts as an L (or a straight line if aligned) and the library owns the route after that. Change the component's `key` to start over                                                                                    |
|                           |           | `className`                  | `string`                                       |                                 | Applied to **every segment element**. Thickness comes from `--dl-line-size`                                                                                                                                                                                                |
|                           |           | `autoFocus`                  | `boolean`                                      | `false`                         | Selects the line as soon as it mounts, e.g. one just made by `onConnect`                                                                                                                                                                                                   |
|                           |           | `handle`                     | `ReactNode`                                    |                                 | Rendered at every segment midpoint and every end while the line is selected (focus is inside it). Dragging it edits the line                                                                                                                                               |
|                           |           | `overlay`                    | `ReactNode`                                    |                                 | Rendered while selected, e.g. a toolbar. Its top-left sits on the midpoint of the longest segment; offset it with your own CSS                                                                                                                                             |

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
  /** Called after any camera or mode change. Returns an unsubscribe function. */
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

## Also exported by `@dots-and-lines/core`

Used by `@dots-and-lines/react` and intended for framework adapters, not for app code:

```ts
createSceneState(options?): SceneState                    // the store behind useSceneState
resolveInput(event: InputEvent): ViewAction | null        // built-in wheel / space-drag bindings
seedElbowPoints(start: Point, end: Point): Point[]        // the L (or straight) path an ElbowLine starts as
moveElbowSegment(points, segmentIndex, dx, dy): Point[]   // what dragging a segment does
moveElbowEnd(points, 'start' | 'end', to: Point): Point[] // what dragging an end does
lineSegments(points): ElbowSegment[]                      // geometry of each segment
```
