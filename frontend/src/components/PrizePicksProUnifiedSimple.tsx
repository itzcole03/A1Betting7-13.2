import React from 'react';

// Simple test component to isolate the error
const PrizePicksProUnifiedSimple: React.FC = () => {
  return (
    <div className='p-8 bg-gray-900 text-white min-h-screen'>
      <h1 className='text-3xl font-bold mb-4'>PrizePicks Pro - Test Component</h1>
      <p className='text-gray-400'>
        This is a simplified version to test if the basic component loads without errors.
      </p>
      <div className='mt-8 p-4 bg-gray-800 rounded-lg'>
        <h2 className='text-xl font-semibold mb-2'>Test Status</h2>
        <p>✅ Component loaded successfully</p>
        <p>✅ Basic styling applied</p>
        <p>🔄 Ready to test full component</p>
      </div>
    </div>
  );
};

export default PrizePicksProUnifiedSimple;
