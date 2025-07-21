import React from 'react';

// Simple test component to isolate the error
const PrizePicksProUnifiedSimple: React.FC = () => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='p-8 bg-gray-900 text-white min-h-screen'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h1 className='text-3xl font-bold mb-4'>PrizePicks Pro - Test Component</h1>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p className='text-gray-400'>
        This is a simplified version to test if the basic component loads without errors.
      </p>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='mt-8 p-4 bg-gray-800 rounded-lg'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h2 className='text-xl font-semibold mb-2'>Test Status</h2>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <p>✅ Component loaded successfully</p>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <p>✅ Basic styling applied</p>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <p>🔄 Ready to test full component</p>
      </div>
    </div>
  );
};

export default PrizePicksProUnifiedSimple;
