import { BaseService } from './BaseService';
import { UnifiedDataService } from './UnifiedDataService';
import { UnifiedServiceRegistry } from './UnifiedServiceRegistry';

export interface PredictionRequest {
  sport: string;
  market: string;
  gameId?: string;
  playerId?: string;
  modelType?: string;
  metadata?: Record<string, unknown>;
}

export interface PredictionResult {
  prediction: number;
  confidence: number;
  modelUsed: string;
  factors: unknown[];
  timestamp: Date;
  request: PredictionRequest;
  raw?: unknown;
}

export interface QuantumPredictionParams extends PredictionRequest {
  optimizationLevel?: 'baseline' | 'annealed' | 'variational';
  decoherenceMitigation?: boolean;
  samplingShots?: number;
}

export interface RealTimePredictionRequest {
  sport?: string;
  limit?: number;
  userId?: string;
}

export interface RealTimePrediction {
  prop_id: string;
  player_name: string;
  stat_type: string;
  line: number;
  sport: string;
  league: string;
  game_time: string;
  predicted_value: number;
  prediction_probability: number;
  confidence_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  confidence_score: number;
  primary_model: string;
  ensemble_models: string[];
  model_agreement: number;
  shap_explanation: Record<string, unknown>;
  key_factors: string[];
  reasoning: string;
  expected_value: number;
  risk_score: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'WEAK_SELL' | 'STRONG_SELL';
  prediction_time: string;
  data_freshness: number;
  api_latency: number;
}

export interface RealTimeSystemHealth {
  status: string;
  models_loaded: number;
  active_predictions: number;
  api_latency_avg: number;
  data_freshness_avg: number;
  error_rate: number;
  last_update: string;
}

export interface RealTimeModelInfo {
  model_id: string;
  model_name: string;
  loaded_at: string;
  feature_count: number;
  status: string;
}

export interface RealTimePredictionStats {
  total_predictions: number;
  total_api_calls: number;
  total_errors: number;
  uptime_seconds: number;
  models_loaded: number;
  cache_size: number;
  error_rate: number;
  predictions_per_call: number;
  timestamp: string;
}

export interface RealTimeModelSnapshot {
  models_loaded: number;
  models: RealTimeModelInfo[];
  timestamp: string;
}

export interface RealTimeSubscriptionOptions {
  request?: RealTimePredictionRequest;
  intervalMs?: number;
  emitErrors?: boolean;
  transform?: (predictions: RealTimePrediction[]) => RealTimePrediction[];
}

export interface PredictionOptimizationOptions {
  minConfidence?: number;
  maxConfidence?: number;
  smoothingWindow?: number;
  strategy?: 'auto' | 'remote' | 'heuristic';
}

type PredictionPayload = PredictionRequest & {
  timestamp: string;
  sportsData?: unknown;
  contextData?: unknown;
};

export class UnifiedPredictionService extends BaseService {
  private static instance: UnifiedPredictionService;
  private readonly dataService: UnifiedDataService;
  private readonly defaultPredictionTtlMs = 10 * 60 * 1000;
  private readonly realTimeEndpoints = [
    '/api/predictions/prizepicks/enhanced',
    '/api/predictions/prizepicks/live',
  ];

  protected constructor() {
    super('UnifiedPredictionService', UnifiedServiceRegistry.getInstance());
    this.dataService = UnifiedDataService.getInstance();
  }

  static getInstance(): UnifiedPredictionService {
    if (!UnifiedPredictionService.instance) {
      UnifiedPredictionService.instance = new UnifiedPredictionService();
    }
    return UnifiedPredictionService.instance;
  }

  async makePrediction(request: PredictionRequest): Promise<PredictionResult> {
    const cacheKey = this.getCacheKey(
      'single',
      request.sport,
      request.market,
      request.playerId ?? 'anonymous',
      request.gameId ?? 'na',
      request.modelType ?? 'default'
    );

    return this.withCache(
      cacheKey,
      async () => {
        const payload = await this.buildPredictionPayload(request);

        try {
          const response = await this.handleRequest(() =>
            this.postJson<unknown>('/api/predictions/make', payload)
          );
          const normalized = this.normalizePredictionResponse(response, request);
          this.logger.info('Prediction made', {
            sport: request.sport,
            market: request.market,
            confidence: normalized.confidence,
          });
          return normalized;
        } catch (error) {
          this.handleError(error, {
            code: 'PREDICTION_REQUEST_FAILED',
            source: 'UnifiedPredictionService.makePrediction',
            details: { request },
          });
          throw error;
        }
      },
      this.defaultPredictionTtlMs
    );
  }

