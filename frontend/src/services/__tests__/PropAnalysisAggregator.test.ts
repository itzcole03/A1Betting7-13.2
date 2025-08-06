import { PropOllamaError, PropOllamaErrorType } from '../../types/errors';
import { AnalysisCacheService } from '../AnalysisCacheService';
import { PropAnalysisAggregator, PropAnalysisRequest } from '../PropAnalysisAggregator';
import propOllamaService from '../propOllamaService';
beforeAll(() => {
  jest.useFakeTimers();
});
afterAll(() => {
  jest.useRealTimers();
});

// Mock dependencies
jest.mock('../AnalysisCacheService');
jest.mock('../propOllamaService');
jest.mock('../../types/errors');

describe('PropAnalysisAggregator', () => {
  let aggregator: PropAnalysisAggregator;
  let mockCacheService: jest.Mocked<AnalysisCacheService>;

  const mockRequest: PropAnalysisRequest = {
    propId: '123',
    player: 'LeBron James',
    team: 'LAL',
    sport: 'NBA',
    statType: 'Points',
    line: 27.5,
    overOdds: 1.8,
    underOdds: 2.0,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AnalysisCacheService
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
    } as unknown as jest.Mocked<AnalysisCacheService>;

    (AnalysisCacheService.getInstance as jest.Mock).mockReturnValue(mockCacheService);
    (AnalysisCacheService.generateCacheKey as jest.Mock).mockReturnValue('cache-key-123');

    // Explicitly mock sendChatMessage as a Jest mock function
    propOllamaService.sendChatMessage = jest.fn().mockResolvedValue({
      content: `OVER ANALYSIS:\nThis is the over analysis content.\nConfidence: 85%\nKey Factors:\n- Factor 1\n- Factor 2\n\nUNDER ANALYSIS:\nThis is the under analysis content.\nConfidence: 15%\nKey Factors:\n- Factor 3\n- Factor 4`,
      confidence: 0.85,
      model_used: 'llama2',
      response_time: 1500,
    });

    // Create aggregator instance
    aggregator = new PropAnalysisAggregator();
  });

  test('getAnalysis returns cached analysis if available', async () => {
    const cachedAnalysis = {
      overAnalysis: 'Cached over analysis',
      underAnalysis: 'Cached under analysis',
      confidenceOver: 80,
      confidenceUnder: 20,
      keyFactorsOver: ['Cached Factor 1', 'Cached Factor 2'],
      keyFactorsUnder: ['Cached Factor 3', 'Cached Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    };

    mockCacheService.get.mockReturnValue(cachedAnalysis);

    const result = await aggregator.getAnalysis(mockRequest);

    expect(result).toBe(cachedAnalysis);
    expect(mockCacheService.get).toHaveBeenCalledWith('cache-key-123');
    expect(propOllamaService.sendChatMessage).not.toHaveBeenCalled();
  });

  test('getAnalysis returns stale analysis and refreshes in background', async () => {
    const staleAnalysis = {
      overAnalysis: 'Stale over analysis',
      underAnalysis: 'Stale under analysis',
      confidenceOver: 80,
      confidenceUnder: 20,
      keyFactorsOver: ['Stale Factor 1', 'Stale Factor 2'],
      keyFactorsUnder: ['Stale Factor 3', 'Stale Factor 4'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
      isStale: true,
    };

    mockCacheService.get.mockReturnValue(staleAnalysis);

    const result = await aggregator.getAnalysis(mockRequest);

    expect(result).toEqual({
      ...staleAnalysis,
      isStale: true,
      timestamp: expect.any(String),
    });

    // Wait for background refresh to complete (simulate async)
    await Promise.resolve();
    await Promise.resolve();

    expect(propOllamaService.sendChatMessage).toHaveBeenCalled();
    expect(mockCacheService.set).toHaveBeenCalled();
  });

  test('getAnalysis generates new analysis when cache is empty', async () => {
    mockCacheService.get.mockReturnValue(null);

    const result = await aggregator.getAnalysis(mockRequest);

    expect(result).toEqual({
      overAnalysis:
        'This is the over analysis content.\nConfidence: 85%\nKey Factors:\n- Factor 1\n- Factor 2',
      underAnalysis:
        'This is the under analysis content.\nConfidence: 15%\nKey Factors:\n- Factor 3\n- Factor 4',
      confidenceOver: 85,
      confidenceUnder: 15,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
      dataQuality: 0.8,
      generationTime: expect.any(Number),
      modelUsed: 'llama2',
    });

    expect(propOllamaService.sendChatMessage).toHaveBeenCalled();
    expect(mockCacheService.set).toHaveBeenCalledWith('cache-key-123', result);
  });

  test('getAnalysis handles errors and generates fallback content', async () => {
    mockCacheService.get.mockReturnValue(null);

    // Mock propOllamaService to throw an error
    (propOllamaService.sendChatMessage as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Mock PropOllamaError.fromError with fallbackAvailable = true
    const mockError = {
      message: 'Network error',
      type: PropOllamaErrorType.NETWORK_ERROR,
      fallbackAvailable: true,
      isCritical: true,
      toString: () => 'Network error',
    };
    (PropOllamaError.fromError as jest.Mock).mockReturnValue(mockError);

    const result = await aggregator.getAnalysis(mockRequest);

    expect(result).toEqual({
      overAnalysis: expect.stringContaining('has a good chance of exceeding'),
      underAnalysis: expect.stringContaining('could limit'),
      confidenceOver: 65,
      confidenceUnder: 35,
      keyFactorsOver: ['Historical performance', 'Recent trends', 'Matchup factors'],
      keyFactorsUnder: ['Team dynamics', 'Game script', 'Defensive matchup'],
      dataQuality: 0.5,
      generationTime: 0,
      modelUsed: 'Fallback Generator',
      isFallback: true,
      error: mockError,
    });

    expect(propOllamaService.sendChatMessage).toHaveBeenCalled();
    expect(PropOllamaError.fromError).toHaveBeenCalled();
  });

  test('getAnalysis rethrows error if fallback is not available', async () => {
    mockCacheService.get.mockReturnValue(null);

    // Mock propOllamaService to throw an error
    (propOllamaService.sendChatMessage as jest.Mock).mockRejectedValue(new Error('Critical error'));

    // Mock PropOllamaError.fromError with fallbackAvailable = false, as an Error instance

    class MockCriticalError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'MockCriticalError';
        (this as any).type = PropOllamaErrorType.UNKNOWN_ERROR;
        (this as any).fallbackAvailable = false;
        (this as any).isCritical = true;
      }
    }
    (PropOllamaError.fromError as jest.Mock).mockReturnValue(
      new MockCriticalError('Critical error')
    );

    await expect(aggregator.getAnalysis(mockRequest)).rejects.toThrow('Critical error');
  });

  test('parseResponse extracts analysis sections correctly', () => {
    // (Removed raw text block that was causing syntax errors)
    const content =
      'OVER ANALYSIS:\nThis is the over analysis content.\nConfidence: 85%\nKey Factors:\n- Factor 1\n- Factor 2\n\nUNDER ANALYSIS:\nThis is the under analysis content.\nConfidence: 15%\nKey Factors:\n- Factor 3\n- Factor 4';

    // Access private method using type assertion
    const parsed = (aggregator as any).parseResponse(content);

    expect(parsed).toEqual({
      overAnalysis:
        'This is the over analysis content.\nConfidence: 85%\nKey Factors:\n- Factor 1\n- Factor 2',
      underAnalysis:
        'This is the under analysis content.\nConfidence: 15%\nKey Factors:\n- Factor 3\n- Factor 4',
      confidenceOver: 85,
      confidenceUnder: 15,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
    });
  });

  test('parseResponse handles missing sections gracefully', () => {
    const content = 'Some unstructured content without clear sections';

    // Access private method using type assertion
    const parsed = (aggregator as any).parseResponse(content);

    expect(parsed).toEqual({
      overAnalysis: 'No over analysis available',
      underAnalysis: 'No under analysis available',
      confidenceOver: undefined,
      confidenceUnder: undefined,
      keyFactorsOver: undefined,
      keyFactorsUnder: undefined,
    });
  });

  test('buildPrompt creates appropriate prompt', () => {
    const context = {
      player: {
        name: 'LeBron James',
        team: 'LAL',
        position: 'Guard',
      },
      matchup: {
        opponent: 'GSW',
      },
      betting: {
        line: 27.5,
        overOdds: 1.8,
        underOdds: 2.0,
      },
      predictions: {
        confidenceScores: {
          over: 0.75,
        },
      },
    };

    // Access private method using type assertion
    const prompt = (aggregator as any).buildPrompt(mockRequest, context);

    expect(prompt).toContain('LeBron James');
    expect(prompt).toContain('27.5');
    expect(prompt).toContain('OVER');
    expect(prompt).toContain('UNDER');
  });

  test('parseResponse extracts analysis sections correctly', () => {
    // (Removed raw text block that was causing syntax errors)
    const content =
      'OVER ANALYSIS:\nThis is the over analysis content.\nConfidence: 85%\nKey Factors:\n- Factor 1\n- Factor 2\n\nUNDER ANALYSIS:\nThis is the under analysis content.\nConfidence: 15%\nKey Factors:\n- Factor 3\n- Factor 4';

    // Access private method using type assertion
    const parsed = (aggregator as any).parseResponse(content);

    expect(parsed).toEqual({
      overAnalysis:
        'This is the over analysis content.\nConfidence: 85%\nKey Factors:\n- Factor 1\n- Factor 2',
      underAnalysis:
        'This is the under analysis content.\nConfidence: 15%\nKey Factors:\n- Factor 3\n- Factor 4',
      confidenceOver: 85,
      confidenceUnder: 15,
      keyFactorsOver: ['Factor 1', 'Factor 2'],
      keyFactorsUnder: ['Factor 3', 'Factor 4'],
    });
  });

  test('parseResponse handles missing sections gracefully', () => {
    const content = 'Some unstructured content without clear sections';

    // Access private method using type assertion
    const parsed = (aggregator as any).parseResponse(content);

    expect(parsed).toEqual({
      overAnalysis: 'No over analysis available',
      underAnalysis: 'No under analysis available',
      confidenceOver: undefined,
      confidenceUnder: undefined,
      keyFactorsOver: undefined,
      keyFactorsUnder: undefined,
    });
  });

  test('buildPrompt creates appropriate prompt', () => {
    const context = {
      player: {
        name: 'LeBron James',
        team: 'LAL',
        position: 'Guard',
      },
      matchup: {
        opponent: 'GSW',
      },
      betting: {
        line: 27.5,
        overOdds: 1.8,
        underOdds: 2.0,
      },
      predictions: {
        confidenceScores: {
          over: 0.75,
        },
      },
    };

    // Access private method using type assertion
    const prompt = (aggregator as any).buildPrompt(mockRequest, context);

    expect(prompt).toContain('LeBron James');
    expect(prompt).toContain('27.5');
    expect(prompt).toContain('OVER');
    expect(prompt).toContain('UNDER');
  });
});
