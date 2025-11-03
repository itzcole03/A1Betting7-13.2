// Mock getEnvVar to prevent ReferenceError in OllamaService
jest.mock('../../utils/getEnvVar', () => ({
  getEnvVar: jest.fn(() => 'http://localhost:8000'),
}));

import axios from 'axios';
import propOllamaService from '../propOllamaService';

const mockValidatePropRecommendations = jest.fn(async () => ({
  executedAt: '2025-11-02T00:00:00.000Z',
  items: [],
  summary: {
    totalTargets: 0,
    confirmed: 0,
    lowConfidence: 0,
    conflicts: 0,
    missing: 0,
    errors: 0,
  },
  issues: [],
  metadata: {
    confidenceThreshold: 0.6,
    confidenceGapTolerance: 0.18,
  },
}));

jest.mock('axios');

// Always mock backendDiscovery properly
jest.mock('../backendDiscovery', () => ({
  discoverBackend: jest.fn().mockResolvedValue('http://localhost:8000'),
}));

jest.mock('../../core/UnifiedPredictionEngine', () => ({
  validatePropRecommendations: mockValidatePropRecommendations,
}));

describe('propOllamaService', () => {
  const axiosMock = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidatePropRecommendations.mockClear();
    propOllamaService.clearChatHistory();
  });

  test('sendChatMessage sends request to correct endpoint', async () => {
    // Mock axios response
    axiosMock.post.mockResolvedValue({
      data: {
        response: 'AI response',
        confidence: 0.85,
        suggestions: ['Suggestion 1', 'Suggestion 2'],
        model_used: 'llama2',
        response_time: 1500,
        analysis_type: 'general',
      },
    });

    // Call sendChatMessage
    const result = await propOllamaService.sendChatMessage({
      message: 'Hello',
      analysisType: 'general',
    });

    // Verify axios was called correctly
    expect(axiosMock.post).toHaveBeenCalledWith(
      'http://localhost:8000/api/propollama/chat',
      {
        message: 'Hello',
        analysisType: 'general',
      },
      expect.any(Object)
    );

    // Verify result
    expect(result).toHaveProperty('content', 'AI response');
    expect(result).toHaveProperty('confidence', 0.85);
    expect(result).toHaveProperty('suggestions', ['Suggestion 1', 'Suggestion 2']);
    expect(mockValidatePropRecommendations).toHaveBeenCalled();
    expect(result.validation).toBeDefined();
    expect(result.validation?.summary.totalTargets).toBe(0);
    expect(result.validation?.guardrail.adjustedConfidence).toBe(result.confidence);
    expect(result.guardrailTriggered).toBe(false);
    expect(result.validationNotices).toEqual([]);
  });

  test('getPropOllamaHealth sends request to correct endpoint', async () => {
    // Mock axios response
    axiosMock.get.mockResolvedValue({
      data: {
        status: 'healthy',
        message: 'All systems operational',
      },
    });

    // Call getPropOllamaHealth
    const result = await propOllamaService.getPropOllamaHealth();

    // Verify axios was called correctly
    expect(axiosMock.get).toHaveBeenCalledWith('http://localhost:8000/api/propollama/health');

    // Verify result
    expect(result).toHaveProperty('status', 'healthy');
    expect(result).toHaveProperty('message', 'All systems operational');
  });

  test('getAvailableModels sends request to correct endpoint', async () => {
    // Mock axios response
    axiosMock.get.mockResolvedValue({
      data: {
        models: ['llama2', 'mistral', 'gpt4all'],
      },
    });

    // Call getAvailableModels
    const result = await propOllamaService.getAvailableModels();

    // Verify axios was called correctly
    expect(axiosMock.get).toHaveBeenCalledWith('http://localhost:8000/api/propollama/models');

    // Verify result
    expect(result).toEqual(['llama2', 'mistral', 'gpt4all']);
  });

  test('getModelHealth sends request to correct endpoint', async () => {
    // Mock axios response
    axiosMock.get.mockResolvedValue({
      data: {
        model_health: {
          status: 'ready',
          last_update: '2025-07-26T07:00:00Z',
        },
      },
    });

    // Call getModelHealth
    const result = await propOllamaService.getModelHealth('llama2');

    // Verify axios was called correctly
    expect(axiosMock.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/propollama/model_health',
      {
        params: { model_name: 'llama2' },
      }
    );

    // Verify result
    expect(result).toHaveProperty('status', 'ready');
    expect(result).toHaveProperty('last_update', '2025-07-26T07:00:00Z');
  });

  test('handles network errors gracefully', async () => {
    // Mock axios to throw error
    axiosMock.post.mockRejectedValue(new Error('Network Error'));

    // Call sendChatMessage and expect it to throw
    await expect(
      propOllamaService.sendChatMessage({
        message: 'Hello',
      })
    ).rejects.toThrow('Network Error');
  });

  test('handles HTTP errors with details', async () => {
    // Mock axios to throw error with response
    axiosMock.post.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 500,
        data: {
          detail: 'Internal Server Error',
        },
      },
    });

    // Call sendChatMessage and expect it to throw
    await expect(
      propOllamaService.sendChatMessage({
        message: 'Hello',
      })
    ).rejects.toThrow('HTTP 500: Internal Server Error');
  });

  test('getConversationStarters returns array of suggestions', () => {
    const starters = propOllamaService.getConversationStarters();
    expect(Array.isArray(starters)).toBe(true);
    expect(starters.length).toBeGreaterThan(0);
    expect(typeof starters[0]).toBe('string');
  });

  test('getChatHistory returns chat history array', () => {
    const history = propOllamaService.getChatHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  test('clearChatHistory clears the chat history', () => {
    // Add a message to history
    propOllamaService
      .sendChatMessage({
        message: 'Test message',
      })
      .catch(() => {});

    // Clear history
    propOllamaService.clearChatHistory();

    // Verify history is empty
    const history = propOllamaService.getChatHistory();
    expect(history.length).toBe(0);
  });

  test('getSystemStatus returns system status', async () => {
    // Mock axios response
    axiosMock.get.mockResolvedValue({
      data: {
        status: 'healthy',
        model_status: 'ready',
        uptime: 3600,
      },
    });

    // Call getSystemStatus
    const result = await propOllamaService.getSystemStatus();

    // Verify axios was called correctly
    expect(axiosMock.get).toHaveBeenCalledWith('http://localhost:8000/health');

    // Verify result
    expect(result).toHaveProperty('status', 'healthy');
    expect(result).toHaveProperty('model_ready', true);
    expect(result).toHaveProperty('response_time_avg', 3600);
    expect(result).toHaveProperty('accuracy', 0.964);
  });

  test('formatShapExplanation formats SHAP values correctly', () => {
    const shapValues = {
      player_height: 0.25,
      team_pace: -0.15,
      opponent_defense: 0.02,
    };

    const formatted = propOllamaService.formatShapExplanation(shapValues);

    expect(formatted).toHaveLength(3);
    expect(formatted[0]).toEqual({
      feature: 'Player Height',
      importance: 0.25,
      impact: 'positive',
    });
    expect(formatted[1]).toEqual({
      feature: 'Team Pace',
      importance: 0.15,
      impact: 'negative',
    });
    expect(formatted[2]).toEqual({
      feature: 'Opponent Defense',
      importance: 0.02,
      impact: 'neutral',
    });
  });
});
