/**
 * ML Service - Machine Learning Model Management for A1Betting Platform
 * Handles 47+ ML models, ensemble predictions, and SHAP analysis
 */

import ApiService from '../unified/ApiService';

export interface MLModel {
  id: string;
  name: string;
  type: 'xgboost' | 'lstm' | 'random_forest' | 'neural_network' | 'svm' | 'ensemble';
  accuracy: number;
  weight: number;
  status: 'active' | 'training' | 'inactive' | 'error';
  lastTrained: Date;
  features: string[];
  sport: string;
  market: string;
}

export interface Prediction {
  id: string;
  modelId: string;
  gameId: string;
  market: string;
  prediction: number;
  confidence: number;
  probability: number;
  expectedValue: number;
  reasoning: string[];
  shapValues?: Record<string, number>;
  timestamp: Date;
}

export interface EnsemblePrediction {
  id: string;
  gameId: string;
  market: string;
  finalPrediction: number;
  finalConfidence: number;
  finalProbability: number;
  modelPredictions: Prediction[];
  weightedAverage: number;
  consensus: number;
  variance: number;
  timestamp: Date;
}

export interface ModelPerformance {
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalPredictions: number;
  recentPerformance: Array<{
    date: Date;
    accuracy: number;
    profit: number;
  }>;
}

export interface SHAPAnalysis {
  predictionId: string;
  featureImportance: Record<string, number>;
  globalImportance: Record<string, number>;
  explanations: Array<{
    feature: string;
    impact: number;
    description: string;
  }>;
}

class MLService {
  private models: Map<string, MLModel> = new Map();
  private cachedPredictions: Map<string, EnsemblePrediction> = new Map();

  async initialize(): Promise<void> {
    try {
      await this.loadModels();
      await this.validateModels();
    } catch (error) {
      console.error('MLService initialization failed:', error);
      throw error;
    }
  }

  async loadModels(): Promise<MLModel[]> {
    try {
      const response = await ApiService.get<MLModel[]>('/ml/models');

      this.models.clear();
      response.data.forEach(model => {
        this.models.set(model.id, model);
      });

      return response.data;
    } catch (error) {
      console.error('Failed to load ML models:', error);
      return [];
    }
  }

  async getModels(filters?: {
    sport?: string;
    market?: string;
    type?: string;
    status?: string;
  }): Promise<MLModel[]> {
    let models = Array.from(this.models.values());

    if (filters) {
      if (filters.sport) models = models.filter(m => m.sport === filters.sport);
      if (filters.market) models = models.filter(m => m.market === filters.market);
      if (filters.type) models = models.filter(m => m.type === filters.type);
      if (filters.status) models = models.filter(m => m.status === filters.status);
    }

    return models;
  }

  async getPrediction(gameId: string, market: string): Promise<EnsemblePrediction | null> {
    const cacheKey = `${gameId}:${market}`;

    // Check cache first
    if (this.cachedPredictions.has(cacheKey)) {
      const cached = this.cachedPredictions.get(cacheKey)!;
      const cacheAge = Date.now() - cached.timestamp.getTime();

      // Cache for 5 minutes
      if (cacheAge < 300000) {
        return cached;
      }
    }

    try {
      const response = await ApiService.post<EnsemblePrediction>('/ml/predict', {
        gameId,
        market,
        useEnsemble: true,
      });

      this.cachedPredictions.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get prediction:', error);
      return null;
    }
  }

  async getMultiplePredictions(
    requests: Array<{
      gameId: string;
      market: string;
    }>
  ): Promise<EnsemblePrediction[]> {
    try {
      const response = await ApiService.post<EnsemblePrediction[]>('/ml/predict/batch', {
        requests,
        useEnsemble: true,
      });

      // Cache all predictions
      response.data.forEach(prediction => {
        const cacheKey = `${prediction.gameId}:${prediction.market}`;
        this.cachedPredictions.set(cacheKey, prediction);
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get multiple predictions:', error);
      return [];
    }
  }

  async getModelPerformance(modelId?: string): Promise<ModelPerformance[]> {
    try {
      const url = modelId ? `/ml/models/${modelId}/performance` : '/ml/performance';
      const response = await ApiService.get<ModelPerformance[]>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to get model performance:', error);
      return [];
    }
  }

  async getSHAPAnalysis(predictionId: string): Promise<SHAPAnalysis | null> {
    try {
      const response = await ApiService.get<SHAPAnalysis>(`/ml/shap/${predictionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get SHAP analysis:', error);
      return null;
    }
  }

  async retrainModel(modelId: string, data?: any): Promise<boolean> {
    try {
      await ApiService.post(`/ml/models/${modelId}/retrain`, data);

      // Reload model after retraining
      const updatedModel = await ApiService.get<MLModel>(`/ml/models/${modelId}`);
      this.models.set(modelId, updatedModel.data);

      return true;
    } catch (error) {
      console.error('Failed to retrain model:', error);
      return false;
    }
  }

  async validateModels(): Promise<{ valid: number; invalid: number; errors: string[] }> {
    const results = { valid: 0, invalid: 0, errors: [] as string[] };

    for (const model of this.models.values()) {
      try {
        const response = await ApiService.get(`/ml/models/${model.id}/validate`);
        if (response.data.valid) {
          results.valid++;
        } else {
          results.invalid++;
          results.errors.push(`${model.name}: ${response.data.error}`);
        }
      } catch (error) {
        results.invalid++;
        results.errors.push(`${model.name}: Validation failed`);
      }
    }

    return results;
  }

  async getFeatureImportance(modelId: string): Promise<Record<string, number>> {
    try {
      const response = await ApiService.get<Record<string, number>>(
        `/ml/models/${modelId}/features`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get feature importance:', error);
      return {};
    }
  }

  async optimizeEnsemble(): Promise<{
    oldWeights: Record<string, number>;
    newWeights: Record<string, number>;
  }> {
    try {
      const response = await ApiService.post<{
        oldWeights: Record<string, number>;
        newWeights: Record<string, number>;
      }>('/ml/ensemble/optimize');

      // Update model weights
      for (const [modelId, weight] of Object.entries(response.data.newWeights)) {
        const model = this.models.get(modelId);
        if (model) {
          model.weight = weight;
        }
      }

      return response.data;
    } catch (error) {
      console.error('Failed to optimize ensemble:', error);
      return { oldWeights: {}, newWeights: {} };
    }
  }

  getStats(): {
    totalModels: number;
    activeModels: number;
    avgAccuracy: number;
    cachedPredictions: number;
  } {
    const models = Array.from(this.models.values());
    const activeModels = models.filter(m => m.status === 'active');
    const avgAccuracy = activeModels.reduce((sum, m) => sum + m.accuracy, 0) / activeModels.length;

    return {
      totalModels: models.length,
      activeModels: activeModels.length,
      avgAccuracy: avgAccuracy || 0,
      cachedPredictions: this.cachedPredictions.size,
    };
  }

  clearCache(): void {
    this.cachedPredictions.clear();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await ApiService.get('/ml/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export default new MLService();