  async getQuantumPrediction(params: QuantumPredictionParams): Promise<PredictionResult> {
    const quantumMetadata = {
      mode: params.optimizationLevel ?? 'variational',
      decoherenceMitigation: params.decoherenceMitigation ?? true,
      samplingShots: params.samplingShots ?? 256,
      requestedAt: new Date().toISOString(),
    };

    const enrichedRequest: PredictionRequest = {
      ...params,
      modelType: params.modelType ?? 'quantum-inspired',
      metadata: {
        ...params.metadata,
        quantum: quantumMetadata,
      },
    };

    this.logger.info('Quantum prediction requested', {
      sport: enrichedRequest.sport,
      market: enrichedRequest.market,
      modelType: enrichedRequest.modelType,
      mode: quantumMetadata.mode,
    });

    return this.makePrediction(enrichedRequest);
  }

  async batchPredict(requests: PredictionRequest[]): Promise<PredictionResult[]> {
    if (!Array.isArray(requests) || requests.length === 0) {
      return [];
    }

    try {
      const payloads = await Promise.all(
        requests.map(request => this.buildPredictionPayload(request))
      );
      const response = await this.handleRequest(() =>
        this.postJson<unknown>('/api/predictions/batch', { requests: payloads })
      );
      const responseRecord = this.asRecord(response) ?? {};
      const rawItems = this.extractArray(responseRecord, ['predictions']) ?? [];
      return rawItems.map((item, index) =>
        this.normalizePredictionResponse(item, requests[index] ?? requests[0])
      );
    } catch (error) {
      this.handleError(error, {
        code: 'BATCH_PREDICTION_FAILED',
        source: 'UnifiedPredictionService.batchPredict',
      });
      throw error;
    }
  }

  async getPredictionHistory(filters: Record<string, string> = {}): Promise<PredictionResult[]> {
    try {
      const query = new URLSearchParams(filters).toString();
      const url = query ? `/api/predictions/history?${query}` : '/api/predictions/history';
      const response = await this.handleRequest(() => this.getJson<unknown>(url));
      const responseRecord = this.asRecord(response) ?? {};
      const rawItems = this.extractArray(responseRecord, ['predictions']) ?? [];
      return rawItems.map(item =>
        this.normalizePredictionResponse(item, {
          sport: filters.sport ?? 'unknown',
          market: filters.market ?? 'unknown',
          playerId: filters.playerId,
          gameId: filters.gameId,
          modelType: filters.modelType,
        })
      );
    } catch (error) {
      this.handleError(error, {
        code: 'PREDICTION_HISTORY_FAILED',
        source: 'UnifiedPredictionService.getPredictionHistory',
        details: { filters },
      });
      return [];
    }
  }

  async getModelPerformance(modelName?: string): Promise<unknown> {
    try {
      const url = modelName
        ? `/api/predictions/performance/${modelName}`
        : '/api/predictions/performance';
      return await this.handleRequest(() => this.getJson<unknown>(url));
    } catch (error) {
      this.handleError(error, {
        code: 'MODEL_PERFORMANCE_FAILED',
        source: 'UnifiedPredictionService.getModelPerformance',
        details: { modelName },
      });
      return {};
    }
  }

  async calibrateModel(modelName: string, calibrationData: unknown): Promise<boolean> {
    try {
      await this.handleRequest(() =>
        this.postJson<unknown>(`/api/predictions/calibrate/${modelName}`, calibrationData)
      );
      this.logger.info('Model calibrated', { modelName });
      return true;
    } catch (error) {
      this.handleError(error, {
        code: 'MODEL_CALIBRATION_FAILED',
        source: 'UnifiedPredictionService.calibrateModel',
        details: { modelName },
      });
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.handleRequest(() =>
        this.getJson<unknown>('/api/predictions/models')
      );
      const responseRecord = this.asRecord(response) ?? {};
      const models = this.extractArray(responseRecord, ['models']);
      return Array.isArray(models)
        ? models.filter((value): value is string => typeof value === 'string')
        : ['default'];
    } catch (error) {
      this.handleError(error, {
        code: 'MODEL_LIST_FAILED',
        source: 'UnifiedPredictionService.getAvailableModels',
      });
      return ['default'];
    }
  }

