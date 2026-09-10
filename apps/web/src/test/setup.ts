import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

function resetDocumentAppearance() {
  window.localStorage.clear();
  document.documentElement.lang = 'en-US';
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('color-scheme');
}

beforeEach(resetDocumentAppearance);

afterEach(() => {
  cleanup();
  resetDocumentAppearance();
});
