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

describe('createSceneState: Dots and lines', () => {
  const L = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 5 },
  ];

  it('starts empty', () => {
    const scene = createSceneState();
    expect(scene.getDots()).toEqual([]);
    expect(scene.getLines()).toEqual([]);
  });

  it('adds, moves and removes Dots', () => {
    const scene = createSceneState();
    const id = scene.addDot({ x: 1, y: 2 });
    expect(id).toEqual(expect.any(String));
    expect(scene.getDots()).toEqual([{ id, x: 1, y: 2 }]);

    scene.moveDot(id!, 5, 6);
    expect(scene.getDots()).toEqual([{ id, x: 5, y: 6 }]);

    scene.removeDot(id!);
    expect(scene.getDots()).toEqual([]);
  });

  it('uses a given id, and rejects one that is taken or empty', () => {
    const scene = createSceneState();
    expect(scene.addDot({ id: 'a', x: 0, y: 0 })).toBe('a');
    expect(scene.addDot({ id: 'a', x: 9, y: 9 })).toBeNull();
    expect(scene.addDot({ id: '', x: 0, y: 0 })).toBeNull();
    expect(scene.getDots()).toEqual([{ id: 'a', x: 0, y: 0 }]);
  });

  it('generates different ids', () => {
    const scene = createSceneState();
    const a = scene.addDot({ x: 0, y: 0 });
    const b = scene.addDot({ x: 0, y: 0 });
    expect(a).not.toBe(b);
  });

  it('ignores non-finite positions and unknown ids', () => {
    const scene = createSceneState();
    const listener = vi.fn();
    expect(scene.addDot({ x: NaN, y: 0 })).toBeNull();
    scene.addDot({ id: 'a', x: 0, y: 0 });
    scene.subscribe(listener);
    scene.moveDot('a', Infinity, 0);
    scene.moveDot('nope', 1, 1);
    scene.removeDot('nope');
    expect(scene.getDots()).toEqual([{ id: 'a', x: 0, y: 0 }]);
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps identity until something changes, and only replaces what changed', () => {
    const scene = createSceneState();
    scene.addDot({ id: 'a', x: 0, y: 0 });
    scene.addDot({ id: 'b', x: 1, y: 1 });
    const before = scene.getDots();
    const listener = vi.fn();
    scene.subscribe(listener);

    scene.moveDot('a', 0, 0); // no-op
    expect(scene.getDots()).toBe(before);
    expect(listener).not.toHaveBeenCalled();

    scene.moveDot('a', 3, 3);
    const after = scene.getDots();
    expect(after).not.toBe(before);
    expect(after[0]).not.toBe(before[0]);
    expect(after[1]).toBe(before[1]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps Dots in the order they were added', () => {
    const scene = createSceneState();
    scene.addDot({ id: 'a', x: 0, y: 0 });
    scene.addDot({ id: 'b', x: 0, y: 0 });
    scene.moveDot('a', 1, 1);
    expect(scene.getDots().map((d) => d.id)).toEqual(['a', 'b']);
  });

  it('adds, re-routes and removes lines', () => {
    const scene = createSceneState();
    const id = scene.addLine({ route: L });
    expect(scene.getLines()).toEqual([{ id, route: L }]);

    const next = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
    ];
    scene.setLineRoute(id!, next);
    expect(scene.getLines()).toEqual([{ id, route: next }]);

    scene.removeLine(id!);
    expect(scene.getLines()).toEqual([]);
  });

  it('copies a route rather than keeping the caller’s array', () => {
    const scene = createSceneState();
    const route = L.map((p) => ({ ...p }));
    const id = scene.addLine({ route })!;
    route[1].x = 999;
    expect(scene.getLines().find((l) => l.id === id)?.route).toEqual(L);
  });

  it('rejects invalid routes and taken ids, and ignores a bad re-route', () => {
    const scene = createSceneState();
    const listener = vi.fn();
    expect(
      scene.addLine({
        route: [
          { x: 0, y: 0 },
          { x: 3, y: 4 },
        ],
      }),
    ).toBeNull();
    scene.addLine({ id: 'l', route: L });
    expect(scene.addLine({ id: 'l', route: L })).toBeNull();
    scene.subscribe(listener);
    scene.setLineRoute('l', [{ x: 0, y: 0 }]);
    scene.setLineRoute('l', L); // same route
    scene.setLineRoute('nope', L);
    expect(listener).not.toHaveBeenCalled();
    expect(scene.getLines()).toHaveLength(1);
  });

  it('notifies subscribers of every Dot and line change', () => {
    const scene = createSceneState();
    const listener = vi.fn();
    scene.subscribe(listener);
    const dot = scene.addDot({ x: 0, y: 0 })!;
    scene.moveDot(dot, 1, 1);
    scene.removeDot(dot);
    const line = scene.addLine({ route: L })!;
    scene.setLineRoute(line, [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
    ]);
    scene.removeLine(line);
    expect(listener).toHaveBeenCalledTimes(6);
  });

  describe('defaults and toJSON', () => {
    it('starts from defaultDots and defaultLines', () => {
      const scene = createSceneState({
        defaultDots: [{ id: 'a', x: 1, y: 2 }],
        defaultLines: [{ id: 'l', route: L }],
      });
      expect(scene.getDots()).toEqual([{ id: 'a', x: 1, y: 2 }]);
      expect(scene.getLines()).toEqual([{ id: 'l', route: L }]);
    });

    it('drops invalid saved entries', () => {
      const scene = createSceneState({
        defaultDots: [
          { id: 'a', x: 1, y: 2 },
          { id: 'a', x: 9, y: 9 }, // repeated id
          { id: 'b', x: NaN, y: 0 },
          { id: '', x: 0, y: 0 },
          { x: 0, y: 0 },
          'junk',
          null,
        ] as never,
        defaultLines: [
          { id: 'l', route: L },
          {
            id: 'diag',
            route: [
              { x: 0, y: 0 },
              { x: 3, y: 4 },
            ],
          },
          { id: 'short', route: [{ x: 0, y: 0 }] },
          { id: 'l', route: L },
          { route: L },
        ] as never,
      });
      expect(scene.getDots()).toEqual([{ id: 'a', x: 1, y: 2 }]);
      expect(scene.getLines().map((l) => l.id)).toEqual(['l']);
    });

    it('ignores defaults that are not arrays', () => {
      const scene = createSceneState({
        defaultDots: 'nope' as never,
        defaultLines: { a: 1 } as never,
      });
      expect(scene.getDots()).toEqual([]);
      expect(scene.getLines()).toEqual([]);
    });

    it('round-trips through JSON.stringify', () => {
      const scene = createSceneState({
        defaultView: { panX: 10, panY: 20, zoom: 1.5 },
      });
      scene.addDot({ id: 'a', x: 1, y: 2 });
      scene.addLine({ id: 'l', route: L });
      scene.setMode('connect');

      const saved = JSON.stringify(scene);
      expect(JSON.parse(saved)).toEqual({
        defaultView: { panX: 10, panY: 20, zoom: 1.5 },
        defaultDots: [{ id: 'a', x: 1, y: 2 }],
        defaultLines: [{ id: 'l', route: L }],
      });

      const restored = createSceneState(JSON.parse(saved));
      expect(restored.getView()).toEqual(scene.getView());
      expect(restored.getDots()).toEqual(scene.getDots());
      expect(restored.getLines()).toEqual(scene.getLines());
      expect(restored.getMode()).toBe('select');
    });
  });
});
