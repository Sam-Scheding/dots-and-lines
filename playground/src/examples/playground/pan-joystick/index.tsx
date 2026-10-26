import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import styles from './styles.module.css';

type PanJoystickProps = {
  /** Called every frame while the stick is held away from the middle. */
  onPanDelta: (deltaXPx: number, deltaYPx: number) => void;
};

/** Pixels of pan per second at full stick deflection. */
const PAN_SPEED_PX_PER_SEC = 640;

/** Keep (x, y) inside a circle of `maxRadius` around the middle. */
function clampOffset(x: number, y: number, maxRadius: number) {
  if (maxRadius <= 0) return { x: 0, y: 0 };
  const distance = Math.hypot(x, y);
  if (distance <= maxRadius) return { x, y };
  const scale = maxRadius / distance;
  return { x: x * scale, y: y * scale };
}

/**
 * A stick you hold to pan: the further you push, the faster it goes, and
 * pushing right moves the camera right (the content moves left). Letting go
 * snaps it back to the middle and stops.
 */
export function PanJoystick({ onPanDelta }: PanJoystickProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const onPanDeltaRef = useRef(onPanDelta);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    onPanDeltaRef.current = onPanDelta;
  });

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  /** How far the thumb can travel from the middle. */
  function maxThrowPx() {
    const root = rootRef.current;
    if (!root) return 0;
    const thumb = root.firstElementChild;
    const thumbSize =
      thumb instanceof HTMLElement
        ? Math.min(thumb.clientWidth, thumb.clientHeight)
        : 0;
    return Math.max(
      0,
      (Math.min(root.clientWidth, root.clientHeight) - thumbSize) / 2,
    );
  }

  function moveStick(event: ReactPointerEvent<HTMLDivElement>) {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const next = clampOffset(
      event.clientX - (rect.left + rect.width / 2),
      event.clientY - (rect.top + rect.height / 2),
      maxThrowPx(),
    );
    offsetRef.current = next;
    setOffset(next);
  }

  function stop() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    lastTimeRef.current = null;
    pointerIdRef.current = null;
    offsetRef.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });
    setActive(false);
  }

  function tick(time: number) {
    if (pointerIdRef.current === null) return;
    const last = lastTimeRef.current;
    lastTimeRef.current = time;
    if (last !== null) {
      // Cap the step so a stalled tab doesn't jump on return.
      const seconds = Math.min(0.05, (time - last) / 1000);
      const maxThrow = maxThrowPx();
      if (maxThrow > 0 && seconds > 0) {
        const { x, y } = offsetRef.current;
        const scale = (PAN_SPEED_PX_PER_SEC * seconds) / maxThrow;
        if (x !== 0 || y !== 0) onPanDeltaRef.current(-x * scale, -y * scale);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || pointerIdRef.current !== null) return;
    const root = rootRef.current;
    if (!root) return;
    moveStick(event);
    pointerIdRef.current = event.pointerId;
    setActive(true);
    root.setPointerCapture?.(event.pointerId);
    lastTimeRef.current = null;
    frameRef.current = requestAnimationFrame(tick);
    event.preventDefault();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    moveStick(event);
    event.preventDefault();
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    const root = rootRef.current;
    if (root?.hasPointerCapture?.(event.pointerId)) {
      root.releasePointerCapture(event.pointerId);
    }
    stop();
  }

  return (
    <div
      ref={rootRef}
      className={active ? `${styles.root} ${styles.active}` : styles.root}
      role="application"
      aria-label="Pan the Scene"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={styles.thumb}
        style={{
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
        }}
      />
    </div>
  );
}
