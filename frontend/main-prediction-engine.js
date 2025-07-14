// PredictionEngine for ML ensemble (TensorFlow.js & ONNX)
const { ModelRegistry, ModelManager } = require('./main-model-manager');
const tf = require('@tensorflow/tfjs-node');
const ort = require('onnxruntime-node');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

class PredictionEngine {
  constructor(modelRegistry, modelManager) {
    this.registry = modelRegistry;
    this.manager = modelManager;
  }
  async predict(input, modelNames, opts = {}) {
    // Batch and parallelize predictions, profile latency
    const start = Date.now();
    const results = await Promise.all(
      modelNames.map(async name => {
        const meta = this.registry.getModelMeta(name);
        const model = await this.manager.loadModel(name, opts);
        if (meta.type === 'tensorflow') {
          const tensor = tf.tensor(input);
          const output = model.predict(tensor);
          // Optionally quantize output
          return output.dataSync();
        } else if (meta.type === 'onnx') {
          const feeds = {
            [model.inputNames[0]]: new ort.Tensor('float32', input, [1, input.length]),
          };
          const output = await model.run(feeds);
          return Object.values(output)[0].data;
        }
        return null;
      })
    );
    const latency = Date.now() - start;
    // Aggregate results (simple average for demo, can be weighted)
    const aggregated = results
      .reduce((acc, val) => acc.map((x, i) => x + val[i]), Array(results[0].length).fill(0))
      .map(x => x / results.length);
    // Profile memory usage
    const memory = process.memoryUsage();
    return { results, aggregated, latency, memory };
  }
}

module.exports = { PredictionEngine };
