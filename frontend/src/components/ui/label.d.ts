import * as React from 'react.ts';
import * as LabelPrimitive from '@radix-ui/react-label.ts';
declare const Label: React.ForwardRefExoticComponent<
  Omit<LabelPrimitive.LabelProps & React.RefAttributes<HTMLLabelElement>, 'ref'> &
    React.RefAttributes<HTMLLabelElement>
>;
export { Label };
