// @ts-expect-error TS(2307): Cannot find module '@/core/UnifiedLogger' or its c... Remove this comment to see the full error message
import { UnifiedLogger } from '@/core/UnifiedLogger';
// @ts-expect-error TS(2307): Cannot find module '@/core/UnifiedMetrics' or its ... Remove this comment to see the full error message
import { UnifiedMetrics } from '@/core/UnifiedMetrics';
// @ts-expect-error TS(2307): Cannot find module '@/core/analytics/ModelPerforma... Remove this comment to see the full error message
import { ModelPerformanceMetrics } from '@/core/analytics/ModelPerformanceTracker';
import express, { Request, Response } from 'express';

// Add missing logger and performanceTracker definitions
const _logger = new UnifiedLogger();
const _performanceTracker = UnifiedMetrics.getInstance();

const _router = express.Router();

// Initialize the performance tracker;

// Get performance for a specific model;
router.get('/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    const { timeframe = 'all' } = req.query;

    const _history = performanceTracker.getPerformanceHistory(
      modelName,
      timeframe as 'day' | 'week' | 'month' | 'all'
    );

    // Define performance before using it
    const _performance = history && history.length > 0 ? history[0] : null;

    if (!performance) {
      return res.status(404).json({ error: 'Model performance data not found' });
    }

    res.json({
      performance,
      //       history
    });
  } catch (error) {
    logger.error('Error fetching model performance', error as Error);
    res.status(500).json({ error: 'Failed to fetch model performance data' });
  }
});

// Get top performing models;
router.get('/top/:metric', async (req, res) => {
  try {
    const { metric } = req.params;
    const { limit = '5' } = req.query;

    const _topModels = performanceTracker.getTopPerformingModels(
      metric as keyof ModelPerformanceMetrics | undefined,
      parseInt(limit as string, 10)
    );

    res.json(topModels);
  } catch (error) {
    logger.error('Error fetching top performing models', error as Error);
    res.status(500).json({ error: 'Failed to fetch top performing models' });
  }
});

// Record a prediction outcome;
router.post('/:modelName/outcome', async (req: Request, res: Response) => {
  try {
    const { modelName } = req.params;
    const { stake, payout, odds } = req.body;

    if (!stake || !payout || !odds) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    performanceTracker.recordOutcome(modelName, stake, payout, odds);
    res.status(200).json({ message: 'Outcome recorded successfully' });
  } catch (error) {
    logger.error('Error recording outcome', error as Error);
    res.status(500).json({ error: 'Failed to record outcome' });
  }
});

export default router;
