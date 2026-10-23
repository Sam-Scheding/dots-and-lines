# Appendix: pedal-party field inventory

Reference for what `pedal-party` stores and renders today, based on reading `pedal-party/app/src` (`data/*.ts`, `utils/board-url`, `components/board-*`). This is the input to the data model in [architecture-and-api.md](./architecture-and-api.md).

"Lib" means the field becomes a first-class prop or field in `dots-and-lines`. "App" means it is consumer-specific and goes in the opaque `data` slot (or is just rendered by the consumer's children).

## How it is persisted

- One JSON document: `{ v: 1, placements, leads, view }`.
- Encoded as `lz-string` `compressToEncodedURIComponent(JSON.stringify(doc))`, prefixed with `board/`, stored in `location.hash`.
- Written with `history.replaceState`, debounced 200 ms, on every document change.
- On load, `decodeBoardDocument` validates field by field. Any structural failure returns `null`, and the app silently falls back to an empty board.
- `v` is the only versioning. Anything other than `1` is rejected.
- Not persisted: `draftLeadMode`, `selectedLeadId`, hover state, the catalog.

## `placements[]` (rendered as pedals / pedalboards)

| Field         | Type                      | Validation on decode   | Meaning                                                      | Lib / App                                           |
| ------------- | ------------------------- | ---------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `id`          | `string`                  | must be string         | Stable identity; leads reference it                          | Lib (`Dot` `id`)                                    |
| `kind`        | `'pedal' \| 'pedalboard'` | must be one of the two | Controls draw order (pedalboards render first, under pedals) | App (`data`)                                        |
| `brand`       | `string`                  | must be string         | Label / `alt` text                                           | App (`data`)                                        |
| `name`        | `string`                  | must be string         | Label / `alt` text                                           | App (`data`)                                        |
| `widthCm`     | `number`                  | finite                 | Box width in board cm, set as CSS `width: Ncm`               | App (the child's CSS size; the library measures it) |
| `heightCm`    | `number`                  | finite                 | Box height in board cm                                       | App (the child's CSS size; the library measures it) |
| `image`       | `string`                  | must be string         | Image file name, resolved by `pedalImageSrc`                 | App (`data`)                                        |
| `xCm`         | `number`                  | finite                 | Left edge in board cm                                        | Lib (`x`, px)                                       |
| `yCm`         | `number`                  | finite                 | Top edge in board cm                                         | Lib (`y`, px)                                       |
| `rotationDeg` | `number`                  | finite                 | Visual rotation only (+90 per click, mod 360)                | Out of scope for the first pass                     |

## `leads[]` (rendered as cables)

| Field          | Type                                                            | Validation / default on decode                     | Meaning                                                                                                                                  | Lib / App                                               |
| -------------- | --------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `id`           | `string`                                                        | must be string                                     | Identity                                                                                                                                 | Data only (the component takes no `id`)                 |
| `points`       | `{ xCm, yCm }[]`                                                | at least 2 points, all finite                      | Orthogonal polyline in absolute board cm. First and last are the tips (attachment points). Interior points are the user-draggable elbows | Lib (`points`)                                          |
| `startBinding` | `LeadEdgeBinding \| null`                                       | missing is `null`, malformed rejects the whole doc | Which placement edge the start tip is attached to                                                                                        | Lib (`start`)                                           |
| `endBinding`   | `LeadEdgeBinding \| null`                                       | same                                               | Same, for the end tip                                                                                                                    | Lib (`end`)                                             |
| `color`        | DS `Color`: `purple \| pink \| blue \| neutral \| red \| green` | invalid falls back to `neutral`                    | Stroke colour (a DS token name, not a CSS value)                                                                                         | App (`data`)                                            |
| `tipDepthCm`   | `number`                                                        | finite and > 0, else falls back to `0.73`          | How far the plug sticks out of the jack                                                                                                  | App (the size of the tip node; the library measures it) |

`LeadEdgeBinding`:

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

If `view` is absent (older links), it defaults to `{ 0, 0, 1 }`.

## Rendering constants (not persisted)

| Constant                         | Value               | Where                           | Notes                                                                                          |
| -------------------------------- | ------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Tip width                        | `0.675` cm          | `lead-tip-rect`                 | Constant; no per-lead width yet                                                                |
| Elbow corner radius              | `0.12` cm           | `board-lead` (`cornerRadiusCm`) | Prop with default                                                                              |
| Segment handle dot / halo radius | `0.2` cm / `0.2` cm | `board-lead`                    | Halo is the hit target                                                                         |
| Tip snap threshold               | `12` px             | `data/lead`                     | Converted with `12 / pxPerCm`; **not divided by zoom**, so on-screen distance varies with zoom |
| Wheel zoom sensitivity           | `0.01`              | `data/board-input`              | `exp(-deltaY * 0.01)` for ctrl/cmd + wheel                                                     |
| Zoom range                       | `0.1`–`2`           | `data/board-view`               |                                                                                                |
| Pixels per cm                    | measured at runtime | `get-css-px-per-cm`             | Probe `1cm` div; falls back to `37.795` (jsdom)                                                |

## Behaviours that matter for the port

These are not fields, but they define the data model's invariants.

- **Units.** Everything on the board is cm. Positions are CSS `cm` units inside a `translate(pan) scale(zoom)` wrapper, and the SVG layer is `scale(pxPerCm)`.
- **Bound tips follow their placement.** On move or rotate, `syncLeadTipsToPlacements` re-pins each bound tip to `placementEdgePoint(placement, binding)` via `updateLeadTip`. That moves only the tip and its adjacent point, so the tip segment stays orthogonal.
- **Removing a placement deletes every lead bound at either end** (`removePlacementFromLeads`). Leads are not detached.
- **Bindings use the unrotated layout box.** `placementEdgePoint` and `pointOnPlacementEdge` use `xCm/yCm/widthCm/heightCm` and ignore `rotationDeg`, and rotation never swaps width and height. For a non-square pedal rotated 90°, the image and the attach edges can disagree. Worth confirming whether that is intended.
- **Lead editing is local-then-commit.** During a segment or tip drag the live lead lives in component state, and `onLeadChange` fires once on pointer-up. Placement drags, by contrast, call `onMovePlacement` on every pointer move.
- **Draw mode is click-click.** First click sets the start (snapping to the nearest edge within threshold), second click sets the end and seeds an L-shaped (or straight, if aligned) path via `seedElbowPoints`. The app then leaves draw mode and selects the new lead.
- **Segment drag rules** (`move-elbow-segment`): interior segments move only perpendicular to their axis. Tip-adjacent segments insert a new stub when dragged perpendicular. Tip-adjacent segments can also be resized along their axis.
- **Pan and zoom** come from a binding table (`data/board-input`): ctrl/cmd + wheel zooms about the cursor, shift + wheel pans horizontally, plain wheel pans, and space + drag pans.
- **Overlay UI** (placement toolbar, lead toolbar) is counter-scaled with `scale(1 / zoom)` so it stays a constant on-screen size.
- **Hit-testing** currently relies on `closest('[data-testid^="board-pedal-"]')` style selectors. Fine for an app, but the library should use its own data attributes and `stopPropagation` instead.

## Pedal-party utils that become `core`

| pedal-party util                                                         | Becomes                                | Notes                                                                                   |
| ------------------------------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------------------------------- |
| `seed-elbow-points`                                                      | `seedElbowPoints`                      |                                                                                         |
| `normalize-elbow-points`                                                 | `normalizeElbowPoints`                 |                                                                                         |
| `move-elbow-segment`                                                     | `moveElbowSegment`                     |                                                                                         |
| `update-lead-tip` (`updateLeadTip`)                                      | `updateLineTip`                        |                                                                                         |
| `update-lead-tip` (`syncLeadTipsToPlacements`)                           | `resolveLinePoints`                    | Anchored ends are resolved at render, not re-pinned in state                            |
| `update-lead-tip` (`removePlacementFromLeads`)                           | `removeDotFromLines`                   | Gains a `delete` / `detach` policy                                                      |
| `placement-edge-point`                                                   | `anchorPoint`, `projectOnDotEdge`      | Take a measured rectangle                                                               |
| `snap-point-to-placement-edge`                                           | `snapToDotEdge`                        |                                                                                         |
| `lead-tip-rect`                                                          | `tipOutward`                           | Tip rectangles go away: tips are consumer nodes                                         |
| `visual-lead-points`                                                     | `resolveLinePoints`                    | Merged with the row above                                                               |
| `build-elbow-svg-path`                                                   | `lineSegments`                         | Lines are HTML segments, not an SVG path                                                |
| `lead-toolbar-anchor`                                                    | `lineAnchorPoint`                      | For overlay placement                                                                   |
| `apply-board-view-action`                                                | `applyViewAction`                      |                                                                                         |
| `normalize-board-input-event`, `resolve-board-input`, `data/board-input` | `resolveInput`, `defaultInputBindings` |                                                                                         |
| `get-css-px-per-cm`                                                      | stays in the consumer                  | Not needed: CSS `cm` is a fixed 96/2.54 px, so pedal-party converts at its own boundary |
| `board-url`                                                              | stays in the consumer                  | URL / lz-string is an app feature; core only exposes `parseDocument`                    |
| `catalog-*`, `pedal-*`                                                   | stay in the consumer                   | App-specific                                                                            |
