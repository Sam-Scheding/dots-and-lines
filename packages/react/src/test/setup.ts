import '@testing-library/jest-dom/vitest';

// jsdom has no PointerEvent. This is just enough of one for the tests; real
// browsers provide the genuine article.
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? 'mouse';
      // The real default is false; true keeps test helpers short.
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  globalThis.PointerEvent =
    PointerEventPolyfill as unknown as typeof PointerEvent;
}

// jsdom has no ResizeObserver, and never lays anything out, so a stub that
// never fires is all the tests need. Dots fall back to their initial measure.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
