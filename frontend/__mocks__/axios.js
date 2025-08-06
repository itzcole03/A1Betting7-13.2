// Manual mock for axios for Jest
const mockAxios = jest.createMockFromModule('axios');

mockAxios.create = () => mockAxios;
mockAxios.get = jest.fn((url, ...args) => {
  if (url.includes('/api/propollama/models')) {
    console.log('[MOCK AXIOS] /api/propollama/models called');
    return Promise.resolve({ data: { models: ['llama2', 'mistral', 'gpt4all'] } });
  }
  if (url.includes('/api/propollama/health')) {
    console.log('[MOCK AXIOS] /api/propollama/health called');
    return Promise.resolve({ data: { status: 'healthy', message: 'All systems operational' } });
  }
  if (url.includes('/api/propollama/model_health')) {
    console.log('[MOCK AXIOS] /api/propollama/model_health called');
    return Promise.resolve({
      data: { model_health: { status: 'ready', last_update: '2025-07-26T07:00:00Z' } },
    });
  }
  if (url.endsWith('/health')) {
    // For getSystemStatus
    return Promise.resolve({ data: { status: 'healthy', model_status: 'ready', uptime: 3600 } });
  }
  return Promise.reject(new Error('Unknown endpoint: ' + url));
});
mockAxios.post = jest.fn((url, body, ...args) => {
  if (url.includes('/api/propollama/chat')) {
    console.log('[MOCK AXIOS] POST /api/propollama/chat called');
    return Promise.resolve({
      data: {
        response: 'AI response',
        confidence: 0.85,
        suggestions: ['Suggestion 1', 'Suggestion 2'],
        model_used: 'llama2',
        response_time: 1500,
        analysis_type: 'general',
      },
    });
  }
  return Promise.reject(new Error('Unknown endpoint: ' + url));
});

module.exports = mockAxios;
exports.default = mockAxios;
