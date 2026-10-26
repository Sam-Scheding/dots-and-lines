import type { Rect } from '@dots-and-lines/core';

export type DotEntry = {
  /** The Dot's box in world space. */
  rect: Rect;
  isMagnetic: boolean;
};

export type DotRegistry = {
  /** Add a Dot or update its box. A no-op when nothing changed. */
  set: (key: string, entry: DotEntry) => void;
  remove: (key: string) => void;
  subscribe: (listener: () => void) => () => void;
  /** Replaced (never mutated) on every change, so it suits `useSyncExternalStore`. */
  getSnapshot: () => ReadonlyMap<string, DotEntry>;
};

function sameEntry(a: DotEntry, b: DotEntry): boolean {
  return (
    a.isMagnetic === b.isMagnetic &&
    a.rect.x === b.rect.x &&
    a.rect.y === b.rect.y &&
    a.rect.width === b.rect.width &&
    a.rect.height === b.rect.height
  );
}

/**
 * Where every Dot in a Scene currently is. Dots report their own box; lines
 * read it to snap to and follow them.
 */
export function createDotRegistry(): DotRegistry {
  let snapshot: ReadonlyMap<string, DotEntry> = new Map();
  const listeners = new Set<() => void>();

  const publish = (next: Map<string, DotEntry>) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  return {
    set(key, entry) {
      const current = snapshot.get(key);
      if (current && sameEntry(current, entry)) return;
      const next = new Map(snapshot);
      next.set(key, entry);
      publish(next);
    },
    remove(key) {
      if (!snapshot.has(key)) return;
      const next = new Map(snapshot);
      next.delete(key);
      publish(next);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
  };
}
