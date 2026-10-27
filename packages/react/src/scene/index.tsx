import {
  MAGNET_DISTANCE,
  lineSegments,
  resolveInput,
  seedElbowPoints,
  snapPointToRects,
  type Point,
  type SceneState,
  type ViewAction,
} from '@dots-and-lines/core';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import { createDotRegistry } from '../dot-registry';
import { magneticTargets } from '../resolve-bound-route';
import { SceneContext } from '../scene-context';
import { segmentStyle } from '../segment-style';
import { useLatest } from '../use-latest';
import { useScene } from '../hooks';

export type SceneProps = {
  /** From `useSceneState`. */
  state: SceneState;
  /** Fires when the second click completes a line in `'connect'` mode. */
  onConnect?: (line: { start: Point; end: Point }) => void;
  /**
   * After the first click in `'connect'` mode, the Scene draws the line so far:
   * from that click to the pointer, as the L an `ElbowLine` starts as. This is
   * the `className` for its segments. Pass the one you give your `ElbowLine`s
   * so the two look alike. Thickness comes from `--dl-line-size`, as for a
   * line.
   */
  previewClassName?: string;
  /** `false` turns off built-in pan and zoom. Default `true`. */
  panZoom?: boolean;
  children?: ReactNode;
};

const ROOT_STYLE: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  touchAction: 'none',
  outline: 'none',
  width: '100%',
  height: '100%',
};

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

function applyAction(
  state: SceneState,
  action: ViewAction,
  origin: Point,
): void {
  if (action.type === 'pan') {
    state.panBy(action.deltaX, action.deltaY);
  } else {
    state.zoomBy(action.factor, origin);
  }
}

export function Scene({
  state,
  onConnect,
  previewClassName,
  panZoom = true,
  children,
}: SceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const view = useScene(state, (s) => s.getView());
  const mode = useScene(state, (s) => s.getMode());
  const onConnectRef = useLatest(onConnect);

  const hoveredRef = useRef(false);
  const spaceHeldRef = useRef(false);
  const panRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const connectStartRef = useRef<Point | null>(null);
  // The line being drawn, for the preview. `end` follows the pointer.
  const [preview, setPreview] = useState<{ start: Point; end: Point } | null>(
    null,
  );

  const [registry] = useState(createDotRegistry);
  const context = useMemo(() => ({ state, registry }), [state, registry]);

  // A half-finished connection never survives a mode change.
  useEffect(() => {
    if (mode !== 'connect') {
      connectStartRef.current = null;
      setPreview(null);
    }
  }, [mode]);

  // Wheel needs a non-passive native listener so it can preventDefault.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !panZoom) return;

    const onWheel = (event: WheelEvent) => {
      const lineScale =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? root.clientHeight
            : 1;
      const action = resolveInput({
        source: 'wheel',
        deltaX: event.deltaX * lineScale,
        deltaY: event.deltaY * lineScale,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      });
      if (!action) return;

      event.preventDefault();
      const rect = root.getBoundingClientRect();
      applyAction(state, action, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, [panZoom, state]);

  // Space is the pan modifier. Track it on window so it works wherever focus is.
  useEffect(() => {
    if (!panZoom) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || isEditable(event.target)) return;
      spaceHeldRef.current = true;
      // Stop the page scrolling while the pointer is over the Scene.
      if (hoveredRef.current) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') spaceHeldRef.current = false;
    };
    const onBlur = () => {
      spaceHeldRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      spaceHeldRef.current = false;
    };
  }, [panZoom]);

  const clientToWorld = (clientX: number, clientY: number): Point => {
    const rect = rootRef.current?.getBoundingClientRect();
    const { panX, panY, zoom } = state.getView();
    return {
      x: (clientX - (rect?.left ?? 0) - panX) / zoom,
      y: (clientY - (rect?.top ?? 0) - panY) / zoom,
    };
  };

  // Where a pointer at (clientX, clientY) lands in connect mode: in world
  // coordinates, snapped to a magnetic Dot like a dragged line end is.
  const connectPoint = (clientX: number, clientY: number): Point => {
    const point = clientToWorld(clientX, clientY);
    const snap = snapPointToRects(
      point,
      magneticTargets(registry.getSnapshot()),
      { distance: MAGNET_DISTANCE / state.getView().zoom },
    );
    return snap ? snap.point : point;
  };

  const handleConnectClick = (clientX: number, clientY: number) => {
    // The line that `onConnect` creates attaches itself to a Dot on mount.
    const point = connectPoint(clientX, clientY);
    const start = connectStartRef.current;

    if (!start) {
      connectStartRef.current = point;
      setPreview({ start: point, end: point });
      return;
    }
    if (start.x === point.x && start.y === point.y) return;

    connectStartRef.current = null;
    setPreview(null);
    onConnectRef.current?.({ start, end: point });
    state.setMode('select');
  };

  // Capture phase, so Dots and lines underneath never see these presses.
  const handlePointerDownCapture = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) return;

    if (panZoom && spaceHeldRef.current) {
      event.stopPropagation();
      event.preventDefault();
      panRef.current = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is a nicety; panning still works without it.
      }
      return;
    }

    if (state.getMode() === 'connect') {
      event.stopPropagation();
      event.preventDefault();
      handleConnectClick(event.clientX, event.clientY);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const connectStart = connectStartRef.current;
    if (connectStart && state.getMode() === 'connect') {
      const end = connectPoint(event.clientX, event.clientY);
      setPreview((current) =>
        current && current.end.x === end.x && current.end.y === end.y
          ? current
          : { start: connectStart, end },
      );
    }

    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;

    const action = resolveInput({
      source: 'pointer',
      deltaX: event.clientX - pan.clientX,
      deltaY: event.clientY - pan.clientY,
      buttons: event.buttons,
      spaceKey: spaceHeldRef.current,
    });
    pan.clientX = event.clientX;
    pan.clientY = event.clientY;
    if (action) applyAction(state, action, { x: 0, y: 0 });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panRef.current?.pointerId !== event.pointerId) return;
    panRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Already released.
    }
  };

  // The line drawn so far in connect mode: the L an ElbowLine would start as.
  const previewSegments = preview
    ? lineSegments(seedElbowPoints(preview.start, preview.end))
    : null;

  const worldStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    transformOrigin: '0 0',
    transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`,
    '--dl-zoom': view.zoom,
  } as CSSProperties;

  return (
    <SceneContext value={context}>
      <div
        ref={rootRef}
        data-dl-scene=""
        data-dl-mode={mode}
        // -1: a press on the background focuses the Scene, which takes focus
        // off whatever was selected. Not in the Tab order.
        tabIndex={-1}
        style={ROOT_STYLE}
        onPointerEnter={() => {
          hoveredRef.current = true;
        }}
        onPointerLeave={() => {
          hoveredRef.current = false;
        }}
        onPointerDownCapture={handlePointerDownCapture}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div data-dl-world="" style={worldStyle}>
          {children}
          {previewSegments ? (
            <div data-dl-connect-preview="">
              {previewSegments.map((segment) => (
                <div
                  key={segment.index}
                  data-dl-preview-segment=""
                  className={previewClassName}
                  style={segmentStyle(segment, previewSegments.length)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </SceneContext>
  );
}
