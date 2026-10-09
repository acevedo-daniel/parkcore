import { useEffect } from 'react';

export function useDocumentReadyMarker(): void {
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true';
  }, []);
}
