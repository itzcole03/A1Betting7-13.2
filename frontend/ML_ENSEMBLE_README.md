# ML Ensemble System for A1Betting (2025)

## Overview

This system supports robust, scalable ML ensemble predictions using TensorFlow.js and ONNX runtime in Electron. It is designed for 47+ models, with modular architecture, lazy loading, caching, batching, parallel inference, and hardware acceleration.

## Key Components

- **ModelRegistry**: Tracks model metadata (name, type, path, status).
- **ModelManager**: Loads/unloads models, manages cache, supports quantization and hardware acceleration.
- **PredictionEngine**: Batches and parallelizes predictions, aggregates results, profiles latency and memory.
- **IPC Handlers**: Routes prediction requests from renderer to main process, returns results asynchronously.

## Supported Model Types

- TensorFlow.js (`@tensorflow/tfjs-node`)
- ONNX (`onnxruntime-node`, ORT format recommended)

## Performance Best Practices

- Use GPU acceleration if available (TensorFlow backend, CUDA for ONNX).
- Convert ONNX models to ORT format for faster loading and lower memory.
- Quantize models for faster inference if accuracy is sufficient.
- Batch prediction requests and parallelize using worker threads.
- Profile latency and memory usage, tune cache and batch sizes.

## Usage

1. Register models in `main-prediction-ipc.js` (or load from config/db).
2. Use `PredictionEngine.predict(input, modelNames, opts)` to run ensemble predictions.
3. Access profiling info (latency, memory) in prediction results.
4. Extend ModelRegistry/Manager for new model types as needed.

## Onboarding

- See `main-model-manager.js`, `main-prediction-engine.js`, and `main-prediction-ipc.js` for implementation details.
- For new models, add to registry and ensure file paths are correct.
- For advanced optimization, use quantized/ORT models and enable hardware acceleration.

## Help & Support

- For troubleshooting, check logs and profiling info.
- For integration questions, see code comments and this README.
- For further optimization, consult TensorFlow.js and ONNX runtime docs (2025).
