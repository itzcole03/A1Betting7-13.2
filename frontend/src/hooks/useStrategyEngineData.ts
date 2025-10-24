import { useEffect, useState } from 'react';

import type {
  StrategyEngineEventPayload,
  StrategyRecommendation,
} from '../core/UnifiedStrategyEngine';
import { UnifiedStrategyEngine } from '../core/UnifiedStrategyEngine';

const engine = UnifiedStrategyEngine;

const resolveIdentifier = (recommendation: StrategyRecommendation): string =>
  recommendation.opportunityId ?? recommendation.id;

const upsertRecommendations = (
  current: StrategyRecommendation[],
  incoming: StrategyRecommendation
): StrategyRecommendation[] => {
  const identifier = resolveIdentifier(incoming);
  const index = current.findIndex(item => resolveIdentifier(item) === identifier);

  if (index === -1) {
    return [incoming, ...current].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }

  const copy = [...current];
  copy[index] = incoming;
  return copy.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
};

function useStrategyEngineData(): StrategyRecommendation[] {
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>(
    engine.getRecommendations()
  );

  useEffect(() => {
    const unsubscribe = engine.onRecommendation((event: StrategyEngineEventPayload) => {
      setRecommendations(prev => upsertRecommendations(prev, event.recommendation));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return recommendations;
}

export default useStrategyEngineData;
