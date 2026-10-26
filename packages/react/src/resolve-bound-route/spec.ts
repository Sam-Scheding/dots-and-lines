import { describe, expect, it } from 'vitest';

import type { DotEntry } from '../dot-registry';
import { NO_BINDINGS, magneticTargets, resolveBoundRoute } from './index';

const dot = (x: number, y: number, isMagnetic = true): DotEntry => ({
  rect: { x, y, width: 40, height: 20 },
  isMagnetic,
});

const points = [
  { x: 0, y: 0 },
  { x: 50, y: 0 },
  { x: 50, y: 30 },
  { x: 100, y: 30 },
];

describe('resolveBoundRoute', () => {
  it('returns the points untouched without bindings', () => {
    const { route, released } = resolveBoundRoute(
      points,
      NO_BINDINGS,
      new Map(),
      true,
    );
    expect(route).toBe(points);
    expect(released).toEqual({ start: false, end: false });
  });

  it('moves a bound end onto its Dot and keeps the other end put', () => {
    const dots = new Map([['a', dot(110, 40)]]);
    const { route } = resolveBoundRoute(
      points,
      { start: null, end: { dotKey: 'a', edge: 'left', t: 0.5 } },
      dots,
      true,
    );
    expect(route[0]).toEqual({ x: 0, y: 0 });
    expect(route[route.length - 1]).toEqual({ x: 110, y: 50 });
  });

  it('does not touch an end that is already on its edge point', () => {
    const dots = new Map([['a', dot(100, 20)]]);
    const { route } = resolveBoundRoute(
      points,
      { start: null, end: { dotKey: 'a', edge: 'left', t: 0.5 } },
      dots,
      true,
    );
    expect(route).toBe(points);
  });

  it('is derived from the stored points, so moving a Dot back restores the route', () => {
    const binding = { dotKey: 'a', edge: 'left' as const, t: 0.5 };
    const bindings = { start: null, end: binding };
    const away = resolveBoundRoute(
      points,
      bindings,
      new Map([['a', dot(110, 90)]]),
      true,
    ).route;
    const back = resolveBoundRoute(
      points,
      bindings,
      new Map([['a', dot(100, 20)]]),
      true,
    ).route;
    expect(away).not.toEqual(points);
    expect(back).toEqual(points);
  });

  it('releases ends whose Dot is missing, not magnetic, or the line is not', () => {
    const bindings = {
      start: { dotKey: 'gone', edge: 'top' as const, t: 0 },
      end: { dotKey: 'a', edge: 'left' as const, t: 0 },
    };
    expect(
      resolveBoundRoute(points, bindings, new Map([['a', dot(0, 0)]]), true)
        .released,
    ).toEqual({ start: true, end: false });
    expect(
      resolveBoundRoute(
        points,
        bindings,
        new Map([
          ['gone', dot(0, 0)],
          ['a', dot(0, 0, false)],
        ]),
        true,
      ).released,
    ).toEqual({ start: false, end: true });
    expect(
      resolveBoundRoute(
        points,
        bindings,
        new Map([
          ['gone', dot(0, 0)],
          ['a', dot(0, 0)],
        ]),
        false,
      ).released,
    ).toEqual({ start: true, end: true });
  });
});

describe('magneticTargets', () => {
  it('lists measured, magnetic Dots only', () => {
    const dots = new Map<string, DotEntry>([
      ['a', dot(0, 0)],
      ['off', dot(0, 0, false)],
      [
        'empty',
        { rect: { x: 0, y: 0, width: 0, height: 0 }, isMagnetic: true },
      ],
    ]);
    expect(magneticTargets(dots).map((t) => t.key)).toEqual(['a']);
  });
});
