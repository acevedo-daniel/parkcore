import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDocumentReadyMarker } from './document-ready.js';

describe('useDocumentReadyMarker', () => {
  it('marks the document as hydrated after mount', () => {
    expect(document.documentElement.getAttribute('data-hydrated')).toBeNull();

    renderHook(() => {
      useDocumentReadyMarker();
    });

    expect(document.documentElement.getAttribute('data-hydrated')).toBe('true');
  });
});
