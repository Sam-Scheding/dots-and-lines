# dots-and-lines: architecture and API

Status: **proposal**, for review before any code is written.

`dots-and-lines` is a headless toolkit for a draggable-boxes-and-connectors surface: things you drag around a plane, and lines you route between them. It ships **behaviour and geometry, never visuals**. Consumers supply every pixel of styling.

It is extracted from the bespoke implementation in `pedal-party`, which will eventually be migrated onto it. The field-by-field inventory of that implementation is in [appendix-pedal-party-fields.md](./appendix-pedal-party-fields.md).

## 1. Decisions at a glance

| #   | Question                | Decision                                                                                                                                      |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Is a `Region` integral? | **Yes, and it is required.** `Dot` and `ElbowLine` must live inside one.                                                                      |
| 2   | Package naming          | Scoped, one package per framework: **`@dots-and-lines/core`**, **`@dots-and-lines/react`**, later `/vue`, `/angular`.                         |
| 3   | Fields from pedal-party | Inventoried in the appendix. Geometry becomes props; brand, name, image, colour and kind become opaque `data`.                                |
| 4   | Hook or Context?        | **Controlled components + a state hook.** Context exists only as internal plumbing between `Region` and its children, not as the state store. |
| 5   | Units                   | Unitless world units. `Region` takes `pxPerUnit`. pedal-party uses `pxPerUnit = pxPerCm` and keeps its data in cm.                            |
| 6   | v1 surface              | `Region`, `Dot`, `ElbowLine`, `useDotsAndLines`, and a pure `core`. Hook-flavoured primitives (`useDot`) come later.                          |

## 2. Question 1: is `Region` integral?

**Yes.** The alternative, letting Dots and Lines sit anywhere, breaks things that the pedal-party implementation depends on:

1. **Coordinate system.** `x`/`y` need a common origin. Pointer events arrive in client coordinates, and dragging needs `client → world`:
   `world = (client − regionRect.topLeft − pan) / (pxPerUnit · zoom)`. Only a shared ancestor can own that mapping.
2. **Pan and zoom.** The camera is a single `translate(pan) scale(zoom)` on a wrapper around all content. It cannot be applied per-Dot without desyncing lines from dots.
3. **Snapping.** While a line tip is dragged, it needs the geometry of every Dot in the same space. `Region` holds a ref-based registry that Dots report into (no state, no re-render).
4. **Drawing new lines.** pedal-party's "click, click" draw mode needs a surface that receives clicks on empty space.
5. **Containing block.** Absolutely-positioned Dots need a `position: relative; overflow: hidden` parent that clips and sizes the viewport.

