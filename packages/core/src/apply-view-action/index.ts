import type { View, ZoomLimits } from '../types';
import { clampZoom } from '../view';

export type ViewAction =
  | {
      type: 'pan';
      /** Screen px. */
      deltaX: number;
      deltaY: number;
    }
  | {
      type: 'zoomBy';
      /** Multiplier applied to the current zoom. */
      factor: number;
      /** Scene-local screen point to keep fixed while zooming (e.g. the cursor). */
      originX?: number;
      originY?: number;
    };

/** Pure camera transition. Zoom is clamped to `limits`. */
export function applyViewAction(
  view: View,
  action: ViewAction,
  limits: ZoomLimits,
): View {
  switch (action.type) {
    case 'pan':
      return {
        ...view,
        panX: view.panX + action.deltaX,
        panY: view.panY + action.deltaY,
      };
    case 'zoomBy': {
      const zoom = clampZoom(view.zoom * action.factor, limits);
      if (zoom === view.zoom) {
        return view;
      }

      const scale = zoom / view.zoom;
      if (action.originX === undefined || action.originY === undefined) {
        return { ...view, zoom };
      }

      return {
        zoom,
        panX: action.originX * (1 - scale) + view.panX * scale,
        panY: action.originY * (1 - scale) + view.panY * scale,
      };
    }
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
