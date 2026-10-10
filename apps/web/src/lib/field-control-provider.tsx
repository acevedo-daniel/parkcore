import type { ReactNode } from 'react';

import { FieldControlContext, type FieldControlContextValue } from './field-control-context.js';

export function FieldControlProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: FieldControlContextValue;
}) {
  return <FieldControlContext.Provider value={value}>{children}</FieldControlContext.Provider>;
}