What `Region` is **not**: it does not render a shared SVG layer. Each `ElbowLine` renders its own overflow-visible SVG at the world origin, so stacking order between lines and dots is just JSX order. (pedal-party's single lead layer always sits above every pedal. That becomes a choice instead of a constraint.)

The cost is that a Region is one more component to mount. It is also where the consumer's viewport size, background and pan/zoom behaviour are configured, so it is a natural place to put them.

## 3. Question 2: package naming

### What others do

The common convention is **a scope per project, one package per framework, plus a shared `core`** (examples, from memory of their npm listings):

| Project                                         | Packages                                                                                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| TanStack Query                                  | `@tanstack/query-core`, `@tanstack/react-query`, `@tanstack/vue-query`, `@tanstack/svelte-query`, `@tanstack/angular-query-experimental` |
| Floating UI                                     | `@floating-ui/core`, `@floating-ui/dom`, `@floating-ui/react`, `@floating-ui/vue`                                                        |
| React Flow / Svelte Flow (closest domain match) | `@xyflow/system`, `@xyflow/react`, `@xyflow/svelte`                                                                                      |
| Testing Library                                 | `@testing-library/dom`, `/react`, `/vue`, `/svelte`                                                                                      |
| Headless UI                                     | `@headlessui/react`, `@headlessui/vue`                                                                                                   |

### Options considered

| Option                                                 | Verdict                                                                                                                                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@dots-and-lines/react` (scope + framework)            | **Chosen.** Each package has its own `peerDependencies` (`react`, later `vue`), its own bundle, and can be installed without pulling in other frameworks.                                                                            |
| `dots-and-lines/react` (subpath export of one package) | Rejected. One package would need every framework as an optional peer dependency, all adapters would version together, and TypeScript or bundler resolution is more fragile. Fine for a single-framework library; wrong for this one. |
| `react/dots-and-lines`                                 | Not viable. `react` is not ours to namespace, and npm has no such convention.                                                                                                                                                        |
| Unscoped `dots-and-lines-react`                        | Works, but gives no way to group packages and no clean place for `core`.                                                                                                                                                             |

### Package set

| Package                           | Contents                                                                                                                                    | Depends on               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `@dots-and-lines/core`            | Types, document schema and parser, elbow routing and editing, snapping, anchor maths, pan/zoom maths, input bindings. **No DOM, no React.** | nothing                  |
| `@dots-and-lines/react`           | `Region`, `Dot`, `ElbowLine`, `useDotsAndLines`, pointer interaction                                                                        | `core`; peer `react@^19` |
| `@dots-and-lines/vue`, `/angular` | Future adapters, same shape                                                                                                                 | `core`                   |

pedal-party's example import `import { Dot, ElbowLine } from 'dots-and-lines'` becomes `import { Dot, ElbowLine } from '@dots-and-lines/react'`.

Availability: as of today `npm view` returns 404 for `dots-and-lines`, `@dots-and-lines/core` and `@dots-and-lines/react`. A 404 on a package does not prove the **scope** is free, so register the `@dots-and-lines` npm org before building anything that references it.

### Why `core` from day one

Roughly 45% of the board and lead code in pedal-party (about 1,300 of 2,900 lines in `utils/` and `components/board-*`, excluding specs) is already pure functions with specs (see the table at the bottom of the appendix). They have no reason to be inside React, and they are the part a Vue adapter would otherwise duplicate. Putting them in `core` now costs almost nothing and makes the multi-framework promise real.

The pointer-interaction code (drag state machines) is the other large chunk. For v1 it lives in `react`, but is written as plain TypeScript controllers (functions or classes taking `getState` and `commit` callbacks, no React imports) so that extracting it into `core` when the second adapter starts is a move, not a rewrite.

## 4. Repo layout

Yarn Berry workspaces with `nodeLinker: node-modules`, the same as pedal-party.

```text
dots-and-lines/
  package.json              # private; workspaces: ["packages/*", "playground"]
  .yarnrc.yml
  tsconfig.base.json
  .changeset/
  docs/
  packages/
    core/                   # @dots-and-lines/core
      src/
      package.json
    react/                  # @dots-and-lines/react
      src/
      package.json
    # vue/  angular/        # later: one folder per implementation
  playground/               # @dots-and-lines/playground: private Vite app, not published
    src/
```

- A new implementation is a new folder under `packages/` (`packages/vue/`, `packages/angular/`). The `packages/*` workspace glob picks it up automatically.
- `playground/` is for trying things out. It is private and never published.
- Tooling: TypeScript strict, Vitest, ESLint, Prettier (settings copied from pedal-party), Changesets for versioning, and tsup to build the published packages (ESM only, with `.d.ts`).
- During development the playground and the react tests resolve workspace packages from TypeScript **source** through a custom `source` export condition, so no rebuild is needed. Consumers of the published packages get `dist` and the `.d.ts` files.

## 5. Vocabulary

| Term            | Meaning                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Region**      | The viewport and coordinate space. Owns pan/zoom (`view`) and the client-to-world mapping.                                                                           |
| **Dot**         | A draggable box with a position, size and optional rotation. Children are the consumer's visuals. (It has a size, so it is a box, not a point. See open question 1.) |
| **ElbowLine**   | An orthogonal polyline connecting two ends. Each end is either free or anchored to a Dot edge.                                                                       |
| **Anchor**      | `{ dotId, edge, t }`: a point on a Dot's edge, `t` ∈ [0,1] along it.                                                                                                 |
| **Tip**         | The end cap of a line (a "plug"). Has `tipDepth` (how far it sticks out of the edge) and `tipWidth`.                                                                 |
| **World units** | Unitless. At zoom 1, `1 unit = pxPerUnit` CSS px.                                                                                                                    |
| **View**        | `{ panX, panY, zoom }`. Pan is in screen px, zoom is unitless.                                                                                                       |

## 6. Question 4: hook vs Context

### The real question

"Hook or Context" is really **who owns the state**. pedal-party's constraints:

- State is a **serialisable document** that becomes a shareable URL.
- Each dot carries **app data** (brand, name, image) the library knows nothing about.
- **Other UI mutates it**: a catalog sidebar adds dots, a toolbar removes lines, URL sync reads and writes it.
- Moving a dot has **cascading effects** (bound line tips must re-pin).

### Why not option (b), a Provider that owns state through JSX children

```tsx
<DotsAndLinesProvider>
  <Dot>
    <div />
  </Dot>{' '}
  {/* where do x and y come from? */}
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
│ useDotsAndLines()  (react, optional)          │  state + actions, thin wrapper over core
├───────────────────────────────────────────────┤
│ Region / Dot / ElbowLine   (react)            │  controlled components: props in, callbacks out
├───────────────────────────────────────────────┤
│ @dots-and-lines/core                          │  pure data + functions, framework-free
└───────────────────────────────────────────────┘
```

1. **`core`** defines the document and pure transitions, for example `moveDot(doc, id, x, y)` (which also re-pins anchored line tips). This is the part every framework shares.
2. **Components are controlled.** `Dot` takes `x`/`y` and calls `onMove`. `ElbowLine` takes `points` and calls `onChange`. They hold no document state.
3. **`useDotsAndLines`** is your option (a): a store that applies core transitions and exposes `state` plus actions. It supports uncontrolled (`defaultValue`) and controlled (`value` + `onChange`) use, so it can sit on top of `useState`, Zustand, or a URL-synced store.

A consumer who doesn't want the hook can call core's pure functions in their own reducer. That is exactly how pedal-party's `App` works today (`syncLeadTipsToPlacements` inside `handleMovePlacement`).

### Where Context is used

Context is **internal** to `@dots-and-lines/react`. `Region` provides it, and `Dot` and `ElbowLine` read it:

- `view`, `pxPerUnit`
- `clientToWorld(clientX, clientY)`
- the dot geometry registry, used for snapping during tip drags
- `mode` (idle / drawing a line)

It does not hold the document. There is no public `DotsAndLinesProvider` in v1. If a consumer needs the hook's result in distant components (toolbar, sidebar), they put it in their own context or store, as pedal-party does with `App` state. Revisit if that proves painful.

### Why lines carry `points`, not just `from` and `to`

You asked whether the line "also encodes the path segments". **Yes.** The elbows are user-draggable and are part of what is shared, so they must be persisted. Anchors alone say where the ends attach, not how the path bends. (Auto-routing when `points` is omitted is a possible later feature; it would use core's `seedElbowPoints`.)

## 7. Data model (`core`)

Renamed from pedal-party. Names below are provisional; the mapping is in the appendix.

```ts
export type Point = { x: number; y: number };
export type Edge = 'left' | 'right' | 'top' | 'bottom';

