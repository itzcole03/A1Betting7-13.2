/**
 * Phase 3 Banner Component
 * Displays a prominent banner to access Phase 3 features
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles as SparklesIcon,
  X as XMarkIcon,
  Rocket as RocketLaunchIcon,
  BarChart3 as ChartBarIcon,
  Cpu as CpuChipIcon
} from 'lucide-react';

export const Phase3Banner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) return null;

  const handleExplorePhase3 = () => {
    navigate('/phase3');
  };

  return (
    <div className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 border border-purple-500/30 rounded-xl p-6 mb-6 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-300/10 rounded-full blur-xl transform -translate-x-4 translate-y-4"></div>
      
      {/* Close Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <RocketLaunchIcon className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-xl font-bold text-white">Phase 3 is Now Live!</h2>
              <span className="bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                NEW
              </span>
            </div>
            
            <p className="text-purple-100 mb-4 leading-relaxed">
              Experience the fully unified A1Betting architecture with consolidated domains, 
              advanced ML predictions, and real-time analytics. 91% route reduction, 96% service consolidation.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="h-5 w-5 text-purple-200" />
                <span className="text-sm text-purple-100">Advanced ML with SHAP</span>
              </div>
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-5 w-5 text-purple-200" />
                <span className="text-sm text-purple-100">Real-time Analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <CpuChipIcon className="h-5 w-5 text-purple-200" />
                <span className="text-sm text-purple-100">5 Unified Domains</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">91%</div>
                <div className="text-xs text-purple-200">Route Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">96%</div>
                <div className="text-xs text-purple-200">Service Consolidation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">73%</div>
                <div className="text-xs text-purple-200">Complexity Reduction</div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleExplorePhase3}
              className="bg-white text-purple-700 hover:bg-purple-50 font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
            >
              <RocketLaunchIcon className="h-4 w-4" />
              <span>Explore Phase 3</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phase3Banner;