  clearPredictionCache(sport?: string): void {
    const prefix = sport ? `${this.name}:single:${sport}` : `${this.name}:`;

    const keys = this.cache.getKeys();
    keys.filter(key => key.startsWith(prefix)).forEach(key => this.cache.delete(key));

    this.logger.info('Prediction cache cleared', { sport: sport ?? 'all' });
  }

  async getRealTimePredictions(
    request: RealTimePredictionRequest = {}
  ): Promise<RealTimePrediction[]> {
    const params: Record<string, string> = {};
    if (request.sport) {
      params.sport = request.sport;
    }
    if (typeof request.limit === 'number') {
      params.limit = String(request.limit);
    }

    const headers = request.userId ? { user_id: request.userId } : undefined;
    let lastError: unknown;

    for (const endpoint of this.realTimeEndpoints) {
      try {
        const data = await this.fetchRealTimeEndpoint<unknown>(endpoint, {
          params,
          headers,
        });
        const predictions = Array.isArray(data)
          ? data
          : this.extractArray(this.asRecord(data) ?? {}, ['predictions']) ?? [];

        const sanitized = predictions.filter(
          (item): item is RealTimePrediction => item !== null && typeof item === 'object'
        );

        this.logger.info('Real-time predictions fetched', {
          endpoint,
          count: sanitized.length,
          sport: request.sport ?? 'all',
        });

        return sanitized;
      } catch (error) {
        lastError = error;
        this.logger.warn('Real-time prediction endpoint failed, trying fallback', {
          endpoint,
          error: this.toErrorMessage(error),
        });
      }
    }

    this.handleError(lastError, {
      code: 'REALTIME_PREDICTIONS_FAILED',
      source: 'UnifiedPredictionService.getRealTimePredictions',
      details: { sport: request.sport, limit: request.limit },
    });

    throw lastError instanceof Error
      ? lastError
      : new Error('Unable to fetch real-time predictions');
  }

  async getRealTimeSystemHealth(): Promise<RealTimeSystemHealth> {
    try {
      return await this.fetchRealTimeEndpoint<RealTimeSystemHealth>(
        '/api/predictions/prizepicks/health'
      );
    } catch (error) {
      this.handleError(error, {
        code: 'REALTIME_HEALTH_FAILED',
        source: 'UnifiedPredictionService.getRealTimeSystemHealth',
      });
      throw error;
    }
  }

  async getRealTimePredictionExplanation(propId: string): Promise<Record<string, unknown>> {
    try {
      const data = await this.fetchRealTimeEndpoint<Record<string, unknown>>(
        `/api/predictions/prizepicks/explain/${propId}`
      );
      return this.asRecord(data) ?? {};
    } catch (error) {
      this.handleError(error, {
        code: 'REALTIME_EXPLANATION_FAILED',
        source: 'UnifiedPredictionService.getRealTimePredictionExplanation',
        details: { propId },
      });
      throw error;
    }
  }

  async getRealTimeLoadedModels(): Promise<RealTimeModelSnapshot> {
    try {
      return await this.fetchRealTimeEndpoint<RealTimeModelSnapshot>(
        '/api/predictions/prizepicks/models'
      );
    } catch (error) {
      this.handleError(error, {
        code: 'REALTIME_MODELS_FAILED',
        source: 'UnifiedPredictionService.getRealTimeLoadedModels',
      });
      throw error;
    }
  }

  async getRealTimePredictionStats(): Promise<RealTimePredictionStats> {
    try {
      return await this.fetchRealTimeEndpoint<RealTimePredictionStats>(
        '/api/predictions/prizepicks/stats'
      );
    } catch (error) {
      this.handleError(error, {
        code: 'REALTIME_STATS_FAILED',
        source: 'UnifiedPredictionService.getRealTimePredictionStats',
      });
      throw error;
    }
  }

  async triggerRealTimeModelTraining(): Promise<{
    message: string;
    timestamp: string;
    status: string;
  }> {
    try {
      return await this.postRealTimeEndpoint('/api/predictions/prizepicks/train', {});
    } catch (error) {
      this.handleError(error, {
        code: 'REALTIME_TRAINING_FAILED',
        source: 'UnifiedPredictionService.triggerRealTimeModelTraining',
      });
      throw error;
    }
  }

