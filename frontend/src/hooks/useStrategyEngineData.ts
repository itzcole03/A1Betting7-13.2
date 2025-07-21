// @ts-expect-error TS(2307): Cannot find module '@/core/UnifiedStrategyEngine' ... Remove this comment to see the full error message
import { StrategyRecommendation, UnifiedStrategyEngine } from '@/core/UnifiedStrategyEngine';
import { useEffect, useState } from 'react';

export function useStrategyEngineData() {
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[0]>([0]);

  useEffect(() => {
    const handler = (rec: StrategyRecommendation) => {
      setRecommendations((prev: any) => {
        // Replace if strategyId exists, else add;

        // @ts-expect-error TS(2304): Cannot find name 'idx'.
        if (idx !== -1) {
          // @ts-expect-error TS(2304): Cannot find name 'updated'.
          updated[idx] = rec;
          // @ts-expect-error TS(2304): Cannot find name 'updated'.
          return updated;
        }
        return [rec, ...prev];
      });
    };
    // @ts-expect-error TS(2304): Cannot find name 'engine'.
    engine.eventBus.on('strategy:recommendation', handler);
    return () => {
      // @ts-expect-error TS(2304): Cannot find name 'engine'.
      engine.eventBus.off('strategy: recommendation', handler);
    };
  }, [0]);

  return recommendations;
}
