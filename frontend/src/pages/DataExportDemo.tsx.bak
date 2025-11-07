/**
 * Data Export Demo Page
 * Phase 3: Advanced UI Features - Comprehensive data export capabilities demo
 * 
 * Features:
 * - Multiple format export demonstration
 * - Live export progress tracking
 * - Export templates showcase
 * - Bulk export capabilities
 * - File download management
 */

import React, { useState, useEffect } from 'react';
import { 
  Download,
  FileText,
  Database,
  Table,
  FileSpreadsheet,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  Settings,
  Share2
} from 'lucide-react';

import UniversalDataExporter from '../components/export/UniversalDataExporter';
import { ExportField, ExportOptions } from '../components/export/UniversalDataExporter';

interface ExportJob {
  id: string;
  name: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  recordCount: number;
  startTime: string;
  completedTime?: string;
  downloadUrl?: string;
  fileSize?: string;
}

interface DemoStats {
  totalExports: number;
  completedExports: number;
  totalRecords: number;
  favoriteFormat: string;
}

const DataExportDemo: React.FC = () => {
  const [selectedDataType, setSelectedDataType] = useState<'bets' | 'players' | 'odds' | 'props' | 'analytics'>('props');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [demoStats, setDemoStats] = useState<DemoStats>({
    totalExports: 0,
    completedExports: 0,
    totalRecords: 0,
    favoriteFormat: 'CSV'
  });
  
  const [mockData, setMockData] = useState<Record<string, any[]>>({});
  const [availableFields, setAvailableFields] = useState<Record<string, ExportField[]>>({});

  // Data type configurations
  const dataTypeConfigs = {
    bets: {
      title: 'Betting History',
      description: 'Export your complete betting history and performance data',
      icon: Target,
      color: 'bg-blue-500',
      recordCount: 1247
    },
    players: {
      title: 'Player Database',
      description: 'Export player statistics and information across all sports',
      icon: Users,
      color: 'bg-green-500',
      recordCount: 856
    },
    odds: {
      title: 'Odds Comparison',
      description: 'Export odds data from multiple sportsbooks',
      icon: TrendingUp,
      color: 'bg-purple-500',
      recordCount: 2104
    },
    props: {
      title: 'Prop Opportunities',
      description: 'Export prop betting opportunities with predictions',
      icon: BarChart3,
      color: 'bg-orange-500',
      recordCount: 634
    },
    analytics: {
      title: 'Analytics Reports',
      description: 'Export performance analytics and insights',
      icon: Database,
      color: 'bg-red-500',
      recordCount: 425
    }
  };

  // Export format examples
  const formatExamples = [
    {
      format: 'csv',
      name: 'CSV (Spreadsheet)',
      description: 'Best for Excel and data analysis',
      icon: Table,
      useCase: 'Data analysis, pivot tables, charts'
    },
    {
      format: 'json',
      name: 'JSON (API)',
      description: 'Perfect for APIs and web applications',
      icon: Database,
      useCase: 'API integration, web applications'
    },
    {
      format: 'pdf',
      name: 'PDF (Report)',
      description: 'Professional reports and presentations',
      icon: FileText,
      useCase: 'Reports, presentations, sharing'
    },
    {
      format: 'excel',
      name: 'Excel (Advanced)',
      description: 'Full Excel features with formulas',
      icon: FileSpreadsheet,
      useCase: 'Advanced spreadsheets, formulas, charts'
    }
  ];

  // Initialize demo data
  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = () => {
    // Generate mock data for each data type
    const mockDataSets = {
      bets: generateMockBets(50),
      players: generateMockPlayers(30),
      odds: generateMockOdds(40),
      props: generateMockProps(35),
      analytics: generateMockAnalytics(25)
    };

    const fieldSets = {
      bets: [
        { key: 'id', label: 'Bet ID', type: 'string', defaultIncluded: true },
        { key: 'player', label: 'Player', type: 'string', defaultIncluded: true },
        { key: 'prop', label: 'Prop Type', type: 'string', defaultIncluded: true },
        { key: 'line', label: 'Line', type: 'number', defaultIncluded: true },
        { key: 'odds', label: 'Odds', type: 'number', defaultIncluded: true },
        { key: 'amount', label: 'Bet Amount', type: 'number', defaultIncluded: true },
        { key: 'status', label: 'Status', type: 'string', defaultIncluded: true },
        { key: 'date', label: 'Date', type: 'date', defaultIncluded: true },
        { key: 'profit', label: 'Profit/Loss', type: 'number', defaultIncluded: false }
      ],
      players: [
        { key: 'id', label: 'Player ID', type: 'string', defaultIncluded: true },
        { key: 'name', label: 'Name', type: 'string', defaultIncluded: true },
        { key: 'team', label: 'Team', type: 'string', defaultIncluded: true },
        { key: 'position', label: 'Position', type: 'string', defaultIncluded: true },
        { key: 'sport', label: 'Sport', type: 'string', defaultIncluded: true },
        { key: 'age', label: 'Age', type: 'number', defaultIncluded: false },
        { key: 'salary', label: 'Salary', type: 'number', defaultIncluded: false }
      ],
      props: [
        { key: 'id', label: 'Prop ID', type: 'string', defaultIncluded: true },
        { key: 'player', label: 'Player', type: 'string', defaultIncluded: true },
        { key: 'prop', label: 'Prop Type', type: 'string', defaultIncluded: true },
        { key: 'line', label: 'Line', type: 'number', defaultIncluded: true },
        { key: 'prediction', label: 'Prediction', type: 'number', defaultIncluded: true },
        { key: 'confidence', label: 'Confidence', type: 'number', defaultIncluded: true },
        { key: 'ev', label: 'Expected Value', type: 'number', defaultIncluded: true },
        { key: 'sportsbook', label: 'Sportsbook', type: 'string', defaultIncluded: false }
      ],
      odds: [
        { key: 'id', label: 'Odds ID', type: 'string', defaultIncluded: true },
        { key: 'sportsbook', label: 'Sportsbook', type: 'string', defaultIncluded: true },
        { key: 'sport', label: 'Sport', type: 'string', defaultIncluded: true },
        { key: 'market', label: 'Market', type: 'string', defaultIncluded: true },
        { key: 'odds', label: 'Odds', type: 'number', defaultIncluded: true },
        { key: 'line', label: 'Line', type: 'number', defaultIncluded: false }
      ],
      analytics: [
        { key: 'metric', label: 'Metric', type: 'string', defaultIncluded: true },
        { key: 'value', label: 'Value', type: 'number', defaultIncluded: true },
        { key: 'change', label: 'Change %', type: 'number', defaultIncluded: true },
        { key: 'period', label: 'Period', type: 'string', defaultIncluded: true }
      ]
    };

    setMockData(mockDataSets);
    setAvailableFields(fieldSets);
  };

  // Handle export completion
  const handleExport = async (options: ExportOptions): Promise<Blob> => {
    const exportJob: ExportJob = {
      id: `export_${Date.now()}`,
      name: `${selectedDataType} Export`,
      format: options.format.toUpperCase(),
      status: 'processing',
      progress: 0,
      recordCount: mockData[selectedDataType]?.length || 0,
      startTime: new Date().toISOString()
    };

    setExportJobs(prev => [exportJob, ...prev]);

    // Simulate export progress
    const progressInterval = setInterval(() => {
      setExportJobs(prev => prev.map(job => 
        job.id === exportJob.id 
          ? { ...job, progress: Math.min(job.progress + 20, 100) }
          : job
      ));
    }, 500);

    // Simulate completion after 3 seconds
    setTimeout(() => {
      clearInterval(progressInterval);
      
      const completedJob: ExportJob = {
        ...exportJob,
        status: 'completed',
        progress: 100,
        completedTime: new Date().toISOString(),
        downloadUrl: '#',
        fileSize: '2.4 MB'
      };

      setExportJobs(prev => prev.map(job => 
        job.id === exportJob.id ? completedJob : job
      ));

      setDemoStats(prev => ({
        ...prev,
        totalExports: prev.totalExports + 1,
        completedExports: prev.completedExports + 1,
        totalRecords: prev.totalRecords + completedJob.recordCount
      }));
    }, 3000);

    // Return mock blob
    const data = JSON.stringify(mockData[selectedDataType] || []);
    return new Blob([data], { type: 'application/json' });
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                    <Download className="w-8 h-8 text-white" />
                  </div>
                  <span>Universal Data Export System</span>
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Phase 3: Export data in multiple formats with advanced customization
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Phase 3 Status</p>
                  <p className="text-lg font-semibold text-green-600">Export Features</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Data Type Selector */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Data Type</h3>
              <div className="space-y-3">
                {Object.entries(dataTypeConfigs).map(([key, config]) => {
                  const IconComponent = config.icon;
                  const isSelected = selectedDataType === key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDataType(key as any)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-md ${config.color}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                            {config.title}
                          </h4>
                          <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                            {config.recordCount} records
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Export Formats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Formats</h3>
              <div className="space-y-3">
                {formatExamples.map((format) => (
                  <div key={format.format} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <format.icon className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-gray-900">{format.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                    <p className="text-xs text-gray-500">Use case: {format.useCase}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Exports:</span>
                  <span className="font-medium">{demoStats.totalExports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">{demoStats.completedExports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Records:</span>
                  <span className="font-medium">{demoStats.totalRecords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Favorite Format:</span>
                  <span className="font-medium">{demoStats.favoriteFormat}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Export Interface */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Export {dataTypeConfigs[selectedDataType].title}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {dataTypeConfigs[selectedDataType].description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {dataTypeConfigs[selectedDataType].recordCount}
                  </p>
                  <p className="text-sm text-gray-600">records available</p>
                </div>
              </div>

              <UniversalDataExporter
                dataType={selectedDataType}
                data={mockData[selectedDataType] || []}
                availableFields={availableFields[selectedDataType] || []}
                onExport={handleExport}
                templates={[]}
                className="w-full"
              />
            </div>

            {/* Export Jobs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Export Jobs</h3>
              
              {exportJobs.length > 0 ? (
                <div className="space-y-3">
                  {exportJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h4 className="font-medium text-gray-900">{job.name}</h4>
                            <p className="text-sm text-gray-600">
                              {job.format} • {job.recordCount} records
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {job.status === 'processing' && (
                            <div className="w-24 bg-gray-200 rounded-full h-2 mb-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          )}
                          
                          {job.status === 'completed' && job.downloadUrl && (
                            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
                              Download ({job.fileSize})
                            </button>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(job.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">No Export Jobs Yet</h4>
                  <p className="text-gray-500">Start your first export to see job progress here</p>
                </div>
              )}
            </div>

            {/* Feature Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureCard
                icon={Settings}
                title="Advanced Customization"
                description="Configure field selection, formatting, and filters"
                color="bg-blue-500"
              />
              <FeatureCard
                icon={Clock}
                title="Progress Tracking"
                description="Real-time progress for large dataset exports"
                color="bg-green-500"
              />
              <FeatureCard
                icon={Share2}
                title="Export Templates"
                description="Save and reuse export configurations"
                color="bg-purple-500"
              />
              <FeatureCard
                icon={Eye}
                title="Data Preview"
                description="Preview export results before downloading"
                color="bg-orange-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{
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

// Mock data generators
const generateMockBets = (count: number) => {
  const players = ['LeBron James', 'Stephen Curry', 'Aaron Judge', 'Josh Allen'];
  const props = ['Points', 'Assists', 'Home Runs', 'Passing Yards'];
  const statuses = ['won', 'lost', 'pending'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `bet_${i}`,
    player: players[i % players.length],
    prop: props[i % props.length],
    line: Math.round((Math.random() * 30 + 10) * 10) / 10,
    odds: [-110, -105, +100, +105][i % 4],
    amount: Math.round(Math.random() * 100 + 25),
    status: statuses[i % statuses.length],
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    profit: Math.round((Math.random() - 0.5) * 200)
  }));
};

const generateMockPlayers = (count: number) => {
  const names = ['LeBron James', 'Stephen Curry', 'Aaron Judge', 'Josh Allen', 'Connor McDavid'];
  const teams = ['LAL', 'GSW', 'NYY', 'BUF', 'EDM'];
  const positions = ['SF', 'PG', 'OF', 'QB', 'C'];
  const sports = ['NBA', 'NBA', 'MLB', 'NFL', 'NHL'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `player_${i}`,
    name: names[i % names.length],
    team: teams[i % teams.length],
    position: positions[i % positions.length],
    sport: sports[i % sports.length],
    age: Math.floor(Math.random() * 15 + 20),
    salary: Math.floor(Math.random() * 40000000 + 1000000)
  }));
};

const generateMockProps = (count: number) => {
  const players = ['LeBron James', 'Stephen Curry', 'Aaron Judge'];
  const props = ['Points', 'Assists', 'Home Runs'];
  const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `prop_${i}`,
    player: players[i % players.length],
    prop: props[i % props.length],
    line: Math.round((Math.random() * 30 + 10) * 10) / 10,
    prediction: Math.round((Math.random() * 35 + 15) * 10) / 10,
    confidence: Math.round((Math.random() * 0.3 + 0.7) * 1000) / 1000,
    ev: Math.round((Math.random() * 0.2 - 0.05) * 1000) / 1000,
    sportsbook: sportsbooks[i % sportsbooks.length]
  }));
};

const generateMockOdds = (count: number) => {
  const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];
  const sports = ['NBA', 'NFL', 'MLB', 'NHL'];
  const markets = ['moneyline', 'spread', 'total'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `odds_${i}`,
    sportsbook: sportsbooks[i % sportsbooks.length],
    sport: sports[i % sports.length],
    market: markets[i % markets.length],
    odds: [-110, -105, +100, +105][i % 4],
    line: Math.random() > 0.5 ? Math.round((Math.random() * 10 - 5) * 10) / 10 : null
  }));
};

const generateMockAnalytics = (count: number) => {
  const metrics = ['ROI', 'Win Rate', 'Avg Bet Size', 'Total Profit', 'Sharpe Ratio'];
  const periods = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'All time'];
  
  return Array.from({ length: count }, (_, i) => ({
    metric: metrics[i % metrics.length],
    value: Math.round((Math.random() * 100) * 100) / 100,
    change: Math.round((Math.random() * 20 - 10) * 100) / 100,
    period: periods[i % periods.length]
  }));
};

export default DataExportDemo;
