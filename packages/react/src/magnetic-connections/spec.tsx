// Integration specs: a Scene with Dots and an ElbowLine, as consumers use them.
import { createSceneState } from '@dots-and-lines/core';
import { act, fireEvent, render } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { Dot } from '../dot';
import { ElbowLine } from '../elbow-line';
import { Scene } from '../scene';
import { measureDots } from '../test/measure-dots';

// Each Dot measures 80 x 40. At (100, 100) its right edge is x = 180, and its
// edges run y = 100..140 (left, right) and x = 100..180 (top, bottom).
const SIZE = { width: 80, height: 40 };

// An L from the origin right to x = 200, then down to y = 120: its end handle
// is 20px right of the Dot's right edge, just out of reach.
const START = { x: 0, y: 0 };
const END = { x: 200, y: 120 };

type Layout = {
  dot?: { x: number; y: number; isMagnetic?: boolean } | null;
  line?: {
    isMagnetic?: boolean;
    initialStart?: typeof START;
    initialEnd?: typeof END;
  };
  /** Render the Dot after the line, instead of before it. */
  dotLast?: boolean;
  strict?: boolean;
};

function layout({
  dot = { x: 100, y: 100 },
  line = {},
  dotLast = false,
  strict = false,
}: Layout = {}) {
  const dotNode = dot ? (
    <Dot key="dot" x={dot.x} y={dot.y} isMagnetic={dot.isMagnetic}>
      <div style={SIZE} />
    </Dot>
  ) : null;
  const lineNode = (
    <ElbowLine
      key="line"
      initialStart={START}
      initialEnd={END}
      {...line}
      handle={<i />}
    />
  );
  return (state: ReturnType<typeof createSceneState>): ReactNode => {
    const scene = (
      <Scene state={state}>
        {dotLast ? [lineNode, dotNode] : [dotNode, lineNode]}
      </Scene>
    );
    return strict ? <StrictMode>{scene}</StrictMode> : scene;
  };
}

function setup(first: Layout = {}, zoom = 1) {
  const state = createSceneState({ defaultView: { panX: 0, panY: 0, zoom } });
  const utils = render(layout(first)(state));
  const line = utils.container.querySelector<HTMLElement>('[data-dl-line]')!;
  const update = (next: Layout) => utils.rerender(layout(next)(state));
  const select = () => act(() => line.focus());
  const handle = (end: 'start' | 'end') =>
    utils.container.querySelector<HTMLElement>(
      `[data-dl-line-handle="${end}"]`,
    )!;
  /** Where an end handle sits, as "x,y". */
  const at = (end: 'start' | 'end') => {
    const match = handle(end).style.transform.match(
      /translate\(([-\d.]+)px, ([-\d.]+)px\)/,
    );
    return `${match?.[1]},${match?.[2]}`;
  };
  return { state, line, update, select, handle, at, ...utils };
}

const press = (el: Element, clientX: number, clientY: number) =>
  fireEvent.pointerDown(el, { clientX, clientY, pointerId: 1, button: 0 });
const moveTo = (clientX: number, clientY: number) =>
  fireEvent.pointerMove(window, { clientX, clientY, pointerId: 1 });
const release = () => fireEvent.pointerUp(window, { pointerId: 1 });

/** Press the end handle where it is, move by (dx, dy), and let go. */
function dragEnd(
  s: ReturnType<typeof setup>,
  end: 'start' | 'end',
  dx: number,
  dy = 0,
  { release: doRelease = true } = {},
) {
  const [x, y] = s.at(end).split(',').map(Number);
  press(s.handle(end), x, y);
  moveTo(x + dx, y + dy);
  if (doRelease) release();
}

