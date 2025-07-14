import React from 'react';
import FeedbackWidget from './FeedbackWidget';

const FeedbackExamples: React.FC = () => {
  return (
    <div className='p-8 space-y-8'>
      <h1 className='text-2xl font-bold text-gray-900'>Feedback Widget Examples</h1>

      {/* Beta Feature Example */}
      <div className='bg-gray-50 p-6 rounded-lg'>
        <h2 className='text-lg font-semibold mb-4'>Beta Feature Feedback</h2>
        <div className='bg-white p-4 rounded border'>
          <h3 className='font-medium'>Real-Time Analysis Dashboard</h3>
          <p className='text-gray-600 mb-2'>Advanced sports betting analysis with ML models.</p>
          <FeedbackWidget trigger='beta' feature='real-time-analysis' />
        </div>
      </div>

      {/* General Feedback Example */}
      <div className='bg-gray-50 p-6 rounded-lg'>
        <h2 className='text-lg font-semibold mb-4'>General Application Feedback</h2>
        <p className='text-gray-600 mb-4'>
          The floating feedback button appears in the bottom-right corner of the application.
        </p>
        <div className='relative h-32 bg-white border rounded overflow-hidden'>
          <div className='absolute bottom-2 right-2'>
            <FeedbackWidget position='bottom-right' />
          </div>
        </div>
      </div>

      {/* Other Position Examples */}
      <div className='bg-gray-50 p-6 rounded-lg'>
        <h2 className='text-lg font-semibold mb-4'>Different Positions</h2>
        <div className='grid grid-cols-2 gap-4'>
          <div className='relative h-24 bg-white border rounded'>
            <div className='absolute top-2 left-2'>
              <FeedbackWidget position='top-left' />
            </div>
            <span className='absolute bottom-2 right-2 text-xs text-gray-500'>Top Left</span>
          </div>
          <div className='relative h-24 bg-white border rounded'>
            <div className='absolute top-2 right-2'>
              <FeedbackWidget position='top-right' />
            </div>
            <span className='absolute bottom-2 left-2 text-xs text-gray-500'>Top Right</span>
          </div>
          <div className='relative h-24 bg-white border rounded'>
            <div className='absolute bottom-2 left-2'>
              <FeedbackWidget position='bottom-left' />
            </div>
            <span className='absolute top-2 right-2 text-xs text-gray-500'>Bottom Left</span>
          </div>
          <div className='relative h-24 bg-white border rounded'>
            <div className='absolute bottom-2 right-2'>
              <FeedbackWidget position='bottom-right' />
            </div>
            <span className='absolute top-2 left-2 text-xs text-gray-500'>Bottom Right</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackExamples;
