import { BaseService } from './BaseService';
import { UnifiedCache } from './UnifiedCache';
import { UnifiedDataService } from './UnifiedDataService';

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
  factors: any[];
  timestamp: Date;
}

export class UnifiedPredictionService extends BaseService {
  private static instance: UnifiedPredictionService;
  private cache: UnifiedCache;
  private dataService: UnifiedDataService;

  protected constructor() {
    super('UnifiedPredictionService');
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

      const result: PredictionResult = {
        prediction: response.prediction,
        confidence: response.confidence,
        modelUsed: response.model || 'default',
        factors: response.factors || [],
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
      return response.predictions;
    } catch (error) {
      this.logger.error('Failed to make batch predictions', error);
      throw error;
    }
  }

  async getPredictionHistory(filters: any = {}): Promise<PredictionResult[]> {
    try {
      const response = await this.get(`/api/predictions/history?${new URLSearchParams(filters)}`);
      return response.predictions;
    } catch (error) {
      this.logger.error('Failed to fetch prediction history', error);
      return [];
    }
  }

  async getModelPerformance(modelName?: string): Promise<any> {
    try {
      const url = modelName
        ? `/api/predictions/performance/${modelName}`
        : '/api/predictions/performance';
      const response = await this.get(url);
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch model performance', error);
      return {};
    }
  }

  async calibrateModel(modelName: string, calibrationData: any): Promise<boolean> {
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
      return response.models;
    } catch (error) {
      this.logger.error('Failed to fetch available models', error);
      return ['default'];
    }
  }

  clearPredictionCache(sport?: string): void {
    const pattern = sport ? `prediction_{"sport":"${sport}"` : 'prediction_';
    const keys = this.cache.getKeys().filter(key => key.includes(pattern));
    keys.forEach(key => this.cache.delete(key));
    this.logger.info('Prediction cache cleared', { sport });
  }

  private async get(url: string): Promise<any> {
    return this.api.get(url).then(response => response.data);
  }

  private async post(url: string, data: any): Promise<any> {
    return this.api.post(url, data).then(response => response.data);
  }
}

export default UnifiedPredictionService;
