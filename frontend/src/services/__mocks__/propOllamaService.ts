class MockPropOllamaService {
  getAvailableModels() {
    const models = ['mock-model-1', 'mock-model-2'];
    console.log('[MOCK] getAvailableModels called, returning:', models);
    return Promise.resolve(models);
  }
  getPropOllamaHealth() {
    console.log('[MOCK] getPropOllamaHealth called');
    return Promise.resolve({
      status: 'ready',
      message: 'All systems go!',
    });
  }
  getModelHealth(modelName) {
    console.log('[MOCK] getModelHealth called for', modelName);
    return Promise.resolve({
      status: 'ready',
      last_error: '',
    });
  }
  sendChatMessage(payload) {
    console.log('[MOCK] sendChatMessage called with', payload);
    if (payload.message === 'error') {
      return Promise.reject(
        new Error('Simulated error from mock service.\nTraceback: ...mocked...')
      );
    }
    return Promise.resolve({
      content: 'This is a mock AI response.',
      confidence: 0.99,
      suggestions: ['Try another question!'],
      shap_explanation: { feature1: 0.5 },
    });
  }
}

const propOllamaService = new MockPropOllamaService();

module.exports = {
  __esModule: true,
  propOllamaService,
  default: propOllamaService,
};
