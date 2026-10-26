import { afterEach, describe, expect, it, vi } from 'vitest';

import { startDrag } from './index';

function pointer(
  type: string,
  init: { clientX?: number; clientY?: number; pointerId?: number } = {},
) {
  return new PointerEvent(type, {
    clientX: 0,
    clientY: 0,
    pointerId: 1,
    bubbles: true,
    ...init,
  });
}

const cancels: Array<() => void> = [];
function start(options: Partial<Parameters<typeof startDrag>[0]> = {}) {
  const onDrag = vi.fn();
  const onEnd = vi.fn();
  const cancel = startDrag({
    event: pointer('pointerdown', { clientX: 100, clientY: 100 }),
    getZoom: () => 1,
    threshold: 3,
    onDrag,
    onEnd,
    ...options,
  });
  cancels.push(cancel);
  return { onDrag, onEnd, cancel };
}

afterEach(() => {
  while (cancels.length) cancels.pop()?.();
});

describe('startDrag', () => {
  it('ignores movement within the threshold and reports a click on release', () => {
    const { onDrag, onEnd } = start();
    window.dispatchEvent(
      pointer('pointermove', { clientX: 102, clientY: 101 }),
    );
    window.dispatchEvent(pointer('pointerup', { clientX: 102, clientY: 101 }));
    expect(onDrag).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledWith(false);
  });

  it('reports total movement since pointer-down, including the part before the threshold', () => {
    const { onDrag, onEnd } = start();
    window.dispatchEvent(
      pointer('pointermove', { clientX: 102, clientY: 100 }),
    );
    window.dispatchEvent(pointer('pointermove', { clientX: 110, clientY: 95 }));
    expect(onDrag).toHaveBeenLastCalledWith(10, -5);

    window.dispatchEvent(pointer('pointerup', { clientX: 110, clientY: 95 }));
    expect(onEnd).toHaveBeenCalledWith(true);
  });

  it('divides movement by the current zoom', () => {
    let zoom = 2;
    const { onDrag } = start({ getZoom: () => zoom, threshold: 0 });
    window.dispatchEvent(
      pointer('pointermove', { clientX: 120, clientY: 100 }),
    );
    expect(onDrag).toHaveBeenLastCalledWith(10, 0);

    zoom = 0.5;
    window.dispatchEvent(
      pointer('pointermove', { clientX: 130, clientY: 100 }),
    );
    expect(onDrag).toHaveBeenLastCalledWith(30, 0);
  });

  it('counts any movement as a drag when the threshold is 0', () => {
    const { onDrag } = start({ threshold: 0 });
    window.dispatchEvent(
      pointer('pointermove', { clientX: 101, clientY: 100 }),
    );
    expect(onDrag).toHaveBeenCalledWith(1, 0);
  });

  it('ignores other pointers', () => {
    const { onDrag, onEnd } = start({ threshold: 0 });
    window.dispatchEvent(
      pointer('pointermove', { clientX: 200, clientY: 200, pointerId: 2 }),
    );
    window.dispatchEvent(pointer('pointerup', { pointerId: 2 }));
    expect(onDrag).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('stops listening after release', () => {
    const { onDrag } = start({ threshold: 0 });
    window.dispatchEvent(pointer('pointerup'));
    window.dispatchEvent(
      pointer('pointermove', { clientX: 150, clientY: 150 }),
    );
    expect(onDrag).not.toHaveBeenCalled();
  });

  it('ends the drag on pointercancel', () => {
    const { onEnd } = start({ threshold: 0 });
    window.dispatchEvent(
      pointer('pointermove', { clientX: 150, clientY: 150 }),
    );
    window.dispatchEvent(pointer('pointercancel'));
    expect(onEnd).toHaveBeenCalledWith(true);
  });

  it('cancel() abandons the drag without calling onEnd', () => {
    const { onDrag, onEnd, cancel } = start({ threshold: 0 });
    cancel();
    window.dispatchEvent(
      pointer('pointermove', { clientX: 150, clientY: 150 }),
    );
    window.dispatchEvent(pointer('pointerup'));
    expect(onDrag).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('swallows the click that follows a real drag, but not after a plain click', () => {
    const button = document.createElement('button');
    document.body.append(button);
    const onClick = vi.fn();
    button.addEventListener('click', onClick);

    start({ threshold: 0 });
    window.dispatchEvent(
      pointer('pointermove', { clientX: 150, clientY: 150 }),
    );
    window.dispatchEvent(pointer('pointerup'));
    button.click();
    expect(onClick).not.toHaveBeenCalled();

    start();
    window.dispatchEvent(pointer('pointerup'));
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);

    button.remove();
  });
});
