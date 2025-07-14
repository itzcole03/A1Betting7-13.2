import React from 'react.ts';
/**
 * Props for the PredictionSummaryCard component;
 */
export interface PredictionSummaryProps {
  /** Model's prediction accuracy (0-100) */
  accuracy: number;
  /** Expected payout multiplier */
  payout: number;
  /** Kelly Criterion value (0-1) */
  kelly: number;
  /** Market edge percentage (can be negative) */
  marketEdge: number;
  /** Data quality score (0-100) */
  dataQuality: number;
  /** Name of the prediction model */
  modelName?: string;
  /** Confidence level (0-100) */
  confidence?: number;
  /** Additional CSS classes */
  className?: string;
  /** Last updated timestamp */
  lastUpdated?: Date;
  /** Risk level indicator */
  riskLevel?: 'low' | 'medium' | 'high';
  /** Callback when details button is clicked */
  onDetailsClick?: () => void;
  /** Callback when add to betslip is clicked */
  onAddToBetslip?: () => void;
  /** Whether the card is interactive */
  interactive?: boolean;
}
export declare const PredictionSummaryCard: React.FC<PredictionSummaryProps>;
export default PredictionSummaryCard;
