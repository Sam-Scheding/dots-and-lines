import { describe, expect, it } from 'vitest';

import { DEFAULT_VIEW, DEFAULT_ZOOM_LIMITS } from '../view';
import { applyViewAction } from './index';

const limits = DEFAULT_ZOOM_LIMITS;

describe('applyViewAction', () => {
  it('accumulates pan deltas onto the view', () => {
    const panned = applyViewAction(
      DEFAULT_VIEW,
      { type: 'pan', deltaX: 15, deltaY: -8 },
      limits,
    );
    expect(panned).toEqual({ panX: 15, panY: -8, zoom: 1 });

    expect(
      applyViewAction(panned, { type: 'pan', deltaX: 5, deltaY: 3 }, limits),
    ).toEqual({ panX: 20, panY: -5, zoom: 1 });
  });

  it('multiplies zoom by the factor and clamps to the limits', () => {
    expect(
      applyViewAction(DEFAULT_VIEW, { type: 'zoomBy', factor: 1.5 }, limits)
        .zoom,
    ).toBe(1.5);
    expect(
      applyViewAction(DEFAULT_VIEW, { type: 'zoomBy', factor: 10 }, limits)
        .zoom,
    ).toBe(limits.max);
    expect(
      applyViewAction(DEFAULT_VIEW, { type: 'zoomBy', factor: 0.01 }, limits)
        .zoom,
    ).toBe(limits.min);
  });

  it('respects custom zoom limits', () => {
    expect(
      applyViewAction(
        DEFAULT_VIEW,
        { type: 'zoomBy', factor: 10 },
        { min: 0.5, max: 4 },
      ).zoom,
    ).toBe(4);
  });

  it('returns the same view object when zoom is already at the limit', () => {
    const atMax = { panX: 3, panY: 4, zoom: limits.max };
    expect(applyViewAction(atMax, { type: 'zoomBy', factor: 2 }, limits)).toBe(
      atMax,
    );
  });

  it('keeps the zoom origin fixed in screen space by adjusting pan', () => {
    const zoomed = applyViewAction(
      { panX: 10, panY: 20, zoom: 1 },
      { type: 'zoomBy', factor: 2, originX: 100, originY: 50 },
      limits,
    );

    expect(zoomed).toEqual({
      zoom: 2,
      // pan' = origin * (1 - scale) + pan * scale
      panX: 100 * (1 - 2) + 10 * 2,
      panY: 50 * (1 - 2) + 20 * 2,
    });
  });

  it('does not move pan when zooming without an origin', () => {
    expect(
      applyViewAction(
        { panX: 10, panY: 20, zoom: 1 },
        { type: 'zoomBy', factor: 2 },
        limits,
      ),
    ).toEqual({ panX: 10, panY: 20, zoom: 2 });
  });
});
