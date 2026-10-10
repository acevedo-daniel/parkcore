import { createContext, useContext, type AriaAttributes } from 'react';

export interface FieldControlContextValue {
  describedBy?: string;
  id: string;
  invalid: boolean;
}

export const FieldControlContext = createContext<FieldControlContextValue | null>(null);

interface FieldControlAttributes {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
}

export function useFieldControlProps(props: FieldControlAttributes): FieldControlAttributes {
  const field = useContext(FieldControlContext);
  const describedBy = [props['aria-describedby'], field?.describedBy].filter(Boolean).join(' ');

  return {
    id: props.id ?? field?.id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': props['aria-invalid'] ?? (field?.invalid ? true : undefined),
  };
}
