import { BaseService } from './BaseService';
import { UnifiedCache } from './UnifiedCache';
import { UnifiedDataService } from './UnifiedDataService';
import { UnifiedServiceRegistry } from './UnifiedServiceRegistry';

interface PredictionRequest {
  sport: string;
  gameId?: string;
  playerId?: string;
  market: string;
  modelType?: string;
}

interface PredictionResult {
  prediction: number;
  confidence: number;
  modelUsed: string;
  factors: unknown[];
  timestamp: Date;
}

// @ts-expect-error TS(2415): Class 'UnifiedPredictionService' incorrectly exten... Remove this comment to see the full error message
export class UnifiedPredictionService extends BaseService {
  private static instance: UnifiedPredictionService;
  private cache: UnifiedCache;
  private dataService: UnifiedDataService;

  protected constructor() {
    // Pass the centralized registry instance to BaseService; keep signature compatible
    super('UnifiedPredictionService', UnifiedServiceRegistry.getInstance());
    this.cache = UnifiedCache.getInstance();
    this.dataService = UnifiedDataService.getInstance();
  }

  static getInstance(): UnifiedPredictionService {
    if (!UnifiedPredictionService.instance) {
      UnifiedPredictionService.instance = new UnifiedPredictionService();
    }
    return UnifiedPredictionService.instance;
  }

  async makePrediction(request: PredictionRequest): Promise<PredictionResult> {
    try {
      const cacheKey = `prediction_${JSON.stringify(request)}`;
      const cached = this.cache.get<PredictionResult>(cacheKey);
      if (cached) return cached;

      // Fetch relevant data
      const sportsData = await this.dataService.fetchSportsData(request.sport);
      let contextData = {};

      if (request.playerId) {
        contextData = await this.dataService.fetchPlayerStats(request.playerId, request.sport);
      }

      // Make prediction request
      const predictionData = {
        ...request,
        sportsData,
        contextData,
        timestamp: new Date(),
      };

      const response = await this.post('/api/predictions/make', predictionData);
      const respAny = response as any;

      const result: PredictionResult = {
        prediction: respAny.prediction,
        confidence: respAny.confidence,
        modelUsed: respAny.model || 'default',
        factors: respAny.factors || [],
        timestamp: new Date(),
      };

      // Cache for 10 minutes
      this.cache.set(cacheKey, result, 600000);

      this.logger.info('Prediction made', {
        sport: request.sport,
        market: request.market,
        confidence: result.confidence,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to make prediction', error);
      throw error;
    }
  }

  async batchPredict(requests: PredictionRequest[]): Promise<PredictionResult[]> {
    try {
  const response = await this.post('/api/predictions/batch', { requests });
  return (response as any).predictions;
    } catch (error) {
      this.logger.error('Failed to make batch predictions', error);
      throw error;
    }
  }

  async getPredictionHistory(filters: unknown = {}): Promise<PredictionResult[]> {
    try {
  const response = await this.get(`/api/predictions/history?${new URLSearchParams(filters as Record<string, string>)}`);
  return (response as any).predictions;
    } catch (error) {
      this.logger.error('Failed to fetch prediction history', error);
      return [];
    }
  }

  async getModelPerformance(modelName?: string): Promise<unknown> {
    try {
      const url = modelName
        ? `/api/predictions/performance/${modelName}`
        : '/api/predictions/performance';
  const response = await this.get(url);
  return response as any;
    } catch (error) {
      this.logger.error('Failed to fetch model performance', error);
      return {};
    }
  }

  async calibrateModel(modelName: string, calibrationData: unknown): Promise<boolean> {
    try {
  await this.post(`/api/predictions/calibrate/${modelName}`, calibrationData);
      this.logger.info('Model calibrated', { modelName });
      return true;
    } catch (error) {
      this.logger.error('Failed to calibrate model', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
  const response = await this.get('/api/predictions/models');
  return (response as any).models;
    } catch (error) {
      this.logger.error('Failed to fetch available models', error);
      return ['default'];
    }
  }

  clearPredictionCache(sport?: string): void {
    const pattern = sport ? `prediction_{"sport":"${sport}"` : 'prediction_';
    const keys = this.cache.getKeys().filter((key: string) => key.includes(pattern));
    keys.forEach((key: string) => this.cache.delete(key));
    this.logger.info('Prediction cache cleared', { sport });
  }

  private async get(url: string): Promise<unknown> {
    return this.api.get(url).then(response => response.data);
  }

  private async post(url: string, data: unknown): Promise<unknown> {
    return this.api.post(url, data).then(response => response.data);
  }
}

export default UnifiedPredictionService;
