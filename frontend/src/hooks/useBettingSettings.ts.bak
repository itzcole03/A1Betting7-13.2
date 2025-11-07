import { useCallback } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/stores/bettingStore' or its ... Remove this comment to see the full error message
import { useBettingStore } from '@/stores/bettingStore';
// @ts-expect-error TS(2307): Cannot find module '@/services/bettingService' or ... Remove this comment to see the full error message
import type { BettingSettings } from '@/services/bettingService';

export const useBettingSettings = () => {
  const { settings, isLoading, error, fetchSettings, updateSettings, setError } = useBettingStore();

  const handleRiskProfileChange = useCallback(
    (profile: BettingSettings['riskProfile']) => {
      updateSettings({ riskProfile: profile });
    },
    [updateSettings]
  );

  const handleStakeChange = useCallback(
    (stake: number) => {
      updateSettings({ stakeSize: stake });
    },
    [updateSettings]
  );

  const handleModelChange = useCallback(
    (modelId: string) => {
      updateSettings({ modelId });
    },
    [updateSettings]
  );

  const handleConfidenceThresholdChange = useCallback(
    (threshold: number) => {
      updateSettings({ confidenceThreshold: threshold });
    },
    [updateSettings]
  );

  const resetSettings = useCallback(async () => {
    try {
      await fetchSettings();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset settings');
    }
  }, [fetchSettings, setError]);

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    handleRiskProfileChange,
    handleStakeChange,
    handleModelChange,
    handleConfidenceThresholdChange,
    resetSettings,
  };
};
