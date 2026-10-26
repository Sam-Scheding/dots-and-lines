import { createSceneState, type Point } from '@dots-and-lines/core';
import { act, fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Scene } from '../scene';
import { ElbowLine } from './index';

// An L: right 80, then down 60.
const START = { x: 0, y: 0 };
const END = { x: 80, y: 60 };

type LineProps = Partial<
  Omit<Parameters<typeof ElbowLine>[0], 'initialRoute'>
> & { initialRoute?: readonly Point[] };

/** `selected` focuses the line once it has mounted, which is what selects it. */
function setup(
  { selected, ...props }: Partial<LineProps> & { selected?: boolean } = {},
  zoom = 1,
) {
  const state = createSceneState({ defaultView: { panX: 0, panY: 0, zoom } });
  const tree = (extra: Partial<LineProps> = {}) => (
    <Scene state={state}>
      <ElbowLine
        {...({
          initialStart: START,
          initialEnd: END,
          className: 'line',
          handle: <i data-testid="handle" />,
          overlay: <b data-testid="overlay">toolbar</b>,
          ...props,
          ...extra,
        } as Parameters<typeof ElbowLine>[0])}
      />
    </Scene>
  );
  const utils = render(tree());
  const q = (selector: string) =>
    utils.container.querySelectorAll<HTMLElement>(selector);
  const line = utils.container.querySelector<HTMLElement>('[data-dl-line]')!;
  if (selected) act(() => line.focus());
  return { state, q, line, tree, ...utils };
}

const press = (el: Element, clientX = 0, clientY = 0) =>
  fireEvent.pointerDown(el, { clientX, clientY, pointerId: 1, button: 0 });
const moveTo = (clientX: number, clientY: number) =>
  fireEvent.pointerMove(window, { clientX, clientY, pointerId: 1 });
const release = () => fireEvent.pointerUp(window, { pointerId: 1 });

