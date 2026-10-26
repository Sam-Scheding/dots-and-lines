import { createSceneState } from '@dots-and-lines/core';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSceneContext } from '../scene-context';
import { Scene } from '../scene';
import { measureDots } from '../test/measure-dots';
import { Dot } from './index';

function setup(props: Partial<Parameters<typeof Dot>[0]> = {}, zoom = 1) {
  const state = createSceneState({ defaultView: { panX: 0, panY: 0, zoom } });
  const onMove = vi.fn();
  const onMoveEnd = vi.fn();
  const utils = render(
    <Scene state={state}>
      <Dot
        x={100}
        y={200}
        onMove={onMove}
        onMoveEnd={onMoveEnd}
        overlay={<button data-testid="overlay">toolbar</button>}
        {...props}
      >
        <div data-testid="content">dot</div>
      </Dot>
    </Scene>,
  );
  const dot = utils.container.querySelector<HTMLElement>('[data-dl-dot]')!;
  return { state, onMove, onMoveEnd, dot, ...utils };
}

const press = (el: Element, clientX = 0, clientY = 0) =>
  fireEvent.pointerDown(el, { clientX, clientY, pointerId: 1, button: 0 });
const moveTo = (clientX: number, clientY: number) =>
  fireEvent.pointerMove(window, { clientX, clientY, pointerId: 1 });
const release = () => fireEvent.pointerUp(window, { pointerId: 1 });

