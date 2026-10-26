# Appendix: pedal-party field inventory

Reference for what `pedal-party` stores and renders today, based on reading `pedal-party/app/src` (`data/*.ts`, `utils/board-url`, `components/board-*`). This is the input to the v1 scope in [architecture-and-api.md](./architecture-and-api.md).

"Lib" means the field becomes a prop in `dots-and-lines` v1. "App" means it is consumer-specific: the consumer keeps it in its own data and renders it in its own children or `className`. "Not in v1" means the feature is deliberately not built (see section 2 of the architecture doc).

## How it is persisted

- One JSON document: `{ v: 1, placements, leads, view }`.
- Encoded as `lz-string` `compressToEncodedURIComponent(JSON.stringify(doc))`, prefixed with `board/`, stored in `location.hash`.
- Written with `history.replaceState`, debounced 200 ms, on every document change.
- On load, `decodeBoardDocument` validates field by field. Any structural failure returns `null`, and the app silently falls back to an empty board.
- `v` is the only versioning. Anything other than `1` is rejected.
- Not persisted: `draftLeadMode`, `selectedLeadId`, hover state, the catalog.

## `placements[]` (rendered as pedals / pedalboards)

| Field         | Type                      | Validation on decode   | Meaning                                                      | Lib / App                                     |
| ------------- | ------------------------- | ---------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| `id`          | `string`                  | must be string         | Stable identity; leads reference it                          | App (used as the React `key`)                 |
| `kind`        | `'pedal' \| 'pedalboard'` | must be one of the two | Controls draw order (pedalboards render first, under pedals) | App                                           |
| `brand`       | `string`                  | must be string         | Label / `alt` text                                           | App                                           |
| `name`        | `string`                  | must be string         | Label / `alt` text                                           | App                                           |
| `widthCm`     | `number`                  | finite                 | Box width in board cm, set as CSS `width: Ncm`               | Not in v1 (a Dot is as large as its children) |
| `heightCm`    | `number`                  | finite                 | Box height in board cm                                       | Not in v1 (a Dot is as large as its children) |
| `image`       | `string`                  | must be string         | Image file name, resolved by `pedalImageSrc`                 | App                                           |
| `xCm`         | `number`                  | finite                 | Left edge in board cm                                        | Lib (`Dot` `x`, in px)                        |
| `yCm`         | `number`                  | finite                 | Top edge in board cm                                         | Lib (`Dot` `y`, in px)                        |
| `rotationDeg` | `number`                  | finite                 | Visual rotation only (+90 per click, mod 360)                | Not in v1                                     |

## `leads[]` (rendered as cables)

| Field          | Type                                                            | Validation / default on decode                     | Meaning                                                                                                                                  | Lib / App                                                                         |
| -------------- | --------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `id`           | `string`                                                        | must be string                                     | Identity                                                                                                                                 | App (used as the React `key`)                                                     |
| `points`       | `{ xCm, yCm }[]`                                                | at least 2 points, all finite                      | Orthogonal polyline in absolute board cm. First and last are the tips (attachment points). Interior points are the user-draggable elbows | Not in v1 (`ElbowLine` owns its route; you give it `initialStart` / `initialEnd`) |
| `startBinding` | `LeadEdgeBinding \| null`                                       | missing is `null`, malformed rejects the whole doc | Which placement edge the start tip is attached to                                                                                        | Internal in v1 (magnetic ends); not readable                                      |
| `endBinding`   | `LeadEdgeBinding \| null`                                       | same                                               | Same, for the end tip                                                                                                                    | Internal in v1 (magnetic ends); not readable                                      |
| `color`        | DS `Color`: `purple \| pink \| blue \| neutral \| red \| green` | invalid falls back to `neutral`                    | Stroke colour (a DS token name, not a CSS value)                                                                                         | App (the consumer chooses the `className`)                                        |
| `tipDepthCm`   | `number`                                                        | finite and > 0, else falls back to `0.73`          | How far the plug sticks out of the jack                                                                                                  | Not in v1 (tips)                                                                  |

`LeadEdgeBinding` (**not exposed in v1**: an `ElbowLine` keeps the same `{ edge, t }` internally, plus which Dot, but the consumer cannot read or save it):

| Field         | Type                                     | Validation             | Meaning                                     |
| ------------- | ---------------------------------------- | ---------------------- | ------------------------------------------- |
| `placementId` | `string`                                 | must be string         | Which placement                             |
| `edge`        | `'left' \| 'right' \| 'top' \| 'bottom'` | must be one of four    | Which side of the placement's layout box    |
| `t`           | `number`                                 | finite, clamped to 0–1 | Position along that edge (0 = top/left end) |

Tip depth presets offered in the UI: `0.73, 0.8, 0.83, 0.88, 1.1, 1.19` cm. The stored value is the raw number, so it is not constrained to presets.

## `view` (camera)

| Field    | Type     | Validation               | Meaning          |
| -------- | -------- | ------------------------ | ---------------- |
| `panXPx` | `number` | finite                   | Pan in screen px |
| `panYPx` | `number` | finite                   | Pan in screen px |
| `zoom`   | `number` | finite, clamped to 0.1–2 | Unitless scale   |

If `view` is absent (older links), it defaults to `{ 0, 0, 1 }`. In `dots-and-lines` this is `View`, held in `SceneState`, not in any document.

## Rendering constants (not persisted)

