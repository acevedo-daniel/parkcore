import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

configure({ asyncUtilTimeout: 1_000 });

for (const method of ['hasPointerCapture', 'setPointerCapture', 'releasePointerCapture'] as const) {
  if (!(method in Element.prototype)) {
    Object.defineProperty(Element.prototype, method, {
      configurable: true,
      value: method === 'hasPointerCapture' ? () => false : () => undefined,
    });
  }
}

if (!('scrollIntoView' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => undefined,
  });
}

if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub implements ResizeObserver {
    private readonly callback: ResizeObserverCallback;

    private readonly observed = new Set<Element>();

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    disconnect() {
      this.observed.clear();
    }

    observe(target: Element) {
      this.observed.add(target);
      const rect = target.getBoundingClientRect();
      const boxSize = { inlineSize: rect.width, blockSize: rect.height };
      const entry = {
        borderBoxSize: [boxSize],
        contentBoxSize: [boxSize],
        contentRect: rect,
        devicePixelContentBoxSize: [],
        target,
      } as unknown as ResizeObserverEntry;
      this.callback([entry], this);
    }

    unobserve(target: Element) {
      this.observed.delete(target);
    }
  }

  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserverStub,
  });
}

function resetDocumentAppearance() {
  window.localStorage.clear();
  document.documentElement.lang = 'en-US';
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-hydrated');
  document.documentElement.style.removeProperty('color-scheme');
}

beforeEach(resetDocumentAppearance);

afterEach(() => {
  cleanup();
  resetDocumentAppearance();
});
