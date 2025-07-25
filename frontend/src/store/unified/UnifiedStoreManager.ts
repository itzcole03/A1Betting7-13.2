import { create, StateCreator } from 'zustand';
import { BestBet, GamePrediction, PropProjection, SelectedProp } from '../../models/domainModels';

interface UnifiedStoreState {
  projections: PropProjection[];
  selectedProps: SelectedProp[];
  predictions: GamePrediction[];
  bestBets: BestBet[];
  isLoading: boolean;
  error: string | null;
  setProjections: (projections: PropProjection[]) => void;
  setSelectedProps: (selected: SelectedProp[]) => void;
  setPredictions: (predictions: GamePrediction[]) => void;
  setBestBets: (bets: BestBet[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const unifiedStoreCreator: StateCreator<UnifiedStoreState> = set => ({
  projections: [],
  selectedProps: [],
  predictions: [],
  bestBets: [],
  isLoading: false,
  error: null,
  setProjections: (projections: PropProjection[]) => set({ projections }),
  setSelectedProps: (selected: SelectedProp[]) => set({ selectedProps: selected }),
  setPredictions: (predictions: GamePrediction[]) => set({ predictions }),
  setBestBets: (bets: BestBet[]) => set({ bestBets: bets }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
});

export const useUnifiedStore = create<UnifiedStoreState>(unifiedStoreCreator);
