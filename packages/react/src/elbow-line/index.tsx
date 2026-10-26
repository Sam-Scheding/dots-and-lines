import {
  MAGNET_DISTANCE,
  MAGNET_RELEASE,
  lineSegments,
  moveElbowEnd,
  moveElbowSegment,
  seedElbowPoints,
  snapPointToRects,
  type ElbowSegment,
  type Point,
} from '@dots-and-lines/core';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import { useSceneContext } from '../scene-context';
import {
  NO_BINDINGS,
  magneticTargets,
  resolveBoundRoute,
  type Bindings,
} from '../resolve-bound-route';
import { startDrag } from '../start-drag';
import { SelectedContext } from '../selected-context';
import { useFocusWithin } from '../use-focus-within';
import { useLatest } from '../use-latest';

export type ElbowLineProps = {
  /**
   * Where the line starts and ends, in CSS px at zoom 1. Only read when the
   * line mounts: it begins as an L (or a straight line if the points are
   * aligned), and the user reshapes it from there. Change the component's
   * `key` to start over.
   */
  initialStart: Point;
  initialEnd: Point;
  /** Applied to every segment element. Thickness comes from `--dl-line-size`. */
  className?: string;
  /** Select the line as soon as it mounts, e.g. one just made by `onConnect`. */
  autoFocus?: boolean;
  /**
   * Whether an end dragged near a Dot snaps to its edge and then follows the
   * Dot. Default `true`. Also decides whether `initialStart` / `initialEnd`
   * attach to a Dot they sit on. A Dot can opt out with its own
   * `isMagnetic={false}`.
   */
  isMagnetic?: boolean;
  /**
   * Rendered at every segment midpoint and every end while the line is
   * selected (focus is inside it).
   */
  handle?: ReactNode;
  /** Rendered at the line's anchor point while selected, e.g. a toolbar. */
  overlay?: ReactNode;
};

const LINE_SIZE = 'var(--dl-line-size, 2px)';
/** Pointer target thickness: 12 screen px, whatever the zoom. */
const HIT_SIZE = `max(${LINE_SIZE}, calc(12px / var(--dl-zoom, 1)))`;

const ROOT_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  // The consumer draws the selected look, e.g. `[data-dl-line]:focus-within`.
  outline: 'none',
};

/** Midpoint of the longest segment: where a toolbar should sit. */
function longestSegmentMidpoint(segments: readonly ElbowSegment[]): Point {
  let best: ElbowSegment | undefined;
  for (const segment of segments) {
    if (!best || segment.length > best.length) best = segment;
  }
  return best ? best.midpoint : { x: 0, y: 0 };
}

/** `base` plus half a line thickness for each joint the segment extends past. */
function extended(base: number, joints: 0 | 1 | 2): string {
  if (joints === 0) return `${base}px`;
  return `calc(${base}px + ${joints === 1 ? `${LINE_SIZE} / 2` : LINE_SIZE})`;
}

function segmentStyle(
  segment: ElbowSegment,
  segmentCount: number,
): CSSProperties {
  // Extend into interior corners by half the thickness so they join cleanly.
  // Line ends are left flush with the point.
  const startIsMin =
    segment.orientation === 'h'
      ? segment.start.x <= segment.end.x
      : segment.start.y <= segment.end.y;
  const startJoint = segment.index > 0;
  const endJoint = segment.index < segmentCount - 1;
  const minJoint = startIsMin ? startJoint : endJoint;
  const maxJoint = startIsMin ? endJoint : startJoint;
  const joints = ((minJoint ? 1 : 0) + (maxJoint ? 1 : 0)) as 0 | 1 | 2;

  const base: CSSProperties = { position: 'absolute', pointerEvents: 'none' };
  if (segment.orientation === 'h') {
    return {
      ...base,
      left: minJoint
        ? `calc(${segment.x}px - ${LINE_SIZE} / 2)`
        : `${segment.x}px`,
      top: `calc(${segment.y}px - ${LINE_SIZE} / 2)`,
      width: extended(segment.length, joints),
      height: LINE_SIZE,
    };
  }
  return {
    ...base,
    left: `calc(${segment.x}px - ${LINE_SIZE} / 2)`,
    top: minJoint
      ? `calc(${segment.y}px - ${LINE_SIZE} / 2)`
      : `${segment.y}px`,
    width: LINE_SIZE,
    height: extended(segment.length, joints),
  };
}

