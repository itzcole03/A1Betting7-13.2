// ModelRegistry and ModelManager for ML ensemble (TensorFlow.js & ONNX)
const tf = require('@tensorflow/tfjs-node');
const ort = require('onnxruntime-node');
const path = require('path');

class ModelRegistry {
  constructor() {
    this.models = new Map(); // key: modelName, value: metadata
  }
  registerModel({ name, type, filePath }) {
    this.models.set(name, { name, type, filePath, status: 'unloaded', instance: null });
  }
  getModelMeta(name) {
    return this.models.get(name);
  }
  getAllModels() {
    return Array.from(this.models.values());
  }
}

class ModelManager {
  constructor(registry) {
    this.registry = registry;
    this.cache = new Map(); // key: modelName, value: loaded model instance
    this.maxCacheSize = 10; // configurable: max models in memory
  }
  async loadModel(name, opts = {}) {
    const meta = this.registry.getModelMeta(name);
    if (!meta) throw new Error(`Model ${name} not registered.`);
    if (meta.status === 'loaded' && meta.instance) return meta.instance;
    let instance;
    if (meta.type === 'tensorflow') {
      // Optionally use quantized/optimized model
      instance = await tf.loadLayersModel('file://' + path.resolve(meta.filePath));
      // TODO: Use tfjs-node-gpu if available, set backend
      if (opts.useGPU && tf.engine().backendName !== 'tensorflow') {
        await tf.setBackend('tensorflow');
      }
    } else if (meta.type === 'onnx') {
      // Use ORT format if available, set execution providers
      const sessionOpts = {};
      if (opts.useGPU)
        sessionOpts.executionProviders = ['CUDAExecutionProvider', 'CPUExecutionProvider'];
      instance = await ort.InferenceSession.create(path.resolve(meta.filePath), sessionOpts);
    } else {
      throw new Error(`Unknown model type: ${meta.type}`);
    }
    meta.status = 'loaded';
    meta.instance = instance;
    this.cache.set(name, instance);
    this._enforceCacheLimit();
    return instance;
  }
  unloadModel(name) {
    const meta = this.registry.getModelMeta(name);
    if (meta && meta.status === 'loaded') {
      meta.status = 'unloaded';
      meta.instance = null;
      this.cache.delete(name);
    }
  }
  _enforceCacheLimit() {
    while (this.cache.size > this.maxCacheSize) {
      const oldest = this.cache.keys().next().value;
      this.unloadModel(oldest);
    }
  }
  getLoadedModel(name) {
    return this.cache.get(name);
  }
}

module.exports = { ModelRegistry, ModelManager };
