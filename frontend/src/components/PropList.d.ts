import React from 'react.ts';
import { ProcessedPrizePicksProp, PropOption } from '@/types/prizePicks.ts';
interface PropListProps {
  onPropSelect?: (prop: ProcessedPrizePicksProp, option: PropOption) => void;
}
export declare const PropList: React.FC<PropListProps>;
declare const _default: React.NamedExoticComponent<PropListProps>;
export default _default;
