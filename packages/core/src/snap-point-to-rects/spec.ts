import { describe, expect, it } from 'vitest';

import { MAGNET_DISTANCE, MAGNET_RELEASE, snapPointToRects } from './index';

const a = { key: 'a', rect: { x: 100, y: 100, width: 80, height: 40 } };
const b = { key: 'b', rect: { x: 300, y: 100, width: 80, height: 40 } };

describe('snapPointToRects', () => {
  it('snaps to the nearest point on the nearest edge within the distance', () => {
    // 5px left of a's left edge, 10px down it.
    const snap = snapPointToRects({ x: 95, y: 110 }, [a, b], { distance: 16 });
    expect(snap).toEqual({
      key: 'a',
      edge: 'left',
      t: 0.25,
      point: { x: 100, y: 110 },
      distance: 5,
    });
  });

  it('returns null when nothing is close enough', () => {
    expect(
      snapPointToRects({ x: 95, y: 200 }, [a, b], { distance: 16 }),
    ).toBeNull();
  });

  it('snaps above and below the rect to its top and bottom edges', () => {
    expect(
      snapPointToRects({ x: 140, y: 90 }, [a], { distance: 16 })?.edge,
    ).toBe('top');
    expect(
      snapPointToRects({ x: 140, y: 150 }, [a], { distance: 16 })?.edge,
    ).toBe('bottom');
  });

  it('clamps to the corner when the point is past the end of an edge', () => {
    const snap = snapPointToRects({ x: 90, y: 95 }, [a], { distance: 16 });
    expect(snap?.point).toEqual({ x: 100, y: 100 });
    expect(snap?.t).toBe(0);
  });

  it('snaps a point inside a rect to the nearest edge, however deep', () => {
    const big = { key: 'big', rect: { x: 0, y: 0, width: 400, height: 400 } };
    const snap = snapPointToRects({ x: 150, y: 20 }, [big], { distance: 4 });
    expect(snap?.edge).toBe('top');
    expect(snap?.point).toEqual({ x: 150, y: 0 });
    const deep = snapPointToRects({ x: 150, y: 150 }, [big], { distance: 4 });
    expect(deep?.edge).toBe('left');
  });

  it('prefers the nearest of several rects', () => {
    const near = {
      key: 'near',
      rect: { x: 100, y: 100, width: 50, height: 50 },
    };
    const far = { key: 'far', rect: { x: 110, y: 100, width: 50, height: 50 } };
    // 4px left of near's left edge; far's left edge is 14px away.
    expect(
      snapPointToRects({ x: 96, y: 120 }, [far, near], { distance: 16 })?.key,
    ).toBe('near');
  });

  it('breaks ties in favour of the earlier target', () => {
    const one = { key: 'one', rect: { x: 100, y: 100, width: 20, height: 20 } };
    const two = { key: 'two', rect: { x: 100, y: 100, width: 20, height: 20 } };
    expect(
      snapPointToRects({ x: 90, y: 110 }, [one, two], { distance: 16 })?.key,
    ).toBe('one');
  });

  it('holds a snap to the current target out to the release distance', () => {
    const point = { x: 80, y: 110 }; // 20px from a's left edge
    expect(snapPointToRects(point, [a], { distance: 16 })).toBeNull();
    expect(
      snapPointToRects(point, [a], {
        distance: 16,
        release: 24,
        currentKey: 'a',
      })?.key,
    ).toBe('a');
    // The release distance only applies to the current target.
    expect(
      snapPointToRects(point, [a], {
        distance: 16,
        release: 24,
        currentKey: 'b',
      }),
    ).toBeNull();
  });

  it('copes with zero-size rects', () => {
    const dot = { key: 'dot', rect: { x: 50, y: 50, width: 0, height: 0 } };
    const snap = snapPointToRects({ x: 54, y: 53 }, [dot], { distance: 16 });
    expect(snap?.point).toEqual({ x: 50, y: 50 });
    expect(snap?.t).toBe(0);
  });

  it('exposes the magnet distances in screen px', () => {
    expect(MAGNET_DISTANCE).toBe(16);
    expect(MAGNET_RELEASE).toBeGreaterThan(MAGNET_DISTANCE);
  });
});
