# dots-and-lines: architecture and API

Status: **v1 spec**. The exact props and types are in [react-exports.md](./react-exports.md).

`dots-and-lines` is a headless toolkit for a draggable-things-and-lines surface: things you drag around a plane, and orthogonal lines you draw and edit on it. It ships **behaviour and geometry, almost never visuals**. Consumers supply the styling. The one exception is a Dot's selected ring (section 7), which can be switched off.

It is extracted from the bespoke implementation in `pedal-party`, which is the first intended consumer. The field-by-field inventory of that implementation is in [appendix-pedal-party-fields.md](./appendix-pedal-party-fields.md).

## 1. What v1 is

Three things, plus a state handle:

- **`Scene`**: a clipped viewport with pan and zoom. Everything else lives inside one.
- **`Dot`**: a draggable wrapper around whatever the consumer renders. It is exactly as large as its children.
- **`ElbowLine`**: an orthogonal path made of HTML segment elements. The consumer gives it two initial points; it starts as an L (or a straight line) and the **library owns its route** from then on. It can be selected (it takes focus), and then its segments and ends can be dragged.
- **`SceneState`**: a stable handle (from `useSceneState()`) that holds the camera and the mode. Passed to `Scene`, readable from anywhere.

A line's ends can be **magnetic**: drag one next to a Dot and it snaps to the Dot's border and follows the Dot from then on, until it is dragged away (section 7). That is on by default and `isMagnetic={false}` turns it off. Otherwise a line's initial points are read once, when it mounts; changing them later does nothing (change the component's `key` to start over). Consumers cannot read, save or restore an edited route, or which Dot an end is attached to, in v1.

| #   | Decision                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A `Scene` is required. `Dot` and `ElbowLine` must live inside one.                                                                                                                                                                                                                                         |
| 2   | `Dot` keeps its name. `Scene` is the viewport.                                                                                                                                                                                                                                                             |
| 3   | Coordinates are **CSS px at zoom 1**. There is no unit prop.                                                                                                                                                                                                                                               |
| 4   | Camera and mode live in a **stable handle** from `useSceneState()`, passed to `<Scene state={sceneState}>`. No provider.                                                                                                                                                                                   |
| 5   | `Dot` is **controlled** by props. `ElbowLine` is **uncontrolled**: it takes `initialStart` / `initialEnd`, then owns its route.                                                                                                                                                                            |
| 6   | No `className` or `style` on any component, and nothing is ever spread onto them. The one exception is `ElbowLine.className`, applied to every segment.                                                                                                                                                    |
| 7   | Types come from `@dots-and-lines/core` and are **not re-exported** by `@dots-and-lines/react`.                                                                                                                                                                                                             |
| 8   | Line editing (drag segments and ends) and connect mode (click, click to create a line) are in v1.                                                                                                                                                                                                          |
| 9   | **Selection is native focus.** `Scene`, `Dot` and `ElbowLine` are focusable (`tabindex="-1"`); an element is selected while focus is inside it. A selected Dot draws a ring (`selectable={false}` turns it off); `useSelected()` reads it in JS. There is no selection state in `SceneState`, and no `id`. |
| 10  | Reading state in React is one selector hook, `useScene(sceneState, select)`.                                                                                                                                                                                                                               |
| 11  | **Line ends are magnetic by default.** An end dragged within 16 screen px of a Dot's border snaps and follows that Dot; `isMagnetic={false}` on the `Dot` or the `ElbowLine` opts out. The attachment is internal: no ids, no callbacks, not saved.                                                        |

## 2. Not built in v1

These are deliberately left out, **along with any supporting code**. Do not add them "just in case"; each one has a cost and a later version may design it differently.

- **Reading or controlling attachments.** Line ends attach to Dots internally (section 7), but there is no `DotAnchor`, no `id` on a Dot, no `onAttach` / `onDetach`, and no way to read, save or restore which Dot an end is attached to. Also left out:
  - a `syncLinesToDots` that a consumer calls, and a removal policy that deletes lines (a line whose Dot is removed just keeps a free end)
  - forcing an attached end's segment to leave the Dot perpendicular
  - a highlight (for example a `data-dl-magnet` attribute) on a Dot while a line end is snapping to it
