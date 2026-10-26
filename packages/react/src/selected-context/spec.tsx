import { createSceneState } from '@dots-and-lines/core';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Dot } from '../dot';
import { ElbowLine } from '../elbow-line';
import { Scene } from '../scene';
import { useSelected } from './index';

describe('useSelected', () => {
  function Probe() {
    return <span data-testid="probe">{String(useSelected())}</span>;
  }

  it('is true for content of a Dot only while focus is inside the Dot', () => {
    const state = createSceneState();
    const { container, getByTestId } = render(
      <Scene state={state}>
        <Dot x={0} y={0}>
          <Probe />
        </Dot>
      </Scene>,
    );
    const dot = container.querySelector<HTMLElement>('[data-dl-dot]')!;
    expect(getByTestId('probe')).toHaveTextContent('false');

    act(() => dot.focus());
    expect(getByTestId('probe')).toHaveTextContent('true');

    act(() => dot.blur());
    expect(getByTestId('probe')).toHaveTextContent('false');
  });

  it('is true for handles of an ElbowLine only while focus is inside the line', () => {
    const state = createSceneState();
    const { container, queryAllByTestId } = render(
      <Scene state={state}>
        <ElbowLine
          initialStart={{ x: 0, y: 0 }}
          initialEnd={{ x: 50, y: 50 }}
          handle={<Probe />}
        />
      </Scene>,
    );
    const line = container.querySelector<HTMLElement>('[data-dl-line]')!;
    expect(queryAllByTestId('probe')).toHaveLength(0);

    act(() => line.focus());
    const probes = queryAllByTestId('probe');
    expect(probes.length).toBeGreaterThan(0);
    probes.forEach((probe) => expect(probe).toHaveTextContent('true'));
  });

  it('throws a helpful error outside a Dot or ElbowLine', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'useSelected() must be called inside a <Dot> or an <ElbowLine>.',
    );
    spy.mockRestore();
  });
});
