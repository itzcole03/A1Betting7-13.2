import { User } from 'lucide-react';
import React from 'react';
// ...import types as needed...

interface PredictionCardProps {
  prop: any; // Replace with actual prop type
  onClick?: () => void;
  advancedAnalysisActive?: boolean;
}

const PredictionCard: React.FC<PredictionCardProps> = ({
  prop,
  onClick,
  advancedAnalysisActive,
}) => (
  <div
    className='bg-gray-800/60 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer backdrop-blur-sm'
    onClick={onClick}
  >
    <div className='flex items-center justify-between mb-4'>
      <div className='flex items-center space-x-3'>
        <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center'>
          <User className='w-5 h-5 text-white' />
        </div>
        <div>
          <div className='font-semibold'>{prop.player.name}</div>
          <div className='text-sm text-gray-400'>
            {prop.player.team} • {prop.player.position}
          </div>
        </div>
      </div>
      {advancedAnalysisActive && prop.quantumAI && <span>{prop.quantumAI.state}</span>}
    </div>
    <div className='mb-4'>
      <div className='flex items-center justify-between mb-2'>
        <span className='text-lg font-semibold'>{prop.prop.type}</span>
        <span className='text-2xl font-bold text-purple-400'>{prop.prop.line}</span>
      </div>
      <div className='flex items-center justify-between text-sm text-gray-400'>
        <span>vs {prop.matchup.opponent}</span>
        <span>{prop.prop.book}</span>
      </div>
    </div>
    {/* Add more details as needed */}
  </div>
);

export default PredictionCard;