- **Line tips**, and their orientation. A later version may add `tipStart` / `tipEnd` props that let a consumer render a node at each end of a line. That would let `pedal-party` draw plugs without `dots-and-lines` knowing what a plug is.
- **Dot `width` / `height` props and rotation.** A Dot is as big as its children.
- **Selection state in `SceneState`**, `id`s, and selecting from outside the Scene. Selection is the browser's focus, so it is lost when focus moves to a control outside the Scene, and there is no `getSelection` or `onSelect`. Controls that act on the selection belong in an `overlay`.
- **Multi-select, box select and keyboard selection.** The wrappers are `tabindex="-1"`, so they are not in the Tab order.
- **A state hook for the document**: `useDotsAndLines`, `DotsAndLinesDocument`, `DotData`, `ElbowLineData`, `parseDocument`, and the opaque `data` slots. Consumers keep their own data.
- **`useDot`** and any "hook flavour" of the components, and prop-getter helpers.
- **Customisable input bindings** (`inputBindings`, the `InputBinding` types). v1 has one built-in set, switched on or off with `panZoom`.
- **`ElbowLine` props** `startTip`, `endTip`, `cornerRadius`, `classNames`.
- **Reading or restoring a line's edited route**: no `points` prop and no `onChange`. Together with the next item, this is what keeps a line's geometry valid by construction.
- **Controlled line ends** (`start` / `end` props that move a line when they change), and route options such as `axis` and `bend`. They can be added later without changing `initialStart` / `initialEnd`.
- **Keyboard accessibility.**

## 3. Why a `Scene` is required

Letting Dots and Lines sit anywhere would break things `pedal-party` depends on:

1. **Coordinate system.** `x`/`y` need a common origin. Pointer events arrive in client coordinates, and dragging needs `client → world`: `world = (client − sceneRect.topLeft − pan) / zoom`. Only a shared ancestor can own that mapping.
2. **Pan and zoom.** The camera is a single `translate(pan) scale(zoom)` on a wrapper around all content. It cannot be applied per-Dot without desyncing lines from dots.
3. **Creating lines.** Connect mode needs a surface that receives clicks on empty space.
4. **Containing block.** Absolutely-positioned Dots need a `position: relative; overflow: hidden` parent that clips and sizes the viewport.

A Scene fills its parent. It takes no `className` or `style`, so its size and background come from the element the consumer wraps it in. Each `ElbowLine` renders its own absolutely-positioned HTML segment elements, so stacking order between lines and Dots is just JSX order.

## 4. Packages

| Package                           | Contents                                                                                                                             | Depends on                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| `@dots-and-lines/core`            | Types, the scene state store, pan/zoom maths, the built-in input bindings, elbow geometry and editing helpers. **No DOM, no React.** | nothing                   |
| `@dots-and-lines/react`           | `Scene`, `Dot`, `ElbowLine`, `useSceneState`, `useScene`, pointer interaction                                                        | peer `core`, peer `react` |
| `@dots-and-lines/vue`, `/angular` | Future adapters, same shape                                                                                                          | `core`                    |

`@dots-and-lines/react` exports only its own components and hooks. Types that come from `core` (`Point`, `View`, `Mode`, `SceneState`) are imported from `@dots-and-lines/core`, so `core` must be installed alongside `react`, which is why it is a peer dependency.

The pointer-interaction code (drag state machines) is the largest piece that is not pure geometry. For v1 it lives in `react`, but is written as plain TypeScript controllers (functions taking `getState` and `commit` callbacks, no React imports) so that moving it into `core` when a second adapter starts is a move, not a rewrite.

Before the first publish, register the `@dots-and-lines` npm org. `npm view` returns 404 for all three package names today, but that does not prove the scope itself is free.

## 5. Vocabulary

| Term           | Meaning                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Scene**      | The viewport and coordinate space that holds Dots and lines. Clips its content and applies the camera.                                 |
| **SceneState** | The stable handle holding the camera (`View`) and the `Mode`. Created by `useSceneState()`, passed to `Scene`.                         |
| **World**      | The inner element of a Scene that carries the pan and zoom transform. Everything the consumer passes as `children` is drawn inside it. |
| **Dot**        | A draggable wrapper around the consumer's visuals. It has a position and is exactly as large as its children.                          |
| **ElbowLine**  | An orthogonal path drawn as HTML segment elements. Starts as an L between two initial points; the library owns its route afterwards.   |
| **Magnetic**   | A Dot or line that takes part in snapping. A line end attaches to a magnetic Dot's border and follows it until dragged away.           |
| **Handle**     | A consumer-rendered node (`handle` prop) placed at each segment midpoint and each end of a selected line, for dragging.                |
| **View**       | `{ panX, panY, zoom }`. Pan is in screen px, zoom is unitless.                                                                         |
| **Mode**       | `'select'` (drag and edit) or `'connect'` (click twice to create a line).                                                              |

