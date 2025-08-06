// IPC handler for ML ensemble predictions
const { ipcMain } = require('electron');
const { ModelRegistry, ModelManager } = require('./main-model-manager');
const { PredictionEngine } = require('./main-prediction-engine');
const logger = require('./utils/logger');

const registry = new ModelRegistry();
const manager = new ModelManager(registry);
const engine = new PredictionEngine(registry, manager);

// Example: Register models (should be loaded from config/db in production)
registry.registerModel({
  name: 'model1',
  type: 'tensorflow',
  filePath: './models/model1/model.json',
});
registry.registerModel({ name: 'model2', type: 'onnx', filePath: './models/model2/model.onnx' });
// ...register all 47+ models here

ipcMain.handle('predict-ensemble', async (event, input, modelNames) => {
  try {
    const result = await engine.predict(input, modelNames);
    logger.info('ML prediction success', {
      input,
      modelNames,
      resultSummary: {
        latency: result.latency,
        memory: result.memory,
        aggregated: result.aggregated,
      },
    });
    return { success: true, result };
  } catch (err) {
    logger.error('ML prediction error: %s', err.message, {
      input,
      modelNames,
      stack: err.stack,
    });
    return { success: false, error: err.message };
  }
});
