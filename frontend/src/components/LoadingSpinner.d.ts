export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  label?: string;
}

declare function LoadingSpinner({
  className,
}: LoadingSpinnerProps): import('react/jsx-runtime').JSX.Element;
export default LoadingSpinner;
