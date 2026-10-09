import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

configure({ asyncUtilTimeout: 1_000 });

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
