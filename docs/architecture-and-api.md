# dots-and-lines: architecture and API

Status: **proposal**, for review before any code is written.

`dots-and-lines` is a headless toolkit for a draggable-boxes-and-connectors surface: things you drag around a plane, and lines you route between them. It ships **behaviour and geometry, never visuals**. Consumers supply every pixel of styling.

It is extracted from the bespoke implementation in `pedal-party`, which will eventually be migrated onto it. The field-by-field inventory of that implementation is in [appendix-pedal-party-fields.md](./appendix-pedal-party-fields.md).

## 1. Decisions at a glance

| #   | Question                | Decision                                                                                                                                                                                                                            |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Is a `Scene` integral?  | **Yes, and it is required.** `Dot` and `ElbowLine` must live inside one.                                                                                                                                                            |
| 2   | Fields from pedal-party | Inventoried in the appendix. Position and anchors become props; brand, name, image and colour become opaque `data`. Sizes are not stored (see 3).                                                                                   |
| 3   | Dot size                | **Measured, never passed in.** A Dot is as large as its children; the library measures it (and line tips) with a `ResizeObserver`.                                                                                                  |
| 4   | Hook or Context?        | **Controlled components + a state hook for the document** (dots and lines). Camera and mode live in a **stable handle** from `useSceneState()`, passed to `Scene`. No provider.                                                     |
| 5   | Units                   | **CSS px at zoom 1.** No unit prop. pedal-party converts cm to px at its own boundary.                                                                                                                                              |
| 6   | Styling                 | No `className` / `style` on any component, and nothing is ever spread onto them. The one exception is `ElbowLine.className`, applied to every segment.                                                                              |
| 7   | v1 surface              | `Scene`, `useSceneState`, `useSceneView`, `useSceneMode`, `Dot`, `ElbowLine`, `useDotsAndLines`, and a pure `core`. The exact props and types are in [react-exports.md](./react-exports.md). Rotation and `useDot` are out for now. |

## 2. Question 1: is a `Scene` integral?

**Yes.** The alternative, letting Dots and Lines sit anywhere, breaks things that the pedal-party implementation depends on:

1. **Coordinate system.** `x`/`y` need a common origin. Pointer events arrive in client coordinates, and dragging needs `client → world`:
   `world = (client − sceneRect.topLeft − pan) / zoom`. Only a shared ancestor can own that mapping.
2. **Pan and zoom.** The camera is a single `translate(pan) scale(zoom)` on a wrapper around all content. It cannot be applied per-Dot without desyncing lines from dots.
3. **Snapping and anchoring.** While a line tip is dragged, it needs the measured rectangle of every Dot in the same space, and anchored line ends are drawn from those rectangles. `Scene` holds the registry that Dots report their measured rectangle into.
4. **Drawing new lines.** pedal-party's "click, click" draw mode needs a surface that receives clicks on empty space.
5. **Containing block.** Absolutely-positioned Dots need a `position: relative; overflow: hidden` parent that clips and sizes the viewport.