describe('Dot', () => {
  it('positions itself with a translate and sizes to its children', () => {
    const { dot, getByTestId } = setup();
    expect(dot.style.transform).toBe('translate(100px, 200px)');
    expect(dot.style.width).toBe('max-content');
    expect(dot.style.left).toBe('0px');
    expect(dot.style.top).toBe('0px');
    expect(dot).toContainElement(getByTestId('content'));
  });

  describe('selection', () => {
    it('can be focused by a press, but is not in the Tab order', () => {
      const { dot } = setup();
      expect(dot).toHaveAttribute('tabindex', '-1');
      expect(dot.style.outline).toBe('none');
    });

    it('draws a ring while selected, coloured by --dl-select-color', () => {
      const { dot } = setup();
      expect(dot.style.outline).toBe('none');

      act(() => dot.focus());
      expect(dot.style.outline).toContain('var(--dl-select-color, #3b82f6)');

      act(() => dot.blur());
      expect(dot.style.outline).toBe('none');
    });

    it('with selectable={false} is not focusable and draws no ring', () => {
      const { dot } = setup({ selectable: false });
      expect(dot).not.toHaveAttribute('tabindex');
      act(() => dot.focus());
      expect(document.activeElement).not.toBe(dot);
      expect(dot.style.outline).toBe('none');
    });

    it('with selectable={false} still follows focus inside it, but draws no ring', () => {
      const state = createSceneState();
      const { container, getByTestId, queryByTestId } = render(
        <Scene state={state}>
          <Dot
            x={0}
            y={0}
            selectable={false}
            overlay={<i data-testid="overlay" />}
          >
            <div data-testid="card" tabIndex={0}>
              card
            </div>
          </Dot>
        </Scene>,
      );
      const dot = container.querySelector<HTMLElement>('[data-dl-dot]')!;
      act(() => getByTestId('card').focus());
      expect(queryByTestId('overlay')).not.toBeNull();
      expect(dot.style.outline).toBe('none');
    });

    it('renders its overlay only while focus is inside it', () => {
      const { dot, queryByTestId } = setup();
      expect(queryByTestId('overlay')).toBeNull();

      act(() => dot.focus());
      expect(dot).toContainElement(queryByTestId('overlay'));

      act(() => dot.blur());
      expect(queryByTestId('overlay')).toBeNull();
    });

    it('keeps its overlay while focus moves to something inside it', () => {
      const { dot, getByTestId, queryByTestId } = setup();
      act(() => dot.focus());
      act(() => getByTestId('overlay').focus());
      expect(queryByTestId('overlay')).not.toBeNull();

      act(() => getByTestId('overlay').blur());
      expect(queryByTestId('overlay')).toBeNull();
    });

    it('drops its overlay when focus moves to another Dot', () => {
      const state = createSceneState();
      const { container, queryAllByTestId } = render(
        <Scene state={state}>
          <Dot x={0} y={0} overlay={<i data-testid="overlay" />}>
            a
          </Dot>
          <Dot x={50} y={0} overlay={<i data-testid="overlay" />}>
            b
          </Dot>
        </Scene>,
      );
      const [first, second] =
        container.querySelectorAll<HTMLElement>('[data-dl-dot]');
      act(() => first.focus());
      expect(queryAllByTestId('overlay')).toHaveLength(1);
      expect(first).toContainElement(queryAllByTestId('overlay')[0]);

      act(() => second.focus());
      expect(queryAllByTestId('overlay')).toHaveLength(1);
      expect(second).toContainElement(queryAllByTestId('overlay')[0]);
    });

    it('is selected from the start with autoFocus', () => {
      const { dot, queryByTestId } = setup({ autoFocus: true });
      expect(document.activeElement).toBe(dot);
      expect(queryByTestId('overlay')).not.toBeNull();
    });

    it('does not take focus by default', () => {
      const { dot } = setup();
      expect(document.activeElement).not.toBe(dot);
    });

    it('does not stop a focusable child taking focus itself', () => {
      const state = createSceneState();
      const { getByTestId } = render(
        <Scene state={state}>
          <Dot x={0} y={0}>
            <button data-testid="inner">inner</button>
          </Dot>
        </Scene>,
      );
      const inner = getByTestId('inner');
      act(() => inner.focus());
      expect(document.activeElement).toBe(inner);
    });
  });

  it('reports absolute positions while dragging, then onMoveEnd on release', () => {
    const { onMove, onMoveEnd, getByTestId } = setup();
    press(getByTestId('content'), 10, 10);
    moveTo(30, 5);
    expect(onMove).toHaveBeenLastCalledWith(120, 195);
    moveTo(40, 10);
    expect(onMove).toHaveBeenLastCalledWith(130, 200);
    expect(onMoveEnd).not.toHaveBeenCalled();

    release();
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it('divides pointer movement by the zoom', () => {
    const { onMove, getByTestId } = setup({}, 2);
    press(getByTestId('content'), 0, 0);
    moveTo(40, 20);
    expect(onMove).toHaveBeenLastCalledWith(120, 210);
  });

  it('does not treat a click as a drag', () => {
    const { onMove, onMoveEnd, getByTestId } = setup();
    press(getByTestId('content'), 10, 10);
    moveTo(11, 11);
    release();
    expect(onMove).not.toHaveBeenCalled();
    expect(onMoveEnd).not.toHaveBeenCalled();
  });

  it('does not start a drag from the overlay', () => {
    const { onMove, dot, getByTestId } = setup();
    act(() => dot.focus());
    press(getByTestId('overlay'), 0, 0);
    moveTo(50, 50);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('ignores non-primary buttons', () => {
    const { onMove, getByTestId } = setup();
    fireEvent.pointerDown(getByTestId('content'), {
      clientX: 0,
      clientY: 0,
      pointerId: 1,
      button: 2,
    });
    moveTo(50, 50);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('uses the latest props when the parent re-renders mid-drag', () => {
    const state = createSceneState();
    const onMove = vi.fn();
    const tree = (x: number) => (
      <Scene state={state}>
        <Dot x={x} y={0} onMove={onMove}>
          <div data-testid="content" />
        </Dot>
      </Scene>
    );
    const { getByTestId, rerender } = render(tree(0));
    press(getByTestId('content'), 0, 0);
    moveTo(10, 0);
    expect(onMove).toHaveBeenLastCalledWith(10, 0);
    rerender(tree(10));
    moveTo(20, 0);
    // Movement is measured from pointer-down, so the drag stays under the cursor.
    expect(onMove).toHaveBeenLastCalledWith(20, 0);
    release();
  });

  it('stops listening if unmounted mid-drag', () => {
    const { onMove, onMoveEnd, getByTestId, unmount } = setup();
    press(getByTestId('content'), 0, 0);
    unmount();
    moveTo(50, 50);
    release();
    expect(onMove).not.toHaveBeenCalled();
    expect(onMoveEnd).not.toHaveBeenCalled();
  });

  describe('reporting to the Scene', () => {
    measureDots(80, 40);

    function Probe({
      onSnapshot,
    }: {
      onSnapshot: (s: ReadonlyMap<string, unknown>) => void;
    }) {
      const { registry } = useSceneContext('Probe');
      onSnapshot(registry.getSnapshot());
      return null;
    }

    function registered(props: Partial<Parameters<typeof Dot>[0]> = {}) {
      const state = createSceneState();
      const seen: { current: ReadonlyMap<string, unknown> } = {
        current: new Map(),
      };
      let registry!: ReturnType<typeof useSceneContext>['registry'];
      function Grab() {
        registry = useSceneContext('Grab').registry;
        return null;
      }
      const tree = (
        dot: boolean,
        extra: Partial<Parameters<typeof Dot>[0]> = {},
      ) => (
        <Scene state={state}>
          <Grab />
          <Probe onSnapshot={(s) => (seen.current = s)} />
          {dot ? (
            <Dot x={10} y={20} {...props} {...extra}>
              <div />
            </Dot>
          ) : null}
        </Scene>
      );
      const utils = render(tree(true));
      return {
        ...utils,
        tree,
        entries: () => [...registry.getSnapshot().values()],
      };
    }

    it('registers its box and magnetism on mount', () => {
      const { entries } = registered();
      expect(entries()).toEqual([
        { rect: { x: 10, y: 20, width: 80, height: 40 }, isMagnetic: true },
      ]);
    });

    it('is magnetic by default and reports isMagnetic={false}', () => {
      expect(registered({ isMagnetic: false }).entries()[0]).toMatchObject({
        isMagnetic: false,
      });
    });

    it('updates when it moves or isMagnetic changes', () => {
      const { entries, rerender, tree } = registered();
      rerender(tree(true, { x: 50, y: 60, isMagnetic: false }));
      expect(entries()).toEqual([
        { rect: { x: 50, y: 60, width: 80, height: 40 }, isMagnetic: false },
      ]);
    });

    it('unregisters on unmount', () => {
      const { entries, rerender, tree } = registered();
      rerender(tree(false));
      expect(entries()).toEqual([]);
    });

    it('measures its body, not its overlay, and ignores the Scene zoom', () => {
      const state = createSceneState({
        defaultView: { panX: 0, panY: 0, zoom: 3 },
      });
      let registry!: ReturnType<typeof useSceneContext>['registry'];
      function Grab() {
        registry = useSceneContext('Grab').registry;
        return null;
      }
      const { container } = render(
        <Scene state={state}>
          <Grab />
          <Dot x={0} y={0} overlay={<div>big toolbar</div>}>
            <div />
          </Dot>
        </Scene>,
      );
      const dot = container.querySelector('[data-dl-dot]')!;
      act(() => (dot as HTMLElement).focus());
      expect([...registry.getSnapshot().values()][0].rect).toMatchObject({
        width: 80,
        height: 40,
      });
    });

    describe('when its size changes', () => {
      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('re-registers with the new size', () => {
        let notify = () => {};
        let observed: Element | null = null;
        vi.stubGlobal(
          'ResizeObserver',
          class {
            constructor(callback: () => void) {
              notify = callback;
            }
            observe(el: Element) {
              observed = el;
            }
            unobserve() {}
            disconnect() {}
          },
        );
        const { entries, container } = registered();
        expect(observed).toBe(container.querySelector('[data-dl-dot-body]'));

        Object.defineProperty(observed!, 'offsetWidth', {
          configurable: true,
          value: 120,
        });
        act(() => notify());
        expect(entries()[0]).toMatchObject({
          rect: { x: 10, y: 20, width: 120, height: 40 },
        });
      });
    });
  });
});
