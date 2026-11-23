import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge<'type-role'>({
  extend: {
    classGroups: {
      'type-role': [
        {
          type: ['display', 'page-title', 'heading', 'section-title', 'label', 'eyebrow', 'metric'],
        },
      ],
    },
    conflictingClassGroups: {
      'type-role': ['font-size', 'leading', 'tracking', 'font-weight', 'font-family'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
