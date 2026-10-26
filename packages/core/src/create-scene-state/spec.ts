import { describe, expect, it, vi } from 'vitest';

import { createSceneState } from './index';

describe('createSceneState', () => {
  it('starts at the default view in select mode', () => {
    const scene = createSceneState();
    expect(scene.getView()).toEqual({ panX: 0, panY: 0, zoom: 1 });
    expect(scene.getMode()).toBe('select');
  });

  it('uses and clamps defaultView', () => {
    const scene = createSceneState({
      defaultView: { panX: 5, panY: 6, zoom: 99 },
      zoom: { min: 0.5, max: 3 },
    });
    expect(scene.getView()).toEqual({ panX: 5, panY: 6, zoom: 3 });
  });

  it('clamps setView to the zoom limits', () => {
    const scene = createSceneState({ zoom: { min: 0.5, max: 3 } });
    scene.setView({ panX: 1, panY: 2, zoom: 0.01 });
    expect(scene.getView()).toEqual({ panX: 1, panY: 2, zoom: 0.5 });
  });

  it('ignores non-finite views', () => {
    const scene = createSceneState();
    const listener = vi.fn();
    scene.subscribe(listener);
    scene.setView({ panX: NaN, panY: 0, zoom: 1 });
    scene.panBy(Infinity, 0);
    scene.zoomBy(NaN);
    expect(scene.getView()).toEqual({ panX: 0, panY: 0, zoom: 1 });
    expect(listener).not.toHaveBeenCalled();
  });

  it('returns the same view object until the camera changes', () => {
    const scene = createSceneState();
    const first = scene.getView();
    scene.setView({ panX: 0, panY: 0, zoom: 1 });
    expect(scene.getView()).toBe(first);
    scene.panBy(1, 0);
    expect(scene.getView()).not.toBe(first);
  });

  it('notifies subscribers once per change, and not for no-ops', () => {
    const scene = createSceneState();
    const listener = vi.fn();
    scene.subscribe(listener);

    scene.setView({ panX: 10, panY: 0, zoom: 1 });
    expect(listener).toHaveBeenCalledTimes(1);

    scene.setView({ panX: 10, panY: 0, zoom: 1 });
    scene.panBy(0, 0);
    scene.setMode('select');
    expect(listener).toHaveBeenCalledTimes(1);

    scene.setMode('connect');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(scene.getMode()).toBe('connect');
  });

  it('stops notifying after unsubscribe', () => {
    const scene = createSceneState();
    const listener = vi.fn();
    const unsubscribe = scene.subscribe(listener);
    unsubscribe();
    scene.panBy(5, 5);
    expect(listener).not.toHaveBeenCalled();
  });

  it('panBy accumulates', () => {
    const scene = createSceneState();
    scene.panBy(15, -8);
    scene.panBy(5, 3);
    expect(scene.getView()).toEqual({ panX: 20, panY: -5, zoom: 1 });
  });

  it('zoomBy clamps and keeps the origin fixed', () => {
    const scene = createSceneState({
      defaultView: { panX: 10, panY: 20, zoom: 1 },
    });
    scene.zoomBy(2, { x: 100, y: 50 });
    expect(scene.getView()).toEqual({
      zoom: 2,
      panX: 100 * (1 - 2) + 10 * 2,
      panY: 50 * (1 - 2) + 20 * 2,
    });

    scene.zoomBy(100);
    expect(scene.getView().zoom).toBe(2);
  });

  it('zoomBy without an origin leaves pan alone', () => {
    const scene = createSceneState({
      defaultView: { panX: 10, panY: 20, zoom: 1 },
    });
    scene.zoomBy(1.5);
    expect(scene.getView()).toEqual({ panX: 10, panY: 20, zoom: 1.5 });
  });

  it('is safe to unsubscribe from inside a listener', () => {
    const scene = createSceneState();
    const second = vi.fn();
    const unsubscribe = scene.subscribe(() => unsubscribe());
    scene.subscribe(second);
    scene.panBy(1, 1);
    scene.panBy(1, 1);
    expect(second).toHaveBeenCalledTimes(2);
  });
});
