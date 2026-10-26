import { describe, expect, it, vi } from 'vitest';

import { createDotRegistry } from './index';

const entry = (x: number, isMagnetic = true) => ({
  rect: { x, y: 0, width: 10, height: 10 },
  isMagnetic,
});

describe('createDotRegistry', () => {
  it('stores entries by key and replaces the snapshot on change', () => {
    const registry = createDotRegistry();
    const empty = registry.getSnapshot();
    registry.set('a', entry(1));
    const one = registry.getSnapshot();
    expect(one).not.toBe(empty);
    expect(one.get('a')).toEqual(entry(1));
    expect(empty.size).toBe(0);
  });

  it('keeps the snapshot and stays quiet when nothing changed', () => {
    const registry = createDotRegistry();
    const listener = vi.fn();
    registry.set('a', entry(1));
    registry.subscribe(listener);
    const before = registry.getSnapshot();
    registry.set('a', entry(1));
    registry.remove('missing');
    expect(registry.getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies on set and remove, and stops after unsubscribe', () => {
    const registry = createDotRegistry();
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);
    registry.set('a', entry(1));
    registry.set('a', entry(2));
    registry.set('a', entry(2, false));
    registry.remove('a');
    expect(listener).toHaveBeenCalledTimes(4);
    expect(registry.getSnapshot().size).toBe(0);
    unsubscribe();
    registry.set('b', entry(1));
    expect(listener).toHaveBeenCalledTimes(4);
  });
});
