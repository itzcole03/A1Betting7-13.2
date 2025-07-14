import React from 'react';
import { Card, CardContent, CardHeader } from './Card';

const mockPatterns = [
  {
    id: '1',
    pattern: 'Over 2.5 Goals',
    confidence: 0.92,
    description: 'Detected in 8 of last 10 matches.',
  },
  {
    id: '2',
    pattern: 'First Half Draw',
    confidence: 0.81,
    description: 'Detected in 5 of last 7 matches.',
  },
];

/**
 * PatternRecognition Component
 *
 * Modern, accessible display of detected betting patterns and insights.
 * Shows pattern, confidence, and description.
 */
export const PatternRecognition: React.FC = () => {
  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <h2 className='text-lg font-bold text-white'>Pattern Recognition</h2>
      </CardHeader>
      <CardContent>
        <table className='w-full text-sm text-left text-gray-400'>
          <thead>
            <tr>
              <th className='py-2 px-3'>Pattern</th>
              <th className='py-2 px-3'>Confidence</th>
              <th className='py-2 px-3'>Description</th>
            </tr>
          </thead>
          <tbody>
            {mockPatterns.length === 0 ? (
              <tr>
                <td colSpan={3} className='text-center py-4 text-gray-500'>
                  No patterns detected.
                </td>
              </tr>
            ) : (
              mockPatterns.map(pat => (
                <tr key={pat.id} className='border-b border-gray-700'>
                  <td className='py-2 px-3'>{pat.pattern}</td>
                  <td className='py-2 px-3 text-cyan-400 font-semibold'>
                    {(pat.confidence * 100).toFixed(1)}%
                  </td>
                  <td className='py-2 px-3'>{pat.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default PatternRecognition;
