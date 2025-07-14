import { Brain } from 'lucide-react';
import React from 'react';

/**
 * PredictionDisplay - Shows latest AI/ML predictions and confidence.
 */
const PredictionDisplay: React.FC = () => {
  // Example predictions (replace with real data integration)
  const predictions = [
    { player: 'Luka Dončić', stat: 'Points', prediction: 'OVER', confidence: 92 },
    { player: 'Jayson Tatum', stat: 'Rebounds', prediction: 'UNDER', confidence: 88 },
    { player: 'Nikola Jokić', stat: 'Assists', prediction: 'OVER', confidence: 85 },
  ];

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4'>
        AI Predictions
      </h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {predictions.map((p, idx) => (
          <div
            key={idx}
            className='bg-slate-800/60 rounded-xl p-6 flex items-center space-x-4 shadow'
          >
            <Brain className='text-purple-400 w-8 h-8' />
            <div>
              <div className='text-lg font-bold text-white'>{p.player}</div>
              <div className='text-gray-400'>{p.stat}</div>
              <div className='text-cyan-400 font-semibold'>{p.prediction}</div>
              <div className='text-green-400 text-sm'>Confidence: {p.confidence}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PredictionDisplay;
