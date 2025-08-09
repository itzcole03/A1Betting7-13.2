import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Calendar,
  MapPin,
  TrendingUp,
  Brain,
  Clock,
  Target,
  Zap,
  BarChart3,
  RefreshCw,
  Download,
  Bookmark,
  History,
  X,
  Plus,
  ChevronDown
} from 'lucide-react';

// Enhanced filter interfaces
interface SearchFilters {
  // Basic filters
  sports: string[];
  markets: string[];
  players: string[];
  teams: string[];
  
  // Performance filters
  confidenceRange: [number, number];
  edgeRange: [number, number];
  volumeRange: [number, number];
  
  // Time-based filters
  dateRange: [string, string];
  gameTime: string[];
  timeToGame: string;
  
  // Advanced filters
  weather: string[];
  venue: string[];
  injuryImpact: boolean;
  lineMovement: string;
  publicBetting: [number, number];
  
  // ML/AI filters
  mlConfidence: [number, number];
  aiRecommendation: string[];
  correlationScore: [number, number];
}

interface SearchResult {
  id: string;
  type: 'player' | 'prop' | 'game' | 'opportunity';
  title: string;
  subtitle: string;
  confidence: number;
  edge: number;
  volume: number;
  metadata: Record<string, any>;
  aiInsights?: string;
}

// Mock search results
const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'prop',
    title: 'Mookie Betts Total Bases Over 1.5',
    subtitle: 'LAD vs SF • Tonight 7:10 PM',
    confidence: 87,
    edge: 12.4,
    volume: 1247,
    metadata: {
      sport: 'MLB',
      market: 'Total Bases',
      player: 'Mookie Betts',
      team: 'LAD',
      line: 1.5,
      odds: -115
    },
    aiInsights: 'Strong recent performance vs LHP, favorable matchup'
  },
  {
    id: '2',
    type: 'opportunity',
    title: 'Arbitrage: Giannis Points',
    subtitle: 'MIL vs BOS • 3.2% edge across 3 books',
    confidence: 94,
    edge: 3.2,
    volume: 892,
    metadata: {
      sport: 'NBA',
      market: 'Points',
      player: 'Giannis Antetokounmpo',
      books: ['DraftKings', 'FanDuel', 'Caesars']
    }
  },
  {
    id: '3',
    type: 'player',
    title: 'Juan Soto',
    subtitle: 'NYY RF • Hot streak: 8/10 games',
    confidence: 82,
    edge: 8.7,
    volume: 657,
    metadata: {
      sport: 'MLB',
      team: 'NYY',
      position: 'RF',
      trend: 'hot'
    }
  }
];

