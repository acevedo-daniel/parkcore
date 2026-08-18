import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { publicUrl, useDocumentMeta, type DocumentMeta } from './document-meta.js';

function MetadataHarness(props: DocumentMeta) {
  useDocumentMeta(props);
  return null;
}

function metaContent(property: string) {
  return document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.content;
}

afterEach(() => {
  document.head
    .querySelectorAll('link[rel="canonical"], meta[name="description"], meta[name="robots"], meta[property^="og:"]')
    .forEach((element) => {
      element.remove();
    });
  document.title = '';
});

describe('document metadata', () => {
  it('sets canonical and Open Graph metadata for a public route', async () => {
    render(
      <MetadataHarness
        description="Browse active parking facilities."
        publicUrl={publicUrl('/parkings')}
        title="Parkings | ParkCore"
      />,
    );

    await waitFor(() => {
      expect(document.title).toBe('Parkings | ParkCore');
    });

    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Browse active parking facilities.',
    );
    expect(metaContent('og:site_name')).toBe('ParkCore');
    expect(metaContent('og:title')).toBe('Parkings | ParkCore');
    expect(metaContent('og:description')).toBe('Browse active parking facilities.');
    expect(metaContent('og:type')).toBe('website');
    expect(metaContent('og:url')).toBe('https://parkcore-app.vercel.app/parkings');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://parkcore-app.vercel.app/parkings',
    );
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
  });

  it('removes public metadata and prevents indexing for a private route', async () => {
    const { rerender } = render(
      <MetadataHarness
        description="Browse active parking facilities."
        publicUrl={publicUrl('/parkings')}
        title="Parkings | ParkCore"
      />,
    );

    rerender(
      <MetadataHarness
        description="Owner parking operations."
        noIndex
        title="ParkCore | Operations"
      />,
    );

    await waitFor(() => {
      expect(document.title).toBe('ParkCore | Operations');
    });

    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex',
    );
    expect(document.head.querySelector('meta[property^="og:"]')).toBeNull();
  });
});
