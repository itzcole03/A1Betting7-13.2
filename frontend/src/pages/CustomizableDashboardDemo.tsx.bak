/**
 * Customizable Dashboard Demo Page
 * Phase 3: Advanced UI Features - Showcases the customizable dashboard system
 * 
 * Features:
 * - Live dashboard customization
 * - Widget drag and drop
 * - Layout saving and loading
 * - Real-time data updates
 * - Template selection
 */

import React, { useState, useEffect } from 'react';
import { 
  Grid,
  Sparkles,
  Save,
  Eye,
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Download,
  Share2,
  Clock,
  Star,
  Zap
} from 'lucide-react';

import CustomizableDashboard from '../components/dashboard/CustomizableDashboard';
import { DashboardLayout } from '../components/dashboard/CustomizableDashboard';

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  widgets: string[];
  previewImage?: string;
}

const CustomizableDashboardDemo: React.FC = () => {
  const [selectedLayout, setSelectedLayout] = useState<DashboardLayout | null>(null);
  const [availableLayouts, setAvailableLayouts] = useState<DashboardLayout[]>([]);
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [demoStats, setDemoStats] = useState({
    layoutsSaved: 0,
    widgetsAdded: 0,
    dataRefreshes: 0,
    customizations: 0
  });

  // Load demo data
  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    setIsLoading(true);
    
    try {
      // Mock data - in production, fetch from APIs
      const mockLayouts: DashboardLayout[] = [
        {
          id: 'default',
          name: 'Default Dashboard',
          description: 'Standard sports betting overview',
          widgets: [
            {
              id: 'profit_card',
              type: 'stats_card',
              title: 'Total Profit',
              x: 0, y: 0, width: 2, height: 1,
              config: { metric: 'total_profit', format: 'currency' },
              visible: true,
              refreshInterval: 30
            },
            {
              id: 'recent_bets',
              type: 'recent_bets',
              title: 'Recent Activity',
              x: 2, y: 0, width: 4, height: 2,
              config: { limit: 8, showStatus: true },
              visible: true,
              refreshInterval: 10
            }
          ],
          gridCols: 6,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          isDefault: true,
          isPublic: false,
          tags: ['default']
        },
        {
          id: 'analytics_focused',
          name: 'Analytics Dashboard',
          description: 'Performance and analytics focused',
          widgets: [
            {
              id: 'performance_chart',
              type: 'line_chart',
              title: 'Performance Over Time',
              x: 0, y: 0, width: 4, height: 2,
              config: { dataSource: 'performance_history', timeframe: '30d' },
              visible: true,
              refreshInterval: 300
            },
            {
              id: 'roi_card',
              type: 'stats_card',
              title: 'ROI',
              x: 4, y: 0, width: 2, height: 1,
              config: { metric: 'roi', format: 'percentage' },
              visible: true,
              refreshInterval: 60
            }
          ],
          gridCols: 6,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          isDefault: false,
          isPublic: true,
          tags: ['analytics', 'performance']
        }
      ];

      const mockTemplates: DashboardTemplate[] = [
        {
          id: 'beginner',
          name: 'Beginner',
          description: 'Simple dashboard for new users',
          category: 'starter',
          widgets: ['stats_card', 'recent_bets']
        },
        {
          id: 'professional',
          name: 'Professional Trader',
          description: 'Advanced analytics and monitoring',
          category: 'advanced',
          widgets: ['line_chart', 'prop_opportunities', 'bankroll_tracker', 'performance_metrics']
        },
        {
          id: 'live_betting',
          name: 'Live Betting',
          description: 'Real-time opportunities and monitoring',
          category: 'live',
          widgets: ['live_odds', 'prop_opportunities', 'recent_bets']
        }
      ];

      setAvailableLayouts(mockLayouts);
      setTemplates(mockTemplates);
      setSelectedLayout(mockLayouts[0]);
      
    } catch (error) {
      console.error('Failed to load demo data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLayoutChange = (layout: DashboardLayout) => {
    setSelectedLayout(layout);
    setDemoStats(prev => ({
      ...prev,
      layoutsSaved: prev.layoutsSaved + 1,
      customizations: prev.customizations + 1
    }));
  };

  const handleTemplateSelect = (template: DashboardTemplate) => {
    // Create layout from template
    const newLayout: DashboardLayout = {
      id: `template_${template.id}_${Date.now()}`,
      name: `${template.name} Dashboard`,
      description: template.description,
      widgets: [], // Would be populated based on template.widgets
      gridCols: 6,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isDefault: false,
      isPublic: false,
      tags: [template.category]
    };
    
    setSelectedLayout(newLayout);
    setDemoStats(prev => ({
      ...prev,
      customizations: prev.customizations + 1
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customizable dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                    <Grid className="w-8 h-8 text-white" />
                  </div>
                  <span>Customizable Dashboard System</span>
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Phase 3: Drag-and-drop widgets with real-time data updates
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Phase 3 Status</p>
                  <p className="text-lg font-semibold text-green-600">Advanced UI Features</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Layout Selector */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Save className="w-5 h-5 text-blue-600" />
                <span>Saved Layouts</span>
              </h3>
              <div className="space-y-2">
                {availableLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => setSelectedLayout(layout)}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      selectedLayout?.id === layout.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <h4 className={`font-medium ${
                      selectedLayout?.id === layout.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {layout.name}
                    </h4>
                    <p className={`text-sm ${
                      selectedLayout?.id === layout.id ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {layout.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {layout.widgets.length} widgets
                      </span>
                      {layout.isDefault && (
                        <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                      {layout.isPublic && (
                        <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                          Public
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Templates</span>
              </h3>
              <div className="space-y-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50"
                  >
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded">
                        {template.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {template.widgets.length} widgets
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Demo Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <span>Session Stats</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Layouts Saved:</span>
                  <span className="font-medium">{demoStats.layoutsSaved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Widgets Added:</span>
                  <span className="font-medium">{demoStats.widgetsAdded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Data Refreshes:</span>
                  <span className="font-medium">{demoStats.dataRefreshes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customizations:</span>
                  <span className="font-medium">{demoStats.customizations}</span>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Features</h3>
              <div className="space-y-3">
                <FeatureItem icon={Grid} text="Drag & Drop Layout" />
                <FeatureItem icon={Zap} text="Real-time Updates" />
                <FeatureItem icon={Save} text="Save/Load Layouts" />
                <FeatureItem icon={Eye} text="Widget Visibility" />
                <FeatureItem icon={Settings} text="Widget Configuration" />
                <FeatureItem icon={Download} text="Export Data" />
              </div>
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="lg:col-span-3">
            {selectedLayout ? (
              <CustomizableDashboard
                userId="demo_user"
                initialLayout={selectedLayout}
                onLayoutChange={handleLayoutChange}
                readOnly={false}
                className="h-[800px]"
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a Dashboard Layout
                </h3>
                <p className="text-gray-500">
                  Choose from saved layouts or templates to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ShowcaseCard
            icon={Grid}
            title="Drag & Drop Interface"
            description="Intuitive drag-and-drop widget positioning with responsive grid system"
            color="bg-blue-500"
          />
          <ShowcaseCard
            icon={Zap}
            title="Real-time Data"
            description="Live data updates with configurable refresh intervals for each widget"
            color="bg-green-500"
          />
          <ShowcaseCard
            icon={Settings}
            title="Widget Configuration"
            description="Customizable widget settings, data sources, and display options"
            color="bg-purple-500"
          />
          <ShowcaseCard
            icon={Target}
            title="Smart Analytics"
            description="AI-powered insights and recommendations based on user behavior"
            color="bg-orange-500"
          />
        </div>
      </div>
    </div>
  );
};

// Feature Item Component
const FeatureItem: React.FC<{
  icon: React.ComponentType<any>;
  text: string;
}> = ({ icon: Icon, text }) => (
  <div className="flex items-center space-x-2">
    <Icon className="w-4 h-4 text-blue-600" />
    <span className="text-sm text-gray-700">{text}</span>
  </div>
);

// Showcase Card Component
const ShowcaseCard: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  color: string;
}> = ({ icon: Icon, title, description, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center space-x-3 mb-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default CustomizableDashboardDemo;
