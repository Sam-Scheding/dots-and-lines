import type { SceneState } from '@dots-and-lines/core';

/**
 * Zoom so the middle of `element` (the box the Scene fills) stays put, like
 * pinch-zoom does. `zoomBy` with no origin keeps pan unchanged, which makes
 * the content run away to the top-left.
 */
export function zoomAboutCenter(
  sceneState: SceneState,
  element: HTMLElement | null,
  factor: number,
): void {
  if (!element) {
    sceneState.zoomBy(factor);
    return;
  }
  sceneState.zoomBy(factor, {
    x: element.clientWidth / 2,
    y: element.clientHeight / 2,
  });
}
