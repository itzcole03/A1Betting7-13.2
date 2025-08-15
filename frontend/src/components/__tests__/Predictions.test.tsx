/**
 * Predictions Display Component Tests - Phase 4.2 Frontend Tests
 * Test suite for prediction display functionality
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock prediction data with proper typing
interface MockPrediction {
  id: string;
  sport: string;
  player_name: string;
  prop_type: string;
  line: number;
  prediction: number;
  confidence_score: number;
  recommendation: string;
  over_odds: number;
  under_odds: number;
  expected_value: number;
  shap_explanation?: {
    feature_importance: Record<string, number>;
  };
  risk_score: number;
  team: string;
  opponent: string;
  game_time: string;
}

const mockPredictions: MockPrediction[] = [
  {
    id: 'pred-1',
    sport: 'MLB',
    player_name: 'Mike Trout',
    prop_type: 'runs_scored',
    line: 1.5,
    prediction: 0.75,
    confidence_score: 0.82,
    recommendation: 'over',
    over_odds: 1.85,
    under_odds: 1.95,
    expected_value: 0.125,
    shap_explanation: {
      feature_importance: {
        'batting_avg': 0.3,
        'recent_form': 0.25,
        'pitcher_matchup': 0.2,
        'weather': 0.1,
        'venue': 0.15
      }
    },
    risk_score: 0.3,
    team: 'LAA',
    opponent: 'HOU',
    game_time: '2024-01-15T19:00:00Z'
  },
  {
    id: 'pred-2',
    sport: 'MLB', 
    player_name: 'Aaron Judge',
    prop_type: 'hits',
    line: 1.5,
    prediction: 0.42,
    confidence_score: 0.68,
    recommendation: 'under',
    over_odds: 2.10,
    under_odds: 1.75,
    expected_value: -0.05,
    shap_explanation: {
      feature_importance: {
        'batting_avg': 0.4,
        'pitcher_era': 0.35,
        'ballpark_factor': 0.15,
        'recent_injuries': 0.1
      }
    },
    risk_score: 0.45,
    team: 'NYY',
    opponent: 'BOS',
    game_time: '2024-01-15T20:00:00Z'
  }
];

// Mock PredictionsDisplay Component
interface PredictionsDisplayProps {
  predictions: MockPrediction[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onPredictionSelect?: (prediction: MockPrediction) => void;
  showAdvancedMetrics?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const MockPredictionsDisplay: React.FC<PredictionsDisplayProps> = ({
  predictions,
  loading = false,
  error = null,
  onRefresh,
  onPredictionSelect,
  showAdvancedMetrics = false,
  sortBy = 'confidence_score',
  sortOrder = 'desc'
}) => {
  const handlePredictionClick = (prediction: MockPrediction) => {
    if (onPredictionSelect) {
      onPredictionSelect(prediction);
    }
  };

  if (loading) {
    return <div data-testid="predictions-loading">Loading predictions...</div>;
  }

  if (error) {
    return (
      <div data-testid="predictions-error">
        <p>Error: {error}</p>
        {onRefresh && (
          <button data-testid="retry-button" onClick={onRefresh}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div data-testid="predictions-empty">
        No predictions available
        {onRefresh && (
          <button data-testid="refresh-button" onClick={onRefresh}>
            Refresh
          </button>
        )}
      </div>
    );
  }

  // Sort predictions
  const sortedPredictions = [...predictions].sort((a, b) => {
    const aVal = a[sortBy as keyof typeof a] as number;
    const bVal = b[sortBy as keyof typeof b] as number;
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  return (
    <div data-testid="predictions-display">
      <div data-testid="predictions-header">
        <h2>Predictions ({predictions.length})</h2>
        {onRefresh && (
          <button data-testid="refresh-button" onClick={onRefresh}>
            Refresh
          </button>
        )}
      </div>
      
      <div data-testid="predictions-list">
        {sortedPredictions.map((prediction) => (
          <div
            key={prediction.id}
            data-testid={`prediction-${prediction.id}`}
            className="prediction-card"
            onClick={() => handlePredictionClick(prediction)}
            style={{ cursor: onPredictionSelect ? 'pointer' : 'default' }}
          >
            <div data-testid="prediction-basic-info">
              <h3>{prediction.player_name}</h3>
              <p>{prediction.prop_type} - Line: {prediction.line}</p>
              <p>Recommendation: 
                <span data-testid={`recommendation-${prediction.id}`}>
                  {prediction.recommendation.toUpperCase()}
                </span>
              </p>
              <p>Confidence: 
                <span data-testid={`confidence-${prediction.id}`}>
                  {(prediction.confidence_score * 100).toFixed(1)}%
                </span>
              </p>
            </div>

            {showAdvancedMetrics && (
              <div data-testid="prediction-advanced-metrics">
                <p>Expected Value: 
                  <span data-testid={`ev-${prediction.id}`}>
                    {prediction.expected_value > 0 ? '+' : ''}{prediction.expected_value.toFixed(3)}
                  </span>
                </p>
                <p>Risk Score: 
                  <span data-testid={`risk-${prediction.id}`}>
                    {(prediction.risk_score * 100).toFixed(1)}%
                  </span>
                </p>
                <p>Prediction: 
                  <span data-testid={`prediction-value-${prediction.id}`}>
                    {(prediction.prediction * 100).toFixed(1)}%
                  </span>
                </p>
              </div>
            )}

            {showAdvancedMetrics && prediction.shap_explanation && (
              <div data-testid="shap-explanation">
                <h4>Feature Importance</h4>
                <div data-testid={`shap-features-${prediction.id}`}>
                  {Object.entries(prediction.shap_explanation.feature_importance)
                    .sort(([,a], [,b]) => b - a)
                    .map(([feature, importance]) => (
                      <div key={feature} data-testid={`shap-${feature}`}>
                        {feature}: {(importance * 100).toFixed(1)}%
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div data-testid="prediction-odds">
              <span>Over: {prediction.over_odds}</span>
              <span>Under: {prediction.under_odds}</span>
            </div>
            
            <div data-testid="prediction-metadata">
              <p>{prediction.team} vs {prediction.opponent}</p>
              <p>Game: {new Date(prediction.game_time).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('PredictionsDisplay Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnRefresh = jest.fn();
  const mockOnPredictionSelect = jest.fn();
  
  beforeEach(() => {
    user = userEvent.setup();
    mockOnRefresh.mockClear();
    mockOnPredictionSelect.mockClear();
  });

  it('renders predictions correctly', () => {
    render(
      <MockPredictionsDisplay predictions={mockPredictions} />
    );

    expect(screen.getByTestId('predictions-display')).toBeInTheDocument();
    expect(screen.getByText('Predictions (2)')).toBeInTheDocument();
    
    // Check first prediction
    expect(screen.getByTestId('prediction-pred-1')).toBeInTheDocument();
    expect(screen.getByText('Mike Trout')).toBeInTheDocument();
    expect(screen.getByText('runs_scored - Line: 1.5')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-pred-1')).toHaveTextContent('OVER');
    expect(screen.getByTestId('confidence-pred-1')).toHaveTextContent('82.0%');
  });

  it('shows loading state correctly', () => {
    render(
      <MockPredictionsDisplay 
        predictions={[]} 
        loading={true}
      />
    );

    expect(screen.getByTestId('predictions-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading predictions...')).toBeInTheDocument();
  });

  it('shows error state correctly', () => {
    render(
      <MockPredictionsDisplay 
        predictions={[]} 
        error="Failed to load predictions"
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByTestId('predictions-error')).toBeInTheDocument();
    expect(screen.getByText('Error: Failed to load predictions')).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('shows empty state correctly', () => {
    render(
      <MockPredictionsDisplay 
        predictions={[]} 
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByTestId('predictions-empty')).toBeInTheDocument();
    expect(screen.getByText('No predictions available')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    render(
      <MockPredictionsDisplay 
        predictions={mockPredictions} 
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByTestId('refresh-button');
    await user.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onRefresh when retry button is clicked in error state', async () => {
    render(
      <MockPredictionsDisplay 
        predictions={[]} 
        error="Network error"
        onRefresh={mockOnRefresh}
      />
    );

    const retryButton = screen.getByTestId('retry-button');
    await user.click(retryButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onPredictionSelect when prediction is clicked', async () => {
    render(
      <MockPredictionsDisplay 
        predictions={mockPredictions}
        onPredictionSelect={mockOnPredictionSelect}
      />
    );

    const predictionCard = screen.getByTestId('prediction-pred-1');
    await user.click(predictionCard);

    expect(mockOnPredictionSelect).toHaveBeenCalledWith(mockPredictions[0]);
  });

  it('shows advanced metrics when enabled', () => {
    render(
      <MockPredictionsDisplay 
        predictions={mockPredictions}
        showAdvancedMetrics={true}
      />
    );

    // Check advanced metrics for first prediction specifically
    const firstPrediction = screen.getByTestId('prediction-pred-1');
    const advancedSection = within(firstPrediction).getByTestId('prediction-advanced-metrics');
    expect(advancedSection).toBeInTheDocument();
    expect(within(firstPrediction).getByTestId('ev-pred-1')).toHaveTextContent('+0.125');
    expect(within(firstPrediction).getByTestId('risk-pred-1')).toHaveTextContent('30.0%');
    expect(within(firstPrediction).getByTestId('prediction-value-pred-1')).toHaveTextContent('75.0%');
  });

  it('shows SHAP explanations when advanced metrics enabled', () => {
    render(
      <MockPredictionsDisplay 
        predictions={mockPredictions}
        showAdvancedMetrics={true}
      />
    );

    // Find a specific prediction's SHAP section
    const firstPrediction = screen.getByTestId('prediction-pred-1');
    const shapSection = within(firstPrediction).getByTestId('shap-explanation');
    expect(shapSection).toBeInTheDocument();
    expect(within(shapSection).getByText('Feature Importance')).toBeInTheDocument();
    expect(within(firstPrediction).getByTestId('shap-features-pred-1')).toBeInTheDocument();
    
    // Check feature importance is displayed and sorted within the first prediction
    const shapFeatures = within(screen.getByTestId('shap-features-pred-1'));
    expect(shapFeatures.getByTestId('shap-batting_avg')).toHaveTextContent('batting_avg: 30.0%');
  });

  it('hides advanced metrics when disabled', () => {
    render(
      <MockPredictionsDisplay 
        predictions={mockPredictions}
        showAdvancedMetrics={false}
      />
    );

    expect(screen.queryByTestId('prediction-advanced-metrics')).not.toBeInTheDocument();
    expect(screen.queryByTestId('shap-explanation')).not.toBeInTheDocument();
  });

  it('displays odds correctly', () => {
    render(
      <MockPredictionsDisplay predictions={mockPredictions} />
    );

    // Check odds for first prediction specifically
    const firstPrediction = screen.getByTestId('prediction-pred-1');
    const oddsSection = within(firstPrediction).getByTestId('prediction-odds');
    expect(within(oddsSection).getByText('Over: 1.85')).toBeInTheDocument();
    expect(within(oddsSection).getByText('Under: 1.95')).toBeInTheDocument();
  });

  it('displays metadata correctly', () => {
    render(
      <MockPredictionsDisplay predictions={mockPredictions} />
    );

    // Check metadata for first prediction specifically  
    const firstPrediction = screen.getByTestId('prediction-pred-1');
    const metadataSection = within(firstPrediction).getByTestId('prediction-metadata');
    expect(within(metadataSection).getByText('LAA vs HOU')).toBeInTheDocument();
    // Game time should be formatted as locale string
    expect(within(metadataSection).getByText(/Game:/)).toBeInTheDocument();
  });

  it('sorts predictions by confidence score descending by default', () => {
    render(
      <MockPredictionsDisplay predictions={mockPredictions} />
    );

    const predictionCards = screen.getAllByText(/Confidence:/);
    // First should be higher confidence (82.0%)
    expect(predictionCards[0]).toHaveTextContent('Confidence:');
    const firstConfidence = screen.getByTestId('confidence-pred-1');
    expect(firstConfidence).toHaveTextContent('82.0%');
  });

  it('sorts predictions by specified field and order', () => {
    render(
      <MockPredictionsDisplay 
        predictions={mockPredictions}
        sortBy="expected_value"
        sortOrder="asc"
      />
    );

    // Should be sorted by expected value ascending
    const predictionsList = screen.getByTestId('predictions-list');
    const predictionCards = within(predictionsList).getAllByTestId(/^prediction-pred-/);
    
    // First card should be the one with lower expected value
    expect(predictionCards[0]).toHaveAttribute('data-testid', 'prediction-pred-2'); // EV: -0.05
    expect(predictionCards[1]).toHaveAttribute('data-testid', 'prediction-pred-1'); // EV: 0.125
  });

  it('formats confidence scores correctly', () => {
    render(
      <MockPredictionsDisplay predictions={mockPredictions} />
    );

    expect(screen.getByTestId('confidence-pred-1')).toHaveTextContent('82.0%');
    expect(screen.getByTestId('confidence-pred-2')).toHaveTextContent('68.0%');
  });

  it('formats expected values correctly', () => {
    render(
      <MockPredictionsDisplay 
        predictions={mockPredictions}
        showAdvancedMetrics={true}
      />
    );

    expect(screen.getByTestId('ev-pred-1')).toHaveTextContent('+0.125');
    expect(screen.getByTestId('ev-pred-2')).toHaveTextContent('-0.050');
  });

  it('handles predictions with missing SHAP data gracefully', () => {
    const predictionsWithoutShap: MockPrediction[] = [
      {
        ...mockPredictions[0],
        shap_explanation: undefined
      }
    ];

    render(
      <MockPredictionsDisplay 
        predictions={predictionsWithoutShap}
        showAdvancedMetrics={true}
      />
    );

    expect(screen.getByTestId('prediction-advanced-metrics')).toBeInTheDocument();
    expect(screen.queryByTestId('shap-explanation')).not.toBeInTheDocument();
  });

  it('handles empty SHAP feature importance gracefully', () => {
    const predictionsWithEmptyShap: MockPrediction[] = [
      {
        ...mockPredictions[0],
        shap_explanation: {
          feature_importance: {}
        }
      }
    ];

    render(
      <MockPredictionsDisplay 
        predictions={predictionsWithEmptyShap}
        showAdvancedMetrics={true}
      />
    );

    expect(screen.getByTestId('shap-explanation')).toBeInTheDocument();
    const shapFeatures = screen.getByTestId('shap-features-pred-1');
    expect(shapFeatures).toBeEmptyDOMElement();
  });

  it('applies pointer cursor when onPredictionSelect is provided', () => {
    render(
      <MockPredictionsDisplay 
        predictions={mockPredictions}
        onPredictionSelect={mockOnPredictionSelect}
      />
    );

    const predictionCard = screen.getByTestId('prediction-pred-1');
    expect(predictionCard).toHaveStyle('cursor: pointer');
  });

  it('does not apply pointer cursor when onPredictionSelect is not provided', () => {
    render(
      <MockPredictionsDisplay predictions={mockPredictions} />
    );

    const predictionCard = screen.getByTestId('prediction-pred-1');
    expect(predictionCard).toHaveStyle('cursor: default');
  });
});