describe('ElbowLine', () => {
  it('starts as an L between the two initial points', () => {
    const { q } = setup();
    const segments = q('[data-dl-line-segment]');
    expect(segments).toHaveLength(2);
    segments.forEach((segment) => expect(segment).toHaveClass('line'));
  });

  it('starts as a straight line when the points are aligned', () => {
    const { q } = setup({ initialEnd: { x: 80, y: 0 } });
    expect(q('[data-dl-line-segment]')).toHaveLength(1);
  });

  it('lays segments out in absolute coordinates, joining the corner', () => {
    const { q } = setup();
    const [horizontal, vertical] = q('[data-dl-line-segment]');
    // Flush at the start, extended into the corner.
    expect(horizontal.style.left).toBe('0px');
    expect(horizontal.style.top).toBe(
      'calc(0px - var(--dl-line-size, 2px) / 2)',
    );
    expect(horizontal.style.width).toBe(
      'calc(80px + var(--dl-line-size, 2px) / 2)',
    );
    expect(horizontal.style.height).toBe('var(--dl-line-size, 2px)');
    // Extended into the corner, flush at the end.
    expect(vertical.style.left).toBe(
      'calc(80px - var(--dl-line-size, 2px) / 2)',
    );
    expect(vertical.style.top).toBe('calc(0px - var(--dl-line-size, 2px) / 2)');
    expect(vertical.style.width).toBe('var(--dl-line-size, 2px)');
    expect(vertical.style.height).toBe(
      'calc(60px + var(--dl-line-size, 2px) / 2)',
    );
  });

  it('does not let the visible segments take pointer events', () => {
    const { q } = setup();
    q('[data-dl-line-segment]').forEach((segment) =>
      expect(segment.style.pointerEvents).toBe('none'),
    );
  });

  it('can be focused by a press, but is not in the Tab order', () => {
    const { line } = setup();
    expect(line).toHaveAttribute('tabindex', '-1');
    expect(line.style.outline).toBe('none');
    // Hit areas have no tabindex of their own, so a press on one focuses the line.
    const hits = line.querySelectorAll('[data-dl-line-hit]');
    expect(hits).toHaveLength(2);
    hits.forEach((hit) => expect(hit).not.toHaveAttribute('tabindex'));
  });

  it('is selected from the start with autoFocus', () => {
    const { line, q } = setup({ autoFocus: true });
    expect(document.activeElement).toBe(line);
    expect(q('[data-dl-line-handle]')).toHaveLength(4);
  });

  it('keeps its handles while focus moves to something inside it', () => {
    const { line, q } = setup();
    act(() => line.focus());
    const handle = q('[data-dl-line-handle]')[0];
    handle.tabIndex = -1;
    act(() => handle.focus());
    expect(q('[data-dl-line-handle]')).toHaveLength(4);
  });

  it('drops its handles when focus leaves it', () => {
    const { line, q, queryByTestId } = setup({ selected: true });
    expect(q('[data-dl-line-handle]')).toHaveLength(4);
    act(() => line.blur());
    expect(q('[data-dl-line-handle]')).toHaveLength(0);
    expect(queryByTestId('overlay')).toBeNull();
  });

  it('renders handles and overlay only while selected', () => {
    const { q, queryByTestId, line } = setup();
    expect(q('[data-dl-line-handle]')).toHaveLength(0);
    expect(queryByTestId('overlay')).toBeNull();

    act(() => line.focus());
    // 2 segment midpoints + 2 ends
    expect(q('[data-dl-line-handle]')).toHaveLength(4);
    expect(q('[data-dl-line-handle="segment"]')).toHaveLength(2);
    expect(q('[data-dl-line-handle="start"]')).toHaveLength(1);
    expect(q('[data-dl-line-handle="end"]')).toHaveLength(1);
    expect(queryByTestId('overlay')).not.toBeNull();
  });

  it('centres handles on segment midpoints and ends', () => {
    const { q } = setup({ selected: true });
    const [horizontal, vertical] = q('[data-dl-line-handle="segment"]');
    expect(horizontal.style.transform).toBe(
      'translate(40px, 0px) translate(-50%, -50%)',
    );
    expect(vertical.style.transform).toBe(
      'translate(80px, 30px) translate(-50%, -50%)',
    );
    expect(q('[data-dl-line-handle="start"]')[0].style.transform).toBe(
      'translate(0px, 0px) translate(-50%, -50%)',
    );
    expect(q('[data-dl-line-handle="end"]')[0].style.transform).toBe(
      'translate(80px, 60px) translate(-50%, -50%)',
    );
  });

  it('anchors the overlay at the midpoint of the longest segment', () => {
    const { q } = setup({ selected: true });
    // The horizontal segment (80) is longer than the vertical one (60).
    expect(q('[data-dl-line-overlay]')[0].style.transform).toBe(
      'translate(40px, 0px)',
    );
  });

  it('drags an end, keeping the end segment orthogonal', () => {
    const { q } = setup({ selected: true });
    press(q('[data-dl-line-handle="end"]')[0], 0, 0);
    moveTo(10, 20);
    // Still an L. The vertical segment slid right with the end.
    expect(q('[data-dl-line-segment]')).toHaveLength(2);
    expect(q('[data-dl-line-segment]')[1].style.left).toBe(
      'calc(90px - var(--dl-line-size, 2px) / 2)',
    );
    release();
    expect(q('[data-dl-line-handle="end"]')[0].style.transform).toBe(
      'translate(90px, 80px) translate(-50%, -50%)',
    );
  });

  it('adds a segment when an end segment is dragged sideways', () => {
    const { q } = setup({ selected: true });
    // Drag the horizontal start segment down by 20.
    press(q('[data-dl-line-handle="segment"]')[0], 0, 0);
    moveTo(0, 20);
    release();
    expect(q('[data-dl-line-segment]')).toHaveLength(3);
  });

  it('keeps the edited route after the drag ends and across re-renders', () => {
    const { q, rerender, tree } = setup({ selected: true });
    press(q('[data-dl-line-handle="end"]')[0], 0, 0);
    moveTo(10, 20);
    release();

    rerender(tree());
    expect(q('[data-dl-line-handle="end"]')[0].style.transform).toBe(
      'translate(90px, 80px) translate(-50%, -50%)',
    );
  });

  it('only reads the initial points on mount', () => {
    const { q, rerender, tree } = setup({ selected: true });
    rerender(tree({ initialEnd: { x: 500, y: 500 } }));
    expect(q('[data-dl-line-handle="end"]')[0].style.transform).toBe(
      'translate(80px, 60px) translate(-50%, -50%)',
    );
  });

  it('divides drag movement by the zoom', () => {
    const { q } = setup({ selected: true }, 2);
    press(q('[data-dl-line-handle="end"]')[0], 0, 0);
    moveTo(20, 0);
    release();
    expect(q('[data-dl-line-handle="end"]')[0].style.transform).toBe(
      'translate(90px, 60px) translate(-50%, -50%)',
    );
  });

  it('leaves the line alone when a handle is pressed without moving', () => {
    const { q } = setup({ selected: true });
    press(q('[data-dl-line-handle="start"]')[0], 0, 0);
    release();
    expect(q('[data-dl-line-segment]')).toHaveLength(2);
    expect(q('[data-dl-line-handle="start"]')[0].style.transform).toBe(
      'translate(0px, 0px) translate(-50%, -50%)',
    );
  });

  it('can be dragged again after a drag', () => {
    const { q } = setup({ selected: true });
    press(q('[data-dl-line-handle="end"]')[0], 0, 0);
    moveTo(10, 0);
    release();
    press(q('[data-dl-line-handle="end"]')[0], 0, 0);
    moveTo(10, 0);
    release();
    expect(q('[data-dl-line-handle="end"]')[0].style.transform).toBe(
      'translate(100px, 60px) translate(-50%, -50%)',
    );
  });
});

