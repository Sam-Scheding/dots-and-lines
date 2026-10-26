import { describe, expect, it } from 'vitest';

import { resolveInput } from './index';

const wheel = (
  overrides: Partial<{
    deltaX: number;
    deltaY: number;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
  }> = {},
) => ({
  source: 'wheel' as const,
  deltaX: 0,
  deltaY: 0,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...overrides,
});

describe('resolveInput', () => {
  it('maps an unmodified wheel event to a pan action', () => {
    expect(resolveInput(wheel({ deltaX: 10, deltaY: 20 }))).toEqual({
      type: 'pan',
      deltaX: -10,
      deltaY: -20,
    });
  });

  it('maps ctrl or meta wheel events to a zoomBy action', () => {
    expect(resolveInput(wheel({ deltaY: 100, metaKey: true }))).toEqual({
      type: 'zoomBy',
      factor: Math.exp(-1),
    });
    expect(resolveInput(wheel({ deltaY: -100, ctrlKey: true }))).toEqual({
      type: 'zoomBy',
      factor: Math.exp(1),
    });
  });

  it('maps shift wheel events to horizontal pan', () => {
    expect(resolveInput(wheel({ deltaY: 20, shiftKey: true }))).toEqual({
      type: 'pan',
      deltaX: -20,
      deltaY: 0,
    });
    expect(
      resolveInput(wheel({ deltaX: 15, deltaY: 20, shiftKey: true })),
    ).toEqual({ type: 'pan', deltaX: -15, deltaY: 0 });
  });

  it('maps space + primary-button pointer moves to pan', () => {
    expect(
      resolveInput({
        source: 'pointer',
        deltaX: 12,
        deltaY: -4,
        buttons: 1,
        spaceKey: true,
      }),
    ).toEqual({ type: 'pan', deltaX: 12, deltaY: -4 });
  });

  it('ignores pointer moves without space or the primary button', () => {
    expect(
      resolveInput({
        source: 'pointer',
        deltaX: 12,
        deltaY: -4,
        buttons: 1,
        spaceKey: false,
      }),
    ).toBeNull();
    expect(
      resolveInput({
        source: 'pointer',
        deltaX: 12,
        deltaY: -4,
        buttons: 0,
        spaceKey: true,
      }),
    ).toBeNull();
  });

  it('does not treat ctrl + shift wheel as zoom or pan', () => {
    expect(
      resolveInput(wheel({ deltaY: 10, ctrlKey: true, shiftKey: true })),
    ).toBeNull();
  });
});
