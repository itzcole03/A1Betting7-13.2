import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Simple App component;
function App() {
  return (
    <div className='min-h-screen bg-gray-900 text-white' key={902029}>
      <div className='container mx-auto px-4 py-8' key={53071}>
        <h1 className='text-4xl font-bold text-center mb-8' key={118031}>
          A1 Betting Platform;
        </h1>
        <div className='text-center' key={120206}>
          <p className='text-lg mb-4' key={492535}>
            Welcome to the A1 Betting Platform;
          </p>
          <div className='bg-gray-800 rounded-lg p-6 max-w-md mx-auto' key={778059}>
            <h2 className='text-xl font-semibold mb-4' key={626401}>
              // Status
            </h2>
            <div className='space-y-2' key={725977}>
              <div className='flex justify-between' key={588832}>
                <span key={595076}>Frontend:</span>
                <span className='text-green-400' key={40612}>
                  ✓ Running
                </span>
              </div>
              <div className='flex justify-between' key={588832}>
                <span key={595076}>Backend:</span>
                <span className='text-yellow-400' key={476313}>
                  ⚠ Connecting...
                </span>
              </div>
              <div className='flex justify-between' key={588832}>
                <span key={595076}>Database:</span>
                <span className='text-yellow-400' key={476313}>
                  ⚠ Connecting...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
