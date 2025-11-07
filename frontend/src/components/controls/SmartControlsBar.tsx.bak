/**
 * SmartControlsBar Component with Risk Profiles and Confidence Thresholds
 * Provides real-time parameter controls for prediction models and betting strategies
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

// Types
interface RiskProfile {
  id: string;
  name: string;
  description: string;
  kellyFraction: number;
  maxBankrollPercent: number;
  confidenceThreshold: number;
  color: string;
  icon: string;
}

interface BankrollSettings {
  totalBankroll: number;
  maxDailyRisk: number;
  maxSingleBet: number;
  stopLossThreshold: number;
}

interface ParameterUpdate {
  riskProfile: RiskProfile;
  confidenceThreshold: number;
  bankrollSettings: BankrollSettings;
}

interface SmartControlsBarProps {
  onRiskProfileChange?: (profile: RiskProfile) => void;
  onConfidenceThresholdChange?: (threshold: number) => void;
  onBankrollSettingsChange?: (settings: BankrollSettings) => void;
  onParameterUpdate?: (params: ParameterUpdate) => void;
  initialRiskProfile?: string;
  initialConfidenceThreshold?: number;
  initialBankroll?: number;
  enableRealTimeUpdates?: boolean;
  className?: string;
}

const SmartControlsBar: React.FC<SmartControlsBarProps> = ({
  onRiskProfileChange,
  onConfidenceThresholdChange,
  onBankrollSettingsChange,
  onParameterUpdate,
  initialRiskProfile = 'moderate',
  initialConfidenceThreshold = 85,
  initialBankroll = 1000,
  enableRealTimeUpdates = true,
  className = '',
}) => {
  // Risk profiles configuration
  const riskProfiles: RiskProfile[] = useMemo(() => [
    {
      id: 'conservative',
      name: 'Conservative',
      description: 'Low risk, steady returns. Focus on high-confidence bets.',
      kellyFraction: 0.25,
      maxBankrollPercent: 2,
      confidenceThreshold: 90,
      color: 'green',
      icon: '🛡️',
    },
    {
      id: 'moderate',
      name: 'Moderate',
      description: 'Balanced approach between risk and reward.',
      kellyFraction: 0.5,
      maxBankrollPercent: 5,
      confidenceThreshold: 80,
      color: 'blue',
      icon: '⚖️',
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      description: 'High risk, high reward. Capitalize on opportunities.',
      kellyFraction: 0.75,
      maxBankrollPercent: 8,
      confidenceThreshold: 70,
      color: 'red',
      icon: '🚀',
    },
  ], []);

  // State management
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile>(
    () => riskProfiles.find(p => p.id === initialRiskProfile) || riskProfiles[1]
  );
  const [confidenceThreshold, setConfidenceThreshold] = useState(initialConfidenceThreshold);
  const [bankrollSettings, setBankrollSettings] = useState<BankrollSettings>({
    totalBankroll: initialBankroll,
    maxDailyRisk: initialBankroll * 0.15,
    maxSingleBet: initialBankroll * 0.05,
    stopLossThreshold: initialBankroll * 0.1,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');

  // Update API with new parameters
  const updateBackendParameters = useCallback(async (params: ParameterUpdate) => {
    if (!enableRealTimeUpdates) return;

    setApiStatus('updating');
    try {
      const response = await fetch('/api/enhanced-ml/update-parameters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          risk_profile: params.riskProfile,
          confidence_threshold: params.confidenceThreshold,
          bankroll_settings: params.bankrollSettings,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API update failed: ${response.status}`);
      }

      setApiStatus('success');
      setLastUpdateTime(new Date());
      toast.success('Parameters updated successfully', {
        duration: 2000,
        position: 'top-right',
      });

      // Call parent callback
      onParameterUpdate?.(params);
    } catch {
      setApiStatus('error');
      toast.error('Failed to update parameters', {
        duration: 3000,
        position: 'top-right',
      });
    }
  }, [enableRealTimeUpdates, onParameterUpdate]);

  // Handle risk profile change
  const handleRiskProfileChange = useCallback((profile: RiskProfile) => {
    setSelectedProfile(profile);
    setConfidenceThreshold(profile.confidenceThreshold);
    
    // Update bankroll settings based on new profile
    setBankrollSettings(prev => ({
      ...prev,
      maxDailyRisk: prev.totalBankroll * (profile.maxBankrollPercent * 3 / 100),
      maxSingleBet: prev.totalBankroll * (profile.maxBankrollPercent / 100),
    }));

    onRiskProfileChange?.(profile);

    // Update backend
    const params = {
      riskProfile: profile,
      confidenceThreshold: profile.confidenceThreshold,
      bankrollSettings: bankrollSettings,
    };
    updateBackendParameters(params);
  }, [bankrollSettings, onRiskProfileChange, updateBackendParameters]);

  // Handle confidence threshold change
  const handleConfidenceThresholdChange = useCallback((threshold: number) => {
    setConfidenceThreshold(threshold);
    onConfidenceThresholdChange?.(threshold);

    // Update backend
    const params = {
      riskProfile: selectedProfile,
      confidenceThreshold: threshold,
      bankrollSettings: bankrollSettings,
    };
    updateBackendParameters(params);
  }, [selectedProfile, bankrollSettings, onConfidenceThresholdChange, updateBackendParameters]);

  // Handle bankroll settings change
  const handleBankrollChange = useCallback((field: keyof BankrollSettings, value: number) => {
    const newSettings = { ...bankrollSettings, [field]: value };
    
    // Ensure logical constraints
    if (field === 'totalBankroll') {
      newSettings.maxDailyRisk = Math.min(newSettings.maxDailyRisk, value * 0.2);
      newSettings.maxSingleBet = Math.min(newSettings.maxSingleBet, value * 0.1);
      newSettings.stopLossThreshold = Math.min(newSettings.stopLossThreshold, value * 0.15);
    }
    
    setBankrollSettings(newSettings);
    onBankrollSettingsChange?.(newSettings);

    // Update backend
    const params = {
      riskProfile: selectedProfile,
      confidenceThreshold: confidenceThreshold,
      bankrollSettings: newSettings,
    };
    updateBackendParameters(params);
  }, [bankrollSettings, selectedProfile, confidenceThreshold, onBankrollSettingsChange, updateBackendParameters]);

  // Color schemes for different risk profiles
  const getProfileColors = useCallback((color: string) => {
    const colors = {
      green: {
        bg: 'bg-green-600',
        hoverBg: 'hover:bg-green-700',
        text: 'text-green-400',
        border: 'border-green-500',
        selected: 'ring-green-500',
      },
      blue: {
        bg: 'bg-blue-600',
        hoverBg: 'hover:bg-blue-700',
        text: 'text-blue-400',
        border: 'border-blue-500',
        selected: 'ring-blue-500',
      },
      red: {
        bg: 'bg-red-600',
        hoverBg: 'hover:bg-red-700',
        text: 'text-red-400',
        border: 'border-red-500',
        selected: 'ring-red-500',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  }, []);

  // Status indicator
  const StatusIndicator = useMemo(() => {
    const statusConfig = {
      idle: { color: 'text-slate-400', icon: '⚪', text: 'Ready' },
      updating: { color: 'text-yellow-400', icon: '🔄', text: 'Updating...' },
      success: { color: 'text-green-400', icon: '✅', text: 'Updated' },
      error: { color: 'text-red-400', icon: '❌', text: 'Error' },
    };
    
    const config = statusConfig[apiStatus];
    return (
      <div className={`flex items-center gap-1 text-xs ${config.color}`}>
        <span className={apiStatus === 'updating' ? 'animate-spin' : ''}>
          {config.icon}
        </span>
        <span>{config.text}</span>
      </div>
    );
  }, [apiStatus]);

  // Auto-reset status
  useEffect(() => {
    if (apiStatus === 'success' || apiStatus === 'error') {
      const timer = setTimeout(() => setApiStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [apiStatus]);

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Smart Controls</h3>
            {lastUpdateTime && (
              <span className="text-xs text-slate-400">
                Updated {lastUpdateTime.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {StatusIndicator}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </div>
      </div>

      {/* Risk Profile Selection */}
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Risk Profile
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {riskProfiles.map((profile) => {
              const colors = getProfileColors(profile.color);
              const isSelected = selectedProfile.id === profile.id;
              
              return (
                <button
                  key={profile.id}
                  onClick={() => handleRiskProfileChange(profile)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `${colors.border} ring-2 ${colors.selected} bg-slate-700`
                      : 'border-slate-600 hover:border-slate-500 bg-slate-750'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{profile.icon}</span>
                    <span className="font-medium text-white text-sm">
                      {profile.name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 text-left">
                    {profile.description}
                  </div>
                  {isSelected && (
                    <div className="mt-2 text-xs text-slate-300">
                      <div>Kelly: {(profile.kellyFraction * 100).toFixed(0)}%</div>
                      <div>Max Bet: {profile.maxBankrollPercent}%</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">
              Confidence Threshold
            </label>
            <span className={`text-sm font-bold ${
              confidenceThreshold >= 90 ? 'text-green-400' :
              confidenceThreshold >= 80 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {confidenceThreshold}%
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="60"
              max="99"
              value={confidenceThreshold}
              onChange={(e) => handleConfidenceThresholdChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, 
                  #ef4444 0%, 
                  #f59e0b ${((confidenceThreshold - 60) / 39) * 50}%, 
                  #10b981 ${((confidenceThreshold - 60) / 39) * 100}%
                )`
              }}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>60%</span>
              <span>High Confidence</span>
              <span>99%</span>
            </div>
          </div>
        </div>

        {/* Expanded Controls */}
        {isExpanded && (
          <div className="space-y-4 border-t border-slate-700 pt-4">
            {/* Bankroll Settings */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">
                Bankroll Management
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Total Bankroll ($)
                  </label>
                  <input
                    type="number"
                    value={bankrollSettings.totalBankroll}
                    onChange={(e) => handleBankrollChange('totalBankroll', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="100"
                    max="1000000"
                    step="100"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Max Single Bet ($)
                  </label>
                  <input
                    type="number"
                    value={bankrollSettings.maxSingleBet}
                    onChange={(e) => handleBankrollChange('maxSingleBet', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max={bankrollSettings.totalBankroll * 0.1}
                    step="10"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Max Daily Risk ($)
                  </label>
                  <input
                    type="number"
                    value={bankrollSettings.maxDailyRisk}
                    onChange={(e) => handleBankrollChange('maxDailyRisk', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max={bankrollSettings.totalBankroll * 0.2}
                    step="10"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Stop Loss ($)
                  </label>
                  <input
                    type="number"
                    value={bankrollSettings.stopLossThreshold}
                    onChange={(e) => handleBankrollChange('stopLossThreshold', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max={bankrollSettings.totalBankroll * 0.15}
                    step="10"
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-750 rounded-lg p-3">
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Current Settings Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-400">Risk Level</div>
                  <div className={`font-medium ${getProfileColors(selectedProfile.color).text}`}>
                    {selectedProfile.name}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Min Confidence</div>
                  <div className="font-medium text-white">
                    {confidenceThreshold}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Kelly Fraction</div>
                  <div className="font-medium text-white">
                    {(selectedProfile.kellyFraction * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Max Bet %</div>
                  <div className="font-medium text-white">
                    {((bankrollSettings.maxSingleBet / bankrollSettings.totalBankroll) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartControlsBar;
