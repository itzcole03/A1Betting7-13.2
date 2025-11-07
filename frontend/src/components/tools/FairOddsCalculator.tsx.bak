import React, { useState } from 'react';

export default function FairOddsCalculator() {
  const [projectionValue, setProjectionValue] = useState('');
  const [marketLine, setMarketLine] = useState('');
  const [result, setResult] = useState(null);

  const calculateFairOdds = async () => {
    try {
      const response = await fetch('/api/tools/fair-odds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projection_value: parseFloat(projectionValue),
          market_line: parseFloat(marketLine),
          market_type: 'over_under'
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Fair Odds Calculator</h1>
      
      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Your Projection</label>
          <input
            type="number"
            step="0.1"
            className="w-full px-3 py-2 border rounded-md"
            value={projectionValue}
            onChange={(e) => setProjectionValue(e.target.value)}
            placeholder="e.g., 8.5"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Market Line</label>
          <input
            type="number"
            step="0.1"
            className="w-full px-3 py-2 border rounded-md"
            value={marketLine}
            onChange={(e) => setMarketLine(e.target.value)}
            placeholder="e.g., 8.0"
          />
        </div>
        
        <button
          onClick={calculateFairOdds}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          disabled={!projectionValue || !marketLine}
        >
          Calculate Fair Odds
        </button>
        
        {result && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Results:</h3>
            <div className="space-y-2">
              <p>Fair Odds (Decimal): {result.fair_odds_decimal?.toFixed(2)}</p>
              <p>Fair Odds (American): {result.fair_odds_american > 0 ? '+' : ''}{result.fair_odds_american}</p>
              <p>Implied Probability: {result.implied_probability?.toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
