import React from 'react.ts';
import { Bet } from '@/types/betting.ts';
interface BetSlipProps {
  onPlaceBet: (bet: Omit<Bet, 'id' | 'status' | 'timestamp'>) => void;
}
declare const _default: React.NamedExoticComponent<BetSlipProps>;
export default _default;
