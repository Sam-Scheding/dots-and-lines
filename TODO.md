# TODO: before `pedal-party` can move onto `dots-and-lines`

Not a plan, a list. Each item says what is missing and what is decided. Context: [docs/architecture-and-api.md](./docs/architecture-and-api.md) and [docs/appendix-pedal-party-fields.md](./docs/appendix-pedal-party-fields.md).

## Blocking

- **Line ends: tips.**
  - Needed for the input jacks and their tip depths. Decided: `pedal-party` changes to fit, so the drawn end can differ from `pedal-party`'s current one.
  - Still to design: `tipStart` / `tipEnd` props (a node at each end?). Which way does the node face, and does it shorten the drawn path or sit on top of it? Does a magnetic end still snap to the Dot's border? (Probably yes, and the tip sticks out of it.)
  - Needs its own plan.
- **Rotation: measure the rotated box.**
  - `transform: rotate()` in a Dot's children does not resize the Dot. A CSS transform leaves layout alone, and a Dot reports `offsetWidth` / `offsetHeight`, so a pedal rotated 90° keeps its unrotated box and lines snap to the wrong edges. This is the same oddity `pedal-party` has now.
  - Fix: measure the visual (axis-aligned) box with `getBoundingClientRect`, converted to world space with the Scene's rect, pan and zoom, instead of `offsetWidth` / `offsetHeight`.
  - `ResizeObserver` does not fire on transform changes. Re-measure in the Dot's layout effect on every render, which already happens, and keep the observer for size changes.
  - Only exact for multiples of 90°. At other angles lines snap to the bounding box, not the rotated outline. That is probably fine.
  - Needs a playground example (rotate button) and tests.
- **Publishing to npm.**
  - Register the `@dots-and-lines` scope (not confirmed free).
  - Check the published `exports` map. The packages use a `source` condition for workspace resolution.
  - Add a `LICENSE`, a README, a versioning approach (changesets?) and a CI publish step.
  - Peer range for React should say `^19`: the library uses `<Context value>` and `ref` as a prop. `pedal-party` is on 19.1.

## Non-blocking, but check

- **Dot removal.**
  - A line whose Dot is removed keeps a free end. `pedal-party` currently deletes every lead bound to the pedal.
  - Decided: no attachment API (`onAttach`, ids, saved bindings). Attachment is derived: on mount, an end within 16 px of a magnetic Dot's border attaches, so a restored route re-attaches by itself.
  - `pedal-party` deletes the leads itself, or lives with free ends. It can find them geometrically, or by tracking which lead it made from which pedal.
  - Edge case to document: after a reload, a free end that happens to be within 16 px of a Dot will attach.
- **Selection outside the Scene.**
  - Selection is browser focus, readable only inside a Dot or line (`useSelected()`). Anything that acts on the selection from outside the Scene loses it when focus moves.
  - Confirm every `pedal-party` toolbar (placement, lead, board toolbar) can live in an `overlay`.
- **Line styling.**
  - Colour, thickness and the selected look are already CSS (`className`, `--dl-line-size`, `:focus-within`).
  - Corner rounding is only partly possible, see the next section.
- **Testing in jsdom.**
  - Every Dot measures 0×0, so nothing snaps, and `ResizeObserver` doesn't exist. `pedal-party`'s specs need the same stub and measuring helper as `packages/react/src/test`.
  - Either export a small test utility, or document it.
- **Performance.** Every Dot move re-renders every line (lines subscribe to the whole Dot registry). Fine for a pedalboard. Not measured.
- **Known limits of magnetic lines**, from the docs:
  - An attached end's last segment isn't forced to leave the Dot perpendicular.
  - Bends can merge away when a route collapses.
  - An attachment is lost if the line remounts.
  - The handle on an attached end is half covered by a Dot later in the tree.

## API cleanup

- **Rename `useSceneState`.** It creates a handle and returns no state, so the name misleads. Candidates: `useCreateScene` or `useInitScene`. Touches the playground examples, the specs, the docs and both packages' exports. `useScene` (the reader) keeps its name.
- Longer term: decide whether two hooks are worth keeping at all (see the options in the chat: rename only, drop the creation hook, or let `Scene` own the store).

## Corner rounding: done as far as CSS goes

- `border-radius` in the line's `className` works, see the `elbow-line-rounded` example. It rounds the outer corner of each bend, and also rounds the two ends of the line.
- It can't go past **half the line's thickness**: a box can't be rounder than that. `pedal-party`'s `0.12 cm` radius is larger than half its stroke, so the look isn't identical.
- `:not(:first-child)` / `:not(:last-child)` won't work as hoped: hit elements and handles are siblings after the segments, so the last segment is never `:last-child`. They also can't pick the joint end of a segment, which depends on which way the line runs.
- To get real elbow arcs, the library would need to render the corner itself. Do that only if the thickness-limited look isn't good enough.

## Not blockers

- Units: a CSS px library, converted at `pedal-party`'s boundary.
- Snap distance: 16 screen px, not divided by `pxPerCm`.
- Tips changing the drawn path, `pedal-party` adapts.
- Pan joystick, zoom buttons, space-pan and wheel zoom, layering by JSX order, and a constant on-screen size for overlays: all covered.