const UnifiedSearchInterface: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'props' | 'players' | 'opportunities' | 'saved'>('all');
  const [results, setResults] = useState<SearchResult[]>(mockResults);
  const [savedSearches, setSavedSearches] = useState<string[]>(['High confidence props', 'MLB home runs']);
  
  const [filters, setFilters] = useState<SearchFilters>({
    sports: [],
    markets: [],
    players: [],
    teams: [],
    confidenceRange: [70, 100],
    edgeRange: [0, 50],
    volumeRange: [0, 10000],
    dateRange: ['', ''],
    gameTime: [],
    timeToGame: 'all',
    weather: [],
    venue: [],
    injuryImpact: false,
    lineMovement: 'all',
    publicBetting: [0, 100],
    mlConfidence: [60, 100],
    aiRecommendation: [],
    correlationScore: [0, 100]
  });

  // Filter results based on current filters and search query
  const filteredResults = useMemo(() => {
    let filtered = results;

    // Text search
    if (searchQuery.trim()) {
      filtered = filtered.filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Confidence range
    filtered = filtered.filter(result => 
      result.confidence >= filters.confidenceRange[0] && 
      result.confidence <= filters.confidenceRange[1]
    );

    // Edge range
    filtered = filtered.filter(result => 
      result.edge >= filters.edgeRange[0] && 
      result.edge <= filters.edgeRange[1]
    );

    // Sports filter
    if (filters.sports.length > 0) {
      filtered = filtered.filter(result => 
        filters.sports.includes(result.metadata.sport)
      );
    }

    // Type filter based on active tab
    if (activeTab !== 'all') {
      const typeMap = {
        props: 'prop',
        players: 'player',
        opportunities: 'opportunity'
      };
      if (typeMap[activeTab]) {
        filtered = filtered.filter(result => result.type === typeMap[activeTab]);
      }
    }

    return filtered;
  }, [results, searchQuery, filters, activeTab]);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const saveCurrentSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setSavedSearches(prev => [searchQuery, ...prev.slice(0, 9)]);
    }
  }, [searchQuery]);

  const tabs = [
    { id: 'all', label: 'All Results', count: filteredResults.length },
    { id: 'props', label: 'Props', count: filteredResults.filter(r => r.type === 'prop').length },
    { id: 'players', label: 'Players', count: filteredResults.filter(r => r.type === 'player').length },
    { id: 'opportunities', label: 'Opportunities', count: filteredResults.filter(r => r.type === 'opportunity').length },
    { id: 'saved', label: 'Saved', count: savedSearches.length }
  ];

  return (
    <div className="unified-search-interface min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search players, props, teams, or opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-4 rounded-xl font-medium transition-all duration-200 ${
              showFilters
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          
          <button
            onClick={saveCurrentSearch}
            disabled={!searchQuery.trim()}
            className="flex items-center gap-2 px-6 py-4 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-200"
          >
            <Bookmark className="w-5 h-5" />
            Save
          </button>
          
          <button className="flex items-center gap-2 px-6 py-4 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 rounded-xl font-medium transition-all duration-200">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <FilterPanel filters={filters} onChange={handleFilterChange} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
            <span className="px-2 py-1 bg-black/20 rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {activeTab === 'saved' ? (
          <SavedSearches searches={savedSearches} onSearch={setSearchQuery} />
        ) : (
          <SearchResults results={filteredResults} />
        )}
      </div>
    </div>
  );
};