## 6. State ownership

Two kinds of state, with different owners:

- **Dot positions** belong to the **consumer**. `Dot` takes `x` / `y` and calls `onMove`. The library never stores them, so the consumer's own state, store, or URL sync is the single source of truth.
- **A line's route** belongs to the **`ElbowLine`**. The consumer supplies `initialStart` / `initialEnd` (typically from `onConnect`) and the line owns the route from then on. This is what makes invalid paths unrepresentable: consumers never hand it a list of points. The cost is that the consumer cannot read or save an edited route in v1.
- **Where each Dot is** is reported by the `Dot` itself to its `Scene`. Each Dot registers its box (its `x` / `y` plus its measured size, from a `ResizeObserver`) and whether it is magnetic in an internal registry in the Scene's context. Lines read it; the consumer never does. Which Dot an end is attached to (an edge and a position along it) belongs to the **`ElbowLine`**, next to its route.
- **Camera and mode** belong to a **`SceneState` handle**. `useSceneState({ defaultView, zoom })` returns an object that never changes identity: `getView`, `setView`, `getMode`, `setMode`, `panBy`, `zoomBy`, `subscribe`. The consumer passes it to `<Scene state={sceneState}>` and can hand it to anything else (a toolbar, an "Add lead" button, URL sync) with no provider.

Reading from the handle does not re-render anything. Components that need to react use `useScene(sceneState, select)`, for example `useScene(sceneState, (s) => s.getView().zoom)`, and re-render only when the picked value changes. Because the handle is stable, calling `useSceneState()` in a top-level component does not re-render that component on pan or zoom. The store itself is plain code in `core`, so other frameworks can reuse it.

`Scene` also provides an internal context that `Dot` and `ElbowLine` read: the same handle and the Dot registry. Consumers never touch the context.

**Selection** is not library state: it is the browser's focus. A Dot or line is selected while focus is inside it, so the library only has to make its elements focusable and tell its own overlay and handles whether focus is inside (`onFocus` / `onBlur`, which bubble in React). The consumer styles it with `:focus-within`, and reads it in JS with `useSelected()` from inside the element. The cost is that selection follows focus: clicking a control outside the Scene deselects, so controls that act on a selection live in an `overlay`.

Persisting the camera (as `pedal-party` does in its share links) is `sceneState.subscribe(() => save(sceneState.getView()))`.

## 7. Rendering and behaviour

### `Scene`

Renders a root element that fills its parent (`position: relative; overflow: hidden; touch-action: none`) containing the world:

```html
<div data-dl-scene data-dl-mode="select">
  <div
    data-dl-world
    style="transform: translate(…) scale(…); transform-origin: 0 0"
  >
    {children}
  </div>
</div>
```

The Scene root is itself focusable (`tabindex="-1"`, `outline: none`), so a press on the background takes focus off whatever was selected. Presses that start a space-pan or a connect click are cancelled before the browser would move focus, so they leave the selection alone.

`data-dl-mode` mirrors the current mode so consumers can style it (for example a crosshair cursor in `'connect'`). `--dl-zoom` is set on the world element so consumers can counter-scale handles and overlays (`scale(calc(1 / var(--dl-zoom)))`), as `pedal-party` does for its toolbars.

Built-in pan and zoom (on by default, `panZoom={false}` turns it off) uses `pedal-party`'s bindings: ctrl/cmd + wheel zooms about the cursor, shift + wheel pans horizontally, plain wheel pans, and space + drag pans. Because plain wheel pans, a Scene captures wheel events, so it will not let the page scroll while the pointer is over it.

**Connect mode.** While `mode === 'connect'`, a pointer-down inside the Scene does not start a Dot drag. The first click is the start, the second is the end; the Scene calls `onConnect({ start, end })` and returns to `'select'`. The consumer stores those two points and renders an `ElbowLine` with them as `initialStart` / `initialEnd`. Each click first snaps to the nearest magnetic Dot border within 16 screen px, so a line drawn from one Dot to another attaches to both when it mounts.

### `Dot`

Renders an absolutely-positioned wrapper at `left: 0; top: 0`, moved with `transform: translate(x, y)` and sized `width: max-content`. Positioning with `transform` rather than `left` / `top` avoids a real layout problem: an absolutely-positioned element's available width shrinks as `left` grows, so content near the right edge would wrap. With `max-content` and a transform, a Dot never squeezes its children.

