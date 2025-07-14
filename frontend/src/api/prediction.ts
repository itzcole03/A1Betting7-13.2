import { register } from '@/services/auth/register';
import {
  PredictionIntegrationService,
  getArbitrageOpportunities,
  getBettingOpportunities,
  getMe,
  getPerformanceStats,
  getPrizePicksProps,
  getUnifiedData,
  login,
} from '@/services/prediction/PredictionIntegrationService';
import { Request, Response, Router } from 'express';

const router = Router();

// Generate predictions;
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { modelName, date } = req.body;
    const predictions = await PredictionIntegrationService.generatePredictions(modelName, date);
    res.json(predictions);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Update models with new data;
router.post('/update', async (req: Request, res: Response) => {
  try {
    await PredictionIntegrationService.updateModelData(req.body);
    res.json({ status: 'success' });
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Evaluate model performance;
router.get('/evaluate', async (_req: Request, res: Response) => {
  try {
    const evaluation = await PredictionIntegrationService.evaluateModelPerformance();
    res.json(evaluation);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Get model comparisons;
router.get('/compare', async (_req: Request, res: Response) => {
  try {
    const comparison = await PredictionIntegrationService.getModelComparisons();
    res.json(comparison);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Get performance metrics;
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await PredictionIntegrationService.getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Get daily fantasy recommendations;
router.get('/fantasy', async (_req: Request, res: Response) => {
  try {
    const recommendations = await PredictionIntegrationService.getDailyFantasyRecommendations();
    res.json(recommendations);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Betting opportunities;
router.get('/betting-opportunities', async (req: Request, res: Response) => {
  try {
    const { sport, limit } = req.query;
    const opportunities = await getBettingOpportunities(sport as string, Number(limit));
    res.json(opportunities);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Arbitrage opportunities;
router.get('/arbitrage-opportunities', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const opportunities = await getArbitrageOpportunities(Number(limit));
    res.json(opportunities);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Performance stats;
router.get('/v1/performance-stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getPerformanceStats();
    res.json(stats);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// PrizePicks props;
router.get('/prizepicks/props', async (req: Request, res: Response) => {
  try {
    const { sport, min_confidence } = req.query;
    const props = await getPrizePicksProps(sport as string, Number(min_confidence));
    res.json(props);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Unified data;
router.get('/v1/unified-data', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const data = await getUnifiedData(date as string);
    res.json(data);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Register;
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const response = await register(userData);
    res.json(response);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Login;
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const credentials = req.body;
    const response = await login(credentials);
    res.json(response);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Get current user;
router.get('/auth/me', async (_req: Request, res: Response) => {
  try {
    const response = await getMe();
    res.json(response);
  } catch (error) {
    // console statement removed
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export { router as predictionRouter };
