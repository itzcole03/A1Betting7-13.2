import React from 'react.ts';
interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}
export declare const GlowButton: React.FC<GlowButtonProps>;
export default GlowButton;