The children sit in a body element (`data-dl-dot-body`, `display: block; width: max-content`) that is a real box, so a Dot's size is its children's size and an `overlay` never inflates it. A layout effect reports that box, with the Dot's `x` / `y`, to the Scene on every render, and a `ResizeObserver` reports size changes. It reads `offsetWidth` / `offsetHeight`, which ignore the Scene's zoom. Reporting in a layout effect means a line re-renders in the same frame the Dot moves. The Dot unregisters when it unmounts. `isMagnetic` (default `true`) is part of the report.

Dragging is tracked with window-level pointer listeners (not pointer capture, which would swallow clicks on buttons inside a Dot), with pixel deltas divided by zoom. A press only becomes a drag after 3px of movement, and the click that follows a real drag is suppressed. Dragging starts only from the children, not from `overlay`, so buttons in an overlay keep working.

The wrapper is focusable (`tabindex="-1"`), so pressing the children focuses it, which selects the Dot. While focus is inside, `overlay` is rendered and the wrapper draws a ring (`outline: 2px solid var(--dl-select-color, #3b82f6)`, set inline from the tracked focus state because inline styles can't express `:focus-within`); otherwise neither. `autoFocus` focuses the Dot on mount (without scrolling the clipped Scene).

`selectable` (default `true`) turns this off. With `selectable={false}` the wrapper has no tabindex and draws no ring. That is for children that handle selection themselves, such as a Card with `tabindex="0"`: the browser focuses the Card, its own `:focus` / `:active` styles apply, and the Dot's ring doesn't stack on top. `overlay` and `useSelected()` still follow focus inside the Dot.

The ring is the library's one visual. It exists because selection by default should be visible without any CSS, and the colour is a CSS variable so it stays themeable. A consumer who wants a different look sets `selectable={false}` and styles `[data-dl-dot]:focus-within`.

### `ElbowLine`

Starts as an L between `initialStart` and `initialEnd` (`seedElbowPoints`), or a straight line if they share an x or y. It renders one absolutely-positioned HTML element per segment, each with `className` applied. Each segment's length and position are set inline; the thickness comes from the consumer through one CSS custom property read by the segment's own inline style, so one class is enough:

```css
.lead {
  --dl-line-size: 4px; /* thickness, whichever axis the segment runs along */
  background: royalblue;
  border-radius: 2px;
}
```

Each segment also has an invisible, thicker hit element (owned by the library) that receives pointer events, so a thin line is still easy to click. It has no tabindex of its own, so pressing it focuses the line's root, which selects the line.

While selected (focus is inside the root, which also contains the handles and the overlay), the line renders the `handle` node at every segment midpoint and every end, plus `overlay` at the line's anchor point. Dragging a midpoint handle moves that segment (`moveElbowSegment`), and dragging a segment at either end of the line sideways inserts a new one; dragging an end handle moves that end (`moveElbowEnd`). Edits are measured from the route at pointer-down, and the result stays in the line's own state. There is no change callback.

**Magnetic ends.** A line's ends can attach to Dots (`isMagnetic`, default `true`, on the line and on each Dot):

- _Snap._ While an end handle is dragged, the end point is tested against every magnetic Dot's box (`snapPointToRects`). Within 16 screen px (`16 / zoom` in world px) of a border it snaps to the nearest point on it, and the line remembers the attachment as `{ Dot, edge, t }`, with `t` the position along the edge from 0 to 1. A point inside a Dot snaps to the nearest edge.
- _Follow._ An attached end is not stored in the route. Each render, the route is resolved from the stored route by moving the attached end to the Dot's current edge point (`moveElbowEnd`), so the line follows with no lag and the result depends only on where the Dot is now, not on where it has been. A drag or segment edit starts from the resolved route and commits it.
- _Release._ An end held by a Dot lets go only beyond 24 screen px (`MAGNET_RELEASE`), so it does not flicker at the 16 px threshold. If the Dot unmounts, or the Dot or the line stops being magnetic, the end stays where it last was and is free.
- _On mount._ In a passive effect, so that every Dot has already reported its box wherever it sits in the tree, each of `initialStart` and `initialEnd` within 16 screen px of a magnetic Dot attaches. The attached end snaps onto the border, so it can move by up to 16 px one frame after the first paint.
- _Routing._ `moveElbowEnd` keeps the end segment's orientation and slides its neighbouring point. A two-point route has no inner point to slide, so it routes a Z (`A, (mid, A.y), (mid, to.y), to`) and the other end never moves. The end segment is not forced to leave the Dot perpendicular, so a line can run along or through a Dot's border.

Known limits: the attachment is lost if the line remounts; an attached end's handle is centred on the border, so a Dot later in the tree can cover its inner half; and because bends are re-normalised, a bend the user made can merge away when the route collapses.

## 8. Usage

```tsx
import { Scene, Dot, ElbowLine, useSceneState } from '@dots-and-lines/react';
import type { Point } from '@dots-and-lines/core';

type Lead = { id: string; start: Point; end: Point };

function Board() {
  const sceneState = useSceneState({ defaultView: initialView });
  const [pedals, setPedals] = useState(initialPedals); // consumer-owned
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  return (
    <div className={styles.board}>
      <AddLeadButton sceneState={sceneState} />{' '}
      {/* outside the Scene; no provider */}
      <Scene
        state={sceneState}
        onConnect={(lead) => {
          setLeads((all) => [...all, { id: crypto.randomUUID(), ...lead }]);
        }}
      >
        {pedals.map((pedal) => (
          <Dot
            key={pedal.id}
            x={pedal.x}
            y={pedal.y}
            onMove={(x, y) => movePedal(pedal.id, x, y)}
            overlay={<PedalToolbar id={pedal.id} />} // shown while the Dot is selected
          >
            <img className={styles.pedal} src={pedal.image} alt="" />
          </Dot>
        ))}
        {leads.map((lead) => (
          <ElbowLine
            key={lead.id}
            autoFocus // a new lead starts selected, ready to edit
            className={styles.lead}
            initialStart={lead.start}
            initialEnd={lead.end}
            handle={<span className={styles.handle} />}
          />
        ))}
      </Scene>
    </div>
  );
}

function AddLeadButton({ sceneState }: { sceneState: SceneState }) {
  // Does not subscribe, so it never re-renders on pan or zoom.
  return (
    <button onClick={() => sceneState.setMode('connect')}>Add lead</button>
  );
}
```

Dots draw in array order (there is no `zIndex` prop), so the consumer controls layering by ordering, as `pedal-party` does with boards under pedals.

## 9. Differences from pedal-party

| Difference                                                                  | Why                                                                               |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Coordinates are CSS px, not cm                                              | The library has no unit concept. CSS `cm` is a fixed 96/2.54 px                   |
| Line ends attach to Dots by proximity, with no binding data                 | The attachment is internal (section 7), so there are no ids and nothing to save   |
| A line's route is owned by `ElbowLine`, not passed in as `points`           | Invalid paths cannot be expressed; `initialStart` / `initialEnd` are all you give |
| Dot size is not stored; a Dot is as large as its children                   | The library wraps arbitrary children                                              |
| Lines are HTML segment elements, not an SVG layer                           | Consumers style them with one `className`, and corner rounding is `border-radius` |
| Camera and mode live in a stable `SceneState` handle                        | No provider, and camera changes do not re-render the owner                        |
| Hit-testing uses `data-dl-*` attributes and `stopPropagation`, not test ids | Test ids are not an API                                                           |

### What this means for migrating pedal-party

`pedal-party` still cannot move onto v1 as-is:

- Its leads snap to and follow pedals, which v1 now does, but the attachment is not exposed. `pedal-party` keeps `startBinding` / `endBinding` in each lead and saves them in share links; v1 gives the consumer no way to read or restore an attachment.
- It saves each lead's points in share links, but v1 gives the consumer no way to read or restore an edited route.
- Removing a pedal deletes the leads bound to it. In v1 a line whose Dot is removed keeps a free end, and the consumer decides whether to remove the line.
- Its snap threshold (12 px converted to cm) is not divided by zoom; v1's is a constant 16 screen px.

Closing those gaps is the next design step (section 10), and the likely shape is a way to read and restore a route together with its attachments.

## 10. Build order

1. `core`: scene state store, view maths, built-in bindings, elbow helpers (with ported specs).
2. `react`: `Scene` (pan/zoom, connect mode), `Dot`, `ElbowLine`, and the hooks.
3. Playground demo page.
4. Magnetic connections: the Dot registry, snapping, following, and releasing.
5. Later: controlled line ends, reading and restoring a line's route and its attachments, tips (`tipStart` / `tipEnd`), a document hook. Each needs its own design.