  async checkRealTimeApiHealth(): Promise<boolean> {
    try {
      const status = await this.handleRequest(() =>
        this.api.get('/health', { timeout: 5000 }).then(res => res.status)
      );
      return status === 200;
    } catch (error) {
      this.logger.warn('Real-time API health check failed', {
        error: this.toErrorMessage(error),
      });
      return false;
    }
  }

  async getRealTimeApiInfo(): Promise<Record<string, unknown>> {
    try {
      const data = await this.fetchRealTimeEndpoint<Record<string, unknown>>('/');
      return this.asRecord(data) ?? {};
    } catch (error) {
      this.handleError(error, {
        code: 'REALTIME_API_INFO_FAILED',
        source: 'UnifiedPredictionService.getRealTimeApiInfo',
      });
      throw error;
    }
  }

  formatConfidenceLevel(level: string): string {
    const labels: Record<string, string> = {
      very_low: 'Very Low',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      very_high: 'Very High',
    };
    return labels[level] ?? level;
  }

  formatRecommendation(recommendation: string): string {
    const labels: Record<string, string> = {
      STRONG_BUY: 'Strong Buy',
      BUY: 'Buy',
      HOLD: 'Hold',
      WEAK_SELL: 'Weak Sell',
      STRONG_SELL: 'Strong Sell',
    };
    return labels[recommendation] ?? recommendation;
  }

  getConfidenceColor(level: string): string {
    const colors: Record<string, string> = {
      very_low: '#ef4444',
      low: '#f97316',
      medium: '#eab308',
      high: '#22c55e',
      very_high: '#16a34a',
    };
    return colors[level] ?? '#6b7280';
  }

  getRecommendationColor(recommendation: string): string {
    const colors: Record<string, string> = {
      STRONG_BUY: '#16a34a',
      BUY: '#22c55e',
      HOLD: '#eab308',
      WEAK_SELL: '#f97316',
      STRONG_SELL: '#ef4444',
    };
    return colors[recommendation] ?? '#6b7280';
  }

  subscribeToRealTimePredictions(
    callback: (predictions: RealTimePrediction[]) => void,
    options: RealTimeSubscriptionOptions = {}
  ): () => void {
    const intervalMs = Math.max(options.intervalMs ?? 15000, 5000);
    const { request = {}, emitErrors = false, transform } = options;

    let active = true;
    let inFlight = false;

    const tick = async () => {
      if (!active || inFlight) {
        return;
      }
      inFlight = true;
      try {
        const predictions = await this.getRealTimePredictions(request);
        const next = transform ? transform(predictions) : predictions;
        if (active) {
          callback(next);
          this.emit('prediction:update', next);
        }
      } catch (error) {
        if (emitErrors) {
          this.handleError(error, {
            code: 'REALTIME_SUBSCRIPTION_ERROR',
            source: 'UnifiedPredictionService.subscribeToRealTimePredictions',
          });
        } else {
          this.logger.warn('Real-time subscription tick failed', {
            error: this.toErrorMessage(error),
          });
        }
      } finally {
        inFlight = false;
      }
    };

    void tick();
    const timer = setInterval(() => void tick(), intervalMs);

    return () => {
      active = false;
      clearInterval(timer);
      this.logger.info('Real-time prediction subscription cancelled');
    };
  }

  async optimizePrediction(
    prediction: PredictionResult,
    options: PredictionOptimizationOptions = {}
  ): Promise<PredictionResult> {
    const payload = {
      prediction,
      options,
    };

    if (options.strategy !== 'heuristic') {
      try {
        const response = await this.handleRequest(() =>
          this.postJson<unknown>('/api/predictions/optimize', payload)
        );
        if (response) {
          return this.normalizePredictionResponse(response, prediction.request);
        }
      } catch (error) {
        this.logger.warn('Remote prediction optimization unavailable, falling back', {
          error: this.toErrorMessage(error),
        });
      }
    }

    const minConfidence = options.minConfidence ?? 0;
    const maxConfidence = options.maxConfidence ?? 1;
    const smoothingWindow = options.smoothingWindow ?? 3;

    const adjustedConfidence = this.clampConfidence(
      Math.min(maxConfidence, Math.max(minConfidence, prediction.confidence))
    );

    const factors = Array.isArray(prediction.factors) ? [...prediction.factors] : [];
    factors.push({
      type: 'optimization',
      strategy: 'heuristic',
      appliedAt: new Date().toISOString(),
      smoothingWindow,
    });

    const rawRecord = this.asRecord(prediction.raw) ?? {};

    return {
      ...prediction,
      confidence: adjustedConfidence,
      factors,
      raw: {
        ...rawRecord,
        optimization: {
          strategy: 'heuristic',
          minConfidence,
          maxConfidence,
          smoothingWindow,
        },
      },
    };
  }

