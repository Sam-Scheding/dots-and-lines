import type { ViewAction } from '../apply-view-action';

export type InputEvent =
  | {
      source: 'wheel';
      deltaX: number;
      deltaY: number;
      ctrlKey: boolean;
      metaKey: boolean;
      shiftKey: boolean;
    }
  | {
      source: 'pointer';
      deltaX: number;
      deltaY: number;
      /** Bitmask; 1 = primary button held. */
      buttons: number;
      spaceKey: boolean;
    };

type InputBinding = {
  id: string;
  match: (event: InputEvent) => ViewAction | null;
};

/** Wheel zoom sensitivity for ctrl/cmd + wheel (and pinch as ctrl-wheel). */
const WHEEL_ZOOM_SENSITIVITY = 0.01;

/**
 * Built-in pan/zoom bindings, checked in order; the first to return an
 * action wins. Not customisable in v1.
 */
const bindings: InputBinding[] = [
  {
    id: 'ctrl-wheel-zoom',
    match(event) {
      if (event.source !== 'wheel') return null;
      if (!(event.ctrlKey || event.metaKey)) return null;
      if (event.shiftKey) return null;
      return {
        type: 'zoomBy',
        factor: Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY),
      };
    },
  },
  {
    id: 'shift-wheel-pan-horizontal',
    match(event) {
      if (event.source !== 'wheel') return null;
      if (!event.shiftKey) return null;
      if (event.ctrlKey || event.metaKey) return null;
      const delta = event.deltaX !== 0 ? event.deltaX : event.deltaY;
      return { type: 'pan', deltaX: -delta, deltaY: 0 };
    },
  },
  {
    id: 'wheel-pan',
    match(event) {
      if (event.source !== 'wheel') return null;
      if (event.ctrlKey || event.metaKey || event.shiftKey) return null;
      return { type: 'pan', deltaX: -event.deltaX, deltaY: -event.deltaY };
    },
  },
  {
    id: 'space-drag-pan',
    match(event) {
      if (event.source !== 'pointer') return null;
      if (!event.spaceKey) return null;
      if ((event.buttons & 1) === 0) return null;
      return { type: 'pan', deltaX: event.deltaX, deltaY: event.deltaY };
    },
  },
];

/** Map a normalized input event to a camera action, or `null` if unhandled. */
export function resolveInput(event: InputEvent): ViewAction | null {
  for (const binding of bindings) {
    const action = binding.match(event);
    if (action) {
      return action;
    }
  }
  return null;
}
