import React from 'react.ts';
interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  glowing?: boolean;
  children: React.ReactNode;
}
declare const CyberButton: React.FC<CyberButtonProps>;
export default CyberButton;
