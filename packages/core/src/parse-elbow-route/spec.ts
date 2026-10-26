import { describe, expect, it } from 'vitest';

import { parseElbowRoute } from './index';

describe('parseElbowRoute', () => {
  it('accepts an orthogonal route and returns copies', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ];
    const route = parseElbowRoute(input);
    expect(route).toEqual(input);
    expect(route![0]).not.toBe(input[0]);
  });

  it('drops fields other than x and y', () => {
    expect(
      parseElbowRoute([
        { x: 0, y: 0, extra: 1 },
        { x: 4, y: 0, note: 'hi' },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
    ]);
  });

  it('collapses colinear and zero-length segments', () => {
    expect(
      parseElbowRoute([
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
  });

  it('snaps rounding noise so segments are exactly orthogonal', () => {
    const route = parseElbowRoute([
      { x: 0, y: 0 },
      { x: 10, y: 1e-9 },
      { x: 10 + 1e-9, y: 5 },
    ]);
    expect(route).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
  });

  it('rejects a diagonal segment', () => {
    expect(
      parseElbowRoute([
        { x: 0, y: 0 },
        { x: 3, y: 4 },
      ]),
    ).toBeNull();
  });

  it('rejects anything that is not at least two finite points', () => {
    expect(parseElbowRoute(undefined)).toBeNull();
    expect(parseElbowRoute('route')).toBeNull();
    expect(parseElbowRoute([])).toBeNull();
    expect(parseElbowRoute([{ x: 0, y: 0 }])).toBeNull();
    expect(
      parseElbowRoute([
        { x: 0, y: 0 },
        { x: NaN, y: 0 },
      ]),
    ).toBeNull();
    expect(parseElbowRoute([{ x: 0, y: 0 }, null])).toBeNull();
    expect(
      parseElbowRoute([
        { x: 0, y: 0 },
        { x: '4', y: 0 },
      ]),
    ).toBeNull();
  });

  it('rejects a route that collapses to a single point', () => {
    expect(
      parseElbowRoute([
        { x: 2, y: 2 },
        { x: 2, y: 2 },
      ]),
    ).toBeNull();
  });
});