What `Scene` is **not**: it does not render a shared line layer. Each `ElbowLine` renders its own absolutely-positioned HTML segment elements, so stacking order between lines and dots is just JSX order. (pedal-party's single lead layer always sits above every pedal. That becomes a choice instead of a constraint.)

A Scene fills its parent. It takes no `className` or `style`, so its size and background come from the element the consumer wraps it in. Camera and mode state live in a handle the consumer creates with `useSceneState()` and passes in as `state`, so the Scene's own chrome (toolbars, a zoom label, an "Add lead" button) can sit anywhere in the app, not only inside the Scene.

## 3. Packages

| Package                           | Contents                                                                                                                                                           | Depends on               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `@dots-and-lines/core`            | Types, document schema and parser, elbow routing and editing, snapping, anchor maths, pan/zoom maths, input bindings, the scene state store. **No DOM, no React.** | nothing                  |
| `@dots-and-lines/react`           | `Scene`, `useSceneState`, `useSceneView`, `useSceneMode`, `Dot`, `ElbowLine`, `useDotsAndLines`, pointer interaction                                               | `core`; peer `react@^19` |
| `@dots-and-lines/vue`, `/angular` | Future adapters, same shape                                                                                                                                        | `core`                   |

pedal-party's example import `import { Dot, ElbowLine } from 'dots-and-lines'` becomes `import { Dot, ElbowLine } from '@dots-and-lines/react'`.

**Types are not re-exported.** `@dots-and-lines/react` exports only its own components and hooks. Types that come from `core` (`Point`, `View`, `DotAnchor`, `InputBinding`, `DotsAndLinesDocument`, and so on) are imported from `@dots-and-lines/core`, so a consumer's imports always show which package a thing lives in, and `react` never forwards `core` exports.

The pointer-interaction code (drag state machines) is the largest piece that is not pure geometry. For v1 it lives in `react`, but is written as plain TypeScript controllers (functions or classes taking `getState` and `commit` callbacks, no React imports) so that extracting it into `core` when the second adapter starts is a move, not a rewrite.

Before the first publish, register the `@dots-and-lines` npm org. `npm view` returns 404 for all three package names today, but that does not prove the scope itself is free.

## 4. Vocabulary

| Term          | Meaning                                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scene**     | The viewport and coordinate space that holds Dots and lines. Clips its content and applies the camera. Its camera and mode state live in a `SceneState` handle. |
| **Dot**       | A draggable wrapper around the consumer's visuals. It has a position and is exactly as large as its children. (See open question 1.)                            |
| **ElbowLine** | An orthogonal path made of HTML segment elements, connecting two ends. Each end is either free or anchored to a Dot edge.                                       |
| **Anchor**    | `{ dotId, edge, t }`: a point on a Dot's edge, `t` in [0,1] along it.                                                                                           |
| **Tip**       | A React node rendered at one end of a line (a "plug"). Passed as `startTip` / `endTip`; the library measures and orients it.                                    |
| **World px**  | The coordinate unit: CSS px at zoom 1.                                                                                                                          |
| **View**      | `{ panX, panY, zoom }`. Pan is in screen px, zoom is unitless.                                                                                                  |
| **Mode**      | `'select'` (drag and edit) or `'connect'` (click twice to create a line).                                                                                       |

## 5. Question 4: hook vs Context

### The real question

"Hook or Context" is really **who owns the state**. pedal-party's constraints:

- State is a **serialisable document** that becomes a shareable URL.
- Each dot carries **app data** (brand, name, image) the library knows nothing about.
- **Other UI mutates it**: a catalog sidebar adds dots, a toolbar removes lines, URL sync reads and writes it.
- Moving a dot has **cascading effects** (bound line tips must re-pin).

### Why not option (b), a Provider that owns state through JSX children

```tsx
<DotsAndLinesProvider>
  {/* where do x and y come from? */}
  <Dot>
    <div />
  </Dot>
</DotsAndLinesProvider>
```

Your instinct was right. If Dots self-register into a Provider:

- The state is **only reachable from inside the tree**, so a sidebar outside it cannot add a dot, and URL sync has nothing to read.
- A serialisable document would have to be reassembled from whatever mounted, in mount order, with no place for app data.
- Dots appearing and disappearing through React mounting makes mounting the source of truth, which is backwards for a data-driven app.
- It does not port: Vue and Angular would each need their own self-registration scheme.

### Decision

Three layers, each usable without the one above it:

```text
┌───────────────────────────────────────────────┐
│ useDotsAndLines()  (react, optional)          │  document state + actions, thin wrapper over core
├───────────────────────────────────────────────┤
│ Scene / Dot / ElbowLine    (react)            │  Dot and ElbowLine controlled by props; Scene takes a state handle
├───────────────────────────────────────────────┤
│ @dots-and-lines/core                          │  pure data + functions, framework-free
└───────────────────────────────────────────────┘
```

1. **`core`** defines the document and pure transitions, for example `moveDot(doc, id, x, y)`. This is the part every framework shares.
2. **`Dot` and `ElbowLine` are controlled.** `Dot` takes `x`/`y` and calls `onMove`. `ElbowLine` takes `points` and calls `onChange`. They hold no document state.
3. **Camera and mode live in a stable handle.** `useSceneState({ defaultView, zoom })` returns a `SceneState` object that never changes identity: `getView`, `setView`, `getMode`, `setMode`, `subscribe`. The consumer passes it to `<Scene state={scene}>` and can hand it to anything else, such as a toolbar or a URL-sync effect, with no provider. Reading from the handle does not re-render anything; components that need to react use `useSceneView(scene)` or `useSceneMode(scene)`. The store itself is plain code in `core`.
4. **`useDotsAndLines`** is a store for the document (dots and lines): it applies core transitions and exposes `state` plus actions. It supports uncontrolled (`defaultValue`) and controlled (`value` + `onChange`) use, so it can sit on top of `useState`, Zustand, or a URL-synced store.

A consumer who doesn't want the hook can call core's pure functions in their own reducer, as pedal-party's `App` does today.

### Where Context is used

`Scene` provides a context that `Dot` and `ElbowLine` read. It carries:

- the same `SceneState` handle the consumer passed in
- `clientToWorld(clientX, clientY)`
- the registry of measured Dot rectangles, used for anchoring and snapping

It does not hold the document, and consumers never need to touch it: outside code uses the handle, not the context. There is no public provider.

### Why lines carry `points`, not just `from` and `to`

You asked whether the line "also encodes the path segments". **Yes.** The elbows are user-draggable and are part of what is shared, so they must be persisted. Anchors alone say where the ends attach, not how the path bends. (Auto-routing when `points` is omitted is a possible later feature; it would use core's `seedElbowPoints`.) Because Dot sizes are measured, the first and last points are overridden by any anchor at render time; see open question 2.

## 6. Data model (`core`)

The types, with examples, are in [react-exports.md](./react-exports.md#types). Summary of what changed from pedal-party:

- `DotData` is `{ id, x, y, data? }`. **No width, height or rotation.** Width and height come from the children and are measured at runtime; rotation is out of scope for the first pass.
- `ElbowLineData` is `{ id, type: 'elbow', points, start, end, data? }`. **No tip depth or width.** Tips are React nodes the library measures.
- `DotsAndLinesDocument` is `{ version, dots, lines }`. **No `view`.** The camera lives in `SceneState`.
- Colour, kind, brand, name and image live in `data`. The library never inspects it.
- **Persistence stays with the app.** `core` exports `parseDocument(unknown): Document | null` (validation and defaults, the same lenient rules as pedal-party's decoder). URL and `lz-string` encoding stay in the consumer.
- **Migration.** pedal-party's existing `v: 1` share links keep working through a small converter in pedal-party, not in this library. It has to convert cm to px, and it no longer needs `widthCm` / `heightCm` in the document.

### Pure functions in `core`

Ported from pedal-party's `utils/` with their specs. Full mapping is in the appendix. Rectangles (`Rect`) are measured Dot rectangles supplied by the caller, so none of this touches the DOM.

```ts
// document transitions
moveDot(doc, id, x, y): Doc
removeDot(doc, id, { lines: 'delete' | 'detach' }): Doc

// line editing
seedElbowPoints(a: Point, b: Point): Point[]
moveElbowSegment(points, segmentIndex, dx, dy): Point[]
updateLineTip(line, 'start' | 'end', point, anchor): ElbowLineData
resolveLinePoints(line, dotRects, tipDepths): Point[]  // anchors override stored end points

// geometry
anchorPoint(rect: Rect, anchor): Point
snapToDotEdge(point, dotRects, threshold): { point; anchor; distance } | null
lineSegments(points): { orientation: 'h' | 'v'; x; y; length }[]
tipOutward(end, adjacent, anchor): Edge

// camera and scene state
createSceneState({ defaultView, zoom }): SceneState   // the stable handle; framework-free
applyViewAction(view, action, limits?): View
resolveInput(event, bindings): InputAction | null
defaultInputBindings
```

Gone, compared with the earlier draft: `syncLinesToDots` (anchored ends are resolved at render, not re-pinned in state), `rotateDot`, `buildElbowPath` (lines are HTML segments, not an SVG path) and `tipRect`.

## 7. React API (v1)

Props, arguments, return values and types are in [react-exports.md](./react-exports.md). This section covers rendering and usage.

### `Scene`

Renders a root element that fills its parent (`position: relative; overflow: hidden; touch-action: none`) containing a "world" element that carries the camera:

```html
<div data-dl-scene>
  <div
    data-dl-world
    style="transform: translate(…) scale(…); transform-origin: 0 0"
  >
    {children}
  </div>
</div>
```

Everything passed as `children` is drawn **inside the world**, so it is panned and scaled. `--dl-zoom` is set on the world element so consumers can counter-scale overlays (`scale(calc(1 / var(--dl-zoom)))`), as pedal-party does for its toolbars.

### `Dot`

Renders an absolutely-positioned wrapper at `left: 0; top: 0` moved with `transform: translate(x, y)`, sized `width: max-content`, with `touch-action: none`. The wrapper sizes to its children, and a `ResizeObserver` reports the measured size to `Scene`.

Positioning with `transform` instead of `left`/`top` avoids a real layout problem: an absolutely-positioned element's available width shrinks as `left` grows, so content near the right edge would wrap. `max-content` plus a transform means a Dot never squeezes its children.

Pointer capture handles drag. Consumer-supplied children are never given the drag handlers.

### `ElbowLine`

Renders one absolutely-positioned HTML element per segment, each with `className` applied. Each segment's length and position are set inline. The thickness is up to the consumer; the proposal is a single CSS custom property, read by the library's inline styles on the segment element itself, so one class is enough:

```css
.lead {
  --dl-line-size: 4px; /* thickness, whichever axis the segment runs along */
  background: royalblue;
  border-radius: 2px;
}
```

`startTip` and `endTip` are wrapped in a positioned element at each end. The library measures them, places the attach point on the Dot edge, and turns them so they point away from that edge. Authoring convention (open question 3): design the tip as it would look on the **right** edge of a Dot, extending to the right, and the library rotates it by multiples of 90° for the other edges.

### Usage with the hook

```tsx
import {
  Scene,
  Dot,
  ElbowLine,
  useDotsAndLines,
  useSceneState,
} from '@dots-and-lines/react';

function Board() {
  const scene = useSceneState({ defaultView: initialView });
  const { state, actions, selectedLineId } = useDotsAndLines<
    PedalData,
    LeadData
  >({ defaultValue: initialDocument });

  return (
    <div className={styles.board}>
      <AddLeadButton scene={scene} /> {/* outside the Scene; no provider */}
      <Scene state={scene} onConnect={actions.addLine}>
        {sortBoardsFirst(state.dots).map((dot) => (
          <Dot
            key={dot.id}
            id={dot.id}
            x={dot.x}
            y={dot.y}
            onMove={(x, y) => actions.moveDot(dot.id, x, y)}
            overlay={<DotToolbar onRemove={() => actions.removeDot(dot.id)} />}
          >
            <img
              className={styles.pedal}
              src={pedalImageSrc(dot.data)}
              alt=""
            />
          </Dot>
        ))}
        {state.lines.map((line) => (
          <ElbowLine
            key={line.id}
            className={styles[line.data?.color ?? 'neutral']}
            points={line.points}
            start={line.start}
            end={line.end}
            startTip={<Plug />}
            endTip={<Plug />}
            selected={line.id === selectedLineId}
            onSelect={() => actions.selectLine(line.id)}
            onChange={(next) => actions.updateLine(line.id, next)}
          />
        ))}
      </Scene>
    </div>
  );
}
```

Dots draw in array order (there is no `zIndex` prop), so the consumer controls layering by ordering, as pedal-party does with boards under pedals.

`useSceneState()` is called in `Board`, but because the handle never changes identity, `Board` does not re-render when the camera moves. Persisting the camera, the "Add lead" button, and a zoom label are shown in [react-exports.md](./react-exports.md#scenestate).

### Usage without the hook (core only)

```tsx
const scene = useSceneState();
const [doc, setDoc] = useState(initialDocument);

<Scene state={scene}>
  {doc.dots.map((dot) => (
    <Dot
      key={dot.id}
      id={dot.id}
      x={dot.x}
      y={dot.y}
      onMove={(x, y) => setDoc((d) => moveDot(d, dot.id, x, y))}
    >
      …
    </Dot>
  ))}
  {/* lines as above */}
</Scene>;
```

## 8. Deliberate differences from pedal-party

| Difference                                                                                       | Why                                                                                              |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Coordinates are CSS px, not cm                                                                   | The library has no unit concept. CSS `cm` is a fixed 96/2.54 px, so pedal-party converts exactly |
| Dot size is measured, not stored (`widthCm` / `heightCm` are not in the document)                | A Dot wraps arbitrary children, whose size the library cannot know in advance                    |
| Anchored line ends are resolved at render, not re-pinned in state                                | Needed once sizes are measured rather than stored                                                |
| Lines are HTML segment elements, not an SVG layer                                                | Consumers style them with one `className`, and corner rounding is `border-radius`                |
| Tips are React nodes (`startTip` / `endTip`), not fixed rectangles                               | Same pattern as `overlay`; no tip size props                                                     |
| Snap threshold is a fixed screen distance (`px / zoom` in world px)                              | pedal-party divides by `pxPerCm` only, so on-screen distance varies with zoom                    |
| Camera and mode live in a stable `SceneState` handle, not in the document or app state           | Fewer props, no provider, and camera changes do not re-render the owner                          |
| Consumer assigns ids; the hook defaults to `crypto.randomUUID()`                                 | No hidden environment assumptions in `core`                                                      |
| Hit-testing uses `data-dl-*` attributes and `stopPropagation`, not `closest('[data-testid^=…]')` | Test ids are not an API                                                                          |
| `removeDot` offers `delete` or `detach` for attached lines                                       | pedal-party only deletes; default stays `delete`                                                 |

## 9. Open questions

1. **Name `Dot`.** It now wraps whatever children it is given, so it is a wrapper, not a point or a box. Keep `Dot` (it matches the package name), or something like `Node` / `Draggable`?
2. **Anchors and measured sizes.** With sizes measured, anchored end points in `points` are derived, so stored values can go stale (for example when a Dot moves). Proposal: render from the anchor and ignore the stored end point, and write fresh points on the next `onChange`. Cleaner alternative: `points` stores only the interior waypoints, and anchored ends are never stored. That changes `moveElbowSegment` and `updateLineTip`, and the share-link format.
3. **Tip orientation convention.** Proposed: author a tip for the right edge of a Dot and let the library rotate it by multiples of 90°. The alternative is passing the edge to a render function (`startTip={(edge) => …}`).
4. **Line styling gaps.** One `className` on thin HTML segments leaves open: the thickness variable (`--dl-line-size`, proposed above), a larger invisible hit area for clicking a 2px line, the drag handles on segments (pedal-party shows a dot at each segment midpoint), and selected styling beyond switching `className` yourself. A `handle` node prop, like `startTip`, is the obvious fit.
5. **Removing a Dot with attached lines.** Default `delete` matches pedal-party. Is `detach` (leave the line with a free end) ever wanted?

## 10. Suggested build order

1. Port the pure utils and their specs into `core` (largest and safest chunk).
2. Scene state store in `core`, then `Scene` with pan/zoom, then `Dot` with drag and measurement.
3. `ElbowLine` rendering (segments, tips), then tip and segment dragging.
4. Connect mode (`mode`, `onConnect`).
5. `useDotsAndLines`.
6. Migrate pedal-party onto it in a branch to validate the API.
