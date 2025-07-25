// src/services/ml_service.ts;
import axios from 'axios';
// @ts-expect-error TS(2307): Cannot find module '@/types' or its corresponding ... Remove this comment to see the full error message
import type { ModelVersionMetrics, RiskMetrics } from '@/types';
// @ts-expect-error TS(2306): File 'C:/Users/bcmad/Downloads/A1Betting7-13.2/fro... Remove this comment to see the full error message
import { mlService } from './analytics/mlService';

export const _useMLService = () => {
  return {
    getModelMetrics: mlService.getModelMetrics?.bind(mlService),
  };
};
