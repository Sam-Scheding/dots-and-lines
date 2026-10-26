import { createSceneState } from '@dots-and-lines/core';
import { act, fireEvent, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { Dot } from '../dot';
import { Scene } from './index';

function setup(
  props: Partial<Parameters<typeof Scene>[0]> = {},
  view?: {
    panX: number;
    panY: number;
    zoom: number;
  },
) {
  const state = createSceneState({ defaultView: view });
  const utils = render(
    <Scene state={state} {...props}>
      <span data-testid="child" />
    </Scene>,
  );
  const root = utils.container.querySelector<HTMLElement>('[data-dl-scene]')!;
  const world = utils.container.querySelector<HTMLElement>('[data-dl-world]')!;
  return { state, root, world, ...utils };
}

const press = (el: Element, clientX: number, clientY: number) =>
  fireEvent.pointerDown(el, { clientX, clientY, pointerId: 1, button: 0 });

describe('Scene', () => {
  it('renders children inside a world transformed by the view', () => {
    const { state, world, getByTestId } = setup(
      {},
      { panX: 10, panY: 20, zoom: 2 },
    );
    expect(world).toContainElement(getByTestId('child'));
    expect(world.style.transform).toBe('translate(10px, 20px) scale(2)');
    expect(world.style.getPropertyValue('--dl-zoom')).toBe('2');

    act(() => state.setView({ panX: 0, panY: 0, zoom: 0.5 }));
    expect(world.style.transform).toBe('translate(0px, 0px) scale(0.5)');
    expect(world.style.getPropertyValue('--dl-zoom')).toBe('0.5');
  });

  it('exposes the mode as a data attribute', () => {
    const { state, root } = setup();
    expect(root).toHaveAttribute('data-dl-mode', 'select');
    act(() => state.setMode('connect'));
    expect(root).toHaveAttribute('data-dl-mode', 'connect');
  });

  it('renders on the server without touching window', () => {
    const state = createSceneState();
    const html = renderToString(
      <Scene state={state}>
        <Dot x={1} y={2}>
          <b>hi</b>
        </Dot>
      </Scene>,
    );
    expect(html).toContain('data-dl-scene');
    expect(html).toContain('translate(1px, 2px)');
  });

  it('throws a helpful error when a Dot is rendered outside a Scene', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Dot x={0} y={0}>
          x
        </Dot>,
      ),
    ).toThrow('<Dot> must be rendered inside a <Scene>.');
    spy.mockRestore();
  });

  describe('pan and zoom', () => {
    it('pans on a plain wheel and prevents the default scroll', () => {
      const { state, root } = setup();
      const notCancelled = fireEvent.wheel(root, { deltaX: 4, deltaY: 10 });
      expect(state.getView()).toEqual({ panX: -4, panY: -10, zoom: 1 });
      expect(notCancelled).toBe(false);
    });

    it('zooms on ctrl+wheel', () => {
      const { state, root } = setup();
      fireEvent.wheel(root, { deltaY: -100, ctrlKey: true });
      // e^1 would be 2.72; clamped to the default max of 2
      expect(state.getView().zoom).toBe(2);
    });

    it('zooms around the cursor', () => {
      const { state, root } = setup();
      fireEvent.wheel(root, {
        deltaY: -Math.log(1.5) * 100,
        ctrlKey: true,
        clientX: 100,
        clientY: 50,
      });
      const { panX, panY, zoom } = state.getView();
      expect(zoom).toBeCloseTo(1.5);
      expect(panX).toBeCloseTo(100 * (1 - 1.5));
      expect(panY).toBeCloseTo(50 * (1 - 1.5));
    });

    it('does nothing when panZoom is false', () => {
      const { state, root } = setup({ panZoom: false });
      const notCancelled = fireEvent.wheel(root, { deltaY: 10 });
      expect(state.getView()).toEqual({ panX: 0, panY: 0, zoom: 1 });
      expect(notCancelled).toBe(true);
    });

    it('pans when dragging with space held', () => {
      const { state, root } = setup();
      fireEvent.keyDown(window, { code: 'Space' });
      press(root, 50, 50);
      fireEvent.pointerMove(root, {
        clientX: 70,
        clientY: 45,
        pointerId: 1,
        buttons: 1,
      });
      expect(state.getView()).toEqual({ panX: 20, panY: -5, zoom: 1 });

      fireEvent.pointerUp(root, { pointerId: 1 });
      fireEvent.pointerMove(root, {
        clientX: 200,
        clientY: 200,
        pointerId: 1,
        buttons: 1,
      });
      expect(state.getView().panX).toBe(20);
      fireEvent.keyUp(window, { code: 'Space' });
    });

    it('does not pan on a pointer drag without space', () => {
      const { state, root } = setup();
      press(root, 50, 50);
      fireEvent.pointerMove(root, {
        clientX: 70,
        clientY: 45,
        pointerId: 1,
        buttons: 1,
      });
      expect(state.getView()).toEqual({ panX: 0, panY: 0, zoom: 1 });
    });

    it('ignores space typed into an input', () => {
      const { state, root } = setup();
      const input = document.createElement('input');
      document.body.append(input);
      fireEvent.keyDown(input, { code: 'Space' });
      press(root, 50, 50);
      fireEvent.pointerMove(root, {
        clientX: 70,
        clientY: 45,
        pointerId: 1,
        buttons: 1,
      });
      expect(state.getView().panX).toBe(0);
      input.remove();
    });
  });

  describe('focus', () => {
    it('can be focused, so a press on the background takes focus off a selected Dot', () => {
      const { root } = setup();
      expect(root).toHaveAttribute('tabindex', '-1');
      expect(root.style.outline).toBe('none');
    });
  });

  describe('connect mode', () => {
    it('creates a line from two clicks, then returns to select mode', () => {
      const onConnect = vi.fn();
      const { state, root } = setup({ onConnect });
      act(() => state.setMode('connect'));

      press(root, 10, 20);
      expect(onConnect).not.toHaveBeenCalled();
      press(root, 50, 60);

      expect(onConnect).toHaveBeenCalledTimes(1);
      expect(onConnect).toHaveBeenCalledWith({
        start: { x: 10, y: 20 },
        end: { x: 50, y: 60 },
      });
      expect(state.getMode()).toBe('select');
    });

    it('reports world coordinates, accounting for pan and zoom', () => {
      const onConnect = vi.fn();
      const { state, root } = setup(
        { onConnect },
        { panX: 10, panY: 0, zoom: 2 },
      );
      act(() => state.setMode('connect'));

      press(root, 30, 20); // world (10, 10)
      press(root, 30, 100); // world (10, 50)
      expect(onConnect).toHaveBeenCalledWith({
        start: { x: 10, y: 10 },
        end: { x: 10, y: 50 },
      });
    });

    it('ignores a second click on the same point', () => {
      const onConnect = vi.fn();
      const { state, root } = setup({ onConnect });
      act(() => state.setMode('connect'));
      press(root, 10, 10);
      press(root, 10, 10);
      expect(onConnect).not.toHaveBeenCalled();
      expect(state.getMode()).toBe('connect');
    });

    it('forgets a half-finished line when the mode changes', () => {
      const onConnect = vi.fn();
      const { state, root } = setup({ onConnect });
      act(() => state.setMode('connect'));
      press(root, 10, 10);
      act(() => state.setMode('select'));
      act(() => state.setMode('connect'));
      press(root, 40, 40); // this is a *first* click now
      expect(onConnect).not.toHaveBeenCalled();
    });

    it('stops Dots underneath from starting a drag', () => {
      const onMove = vi.fn();
      const state = createSceneState();
      const { getByTestId } = render(
        <Scene state={state}>
          <Dot x={0} y={0} onMove={onMove}>
            <span data-testid="dot-content">dot</span>
          </Dot>
        </Scene>,
      );
      act(() => state.setMode('connect'));

      press(getByTestId('dot-content'), 5, 5);
      fireEvent.pointerMove(window, { clientX: 50, clientY: 50, pointerId: 1 });
      fireEvent.pointerUp(window, { pointerId: 1 });
      expect(onMove).not.toHaveBeenCalled();
    });
  });
});
