/**
 * CLV Integration Example
 * 
 * Shows how to integrate the MyCLVTab component into an existing 
 * bankroll/performance dashboard with tabbed interface.
 */

import React from 'react';
import { MyCLVTab } from './MyCLVTab';

// Example of how to integrate into existing dashboard
export const BankrollDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('overview');

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'performance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab('clv')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clv'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My CLV
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Bankroll Overview</h2>
            <p className="text-gray-600">Your overall bankroll and betting summary...</p>
            {/* Existing overview content */}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
            <p className="text-gray-600">Your deposit, withdrawal, and bet history...</p>
            {/* Existing transactions content */}
          </div>
        )}

        {activeTab === 'performance' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Performance Analytics</h2>
            <p className="text-gray-600">Your betting performance metrics...</p>
            {/* Existing performance content */}
          </div>
        )}

        {activeTab === 'clv' && (
          <MyCLVTab />
        )}
      </div>
    </div>
  );
};

// Example usage in main app
export const AppWithCLV: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <BankrollDashboard />
        </div>
      </div>
    </div>
  );
};

export default BankrollDashboard;