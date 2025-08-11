/**
 * Customizable Dashboard System
 * Phase 3: Advanced UI Features - User-configurable dashboard with drag-and-drop widgets
 * 
 * Features:
 * - Drag and drop layout customization
 * - Widget library with various chart types
 * - Personalized dashboard configurations
 * - Real-time data updates
 * - Responsive grid system
 * - Save/load dashboard layouts
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Grid,
  Plus,
  Settings,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Move,
  X,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Clock,
  Star,
  Activity,
  Zap,
  Filter,
  Download,
  Share2,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Widget types
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: Record<string, any>;
  visible: boolean;
  dataSource?: string;
  refreshInterval?: number; // in seconds
}

export type WidgetType = 
  | 'line_chart'
  | 'bar_chart' 
  | 'pie_chart'
  | 'stats_card'
  | 'recent_bets'
  | 'live_odds'
  | 'bankroll_tracker'
  | 'performance_metrics'
  | 'prop_opportunities'
  | 'news_feed'
  | 'weather_widget'
  | 'calendar'
  | 'leaderboard'
  | 'profit_loss';

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  gridCols: number;
  createdAt: string;
  lastModified: string;
  isDefault: boolean;
  isPublic: boolean;
  tags: string[];
}

interface CustomizableDashboardProps {
  userId?: string;
  initialLayout?: DashboardLayout;
  onLayoutChange?: (layout: DashboardLayout) => void;
  readOnly?: boolean;
  className?: string;
}

const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  userId,
  initialLayout,
  onLayoutChange,
  readOnly = false,
  className = ''
}) => {
  // State management
  const [layout, setLayout] = useState<DashboardLayout>(
    initialLayout || createDefaultLayout()
  );
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Widget library configuration
  const widgetLibrary = useMemo(() => [
    {
      type: 'stats_card' as WidgetType,
      name: 'Stats Card',
      icon: BarChart3,
      description: 'Display key metrics and KPIs',
      defaultConfig: { metric: 'total_profit', format: 'currency' },
      defaultSize: { width: 2, height: 1 }
    },
    {
      type: 'line_chart' as WidgetType,
      name: 'Line Chart',
      icon: LineChart,
      description: 'Show trends over time',
      defaultConfig: { dataSource: 'bankroll_history', timeframe: '30d' },
      defaultSize: { width: 4, height: 2 }
    },
    {
      type: 'bar_chart' as WidgetType,
      name: 'Bar Chart',
      icon: BarChart3,
      description: 'Compare categories',
      defaultConfig: { dataSource: 'sport_performance', groupBy: 'sport' },
      defaultSize: { width: 3, height: 2 }
    },
    {
      type: 'pie_chart' as WidgetType,
      name: 'Pie Chart',
      icon: PieChart,
      description: 'Show proportions',
      defaultConfig: { dataSource: 'bet_distribution', groupBy: 'outcome' },
      defaultSize: { width: 2, height: 2 }
    },
    {
      type: 'recent_bets' as WidgetType,
      name: 'Recent Bets',
      icon: Clock,
      description: 'Latest betting activity',
      defaultConfig: { limit: 10, showStatus: true },
      defaultSize: { width: 4, height: 3 }
    },
    {
      type: 'live_odds' as WidgetType,
      name: 'Live Odds',
      icon: TrendingUp,
      description: 'Real-time odds comparison',
      defaultConfig: { sports: ['NBA', 'NFL'], markets: ['moneyline', 'spread'] },
      defaultSize: { width: 3, height: 2 }
    },
    {
      type: 'bankroll_tracker' as WidgetType,
      name: 'Bankroll Tracker',
      icon: DollarSign,
      description: 'Monitor your bankroll',
      defaultConfig: { showProjection: true, timeframe: '7d' },
      defaultSize: { width: 3, height: 2 }
    },
    {
      type: 'performance_metrics' as WidgetType,
      name: 'Performance Metrics',
      icon: Target,
      description: 'Track betting performance',
      defaultConfig: { metrics: ['roi', 'win_rate', 'avg_odds'] },
      defaultSize: { width: 4, height: 2 }
    },
    {
      type: 'prop_opportunities' as WidgetType,
      name: 'Prop Opportunities',
      icon: Star,
      description: 'High-value prop bets',
      defaultConfig: { minConfidence: 0.8, minEV: 0.05 },
      defaultSize: { width: 4, height: 3 }
    }
  ], []);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data: Record<string, any> = {};
      
      // Load data for each widget
      for (const widget of layout.widgets) {
        if (widget.visible) {
          data[widget.id] = await loadWidgetData(widget);
        }
      }
      
      setWidgetData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [layout.widgets]);

  // Load data for a specific widget
  const loadWidgetData = async (widget: Widget): Promise<any> => {
    // Mock data loading - in production, fetch from APIs
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    
    switch (widget.type) {
      case 'stats_card':
        return {
          value: Math.random() * 10000,
          change: (Math.random() - 0.5) * 20,
          label: widget.config.metric || 'Metric'
        };
        
      case 'line_chart':
        return {
          data: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.random() * 1000 + 500
          }))
        };
        
      case 'recent_bets':
        return {
          bets: Array.from({ length: widget.config.limit || 10 }, (_, i) => ({
            id: `bet_${i}`,
            player: ['LeBron James', 'Stephen Curry', 'Aaron Judge'][Math.floor(Math.random() * 3)],
            prop: ['Points', 'Assists', 'Home Runs'][Math.floor(Math.random() * 3)],
            line: Math.random() * 50,
            status: ['pending', 'won', 'lost'][Math.floor(Math.random() * 3)],
            amount: Math.random() * 100,
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          }))
        };
        
      case 'prop_opportunities':
        return {
          opportunities: Array.from({ length: 8 }, (_, i) => ({
            id: `opp_${i}`,
            player: ['LeBron James', 'Stephen Curry', 'Aaron Judge', 'Josh Allen'][Math.floor(Math.random() * 4)],
            prop: ['Points Over', 'Assists Over', 'Rebounds Over'][Math.floor(Math.random() * 3)],
            line: Math.random() * 30,
            prediction: Math.random() * 35,
            confidence: 0.7 + Math.random() * 0.3,
            ev: Math.random() * 0.2,
            sportsbook: ['DraftKings', 'FanDuel', 'BetMGM'][Math.floor(Math.random() * 3)]
          }))
        };
        
      default:
        return { message: 'Widget data loading...' };
    }
  };

  // Handle widget drag and drop
  const handleWidgetDragStart = (widget: Widget) => {
    setDraggedWidget(widget);
  };

  const handleWidgetDrop = (x: number, y: number) => {
    if (draggedWidget) {
      updateWidget(draggedWidget.id, { x, y });
      setDraggedWidget(null);
    }
  };

  // Update widget properties
  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      ),
      lastModified: new Date().toISOString()
    }));
  };

  // Add new widget
  const addWidget = (widgetType: WidgetType) => {
    const widgetConfig = widgetLibrary.find(w => w.type === widgetType);
    if (!widgetConfig) return;

    const newWidget: Widget = {
      id: `widget_${Date.now()}`,
      type: widgetType,
      title: widgetConfig.name,
      x: 0,
      y: 0,
      width: widgetConfig.defaultSize.width,
      height: widgetConfig.defaultSize.height,
      config: widgetConfig.defaultConfig,
      visible: true,
      refreshInterval: 30
    };

    setLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      lastModified: new Date().toISOString()
    }));

    setShowWidgetLibrary(false);
  };

  // Remove widget
  const removeWidget = (widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => widget.id !== widgetId),
      lastModified: new Date().toISOString()
    }));
  };

  // Save layout
  const saveLayout = async () => {
    try {
      // Mock save - in production, save to backend
      console.log('Saving layout:', layout);
      if (onLayoutChange) {
        onLayoutChange(layout);
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  };

  // Load dashboard data on mount and when layout changes
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Set up auto-refresh for widgets
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    layout.widgets.forEach(widget => {
      if (widget.visible && widget.refreshInterval) {
        const interval = setInterval(async () => {
          const data = await loadWidgetData(widget);
          setWidgetData(prev => ({ ...prev, [widget.id]: data }));
        }, widget.refreshInterval * 1000);
        
        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [layout.widgets]);

  return (
    <div className={`customizable-dashboard h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Grid className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-800">{layout.name}</h1>
          {layout.description && (
            <span className="text-sm text-gray-600">- {layout.description}</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Widget</span>
          </button>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-md ${
              isEditing 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{isEditing ? 'Done' : 'Edit'}</span>
          </button>

          {isEditing && (
            <button
              onClick={saveLayout}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          )}

          <button
            onClick={loadDashboardData}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Widget Library */}
      {showWidgetLibrary && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Add Widget</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {widgetLibrary.map((widgetConfig) => (
              <button
                key={widgetConfig.type}
                onClick={() => addWidget(widgetConfig.type)}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left"
              >
                <widgetConfig.icon className="w-6 h-6 text-blue-600 mb-2" />
                <h4 className="font-medium text-gray-800 text-sm">{widgetConfig.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{widgetConfig.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className={`grid gap-4 h-full`} style={{
          gridTemplateColumns: `repeat(${layout.gridCols || 6}, minmax(0, 1fr))`,
          gridAutoRows: '200px'
        }}>
          {layout.widgets
            .filter(widget => widget.visible)
            .map((widget) => (
              <DashboardWidget
                key={widget.id}
                widget={widget}
                data={widgetData[widget.id]}
                isEditing={isEditing}
                isSelected={selectedWidget === widget.id}
                onSelect={() => setSelectedWidget(widget.id)}
                onUpdate={(updates) => updateWidget(widget.id, updates)}
                onRemove={() => removeWidget(widget.id)}
                onDragStart={() => handleWidgetDragStart(widget)}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

// Individual Widget Component
interface DashboardWidgetProps {
  widget: Widget;
  data?: any;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Widget>) => void;
  onRemove: () => void;
  onDragStart: () => void;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  data,
  isEditing,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onDragStart
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const gridStyle = {
    gridColumn: `span ${widget.width}`,
    gridRow: `span ${widget.height}`
  };

  const renderWidgetContent = () => {
    if (!data) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (widget.type) {
      case 'stats_card':
        return <StatsCardWidget data={data} config={widget.config} />;
      case 'line_chart':
        return <LineChartWidget data={data} config={widget.config} />;
      case 'recent_bets':
        return <RecentBetsWidget data={data} config={widget.config} />;
      case 'prop_opportunities':
        return <PropOpportunitiesWidget data={data} config={widget.config} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Widget: {widget.type}
          </div>
        );
    }
  };

  return (
    <div
      style={gridStyle}
      className={`bg-white rounded-lg border-2 transition-all ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
      } ${isEditing ? 'cursor-move' : ''}`}
      onClick={onSelect}
      draggable={isEditing}
      onDragStart={onDragStart}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-800 truncate">{widget.title}</h3>
        
        <div className="flex items-center space-x-1">
          {isEditing && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ visible: !widget.visible });
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-3 h-full overflow-auto">
        {renderWidgetContent()}
      </div>
    </div>
  );
};

// Widget Content Components
const StatsCardWidget: React.FC<{ data: any; config: any }> = ({ data }) => (
  <div className="text-center">
    <p className="text-3xl font-bold text-blue-600">${data.value?.toFixed(0)}</p>
    <p className={`text-sm ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {data.change >= 0 ? '+' : ''}{data.change?.toFixed(1)}%
    </p>
    <p className="text-gray-600 text-sm mt-1">{data.label}</p>
  </div>
);

const LineChartWidget: React.FC<{ data: any; config: any }> = ({ data }) => (
  <div className="h-full">
    <p className="text-sm text-gray-600 mb-2">Trend over time</p>
    <div className="h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded flex items-end justify-between px-2">
      {data.data?.slice(-10).map((point: any, index: number) => (
        <div
          key={index}
          className="bg-blue-500 w-2 rounded-t"
          style={{ height: `${(point.value / 1000) * 80}%` }}
        />
      ))}
    </div>
  </div>
);

const RecentBetsWidget: React.FC<{ data: any; config: any }> = ({ data }) => (
  <div className="space-y-2">
    {data.bets?.slice(0, 5).map((bet: any) => (
      <div key={bet.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
        <div>
          <p className="font-medium text-sm">{bet.player}</p>
          <p className="text-xs text-gray-600">{bet.prop} {bet.line}</p>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 text-xs rounded-full ${
            bet.status === 'won' ? 'bg-green-100 text-green-800' :
            bet.status === 'lost' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {bet.status}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const PropOpportunitiesWidget: React.FC<{ data: any; config: any }> = ({ data }) => (
  <div className="space-y-2">
    {data.opportunities?.slice(0, 4).map((opp: any) => (
      <div key={opp.id} className="p-2 border border-gray-200 rounded">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-sm">{opp.player}</p>
            <p className="text-xs text-gray-600">{opp.prop} {opp.line}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-green-600">
              +{(opp.ev * 100).toFixed(1)}% EV
            </p>
            <p className="text-xs text-gray-600">
              {Math.round(opp.confidence * 100)}% conf
            </p>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Default layout creation
function createDefaultLayout(): DashboardLayout {
  return {
    id: 'default',
    name: 'My Dashboard',
    description: 'Customizable sports betting dashboard',
    widgets: [
      {
        id: 'widget_1',
        type: 'stats_card',
        title: 'Total Profit',
        x: 0, y: 0, width: 2, height: 1,
        config: { metric: 'total_profit', format: 'currency' },
        visible: true,
        refreshInterval: 30
      },
      {
        id: 'widget_2',
        type: 'recent_bets',
        title: 'Recent Activity',
        x: 2, y: 0, width: 4, height: 2,
        config: { limit: 8, showStatus: true },
        visible: true,
        refreshInterval: 10
      },
      {
        id: 'widget_3',
        type: 'prop_opportunities',
        title: 'Top Opportunities',
        x: 0, y: 1, width: 4, height: 2,
        config: { minConfidence: 0.8, minEV: 0.05 },
        visible: true,
        refreshInterval: 60
      }
    ],
    gridCols: 6,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    isDefault: true,
    isPublic: false,
    tags: ['default']
  };
}

export default CustomizableDashboard;
