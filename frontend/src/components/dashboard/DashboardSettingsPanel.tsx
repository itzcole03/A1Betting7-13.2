import { Save, X } from 'lucide-react';
import React from 'react';

export type DashboardLayout = 'compact' | 'comfortable' | 'spacious';

interface DashboardSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  showMetrics: boolean;
  onShowMetricsChange: (show: boolean) => void;
  enableRealTime: boolean;
  onEnableRealTimeChange: (enable: boolean) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (enable: boolean) => void;
}

const DashboardSettingsPanel: React.FC<DashboardSettingsPanelProps> = ({
  isOpen,
  onClose,
  layout,
  onLayoutChange,
  showMetrics,
  onShowMetricsChange,
  enableRealTime,
  onEnableRealTimeChange,
  autoRefresh,
  onAutoRefreshChange,
}) => {
  if (!isOpen) return null;

  const handleSave = () => {
    // Settings are auto-saved via localStorage in parent component
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Dashboard Settings</h3>
              <p className="text-sm text-slate-400 mt-1">Customize your experience</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Layout Density */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Layout Density
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'comfortable', 'spacious'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => onLayoutChange(l)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                      layout === l
                        ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-700/50'
                    }`}
                  >
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {layout === 'compact' && 'Maximize screen space'}
                {layout === 'comfortable' && 'Balanced spacing (recommended)'}
                {layout === 'spacious' && 'Extra breathing room'}
              </p>
            </div>
            
            {/* Toggle Settings */}
            <div className="space-y-4">
              {/* Performance Metrics */}
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <div>
                  <label className="text-sm font-medium text-slate-300 block">
                    Performance Metrics
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Show stats overview at top
                  </p>
                </div>
                <button
                  onClick={() => onShowMetricsChange(!showMetrics)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showMetrics ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle performance metrics"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showMetrics ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Real-time Updates */}
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <div>
                  <label className="text-sm font-medium text-slate-300 block">
                    Real-time Updates
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live odds and opportunities
                  </p>
                </div>
                <button
                  onClick={() => onEnableRealTimeChange(!enableRealTime)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableRealTime ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle real-time updates"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableRealTime ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Auto Refresh */}
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <div>
                  <label className="text-sm font-medium text-slate-300 block">
                    Auto Refresh
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Refresh data every 30 seconds
                  </p>
                </div>
                <button
                  onClick={() => onAutoRefreshChange(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle auto refresh"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <button
              onClick={handleSave}
              className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">
              Settings are saved automatically
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardSettingsPanel;