describe('magnetic connections', () => {
  measureDots(SIZE.width, SIZE.height);

  describe('dragging a line end', () => {
    it('snaps to the nearest point on the Dot border when within 16px', () => {
      const s = setup({ line: { isMagnetic: true } });
      s.select();
      // 20px from the right edge; -8 leaves it 12px away, 10px down the edge.
      dragEnd(s, 'end', -8, -10);
      expect(s.at('end')).toBe('180,110');
    });

    it('stays where it was dropped when nothing is within reach', () => {
      const s = setup();
      s.select();
      dragEnd(s, 'end', -2, 0); // 18px from the edge
      expect(s.at('end')).toBe('198,120');
    });

    it('snaps a dragged start the same way', () => {
      const s = setup({ line: { initialStart: { x: 40, y: 40 } } });
      s.select();
      // Start (40,40) -> (92,110): 8px left of the Dot's left edge.
      dragEnd(s, 'start', 52, 70);
      expect(s.at('start')).toBe('100,110');
    });

    it('keeps the other end where it was', () => {
      const s = setup();
      s.select();
      dragEnd(s, 'end', -8);
      expect(s.at('start')).toBe('0,0');
    });

    it('does not snap to a Dot whose isMagnetic is false', () => {
      const s = setup({ dot: { x: 100, y: 100, isMagnetic: false } });
      s.select();
      dragEnd(s, 'end', -8);
      expect(s.at('end')).toBe('192,120');
    });

    it('does not snap when the line’s isMagnetic is false', () => {
      const s = setup({ line: { isMagnetic: false } });
      s.select();
      dragEnd(s, 'end', -8);
      expect(s.at('end')).toBe('192,120');
    });

    it('scales the snap distance with the zoom', () => {
      // At 2x, 16 screen px is 8 world px. The end handle is 20 world px out.
      const s = setup({}, 2);
      s.select();
      dragEnd(s, 'end', -20); // 10 world px: too far
      expect(s.at('end')).toBe('190,120');
      dragEnd(s, 'end', -24); // 6 world px: close enough
      expect(s.at('end')).toBe('180,120');
    });
  });

  describe('following a Dot', () => {
    function attached() {
      const s = setup();
      s.select();
      dragEnd(s, 'end', -8);
      return s;
    }

    it('moves the attached end with the Dot and leaves the other end', () => {
      const s = attached();
      expect(s.at('end')).toBe('180,120');
      s.update({ dot: { x: 150, y: 200 } });
      // Same spot on the edge: the middle of the right edge.
      expect(s.at('end')).toBe('230,220');
      expect(s.at('start')).toBe('0,0');
    });

    it('keeps its place along the edge as the Dot moves', () => {
      const s = setup();
      s.select();
      dragEnd(s, 'end', -8, -10); // 10px down the right edge
      s.update({ dot: { x: 150, y: 200 } });
      expect(s.at('end')).toBe('230,210');
    });

    it('keeps the end segment orientation, so the line stays orthogonal', () => {
      const s = attached();
      s.update({ dot: { x: 150, y: 200 } });
      const segments = s.container.querySelectorAll<HTMLElement>(
        '[data-dl-line-segment]',
      );
      // Still right then down: a horizontal then a vertical segment.
      expect(segments).toHaveLength(2);
      expect(segments[0].style.height).toBe('var(--dl-line-size, 2px)');
      expect(segments[1].style.width).toBe('var(--dl-line-size, 2px)');
    });

    it('lets the Dot go back and the line return to its old route', () => {
      const s = attached();
      const before = s.at('end');
      s.update({ dot: { x: 150, y: 200 } });
      s.update({ dot: { x: 100, y: 100 } });
      expect(s.at('end')).toBe(before);
    });

    it('re-routes a two-point line without dragging the far end', () => {
      const s = setup({
        line: {
          initialStart: { x: 0, y: 120 },
          initialEnd: { x: 200, y: 120 },
        },
      });
      s.select();
      dragEnd(s, 'end', -8);
      s.update({
        dot: { x: 100, y: 300 },
        line: {
          initialStart: { x: 0, y: 120 },
          initialEnd: { x: 200, y: 120 },
        },
      });
      expect(s.at('start')).toBe('0,120');
      expect(s.at('end')).toBe('180,320');
    });
  });

  describe('detaching', () => {
    it('lets go when the end is dragged away, and stops following', () => {
      const s = setup();
      s.select();
      dragEnd(s, 'end', -8); // attach, at (180, 120)
      dragEnd(s, 'end', 40); // well past the release distance
      expect(s.at('end')).toBe('220,120');
      s.update({ dot: { x: 150, y: 200 } });
      expect(s.at('end')).toBe('220,120');
    });

    it('holds on out to 24px, then lets go', () => {
      const s = setup();
      s.select();
      dragEnd(s, 'end', -8);
      dragEnd(s, 'end', 20); // 20px out: past 16 but inside 24
      expect(s.at('end')).toBe('180,120');
      dragEnd(s, 'end', 30); // 30px out
      expect(s.at('end')).toBe('210,120');
    });

    it('needs the normal distance to attach again', () => {
      const s = setup();
      s.select();
      dragEnd(s, 'end', -8);
      dragEnd(s, 'end', 40); // free at (220, 120)
      dragEnd(s, 'end', -30); // 190 -> 10px out: within 16
      expect(s.at('end')).toBe('180,120');
    });

    it('frees the end, in place, when the Dot unmounts', () => {
      const s = setup();
      s.select();
      dragEnd(s, 'end', -8);
      s.update({ dot: { x: 150, y: 200 } });
      expect(s.at('end')).toBe('230,220');
      s.update({ dot: null });
      expect(s.at('end')).toBe('230,220');
      // And it is a free end now: it no longer needs a Dot to be dragged.
      dragEnd(s, 'end', 5);
      expect(s.at('end')).toBe('235,220');
    });

    it('frees the end, in place, when the Dot stops being magnetic', () => {
      const s = setup();
      s.select();
      dragEnd(s, 'end', -8);
      s.update({ dot: { x: 150, y: 200 } });
      s.update({ dot: { x: 150, y: 200, isMagnetic: false } });
      expect(s.at('end')).toBe('230,220');
      s.update({ dot: { x: 300, y: 300, isMagnetic: false } });
      expect(s.at('end')).toBe('230,220');
    });

    it('frees the end when the line stops being magnetic', () => {
      const s = setup();
      s.select();
      dragEnd(s, 'end', -8);
      s.update({ line: { isMagnetic: false } });
      s.update({ dot: { x: 150, y: 200 }, line: { isMagnetic: false } });
      expect(s.at('end')).toBe('180,120');
    });
  });

  describe('attaching on mount', () => {
    // On the Dot's right edge, 10px down.
    const onEdge = { initialEnd: { x: 181, y: 110 } };

    it.each([
      ['before', false],
      ['after', true],
    ])('attaches when the Dot comes %s the line in the tree', (_, dotLast) => {
      const s = setup({ dotLast, line: onEdge });
      s.select();
      // Snapped from (181,110) onto the edge itself.
      expect(s.at('end')).toBe('180,110');
      s.update({ dotLast, dot: { x: 150, y: 200 }, line: onEdge });
      expect(s.at('end')).toBe('230,210');
    });

    it('survives StrictMode’s double mount', () => {
      const s = setup({ strict: true, line: onEdge });
      s.select();
      expect(s.at('end')).toBe('180,110');
      s.update({ strict: true, dot: { x: 150, y: 200 }, line: onEdge });
      expect(s.at('end')).toBe('230,210');
    });

    it('does not attach an end that is out of reach', () => {
      const s = setup({ line: { initialEnd: { x: 200, y: 110 } } });
      s.select();
      s.update({
        dot: { x: 150, y: 200 },
        line: { initialEnd: { x: 200, y: 110 } },
      });
      expect(s.at('end')).toBe('200,110');
    });

    it('does not attach when the line is not magnetic', () => {
      const s = setup({ line: { ...onEdge, isMagnetic: false } });
      s.select();
      expect(s.at('end')).toBe('181,110');
    });

    it('does not attach to a Dot that is not magnetic', () => {
      const s = setup({
        dot: { x: 100, y: 100, isMagnetic: false },
        line: onEdge,
      });
      s.select();
      expect(s.at('end')).toBe('181,110');
    });
  });
});
