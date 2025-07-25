﻿import * as React from 'react.ts';
import * as SelectPrimitive from '@radix-ui/react-select.ts';
declare const _Select: React.FC<SelectPrimitive.SelectProps>;
declare const _SelectGroup: React.ForwardRefExoticComponent<
  SelectPrimitive.SelectGroupProps & React.RefAttributes<HTMLDivElement>
>;
declare const _SelectValue: React.ForwardRefExoticComponent<
  SelectPrimitive.SelectValueProps & React.RefAttributes<HTMLSpanElement>
>;
declare const _SelectTrigger: React.ForwardRefExoticComponent<
  Omit<SelectPrimitive.SelectTriggerProps & React.RefAttributes<HTMLButtonElement>, 'ref'> &
    React.RefAttributes<HTMLButtonElement>
>;
declare const _SelectContent: React.ForwardRefExoticComponent<
  Omit<SelectPrimitive.SelectContentProps & React.RefAttributes<HTMLDivElement>, 'ref'> &
    React.RefAttributes<HTMLDivElement>
>;
declare const _SelectLabel: React.ForwardRefExoticComponent<
  Omit<SelectPrimitive.SelectLabelProps & React.RefAttributes<HTMLDivElement>, 'ref'> &
    React.RefAttributes<HTMLDivElement>
>;
declare const _SelectItem: React.ForwardRefExoticComponent<
  Omit<SelectPrimitive.SelectItemProps & React.RefAttributes<HTMLDivElement>, 'ref'> &
    React.RefAttributes<HTMLDivElement>
>;
declare const _SelectSeparator: React.ForwardRefExoticComponent<
  Omit<SelectPrimitive.SelectSeparatorProps & React.RefAttributes<HTMLDivElement>, 'ref'> &
    React.RefAttributes<HTMLDivElement>
>;
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  //   SelectSeparator
};
