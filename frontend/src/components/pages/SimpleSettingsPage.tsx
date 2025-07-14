import React from 'react';

const SimpleSettingsPage: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-6'>Settings</h1>

        <div className='bg-white rounded-lg shadow-lg p-6'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4'>User Preferences</h2>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Risk Tolerance</label>
              <select className='w-full p-2 border border-gray-300 rounded-md'>
                <option>Conservative</option>
                <option>Moderate</option>
                <option>Aggressive</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Portfolio Size ($)
              </label>
              <input
                type='number'
                className='w-full p-2 border border-gray-300 rounded-md'
                placeholder='1000'
              />
            </div>

            <div className='flex items-center'>
              <input type='checkbox' className='mr-2' />
              <label className='text-sm text-gray-700'>Enable notifications</label>
            </div>

            <div className='flex items-center'>
              <input type='checkbox' className='mr-2' />
              <label className='text-sm text-gray-700'>Auto-refresh data</label>
            </div>
          </div>

          <div className='mt-6'>
            <button className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'>
              Save Settings
            </button>
          </div>
        </div>

        <div className='mt-6 bg-white rounded-lg shadow-lg p-6'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4'>System Status</h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='p-4 bg-green-50 rounded-lg'>
              <div className='text-lg font-bold text-green-600'>✓ API Connected</div>
              <div className='text-sm text-gray-600'>All services operational</div>
            </div>

            <div className='p-4 bg-blue-50 rounded-lg'>
              <div className='text-lg font-bold text-blue-600'>87.3%</div>
              <div className='text-sm text-gray-600'>Prediction Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSettingsPage;
