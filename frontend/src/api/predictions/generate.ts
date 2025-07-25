import { NextApiRequest, NextApiResponse } from 'next';
// @ts-expect-error TS(2305): Module '"./../../core/logging/logger"' has no expo... Remove this comment to see the full error message
import { getLogger } from './../../core/logging/logger';
// @ts-expect-error TS(2305): Module '"./../../core/metrics/metrics"' has no exp... Remove this comment to see the full error message
import { getMetrics } from './../../core/metrics/metrics';
// @ts-expect-error TS(2305): Module '"./../../services/prediction/PredictionInt... Remove this comment to see the full error message
import { PredictionIntegrationService } from './../../services/prediction/PredictionIntegrationService';

interface GeneratePredictionsRequest {
  modelName: string;
  date: string;
}

export default async function handler(_req: NextApiRequest, _res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { modelName, date } = req.body as GeneratePredictionsRequest;
  const _logger = getLogger();
  const _metrics = getMetrics();

  if (!modelName || !date) {
    return res.status(400).json({ error: 'Model name and date are required' });
  }

  try {
    const _startTime = Date.now();
    const _predictionService = new PredictionIntegrationService();
    const _predictions = await predictionService.generatePredictions(modelName, date);
    const _duration = Date.now() - startTime;

    metrics.timing('prediction_generation_duration', duration, {
      modelName,
      date,
    });

    logger.info('Successfully generated predictions', {
      modelName,
      date,
      predictionCount: predictions.length,
    });

    return res.status(200).json(predictions);
  } catch (error) {
    const _errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Error generating predictions', {
      error: errorMessage,
      modelName,
      date,
    });
    metrics.increment('prediction_generation_error', 1, {
      modelName,
      error: errorMessage,
    });

    return res.status(500).json({ error: errorMessage });
  }
}
