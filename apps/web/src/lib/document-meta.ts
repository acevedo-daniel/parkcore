import { useEffect } from 'react';

export const PARKCORE_PUBLIC_URL = 'https://parkcore-app.vercel.app';

export function publicUrl(path: string) {
  return new URL(path, PARKCORE_PUBLIC_URL).toString();
}

export interface DocumentMeta {
  description: string;
  noIndex?: boolean;
  publicUrl?: string;
  title: string;
}

function setMetaAttribute(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

function removeMetaProperty(key: string) {
  document.head.querySelector(`meta[property="${key}"]`)?.remove();
}

export function useDocumentMeta({ description, noIndex = false, publicUrl: url, title }: DocumentMeta) {
  useEffect(() => {
    document.title = title;
    setMetaAttribute('name', 'description', description);

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (url) {
      setMetaAttribute('property', 'og:site_name', 'ParkCore');
      setMetaAttribute('property', 'og:title', title);
      setMetaAttribute('property', 'og:description', description);
      setMetaAttribute('property', 'og:type', 'website');
      setMetaAttribute('property', 'og:url', url);
      if (canonical) canonical.href = url;
      else {
        const canonicalElement = document.createElement('link');
        canonicalElement.rel = 'canonical';
        canonicalElement.href = url;
        document.head.append(canonicalElement);
      }
    } else {
      canonical?.remove();
      removeMetaProperty('og:site_name');
      removeMetaProperty('og:title');
      removeMetaProperty('og:description');
      removeMetaProperty('og:type');
      removeMetaProperty('og:url');
    }

    if (noIndex) setMetaAttribute('name', 'robots', 'noindex');
    else document.head.querySelector('meta[name="robots"]')?.remove();
  }, [description, noIndex, title, url]);
}