// Filter Panel Component
const FilterPanel: React.FC<{
  filters: SearchFilters;
  onChange: (key: keyof SearchFilters, value: any) => void;
}> = ({ filters, onChange }) => {
  const [activeSection, setActiveSection] = useState<string>('basic');

  const filterSections = [
    { id: 'basic', label: 'Basic', icon: Filter },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'advanced', label: 'Advanced', icon: Brain },
    { id: 'ml', label: 'AI/ML', icon: Zap }
  ];

  return (
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      {/* Filter Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterSections.map(section => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Filter Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeSection === 'basic' && <BasicFilters filters={filters} onChange={onChange} />}
        {activeSection === 'performance' && <PerformanceFilters filters={filters} onChange={onChange} />}
        {activeSection === 'time' && <TimeFilters filters={filters} onChange={onChange} />}
        {activeSection === 'advanced' && <AdvancedFilters filters={filters} onChange={onChange} />}
        {activeSection === 'ml' && <MLFilters filters={filters} onChange={onChange} />}
      </div>
    </div>
  );
};

// Basic Filters Component
const BasicFilters: React.FC<{
  filters: SearchFilters;
  onChange: (key: keyof SearchFilters, value: any) => void;
}> = ({ filters, onChange }) => (
  <>
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Sports</label>
      <select 
        multiple 
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        value={filters.sports}
        onChange={(e) => onChange('sports', Array.from(e.target.selectedOptions, option => option.value))}
      >
        <option value="MLB">MLB</option>
        <option value="NBA">NBA</option>
        <option value="NFL">NFL</option>
        <option value="NHL">NHL</option>
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Markets</label>
      <select 
        multiple 
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        value={filters.markets}
        onChange={(e) => onChange('markets', Array.from(e.target.selectedOptions, option => option.value))}
      >
        <option value="Points">Points</option>
        <option value="Total Bases">Total Bases</option>
        <option value="Rebounds">Rebounds</option>
        <option value="Assists">Assists</option>
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Venue</label>
      <select 
        multiple 
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        value={filters.venue}
        onChange={(e) => onChange('venue', Array.from(e.target.selectedOptions, option => option.value))}
      >
        <option value="home">Home</option>
        <option value="away">Away</option>
        <option value="neutral">Neutral</option>
      </select>
    </div>
  </>
);

// Performance Filters Component
const PerformanceFilters: React.FC<{
  filters: SearchFilters;
  onChange: (key: keyof SearchFilters, value: any) => void;
}> = ({ filters, onChange }) => (
  <>
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Confidence: {filters.confidenceRange[0]}% - {filters.confidenceRange[1]}%
      </label>
      <div className="flex gap-4">
        <input
          type="range"
          min="0"
          max="100"
          value={filters.confidenceRange[0]}
          onChange={(e) => onChange('confidenceRange', [+e.target.value, filters.confidenceRange[1]])}
          className="flex-1"
        />
        <input
          type="range"
          min="0"
          max="100"
          value={filters.confidenceRange[1]}
          onChange={(e) => onChange('confidenceRange', [filters.confidenceRange[0], +e.target.value])}
          className="flex-1"
        />
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Edge: {filters.edgeRange[0]}% - {filters.edgeRange[1]}%
      </label>
      <div className="flex gap-4">
        <input
          type="range"
          min="0"
          max="50"
          value={filters.edgeRange[0]}
          onChange={(e) => onChange('edgeRange', [+e.target.value, filters.edgeRange[1]])}
          className="flex-1"
        />
        <input
          type="range"
          min="0"
          max="50"
          value={filters.edgeRange[1]}
          onChange={(e) => onChange('edgeRange', [filters.edgeRange[0], +e.target.value])}
          className="flex-1"
        />
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Line Movement</label>
      <select 
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        value={filters.lineMovement}
        onChange={(e) => onChange('lineMovement', e.target.value)}
      >
        <option value="all">All Movement</option>
        <option value="steaming">Steaming</option>
        <option value="reverse">Reverse Line Movement</option>
        <option value="stable">Line Stable</option>
      </select>
    </div>
  </>
);

// Time Filters Component
const TimeFilters: React.FC<{
  filters: SearchFilters;
  onChange: (key: keyof SearchFilters, value: any) => void;
}> = ({ filters, onChange }) => (
  <>
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Time to Game</label>
      <select 
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        value={filters.timeToGame}
        onChange={(e) => onChange('timeToGame', e.target.value)}
      >
        <option value="all">All Games</option>
        <option value="today">Today</option>
        <option value="next24h">Next 24 Hours</option>
        <option value="thisweek">This Week</option>
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Game Time</label>
      <select 
        multiple 
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        value={filters.gameTime}
        onChange={(e) => onChange('gameTime', Array.from(e.target.selectedOptions, option => option.value))}
      >
        <option value="afternoon">Afternoon</option>
        <option value="evening">Evening</option>
        <option value="night">Night</option>
        <option value="primetime">Prime Time</option>
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={filters.dateRange[0]}
          onChange={(e) => onChange('dateRange', [e.target.value, filters.dateRange[1]])}
          className="p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
        <input
          type="date"
          value={filters.dateRange[1]}
          onChange={(e) => onChange('dateRange', [filters.dateRange[0], e.target.value])}
          className="p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>
    </div>
  </>
);

// Advanced Filters Component
const AdvancedFilters: React.FC<{
  filters: SearchFilters;
  onChange: (key: keyof SearchFilters, value: any) => void;
}> = ({ filters, onChange }) => (
  <>
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Weather Conditions</label>
      <select 
        multiple 
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        value={filters.weather}
        onChange={(e) => onChange('weather', Array.from(e.target.selectedOptions, option => option.value))}
      >
        <option value="clear">Clear</option>
        <option value="cloudy">Cloudy</option>
        <option value="rain">Rain</option>
        <option value="wind">Windy</option>
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Public Betting: {filters.publicBetting[0]}% - {filters.publicBetting[1]}%
      </label>
      <div className="flex gap-4">
        <input
          type="range"
          min="0"
          max="100"
          value={filters.publicBetting[0]}
          onChange={(e) => onChange('publicBetting', [+e.target.value, filters.publicBetting[1]])}
          className="flex-1"
        />
        <input
          type="range"
          min="0"
          max="100"
          value={filters.publicBetting[1]}
          onChange={(e) => onChange('publicBetting', [filters.publicBetting[0], +e.target.value])}
          className="flex-1"
        />
      </div>
    </div>
    
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <input
          type="checkbox"
          checked={filters.injuryImpact}
          onChange={(e) => onChange('injuryImpact', e.target.checked)}
          className="rounded"
        />
        Consider Injury Impact
      </label>
    </div>
  </>
);

// ML Filters Component
const MLFilters: React.FC<{
  filters: SearchFilters;
  onChange: (key: keyof SearchFilters, value: any) => void;
}> = ({ filters, onChange }) => (
  <>
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        ML Confidence: {filters.mlConfidence[0]}% - {filters.mlConfidence[1]}%
      </label>
      <div className="flex gap-4">
        <input
          type="range"
          min="0"
          max="100"
          value={filters.mlConfidence[0]}
          onChange={(e) => onChange('mlConfidence', [+e.target.value, filters.mlConfidence[1]])}
          className="flex-1"
        />
        <input
          type="range"
          min="0"
          max="100"
          value={filters.mlConfidence[1]}
          onChange={(e) => onChange('mlConfidence', [filters.mlConfidence[0], +e.target.value])}
          className="flex-1"
        />
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">AI Recommendation</label>
      <select 
        multiple 
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
        value={filters.aiRecommendation}
        onChange={(e) => onChange('aiRecommendation', Array.from(e.target.selectedOptions, option => option.value))}
      >
        <option value="strong_buy">Strong Buy</option>
        <option value="buy">Buy</option>
        <option value="hold">Hold</option>
        <option value="avoid">Avoid</option>
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Correlation Score: {filters.correlationScore[0]} - {filters.correlationScore[1]}
      </label>
      <div className="flex gap-4">
        <input
          type="range"
          min="0"
          max="100"
          value={filters.correlationScore[0]}
          onChange={(e) => onChange('correlationScore', [+e.target.value, filters.correlationScore[1]])}
          className="flex-1"
        />
        <input
          type="range"
          min="0"
          max="100"
          value={filters.correlationScore[1]}
          onChange={(e) => onChange('correlationScore', [filters.correlationScore[0], +e.target.value])}
          className="flex-1"
        />
      </div>
    </div>
  </>
);

// Search Results Component
const SearchResults: React.FC<{ results: SearchResult[] }> = ({ results }) => (
  <div className="space-y-4">
    {results.length === 0 ? (
      <div className="text-center py-12">
        <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No results found</h3>
        <p className="text-slate-400">Try adjusting your filters or search terms</p>
      </div>
    ) : (
      results.map(result => (
        <motion.div
          key={result.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{result.title}</h3>
              <p className="text-slate-400">{result.subtitle}</p>
              {result.aiInsights && (
                <p className="text-cyan-300 text-sm mt-2 flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  {result.aiInsights}
                </p>
              )}
            </div>
            
            <div className="flex gap-4 text-right">
              <div>
                <div className="text-sm text-slate-400">Confidence</div>
                <div className="text-lg font-semibold text-green-300">{result.confidence}%</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Edge</div>
                <div className="text-lg font-semibold text-cyan-300">{result.edge}%</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Volume</div>
                <div className="text-lg font-semibold text-purple-300">{result.volume}</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(result.metadata).slice(0, 4).map(([key, value]) => (
              <span key={key} className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs">
                {key}: {value}
              </span>
            ))}
          </div>
        </motion.div>
      ))
    )}
  </div>
);

// Saved Searches Component
const SavedSearches: React.FC<{ 
  searches: string[]; 
  onSearch: (query: string) => void; 
}> = ({ searches, onSearch }) => (
  <div className="space-y-4">
    {searches.length === 0 ? (
      <div className="text-center py-12">
        <Bookmark className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No saved searches</h3>
        <p className="text-slate-400">Save your searches to quickly access them later</p>
      </div>
    ) : (
      searches.map((search, index) => (
        <div
          key={index}
          onClick={() => onSearch(search)}
          className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-slate-400" />
            <span className="text-white">{search}</span>
          </div>
          <span className="text-slate-400 text-sm">Saved search</span>
        </div>
      ))
    )}
  </div>
);

export default UnifiedSearchInterface;
