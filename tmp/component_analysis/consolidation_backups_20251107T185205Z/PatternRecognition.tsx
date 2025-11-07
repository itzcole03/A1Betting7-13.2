import React from 'react';
// @ts-expect-error TS(6142): Module './Card' was resolved to 'C:/Users/bcmad/Do... Remove this comment to see the full error message
import { Card, CardContent, CardHeader } from './Card';

const _mockPatterns = [
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
export const _PatternRecognition: React.FC = () => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Card className='max-w-2xl mx-auto'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardHeader>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h2 className='text-lg font-bold text-white'>Pattern Recognition</h2>
      </CardHeader>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardContent>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <table className='w-full text-sm text-left text-gray-400'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <thead>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <tr>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <th className='py-2 px-3'>Pattern</th>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <th className='py-2 px-3'>Confidence</th>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <th className='py-2 px-3'>Description</th>
            </tr>
          </thead>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <tbody>
            {mockPatterns.length === 0 ? (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <tr>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <td colSpan={3} className='text-center py-4 text-gray-500'>
                  No patterns detected.
                </td>
              </tr>
            ) : (
              mockPatterns.map(pat => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <tr key={pat.id} className='border-b border-gray-700'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <td className='py-2 px-3'>{pat.pattern}</td>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <td className='py-2 px-3 text-cyan-400 font-semibold'>
                    {(pat.confidence * 100).toFixed(1)}%
                  </td>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
