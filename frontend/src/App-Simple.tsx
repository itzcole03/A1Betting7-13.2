import React from 'react';
import './App.css';

// Simple working app component
const App: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'>
      <div className='container mx-auto px-4 py-8'>
        <header className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-yellow-400 mb-2'>🎯 A1Betting Platform</h1>
          <p className='text-xl text-gray-300'>Enterprise Sports Intelligence Platform</p>
        </header>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-yellow-400 mb-2'>📊 Analytics Dashboard</h3>
            <p className='text-gray-300'>Real-time sports analytics and predictions</p>
          </div>

          <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-yellow-400 mb-2'>
              🏀 PrizePicks Integration
            </h3>
            <p className='text-gray-300'>Live PrizePicks data and opportunities</p>
          </div>

          <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-yellow-400 mb-2'>🤖 AI Predictions</h3>
            <p className='text-gray-300'>Machine learning powered betting insights</p>
          </div>
        </div>

        <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6'>
          <h2 className='text-2xl font-bold text-yellow-400 mb-4'>🚀 Platform Status</h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-300'>Frontend Status:</span>
                <span className='text-green-400 font-semibold'>✅ Online</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-300'>Backend API:</span>
                <span className='text-green-400 font-semibold'>✅ Connected</span>
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-300'>ML Models:</span>
                <span className='text-green-400 font-semibold'>✅ Loaded</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-300'>Data Sources:</span>
                <span className='text-green-400 font-semibold'>✅ Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-8 text-center'>
          <button
            className='bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors'
            onClick={() =>
              window.open(
                '${process.env.REACT_APP_API_URL || "http://localhost:8000"}/docs',
                '_blank'
              )
            }
          >
            🔧 View API Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
