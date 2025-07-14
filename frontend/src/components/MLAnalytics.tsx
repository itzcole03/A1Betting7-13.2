import React from 'react';
import { Card, CardContent, CardHeader } from './Card';

const mockModels = [
  { id: '1', name: 'Ensemble Model', accuracy: 0.964, lastTrained: '2025-01-18', status: 'active' },
  {
    id: '2',
    name: 'Quantum Predictor',
    accuracy: 0.958,
    lastTrained: '2025-01-17',
    status: 'active',
  },
  { id: '3', name: 'Legacy Model', accuracy: 0.921, lastTrained: '2025-01-10', status: 'inactive' },
];

/**
 * MLAnalytics Component
 *
 * Modern, accessible display of machine learning model performance and insights.
 * Shows model name, accuracy, last trained date, and status.
 */
export const MLAnalytics: React.FC = () => {
  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <h2 className='text-lg font-bold text-white'>ML Analytics</h2>
      </CardHeader>
      <CardContent>
        <table className='w-full text-sm text-left text-gray-400'>
          <thead>
            <tr>
              <th className='py-2 px-3'>Model</th>
              <th className='py-2 px-3'>Accuracy</th>
              <th className='py-2 px-3'>Last Trained</th>
              <th className='py-2 px-3'>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockModels.length === 0 ? (
              <tr>
                <td colSpan={4} className='text-center py-4 text-gray-500'>
                  No models found.
                </td>
              </tr>
            ) : (
              mockModels.map(model => (
                <tr key={model.id} className='border-b border-gray-700'>
                  <td className='py-2 px-3'>{model.name}</td>
                  <td className='py-2 px-3 text-cyan-400 font-semibold'>
                    {(model.accuracy * 100).toFixed(2)}%
                  </td>
                  <td className='py-2 px-3'>{model.lastTrained}</td>
                  <td
                    className={`py-2 px-3 font-semibold ${
                      model.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
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

export default MLAnalytics;
