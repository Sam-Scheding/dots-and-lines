export type StartDragOptions = {
  /** The pointerdown that started the drag. */
  event: PointerEvent;
  /** Read at every move, so wheel-zooming mid-drag stays correct. */
  getZoom: () => number;
  /** Screen px the pointer must travel before it counts as a drag. */
  threshold: number;
  /** Total movement since pointer-down, in world px (screen px / zoom). */
  onDrag: (dx: number, dy: number) => void;
  /** `moved` is false if the pointer never passed the threshold (a click). */
  onEnd: (moved: boolean) => void;
};

/**
 * Track one pointer on `window` until it is released. Using window listeners
 * (rather than pointer capture) means a fast flick off a small element can't
 * lose the drag, and clicks on interactive children keep working.
 *
 * Returns a function that abandons the drag without calling `onEnd`.
 */
export function startDrag(options: StartDragOptions): () => void {
  const { event, getZoom, threshold, onDrag, onEnd } = options;
  const pointerId = event.pointerId;
  const startClientX = event.clientX;
  const startClientY = event.clientY;
  let lastClientX = startClientX;
  let lastClientY = startClientY;
  let dx = 0;
  let dy = 0;
  let moved = false;

  const remove = () => {
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', handleEnd);
    window.removeEventListener('pointercancel', handleEnd);
  };

  function handleMove(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;

    const zoom = getZoom() || 1;
    dx += (e.clientX - lastClientX) / zoom;
    dy += (e.clientY - lastClientY) / zoom;
    lastClientX = e.clientX;
    lastClientY = e.clientY;

    if (!moved) {
      const travelled = Math.hypot(
        e.clientX - startClientX,
        e.clientY - startClientY,
      );
      if (travelled <= threshold) return;
      moved = true;
      window.getSelection?.()?.removeAllRanges();
    }

    onDrag(dx, dy);
  }

  function handleEnd(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    remove();

    if (moved) {
      // The browser still fires a click after a drag; don't let it reach
      // whatever is under the pointer (e.g. a button inside a Dot).
      const swallow = (clickEvent: MouseEvent) => {
        clickEvent.stopPropagation();
        clickEvent.preventDefault();
      };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, true), 0);
    }

    onEnd(moved);
  }

  window.addEventListener('pointermove', handleMove);
  window.addEventListener('pointerup', handleEnd);
  window.addEventListener('pointercancel', handleEnd);

  return remove;
}
