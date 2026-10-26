import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import { useSceneContext } from '../scene-context';
import { SelectedContext } from '../selected-context';
import { startDrag } from '../start-drag';
import { useFocusWithin } from '../use-focus-within';
import { useLatest } from '../use-latest';

export type DotProps = {
  /** Top-left corner, in CSS px at zoom 1. */
  x: number;
  y: number;
  /** Called on every pointer move while dragging. */
  onMove?: (x: number, y: number) => void;
  /** Called on pointer-up after a drag. */
  onMoveEnd?: () => void;
  /**
   * Rendered only while the Dot is selected (focus is inside it). Not a drag
   * target, e.g. a toolbar.
   */
  overlay?: ReactNode;
  /**
   * Whether pressing the Dot selects it, and a selected Dot gets a ring
   * (colour from `--dl-select-color`, default blue). Default `true`.
   *
   * Set it to `false` when the children handle selection themselves, for
   * example a focusable Card with its own `:focus` style: the Dot's wrapper
   * then isn't focusable and draws nothing.
   */
  selectable?: boolean;
  /** Select the Dot as soon as it mounts, e.g. one created by an "Add" button. */
  autoFocus?: boolean;
  /** The visuals. The Dot is exactly as large as its children. */
  children: ReactNode;
};

/** Movement (screen px) before a press becomes a drag, so clicks still work. */
const DRAG_THRESHOLD = 3;

const BODY_STYLE: CSSProperties = { display: 'contents' };

export function Dot({
  x,
  y,
  onMove,
  onMoveEnd,
  overlay,
  selectable = true,
  autoFocus = false,
  children,
}: DotProps) {
  const { state } = useSceneContext('Dot');
  const { focused, onFocus, onBlur } = useFocusWithin();
  const latest = useLatest({ x, y, onMove, onMoveEnd });
  const dotRef = useRef<HTMLDivElement>(null);
  const cancelDragRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelDragRef.current?.(), []);

  useEffect(() => {
    // preventScroll: the Scene clips its content, and focusing something
    // outside the visible part must not scroll the clipped box.
    if (autoFocus) dotRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary || cancelDragRef.current) return;

    const origin = { x: latest.current.x, y: latest.current.y };
    cancelDragRef.current = startDrag({
      event: event.nativeEvent,
      getZoom: () => state.getView().zoom,
      threshold: DRAG_THRESHOLD,
      onDrag: (dx, dy) => latest.current.onMove?.(origin.x + dx, origin.y + dy),
      onEnd: (moved) => {
        cancelDragRef.current = null;
        if (moved) latest.current.onMoveEnd?.();
      },
    });
  };

  const style: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate(${x}px, ${y}px)`,
    // Without this, an absolutely-positioned box shrink-to-fits against the
    // (zero-size) world and squeezes its children.
    width: 'max-content',
    touchAction: 'none',
    // The browser only shows a ring for keyboard focus, so draw our own, from
    // the tracked focus state. Inline styles can't express :focus-within.
    outline:
      selectable && focused
        ? '2px solid var(--dl-select-color, #3b82f6)'
        : 'none',
    outlineOffset: 2,
  };

  return (
    <div
      ref={dotRef}
      data-dl-dot=""
      // -1: a press can focus it, but it is not in the Tab order. Without
      // a tabindex a press focuses nothing here, so the children decide.
      tabIndex={selectable ? -1 : undefined}
      style={style}
      onFocus={onFocus}
      onBlur={onBlur}
      onDragStart={(e) => e.preventDefault()}
    >
      <SelectedContext value={focused}>
        <div
          data-dl-dot-body=""
          style={BODY_STYLE}
          onPointerDown={handlePointerDown}
        >
          {children}
        </div>
        {focused ? overlay : null}
      </SelectedContext>
    </div>
  );
}
