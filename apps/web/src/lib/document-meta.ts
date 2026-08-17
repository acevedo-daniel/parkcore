import { useEffect } from 'react';

export function useDocumentMeta({ description, title }: { description: string; title: string }) {
  useEffect(() => {
    document.title = title;
    const selector = 'meta[name="description"]';
    let descriptionElement = document.head.querySelector<HTMLMetaElement>(selector);
    if (!descriptionElement) {
      descriptionElement = document.createElement('meta');
      descriptionElement.name = 'description';
      document.head.append(descriptionElement);
    }
    descriptionElement.content = description;
  }, [description, title]);
}
