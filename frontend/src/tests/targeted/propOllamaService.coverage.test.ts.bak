import axios from 'axios';
import { propOllamaService } from '../../services/propOllamaService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('propOllamaService - targeted smoke tests', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    try {
      propOllamaService.clearChatHistory();
    } catch (e) {
      // ignore if not present
    }
  });

  test('getConversationStarters returns an array with items', () => {
    const starters = propOllamaService.getConversationStarters();
    expect(Array.isArray(starters)).toBe(true);
    expect(starters.length).toBeGreaterThan(0);
  });

  test('formatShapExplanation formats and sorts values', () => {
    const shap = { feature_one: 0.2, feature_two: -0.12, feature_three: 0.01 };
    const out = propOllamaService.formatShapExplanation(shap);
    expect(out).toBeInstanceOf(Array);
    expect(out[0].importance).toBeGreaterThanOrEqual(out[out.length - 1].importance);
    // Feature names should be humanized
    expect(out.some(o => /Feature/i.test(o.feature))).toBe(true);
  });

  test('chat history and clearChatHistory behavior', async () => {
    // Mock post response for sendChatMessage
    mockedAxios.post.mockResolvedValueOnce({
      data: { response: 'assistant reply', confidence: 0.8, suggestions: [], shap_explanation: {} },
    } as any);

    const res = await propOllamaService.sendChatMessage({ message: 'hello' });
    expect(res).toHaveProperty('content', 'assistant reply');

    const hist = propOllamaService.getChatHistory();
    expect(hist.length).toBeGreaterThanOrEqual(1);

    propOllamaService.clearChatHistory();
    expect(propOllamaService.getChatHistory().length).toBe(0);
  });

  test('getAvailableModels and getModelHealth are called and return mocked data', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { models: ['m1', 'm2'] } } as any);
    const models = await propOllamaService.getAvailableModels();
    expect(models).toEqual(['m1', 'm2']);

    mockedAxios.get.mockResolvedValueOnce({ data: { model_health: { status: 'ready' } } } as any);
    const health = await propOllamaService.getModelHealth('m1');
    expect(health).toHaveProperty('status');
  });

  test('getSystemStatus returns a status object (mocked)', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: 'ok', model_status: 'ready', uptime: 123 },
    } as any);
    const s = await propOllamaService.getSystemStatus();
    expect(s).toHaveProperty('status');
    expect(typeof s.model_ready).toBe('boolean');
  });
});