| Constant                         | Value               | Where                           | Notes                                                                                                                                              |
| -------------------------------- | ------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tip width                        | `0.675` cm          | `lead-tip-rect`                 | Constant; no per-lead width yet                                                                                                                    |
| Elbow corner radius              | `0.12` cm           | `board-lead` (`cornerRadiusCm`) | Prop with default                                                                                                                                  |
| Segment handle dot / halo radius | `0.2` cm / `0.2` cm | `board-lead`                    | Halo is the hit target                                                                                                                             |
| Tip snap threshold               | `12` px             | `data/lead`                     | Converted with `12 / pxPerCm`; **not divided by zoom**, so on-screen distance varies with zoom. v1 uses 16 screen px (`16 / zoom`), released at 24 |
| Wheel zoom sensitivity           | `0.01`              | `data/board-input`              | `exp(-deltaY * 0.01)` for ctrl/cmd + wheel                                                                                                         |
| Zoom range                       | `0.1`–`2`           | `data/board-view`               |                                                                                                                                                    |
| Pixels per cm                    | measured at runtime | `get-css-px-per-cm`             | Probe `1cm` div; falls back to `37.795` (jsdom)                                                                                                    |

## Behaviours that matter for the port

These are not fields, but they define the data model's invariants.

- **Units.** Everything on the board is cm. Positions are CSS `cm` units inside a `translate(pan) scale(zoom)` wrapper, and the SVG layer is `scale(pxPerCm)`.
- **Bound tips follow their placement.** (v1: an attached `ElbowLine` end follows its Dot the same way.) On move or rotate, `syncLeadTipsToPlacements` re-pins each bound tip to `placementEdgePoint(placement, binding)` via `updateLeadTip`. That moves only the tip and its adjacent point, so the tip segment stays orthogonal.
- **Removing a placement deletes every lead bound at either end** (`removePlacementFromLeads`). Leads are not detached.
- **Bindings use the unrotated layout box.** `placementEdgePoint` and `pointOnPlacementEdge` use `xCm/yCm/widthCm/heightCm` and ignore `rotationDeg`, and rotation never swaps width and height. For a non-square pedal rotated 90°, the image and the attach edges can disagree. Worth confirming whether that is intended.
- **Lead editing is local-then-commit.** During a segment or tip drag the live lead lives in component state, and `onLeadChange` fires once on pointer-up. Placement drags, by contrast, call `onMovePlacement` on every pointer move.
- **Draw mode is click-click.** First click sets the start (snapping to the nearest edge within threshold), second click sets the end and seeds an L-shaped (or straight, if aligned) path via `seedElbowPoints`. The app then leaves draw mode and selects the new lead.
- **Segment drag rules** (`move-elbow-segment`): interior segments move only perpendicular to their axis. Tip-adjacent segments insert a new stub when dragged perpendicular. Tip-adjacent segments can also be resized along their axis.
- **Pan and zoom** come from a binding table (`data/board-input`): ctrl/cmd + wheel zooms about the cursor, shift + wheel pans horizontally, plain wheel pans, and space + drag pans.
- **Overlay UI** (placement toolbar, lead toolbar) is counter-scaled with `scale(1 / zoom)` so it stays a constant on-screen size.
- **Hit-testing** currently relies on `closest('[data-testid^="board-pedal-"]')` style selectors. Fine for an app, but the library should use its own data attributes and `stopPropagation` instead.

## Pedal-party utils: ported, and not ported

| pedal-party util                                                         | v1                           | Notes                                                                       |
| ------------------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------- |
| `seed-elbow-points`                                                      | Ported: `seedElbowPoints`    |                                                                             |
| `normalize-elbow-points`                                                 | Ported, internal to `core`   |                                                                             |
| `move-elbow-segment`                                                     | Ported: `moveElbowSegment`   |                                                                             |
| `update-lead-tip` (`updateLeadTip`)                                      | Ported: `moveElbowEnd`       | Also fixed for two-point routes, which route a Z so the far end stays put   |
| `build-elbow-svg-path`                                                   | Replaced: `lineSegments`     | Lines are HTML segments, not an SVG path                                    |
| `lead-toolbar-anchor`                                                    | Ported inside `ElbowLine`    | Places `overlay`                                                            |
| `apply-board-view-action`                                                | Ported: view maths in `core` | Internal                                                                    |
| `normalize-board-input-event`, `resolve-board-input`, `data/board-input` | Ported, internal             | Fixed built-in bindings; not customisable in v1                             |
| `update-lead-tip` (`syncLeadTipsToPlacements`)                           | Replaced inside `ElbowLine`  | Each line resolves its attached ends from the Dot registry on every render  |
| `update-lead-tip` (`removePlacementFromLeads`)                           | **Not ported**               | A line whose Dot is removed keeps a free end; the consumer removes lines    |
| `placement-edge-point`                                                   | Ported: `pointOnRectEdge`    | On a plain `Rect` instead of a placement                                    |
| `snap-point-to-placement-edge`                                           | Ported: `snapPointToRects`   | On rects, in screen px (divided by zoom), with a release distance           |
| `lead-tip-rect`                                                          | **Not ported**               | Needs tips                                                                  |
| `visual-lead-points`                                                     | **Not ported**               | Needs tips                                                                  |
| `get-css-px-per-cm`                                                      | Stays in the consumer        | CSS `cm` is a fixed 96/2.54 px, so pedal-party converts at its own boundary |
| `board-url`                                                              | Stays in the consumer        | URL / lz-string is an app feature                                           |
| `catalog-*`, `pedal-*`                                                   | Stay in the consumer         | App-specific                                                                |