/** A point on a dot's edge. `t` runs 0–1 along it (left→right / top→bottom). */
export type DotAnchor = { dotId: string; edge: Edge; t: number };

export type DotData<TData = unknown> = {
  id: string;
  x: number; // top-left, world units
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees, visual only (see open question 2)
  data?: TData; // opaque, JSON-serialisable, consumer-owned
};

export type ElbowLineData<TData = unknown> = {
  id: string;
  type: 'elbow'; // leaves room for other line types later
  points: Point[]; // orthogonal, absolute, ≥ 2; first/last are the tips
  start: DotAnchor | null;
  end: DotAnchor | null;
  tipDepth: number;
  data?: TData; // e.g. { color: 'blue' }
};

export type View = { panX: number; panY: number; zoom: number };

export type DotsAndLinesDocument<TDot = unknown, TLine = unknown> = {
  version: 1;
  dots: DotData<TDot>[];
  lines: ElbowLineData<TLine>[];
  view: View;
};
```

Notes:

- **Redundancy is deliberate.** A line stores absolute tip positions in `points` _and_ anchors. pedal-party does the same, and `syncLinesToDots` keeps them consistent. The alternative (store only interior waypoints, derive anchored tips on render) is cleaner, but needs a second representation for free ends, and changes what is shared. Not worth it for v1.
- **`data` replaces app fields.** `brand`, `name`, `image` and `kind` go on `DotData.data`; `color` goes on `ElbowLineData.data`. The library never inspects `data`.
- **Persistence stays with the app.** `core` exports `parseDocument(unknown): Document | null` (validation, clamping, defaults, the same lenient rules as pedal-party's decoder). URL and `lz-string` encoding stay in the consumer.
- **Migration.** pedal-party's existing `v: 1` share links keep working through a small `fromBoardDocumentV1` converter in pedal-party, not in this library.

### Pure functions in `core`

Ported from pedal-party's `utils/` with their specs. Full mapping is in the appendix.

```ts
// document transitions
moveDot(doc, id, x, y): Doc                 // also re-pins anchored line tips
rotateDot(doc, id, deg): Doc
removeDot(doc, id, { lines: 'delete' | 'detach' }): Doc