function hitStyle(segment: ElbowSegment): CSSProperties {
  if (segment.orientation === 'h') {
    return {
      position: 'absolute',
      left: segment.x,
      top: `calc(${segment.y}px - ${HIT_SIZE} / 2)`,
      width: segment.length,
      height: HIT_SIZE,
    };
  }
  return {
    position: 'absolute',
    left: `calc(${segment.x}px - ${HIT_SIZE} / 2)`,
    top: segment.y,
    width: HIT_SIZE,
    height: segment.length,
  };
}

function handleStyle(point: Point): CSSProperties {
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`,
    width: 'max-content',
    touchAction: 'none',
  };
}

function overlayStyle(point: Point): CSSProperties {
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate(${point.x}px, ${point.y}px)`,
    width: 'max-content',
  };
}

export function ElbowLine({
  initialStart,
  initialEnd,
  className,
  handle,
  overlay,
  autoFocus = false,
  isMagnetic = true,
}: ElbowLineProps) {
  const { state, registry } = useSceneContext('ElbowLine');
  // The library owns the route. It starts as an L between the two initial
  // points and is edited in place by the handles.
  const [points, setPoints] = useState(() =>
    seedElbowPoints(initialStart, initialEnd),
  );
  // Which Dot edge each end is attached to, if any. A bound end is not stored
  // in `points`: it is looked up from the Dot every render, so it follows the
  // Dot with no lag and `points` stays the route the user last shaped.
  const [bindings, setBindings] = useState<Bindings>(NO_BINDINGS);
  const dots = useSyncExternalStore(
    registry.subscribe,
    registry.getSnapshot,
    registry.getSnapshot,
  );
  const { route: resolved, released } = useMemo(
    () => resolveBoundRoute(points, bindings, dots, isMagnetic),
    [points, bindings, dots, isMagnetic],
  );
  const hasReleased = released.start || released.end;

  const { focused: selected, onFocus, onBlur } = useFocusWithin();
  const rootRef = useRef<HTMLDivElement>(null);
  // The last route drawn with every bound end on a live Dot.
  const lastGoodRef = useRef(points);
  const route = hasReleased ? lastGoodRef.current : resolved;
  const latest = useLatest({ route, bindings, isMagnetic });
  const cancelDragRef = useRef<(() => void) | null>(null);

  // A bound end whose Dot unmounted (or stopped being magnetic) stays where
  // it last was, as an ordinary free end.
  useLayoutEffect(() => {
    if (!hasReleased) {
      lastGoodRef.current = resolved;
      return;
    }
    setPoints(lastGoodRef.current);
    setBindings((current) => ({
      start: released.start ? null : current.start,
      end: released.end ? null : current.end,
    }));
  }, [hasReleased, resolved, released.start, released.end]);

  // Ends that start on a Dot's edge attach to it. Passive, so that every Dot
  // (before or after this line in the tree) has already reported its box.
  useEffect(() => {
    if (!isMagnetic) return;
    const targets = magneticTargets(registry.getSnapshot());
    if (targets.length === 0) return;

    const options = { distance: MAGNET_DISTANCE / state.getView().zoom };
    let next = points;
    const attached: Bindings = { start: null, end: null };
    for (const end of ['start', 'end'] as const) {
      const at = end === 'start' ? next[0] : next[next.length - 1];
      const snap = at && snapPointToRects(at, targets, options);
      if (!snap) continue;
      next = moveElbowEnd(next, end, snap.point);
      attached[end] = { dotKey: snap.key, edge: snap.edge, t: snap.t };
    }
    if (attached.start || attached.end) {
      setPoints(next);
      setBindings(attached);
    }
    // Once, on mount: the initial points are only read then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cancelDragRef.current?.(), []);

  useEffect(() => {
    // preventScroll: the Scene clips its content, and focusing something
    // outside the visible part must not scroll the clipped box.
    if (autoFocus) rootRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const segments = useMemo(() => lineSegments(route), [route]);

  const beginDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
    onDrag: (base: Point[], dx: number, dy: number) => void,
  ) => {
    if (event.button !== 0 || !event.isPrimary || cancelDragRef.current) return;

    // Edits are measured from the route as it was at pointer-down, so the
    // handle stays under the pointer however the segments reshape.
    const base = latest.current.route;
    cancelDragRef.current = startDrag({
      event: event.nativeEvent,
      getZoom: () => state.getView().zoom,
      threshold: 0,
      onDrag: (dx, dy) => onDrag(base, dx, dy),
      onEnd: () => {
        cancelDragRef.current = null;
      },
    });
  };

  const dragEnd = (
    event: ReactPointerEvent<HTMLDivElement>,
    end: 'start' | 'end',
  ) => {
    // The Dot this end is attached to at pointer-down: it holds on a little
    // longer than a Dot the end has yet to reach.
    let attachedKey = latest.current.bindings[end]?.dotKey;
    beginDrag(event, (base, dx, dy) => {
      const origin = end === 'start' ? base[0] : base[base.length - 1];
      const raw = { x: origin.x + dx, y: origin.y + dy };
      const zoom = state.getView().zoom;
      const snap = latest.current.isMagnetic
        ? snapPointToRects(raw, magneticTargets(registry.getSnapshot()), {
            distance: MAGNET_DISTANCE / zoom,
            release: MAGNET_RELEASE / zoom,
            currentKey: attachedKey,
          })
        : null;
      attachedKey = snap?.key;
      setPoints(moveElbowEnd(base, end, snap ? snap.point : raw));
      setBindings((current) => ({
        ...current,
        [end]: snap ? { dotKey: snap.key, edge: snap.edge, t: snap.t } : null,
      }));
    });
  };

  const first = route[0];
  const last = route[route.length - 1];

  return (
    <div
      ref={rootRef}
      data-dl-line=""
      // -1: a press on the line (its hit areas have no tabindex of their own)
      // focuses it, but it is not in the Tab order.
      tabIndex={-1}
      style={ROOT_STYLE}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <SelectedContext value={selected}>
        {segments.map((segment) => (
          <div
            key={`segment-${segment.index}`}
            data-dl-line-segment=""
            className={className}
            style={segmentStyle(segment, segments.length)}
          />
        ))}
        {segments.map((segment) => (
          <div
            key={`hit-${segment.index}`}
            data-dl-line-hit=""
            style={hitStyle(segment)}
          />
        ))}
        {selected && segments.length > 0 ? (
          <>
            {segments.map((segment) => (
              <div
                key={`handle-segment-${segment.index}`}
                data-dl-line-handle="segment"
                style={handleStyle(segment.midpoint)}
                onPointerDown={(event) =>
                  beginDrag(event, (base, dx, dy) =>
                    setPoints(moveElbowSegment(base, segment.index, dx, dy)),
                  )
                }
              >
                {handle}
              </div>
            ))}
            {(['start', 'end'] as const).map((end) => {
              const point = end === 'start' ? first : last;
              return (
                <div
                  key={`handle-${end}`}
                  data-dl-line-handle={end}
                  style={handleStyle(point)}
                  onPointerDown={(event) => dragEnd(event, end)}
                >
                  {handle}
                </div>
              );
            })}
            {overlay ? (
              <div
                data-dl-line-overlay=""
                style={overlayStyle(longestSegmentMidpoint(segments))}
              >
                {overlay}
              </div>
            ) : null}
          </>
        ) : null}
      </SelectedContext>
    </div>
  );
}
