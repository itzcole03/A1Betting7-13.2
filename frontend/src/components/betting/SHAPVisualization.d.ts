import React from 'react.ts';
interface SHAPVisualizationProps {
  shapValues: Record<string, number>;
  baseValue?: number;
  confidence?: number;
  isLoading?: boolean;
  error?: string | null;
}
declare const _default: React.NamedExoticComponent<SHAPVisualizationProps>;
export default _default;