// line editing
seedElbowPoints(a: Point, b: Point): Point[]
moveElbowSegment(points, segmentIndex, dx, dy): Point[]
updateLineTip(line, 'start' | 'end', point, anchor): ElbowLineData
syncLinesToDots(lines, dots): ElbowLineData[]

// geometry
anchorPoint(dot, anchor): Point
snapToDotEdge(point, dots, thresholdWorld): { point; anchor; distance } | null
buildElbowPath(points, { cornerRadius }): string
tipRect(tip, outward, depth, width): Rect

// camera
applyViewAction(view, action, limits?): View
resolveInput(event, bindings): Action | null
defaultInputBindings
```

## 8. React API (v1)

### `Region`

| Prop                             | Type                                         | Default                | Notes                                                                                            |
| -------------------------------- | -------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `view`                           | `View`                                       | required               | Controlled camera                                                                                |
| `onViewChange`                   | `(view: View) => void`                       |                        | Called by wheel / space-drag input                                                               |
| `pxPerUnit`                      | `number`                                     | `1`                    | CSS px per world unit at zoom 1. pedal-party passes its measured px-per-cm                       |
| `mode`                           | `'idle' \| 'draw-line'`                      | `'idle'`               | In `draw-line`, clicks on empty space or a Dot edge build a line                                 |
| `onDrawLine`                     | `(draft: Omit<ElbowLineData, 'id'>) => void` |                        | Fires on the second click, with seeded `points` and snapped anchors. The consumer assigns the id |
| `snapThreshold`                  | `number` (screen px)                         | `12`                   | Applied as `px / (pxPerUnit · zoom)` (see below)                                                 |
| `inputBindings`                  | `InputBinding[] \| false`                    | `defaultInputBindings` | `false` disables pan/zoom                                                                        |
| `zoomLimits`                     | `{ min: number; max: number }`               | `{ 0.1, 2 }`           |                                                                                                  |
| `className`, `style`, `children` |                                              |                        | Rest props go to the root `div`                                                                  |

Renders:

```html
<div data-dl-region>
  <!-- position: relative; overflow: hidden; touch-action: none -->
  <div
    data-dl-world
    style="transform: translate(…) scale(…); transform-origin: 0 0;
                            --dl-zoom: …; --dl-px-per-unit: …"
  >
    {children}
    <!-- Dots and ElbowLines -->
  </div>
</div>
```

The region's size is whatever the consumer's CSS gives it. `--dl-zoom` is exposed so consumers can counter-scale overlays (`scale(calc(1 / var(--dl-zoom)))`), as pedal-party does for its toolbars.

### `Dot`

| Prop                             | Type                             | Notes                                                                                                                     |
| -------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`                             | `string`                         | Required. Lines refer to it                                                                                               |
| `x`, `y`, `width`, `height`      | `number`                         | Required, world units. **Size is controlled, not measured**                                                               |
| `rotation`                       | `number`                         | Default `0`. Rotates the inner content only                                                                               |
| `onMove`                         | `(x: number, y: number) => void` | Called on every pointer move while dragging                                                                               |
| `onMoveEnd`                      | `() => void`                     |                                                                                                                           |
| `disabled`                       | `boolean`                        |                                                                                                                           |
| `overlay`                        | `ReactNode`                      | Rendered inside the Dot's box but **outside** the rotation, for toolbars. Hover and focus-within behave as in pedal-party |
| `className`, `style`, `children` |                                  | Rest props go to the outer `div` (consumer handlers are composed, not replaced)                                           |

