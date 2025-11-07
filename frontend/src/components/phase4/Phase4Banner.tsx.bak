/**
 * Phase 4 Banner Component
 * Displays launch preparation status and features
 */

import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket,
  X,
  CheckCircle,
  Monitor,
  Users,
  BookOpen,
  Shield,
  BarChart3,
  Zap,
  Target,
  Globe,
  Award
} from 'lucide-react';

export const Phase4Banner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) return null;

  const handleLaunchDashboard = () => {
    navigate('/launch-dashboard');
  };

  const launchCheckpoints = [
    { label: 'System Testing', status: 'complete', icon: CheckCircle },
    { label: 'User Onboarding', status: 'complete', icon: Users },
    { label: 'Documentation', status: 'complete', icon: BookOpen },
    { label: 'Monitoring Setup', status: 'active', icon: Monitor },
    { label: 'Security Validation', status: 'complete', icon: Shield },
    { label: 'Launch Readiness', status: 'pending', icon: Rocket }
  ];

  return (
    <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 border border-emerald-500/30 rounded-xl p-6 mb-6 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-300/10 rounded-full blur-xl transform -translate-x-6 translate-y-6"></div>
      <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-cyan-300/20 rounded-full blur-lg transform -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Close Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Rocket className="h-7 w-7 text-white animate-pulse" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-2xl font-bold text-white">Phase 4: Launch Preparation</h2>
              <span className="bg-emerald-400 text-emerald-900 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                FINAL
              </span>
            </div>
            
            <p className="text-emerald-100 mb-4 leading-relaxed">
              A1Betting is entering final launch preparation. Production systems are being optimized, 
              comprehensive testing is complete, and user onboarding flows are ready for deployment.
            </p>

            {/* Launch Readiness Checkpoints */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Launch Readiness Checkpoints
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {launchCheckpoints.map((checkpoint, index) => {
                  const Icon = checkpoint.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 p-2 rounded-lg ${
                        checkpoint.status === 'complete' 
                          ? 'bg-emerald-500/20 text-emerald-100' 
                          : checkpoint.status === 'active'
                          ? 'bg-yellow-500/20 text-yellow-100 animate-pulse'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{checkpoint.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                <Monitor className="h-5 w-5 text-emerald-200" />
                <span className="text-sm text-emerald-100 font-medium">Real-time Monitoring</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                <Users className="h-5 w-5 text-emerald-200" />
                <span className="text-sm text-emerald-100 font-medium">User Onboarding</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                <BookOpen className="h-5 w-5 text-emerald-200" />
                <span className="text-sm text-emerald-100 font-medium">Documentation</span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="flex items-center space-x-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-xs text-emerald-200">System Reliability</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">&lt;200ms</div>
                <div className="text-xs text-emerald-200">API Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">95%</div>
                <div className="text-xs text-emerald-200">Test Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-emerald-200">Feature Complete</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleLaunchDashboard}
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Launch Dashboard</span>
              </button>
              
              <button
                onClick={() => navigate('/onboarding')}
                className="bg-emerald-500/20 text-white border border-emerald-400/30 hover:bg-emerald-500/30 font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Try Onboarding</span>
              </button>

              <button
                onClick={() => navigate('/docs')}
                className="bg-emerald-500/20 text-white border border-emerald-400/30 hover:bg-emerald-500/30 font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <BookOpen className="h-4 w-4" />
                <span>Documentation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phase4Banner;
