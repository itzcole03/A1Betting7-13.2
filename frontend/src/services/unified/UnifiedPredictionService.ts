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

type PredictionPayload = PredictionRequest & {
  timestamp: string;
  sportsData?: unknown;
  contextData?: unknown;
};

export class UnifiedPredictionService extends BaseService {
  private static instance: UnifiedPredictionService;
  private readonly dataService: UnifiedDataService;
  private readonly defaultPredictionTtlMs = 10 * 60 * 1000;

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