Renders an absolutely-positioned `div` at `left/top/width/height`, `box-sizing: border-box`, `overflow: visible`, `touch-action: none`, containing an inner `div` that carries `rotate()` and fills 100%. Pointer capture handles drag.

**Content squeezing.** The Dot owns its size, so children can't squeeze it. Children should fill it (`width: 100%; height: 100%`, as pedal-party's pedal image does). Measure-to-fit (a `ResizeObserver` on the child) is possible later, but the size is part of the data, so v1 keeps it as an input.

### `ElbowLine`

| Prop           | Type                                                                                    | Notes                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`           | `string`                                                                                | Required                                                                                                                |
| `points`       | `Point[]`                                                                               | Required                                                                                                                |
| `start`, `end` | `DotAnchor \| null`                                                                     | Needed to point the tip caps outward                                                                                    |
| `tipDepth`     | `number`                                                                                |                                                                                                                         |
| `tipWidth`     | `number`                                                                                | Default constant; not persisted                                                                                         |
| `cornerRadius` | `number`                                                                                | Default `0.12` units                                                                                                    |
| `selected`     | `boolean`                                                                               |                                                                                                                         |
| `onSelect`     | `(id: string) => void`                                                                  |                                                                                                                         |
| `onChange`     | `(next: { points: Point[]; start: DotAnchor \| null; end: DotAnchor \| null }) => void` | Fires **once on pointer-up** after a segment or tip drag (live geometry stays local during the drag, as in pedal-party) |
| `overlay`      | `ReactNode`                                                                             | Positioned at `lineAnchorPoint(points)` and counter-scaled, for a selected-line toolbar                                 |
| `classNames`   | `{ stroke?, hit?, tip?, handle? }`                                                      | Consumer styling, one class per part                                                                                    |

Renders a zero-footprint, `overflow: visible` SVG. Parts carry `data-dl-part="stroke | hit | tip | handle"` and `data-selected`. Functional defaults only: `fill: none`, `stroke: currentColor`, pointer-events wiring. No colours, widths or hover styles.

### `useDotsAndLines`

```ts
const dl = useDotsAndLines<DotExtra, LineExtra>({
  defaultValue, // uncontrolled
  // value, onChange   // …or controlled (URL sync, Zustand, etc.)
});

dl.state; // DotsAndLinesDocument
dl.mode; // 'idle' | 'draw-line'      (ephemeral, not in the document)
dl.selectedLineId; // string | null             (ephemeral)

dl.actions.addDot(dot); // generates id if omitted
dl.actions.moveDot(id, x, y); // re-pins anchored lines
dl.actions.rotateDot(id, deg);
dl.actions.removeDot(id);
dl.actions.addLine(draft); // from Region's onDrawLine; leaves draw mode, selects it
dl.actions.updateLine(id, patch); // e.g. colour via data
dl.actions.removeLine(id);
dl.actions.setView(view);
dl.actions.setMode(mode);
dl.actions.selectLine(id | null);

// optional sugar: spread-ready props, defined in terms of the explicit props above
dl.regionProps;
dl.dotProps(dot);
dl.lineProps(line);
```

### Usage with the hook

```tsx
import { Region, Dot, ElbowLine, useDotsAndLines } from '@dots-and-lines/react';

type PedalData = {
  kind: 'pedal' | 'pedalboard';
  brand: string;
  name: string;
  image: string;
};
type LeadData = {
  color: 'purple' | 'pink' | 'blue' | 'neutral' | 'red' | 'green';
};

