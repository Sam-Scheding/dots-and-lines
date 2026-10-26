import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useScene, useSceneState } from './index';

describe('hooks', () => {
  it('useSceneState returns the same stable handle on every render', () => {
    const seen: unknown[] = [];
    function Probe() {
      seen.push(useSceneState({ defaultView: { panX: 5, panY: 0, zoom: 1 } }));
      return null;
    }
    const { rerender } = render(<Probe />);
    rerender(<Probe />);
    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(seen[1]);
  });

  it('useSceneState does not re-render its component on pan, zoom or mode', () => {
    let renders = 0;
    let handle: ReturnType<typeof useSceneState> | undefined;
    function Probe() {
      renders += 1;
      handle = useSceneState();
      return null;
    }
    render(<Probe />);
    act(() => {
      handle?.panBy(10, 10);
      handle?.zoomBy(1.5);
      handle?.setMode('connect');
    });
    expect(renders).toBe(1);
  });

  it('useScene re-renders only when the selected value changes', () => {
    let handle: ReturnType<typeof useSceneState> | undefined;
    const counts = { zoom: 0, mode: 0 };
    function Owner() {
      handle = useSceneState();
      return (
        <>
          <ZoomProbe state={handle} />
          <ModeProbe state={handle} />
        </>
      );
    }
    function ZoomProbe({ state }: { state: NonNullable<typeof handle> }) {
      counts.zoom += 1;
      return (
        <span data-testid="zoom">
          {useScene(state, (s) => s.getView().zoom)}
        </span>
      );
    }
    function ModeProbe({ state }: { state: NonNullable<typeof handle> }) {
      counts.mode += 1;
      return (
        <span data-testid="mode">{useScene(state, (s) => s.getMode())}</span>
      );
    }

    const { getByTestId } = render(<Owner />);
    expect(counts).toEqual({ zoom: 1, mode: 1 });

    // Panning changes the view object but not the zoom number.
    act(() => handle?.panBy(5, 0));
    expect(counts).toEqual({ zoom: 1, mode: 1 });

    act(() => handle?.setMode('connect'));
    expect(counts).toEqual({ zoom: 1, mode: 2 });
    expect(getByTestId('mode')).toHaveTextContent('connect');

    act(() => handle?.zoomBy(2));
    expect(counts).toEqual({ zoom: 2, mode: 2 });
    expect(getByTestId('zoom')).toHaveTextContent('2');
  });
});
