import * as React from 'react.ts';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
export declare const Input: React.ForwardRefExoticComponent<
  InputProps & React.RefAttributes<HTMLInputElement>
>;