function Board({ pxPerCm }: { pxPerCm: number }) {
  const dl = useDotsAndLines<PedalData, LeadData>({
    defaultValue: initialDocument,
  });
  const { state, actions } = dl;

  return (
    <>
      <button
        onClick={() =>
          actions.addDot({ x: 0, y: 0, width: 7, height: 12, data: pedalData })
        }
      >
        Add pedal
      </button>
      <button onClick={() => actions.setMode('draw-line')}>Add lead</button>

      <Region className={styles.board} pxPerUnit={pxPerCm} {...dl.regionProps}>
        {sortBoardsFirst(state.dots).map((dot) => (
          <Dot
            key={dot.id}
            {...dl.dotProps(dot)}
            overlay={<DotToolbar id={dot.id} />}
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
            {...dl.lineProps(line)}
            classNames={{
              stroke: styles[line.data?.color ?? 'neutral'],
              tip: styles.tip,
            }}
          />
        ))}
      </Region>
    </>
  );
}
```

Dots draw in array order (no `zIndex` prop), so the consumer controls layering by ordering, as pedal-party does with boards under pedals.

### Usage without the hook (fully controlled, `core` only)

```tsx
const [doc, setDoc] = useState(initialDocument)

<Region view={doc.view} onViewChange={(view) => setDoc((d) => ({ ...d, view }))} pxPerUnit={pxPerCm}>
  {doc.dots.map((dot) => (
    <Dot
      key={dot.id}
      {...dot}
      onMove={(x, y) => setDoc((d) => moveDot(d, dot.id, x, y))}  // core: also re-pins lines
    >
      …
    </Dot>
  ))}
  {/* lines as above */}
</Region>
```

## 9. Hooks flavour (later)

You said the package may expose either unstyled elements or hooks that apply behaviour to the consumer's own element. The plan is to build the components **on top of** the hooks, in the Radix / Headless UI style:

```tsx
const { ref, style, handlers } = useDot({ id, x, y, width, height, onMove });
return (
  <section ref={ref} style={style} {...handlers}>
    …
  </section>
);
```

v1 ships only the components, but `Dot` and `ElbowLine` are written as "hook + thin element", so exposing the hooks later is an export, not a refactor. A polymorphic `as` prop is deliberately skipped: it makes the types hard for little gain once the hooks exist.

## 10. Deliberate differences from pedal-party

| Difference                                                                                       | Why                                                                           |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Units are abstract (`pxPerUnit`), not hard-coded cm                                              | The library shouldn't care what a unit is                                     |
| Consumer assigns ids; the hook defaults to `crypto.randomUUID()`                                 | No hidden environment assumptions in `core`                                   |
| Snap threshold is `px / (pxPerUnit · zoom)`, so constant on screen                               | pedal-party divides by `pxPerCm` only, so on-screen distance varies with zoom |
| Hit-testing uses `data-dl-*` attributes and `stopPropagation`, not `closest('[data-testid^=…]')` | Test ids are not an API                                                       |
| `removeDot` offers `delete` or `detach` for attached lines                                       | pedal-party only deletes; default stays `delete`                              |
| Colour, kind, brand, name, image live in `data`                                                  | The library is unstyled and domain-agnostic                                   |

## 11. Open questions

1. **Name `Dot`.** A pedal has width and height, so it is a box, not a point. Keep `Dot` (it matches the package name), or use something like `Node` / `Box`? I'd keep it unless it confuses you in practice.
2. **Rotation and anchors.** pedal-party attaches leads to the _unrotated_ layout box, and rotation never swaps width and height. For a non-square pedal rotated 90°, the visible edges and the attach edges differ. Options: keep as-is (documented), or anchor to the rotated bounding box (changes `Dot` geometry). Needs a decision before 1.0, and I'd like you to confirm whether pedal-party's current behaviour is intentional.
3. **`view` in the document?** pedal-party persists pan/zoom, so a shared link preserves the camera. I've kept `view` in the document to match, but it could be separate session state.
4. **Removing a Dot with attached lines.** Default `delete` matches pedal-party. Is `detach` (leave the line with a free end) ever wanted?
5. **npm scope.** Register the `@dots-and-lines` org, or pick a different scope name, before scaffolding.
6. **Prop-getter sugar** (`dl.dotProps(dot)` and friends). Convenient, but one more API surface. Keep for v1, or ship only explicit props first?

## 12. Suggested build order

1. ~~Scaffold the workspace (`core`, `react`, `playground`).~~ Done.
2. Port the pure utils and their specs into `core` (largest and safest chunk).
3. `Region` with pan/zoom, then `Dot` with drag.
4. `ElbowLine` rendering, then tip and segment dragging.
5. Draw mode (`mode`, `onDrawLine`).
6. `useDotsAndLines`.
7. Migrate pedal-party onto it in a branch to validate the API.
