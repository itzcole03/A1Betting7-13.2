import React from 'react';
import { Card, CardContent, CardHeader } from './Card';

const mockPredictions = [
  { id: '1', event: 'Team A vs Team B', prediction: 'Over 2.5 Goals', confidence: 0.87 },
  { id: '2', event: 'Team C vs Team D', prediction: 'Team C Win', confidence: 0.78 },
];

/**
 * RealtimePredictionDisplay Component
 *
 * Modern, accessible display of live AI/ML predictions for the A1Betting platform.
 * Shows event, prediction, and confidence.
 */
export const RealtimePredictionDisplay: React.FC = () => {
  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <h2 className='text-lg font-bold text-white'>Realtime Predictions</h2>
      </CardHeader>
      <CardContent>
        <table className='w-full text-sm text-left text-gray-400'>
          <thead>
            <tr>
              <th className='py-2 px-3'>Event</th>
              <th className='py-2 px-3'>Prediction</th>
              <th className='py-2 px-3'>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {mockPredictions.length === 0 ? (
              <tr>
                <td colSpan={3} className='text-center py-4 text-gray-500'>
                  No predictions available.
                </td>
              </tr>
            ) : (
              mockPredictions.map(pred => (
                <tr key={pred.id} className='border-b border-gray-700'>
                  <td className='py-2 px-3'>{pred.event}</td>
                  <td className='py-2 px-3'>{pred.prediction}</td>
                  <td className='py-2 px-3 text-cyan-400 font-semibold'>
                    {(pred.confidence * 100).toFixed(1)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default RealtimePredictionDisplay;