  private async fetchRealTimeEndpoint<T>(
    path: string,
    options: {
      params?: Record<string, string>;
      headers?: Record<string, string>;
      timeoutMs?: number;
    } = {}
  ): Promise<T> {
    const { params, headers, timeoutMs } = options;
    return this.handleRequest(() =>
      this.api.get(path, { params, headers, timeout: timeoutMs }).then(response =>
        this.unwrapResponse<T>(response.data, {
          url: path,
          params,
        })
      )
    );
  }

  private async postRealTimeEndpoint<T>(path: string, payload: unknown): Promise<T> {
    return this.handleRequest(() =>
      this.api
        .post(path, payload)
        .then(response => this.unwrapResponse<T>(response.data, { url: path }))
    );
  }

  private async buildPredictionPayload(request: PredictionRequest): Promise<PredictionPayload> {
    const [sportsData, contextData] = await Promise.all([
      this.fetchSafe(() => this.dataService.fetchSportsData(request.sport)),
      request.playerId
        ? this.fetchSafe(() => this.dataService.fetchPlayerStats(request.playerId!, request.sport))
        : Promise.resolve(undefined),
    ]);

    return {
      ...request,
      timestamp: new Date().toISOString(),
      sportsData,
      contextData,
    };
  }

  private async fetchSafe<T>(operation: () => Promise<T>): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.logger.warn('Auxiliary data fetch failed for prediction payload', {
        error: this.toErrorMessage(error),
      });
      return undefined;
    }
  }

  private normalizePredictionResponse(raw: unknown, request: PredictionRequest): PredictionResult {
    const record = this.asRecord(raw);
    if (!record) {
      throw new Error('Prediction response payload is not an object');
    }

    const prediction = this.extractNumber(record, ['prediction', 'value', 'predictedValue']);
    if (prediction === undefined) {
      throw new Error('Prediction response missing numeric value');
    }

    const confidence = this.extractNumber(record, ['confidence', 'confidenceScore']) ?? 0.5;
    const modelUsed =
      this.extractString(record, ['modelUsed', 'model', 'model_used']) ??
      request.modelType ??
      'unknown';
    const factors = this.extractArray(record, ['factors', 'explanations']) ?? [];
    const timestamp = this.extractDate(record.timestamp ?? record.generatedAt ?? record.created_at);

    return {
      prediction,
      confidence: this.clampConfidence(confidence),
      modelUsed,
      factors,
      timestamp,
      request,
      raw,
    };
  }

  private clampConfidence(value: number): number {
    if (!Number.isFinite(value)) {
      return 0.5;
    }
    const normalized = value > 1 && value <= 100 ? value / 100 : value;
    if (normalized < 0) {
      return 0;
    }
    if (normalized > 1) {
      return 1;
    }
    return Number(normalized.toFixed(3));
  }

  private extractArray(record: Record<string, unknown>, keys: string[]): unknown[] | undefined {
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
    return undefined;
  }

  private extractString(record: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return undefined;
  }

  private extractNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const value = record[key];
      const numeric = this.coerceNumber(value);
      if (numeric !== undefined) {
        return numeric;
      }
    }
    return undefined;
  }

  private coerceNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private extractDate(value: unknown): Date {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? new Date() : date;
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return undefined;
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }

  private async getJson<T>(url: string): Promise<T> {
    const response = await this.api.get(url);
    return this.unwrapResponse<T>(response.data, { url, method: 'GET' });
  }

  private async postJson<T>(url: string, data: unknown): Promise<T> {
    const response = await this.api.post(url, data);
    return this.unwrapResponse<T>(response.data, { url, method: 'POST' });
  }
}

export default UnifiedPredictionService;