describe('ElbowLine route in and out', () => {
  // A Z: right 40, down 50, right 40.
  const Z = [
    { x: 0, y: 0 },
    { x: 40, y: 0 },
    { x: 40, y: 50 },
    { x: 80, y: 50 },
  ];
  const fromRoute = (initialRoute: readonly Point[]) => ({
    initialRoute,
    initialStart: undefined,
    initialEnd: undefined,
  });
  const handleAt = (el: HTMLElement) => el.style.transform;

  describe('initialRoute', () => {
    it('restores a route with bends', () => {
      const { q } = setup({ ...fromRoute(Z), selected: true });
      expect(q('[data-dl-line-segment]')).toHaveLength(3);
      expect(handleAt(q('[data-dl-line-handle="start"]')[0])).toBe(
        'translate(0px, 0px) translate(-50%, -50%)',
      );
      expect(handleAt(q('[data-dl-line-handle="end"]')[0])).toBe(
        'translate(80px, 50px) translate(-50%, -50%)',
      );
    });

    it('falls back to an L between the ends when the route is not valid', () => {
      const { q } = setup({
        ...fromRoute([
          { x: 0, y: 0 },
          { x: 30, y: 40 },
        ]),
      });
      expect(q('[data-dl-line-segment]')).toHaveLength(2);
    });

    it('is only read when the line mounts', () => {
      const { q, rerender, tree } = setup({ ...fromRoute(Z), selected: true });
      rerender(
        tree({
          ...fromRoute([
            { x: 0, y: 0 },
            { x: 500, y: 0 },
          ]),
        }),
      );
      expect(q('[data-dl-line-segment]')).toHaveLength(3);
    });
  });

  describe('onRouteChange', () => {
    it('is not called on mount', () => {
      const onRouteChange = vi.fn();
      setup({ onRouteChange });
      setup({ ...fromRoute(Z), onRouteChange });
      expect(onRouteChange).not.toHaveBeenCalled();
    });

    it('is called with the whole route as a handle is dragged', () => {
      const onRouteChange = vi.fn();
      const { q } = setup({ onRouteChange, selected: true });
      press(q('[data-dl-line-handle="end"]')[0], 0, 0);
      moveTo(10, 0);
      expect(onRouteChange).toHaveBeenLastCalledWith([
        { x: 0, y: 0 },
        { x: 90, y: 0 },
        { x: 90, y: 60 },
      ]);
      moveTo(20, 0);
      expect(onRouteChange).toHaveBeenCalledTimes(2);
      release();
      expect(onRouteChange).toHaveBeenCalledTimes(2);
    });

    it('is not called when a handle is pressed without moving', () => {
      const onRouteChange = vi.fn();
      const { q } = setup({ onRouteChange, selected: true });
      press(q('[data-dl-line-handle="start"]')[0], 0, 0);
      release();
      expect(onRouteChange).not.toHaveBeenCalled();
    });

    it('can be fed straight back in as initialRoute', () => {
      const onRouteChange = vi.fn();
      const first = setup({ onRouteChange, selected: true });
      press(first.q('[data-dl-line-handle="segment"]')[0], 0, 0);
      moveTo(0, 25); // pull the first segment down: three segments
      release();
      const saved = onRouteChange.mock.lastCall![0] as Point[];
      first.unmount();

      const again = setup({ ...fromRoute(saved), selected: true });
      expect(again.q('[data-dl-line-segment]')).toHaveLength(saved.length - 1);
      expect(handleAt(again.q('[data-dl-line-handle="end"]')[0])).toBe(
        'translate(80px, 60px) translate(-50%, -50%)',
      );
    });
  });
});
