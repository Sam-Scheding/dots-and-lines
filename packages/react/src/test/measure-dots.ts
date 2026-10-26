import { afterEach, beforeEach } from 'vitest';

/**
 * jsdom lays nothing out, so every element is 0x0. Call this inside a
 * `describe` to make each Dot's body measure `width` x `height`.
 */
export function measureDots(width: number, height: number): void {
  const proto = HTMLElement.prototype;
  const original = {
    width: Object.getOwnPropertyDescriptor(proto, 'offsetWidth'),
    height: Object.getOwnPropertyDescriptor(proto, 'offsetHeight'),
  };

  beforeEach(() => {
    const measure = (size: number) =>
      function (this: HTMLElement) {
        return this.hasAttribute('data-dl-dot-body') ? size : 0;
      };
    Object.defineProperty(proto, 'offsetWidth', {
      configurable: true,
      get: measure(width),
    });
    Object.defineProperty(proto, 'offsetHeight', {
      configurable: true,
      get: measure(height),
    });
  });

  afterEach(() => {
    for (const [name, descriptor] of [
      ['offsetWidth', original.width],
      ['offsetHeight', original.height],
    ] as const) {
      if (descriptor) Object.defineProperty(proto, name, descriptor);
      else delete (proto as unknown as Record<string, unknown>)[name];
    }
  });
}
