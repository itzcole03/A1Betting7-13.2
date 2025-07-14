import React from 'react.ts';
interface HolographicTextProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}
declare const HolographicText: React.FC<HolographicTextProps>;
export default HolographicText;
