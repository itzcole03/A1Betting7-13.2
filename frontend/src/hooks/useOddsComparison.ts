import { useState } from 'react';

interface UseOddsComparisonProps {
  onOddsCompare?: (sport: string, player: string, market: string) => void;
}

export interface OddsComparisonState {
  isDrawerOpen: boolean;
  currentComparison: {
    sport: string;
    player: string;
    market: string;
  } | null;
}

export const useOddsComparison = (props?: UseOddsComparisonProps) => {
  const [state, setState] = useState<OddsComparisonState>({
    isDrawerOpen: false,
    currentComparison: null
  });

  const openOddsComparison = (sport: string, player: string, market: string) => {
    setState({
      isDrawerOpen: true,
      currentComparison: { sport, player, market }
    });

    // Optional callback for analytics/tracking
    props?.onOddsCompare?.(sport, player, market);
  };

  const closeOddsComparison = () => {
    setState({
      isDrawerOpen: false,
      currentComparison: null
    });
  };

  return {
    ...state,
    openOddsComparison,
    closeOddsComparison
  };
};