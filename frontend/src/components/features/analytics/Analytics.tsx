import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Clock,
  Cloud,
  CloudRain,
  Cpu,
  Droplets,
  Eye,
  GitBranch,
  Heart,
  RefreshCw,
  RotateCcw,
  Search,
  Snowflake,
  Sun,
  Target,
  Thermometer,
  TrendingUp,
  User,
  Users,
  Wind,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Layout from '../../core/Layout';
import Badge from '../../ui/badge';
import Button from '../../ui/button';

interface ModelMetrics {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  roi: number;
  sharpeRatio: number;
  status: 'active' | 'training' | 'inactive';
  predictions: number;
  weight: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
  category: string;
  trend: 'up' | 'down' | 'stable';
}

interface PredictionMetrics {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  avgConfidence: number;
  avgROI: number;
  topPerformingMarkets: Array<{
    market: string;
    accuracy: number;
    count: number;
  }>;
}

interface InjuryReport {
  id: string;
  player: string;
  team: string;
  sport: string;
  position: string;
  injury: string;
  bodyPart: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  status: 'questionable' | 'doubtful' | 'out' | 'ir' | 'healthy';
  expectedReturn: string;
  impact: {
    team: number;
    fantasy: number;
    betting: number;
  };
  timeline: string;
  reportedDate: string;
  source: string;
  reliability: number;
}

interface TeamImpact {
  team: string;
  sport: string;
  totalInjuries: number;
  keyPlayerInjuries: number;
  projectedImpact: number;
  affectedPositions: string[];
}

interface QuantumNode {
  id: string;
  type: 'input' | 'quantum' | 'neural' | 'output';
  position: { x: number; y: number };
  value: number;
  qubits?: number;
  entangled?: boolean;
  superposition?: boolean;
}

interface QuantumConnection {
  from: string;
  to: string;
  strength: number;
  type: 'quantum' | 'classical';
  entanglement?: boolean;
}

interface QuantumPrediction {
  id: string;
  game: string;
  sport: string;
  prediction: string;
  confidence: number;
  quantumStates: number;
  superpositions: number;
  entanglements: number;
  classicalProbability: number;
  quantumAdvantage: number;
  timestamp: string;
}

interface QuantumMetrics {
  coherenceTime: number;
  fidelity: number;
  entanglementDegree: number;
  quantumVolume: number;
  errorRate: number;
}

interface WeatherData {
  gameId: string;
  game: string;
  sport: string;
  venue: string;
  city: string;
  gameTime: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    visibility: number;
    condition: string;
    pressure: number;
  };
  forecast: {
    temperature: number;
    precipitation: number;
    windSpeed: number;
    condition: string;
  };
  impact: {
    overall: 'high' | 'medium' | 'low';
    passing: number;
    kicking: number;
    visibility: number;
    player_comfort: number;
  };
}

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  author: string;
  timestamp: string;
  category: 'breaking' | 'injury' | 'trade' | 'analysis' | 'prediction';
  sport: string;
  team?: string;
  player?: string;
  impact: 'high' | 'medium' | 'low';
  credibility: number;
  engagement: number;
  url: string;
  imageUrl?: string;
}

interface NewsImpactTopic {
  topic: string;
  mentions: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  growth: number;
}

interface RiskAlert {
  id: string;
  type: 'portfolio' | 'bet' | 'market' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  impact: number;
  probability: number;
  timeframe: string;
  createdAt: Date;
  dismissed: boolean;
}

interface RiskMetric {
  id: string;
  name: string;
  value: number;
  maxValue: number;
  threshold: number;
  status: 'safe' | 'warning' | 'danger';
  trend: 'up' | 'down' | 'stable';
  description: string;
  category: string;
}

interface CorrelationMatrix {
  pairs: Array<{
    asset1: string;
    asset2: string;
    correlation: number;
    risk: 'low' | 'medium' | 'high';
  }>;
}

interface VaRAnalysis {
  oneDay: {
    confidence95: number;
    confidence99: number;
    expectedShortfall: number;
  };
  oneWeek: {
    confidence95: number;
    confidence99: number;
    expectedShortfall: number;
  };
  historicalSimulation: number[];
  monteCarloSimulation: number[];
}

const Analytics: React.FC = () => {
  const [models, setModels] = useState<ModelMetrics[]>([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const [predictionMetrics, setPredictionMetrics] = useState<PredictionMetrics | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const _filterTimeRangeId = 'analytics-filter-time-range';
  const _filterModelId = 'analytics-filter-model';
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  // Injury tracking state
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [teamImpacts, setTeamImpacts] = useState<TeamImpact[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quantum AI state
  const [quantumNodes, setQuantumNodes] = useState<QuantumNode[]>([]);
  const [quantumConnections, setQuantumConnections] = useState<QuantumConnection[]>([]);
  const [quantumPredictions, setQuantumPredictions] = useState<QuantumPrediction[]>([]);
  const [quantumMetrics, setQuantumMetrics] = useState<QuantumMetrics | null>(null);
  const [isQuantumActive, setIsQuantumActive] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'grover' | 'shor' | 'qaoa' | 'vqe'>(
    'qaoa'
  );

  // Removed misplaced export default

  // Weather Station state
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [selectedWeatherGame, setSelectedWeatherGame] = useState<WeatherData | null>(null);

  // News Hub state
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsTopics, setNewsTopics] = useState<NewsImpactTopic[]>([]);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('all');
  const [selectedNewsSport, setSelectedNewsSport] = useState<string>('all');
  const [newsSearchQuery, setNewsSearchQuery] = useState<string>('');
  const [newsSortBy, setNewsSortBy] = useState<
    'timestamp' | 'impact' | 'credibility' | 'engagement'
  >('timestamp');

  // Risk Engine state
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationMatrix | null>(null);
  const [varAnalysis, setVarAnalysis] = useState<VaRAnalysis | null>(null);
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<string>('all');
  const [expandedRiskAlert, setExpandedRiskAlert] = useState<string | null>(null);

  // New state for analytics data
  const [analyticsData, setAnalyticsData] = useState<any[]>([]); // TODO: Replace 'any' with proper AnalyticsDataType
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Simulation speed for quantum simulation
  const simulationSpeed = 1;
  useEffect(() => {
    _loadAnalyticsData();
    _loadInjuryData();
    _loadQuantumData();
    _loadWeatherData();
    _loadNewsData();
    _loadRiskData();
  }, [selectedModel, timeRange]);

  useEffect(() => {
    const _interval = setInterval(_runQuantumSimulation, 1000 / simulationSpeed);
    return () => clearInterval(_interval);
  }, [isQuantumActive, simulationSpeed]);

  const _loadAnalyticsData = async () => {
    setIsLoading(true);
    setAnalyticsError(null);
    try {
      const response = await fetch('/analytics');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setAnalyticsData(data.enriched_props || []);
      // Optionally set other state from response (confidence, key_factors, etc.)
    } catch (error: any) {
      setAnalyticsError(error.message || 'Failed to load analytics data');
      setAnalyticsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const _loadInjuryData = async () => {
    try {
      // Generate mock injury data
      const sports = ['NBA', 'NFL', 'MLB', 'NHL'];
      const teams: { [key: string]: string[] } = {
        NBA: ['Lakers', 'Warriors', 'Celtics', 'Heat', 'Nets', 'Knicks'],
        NFL: ['Chiefs', 'Bills', 'Cowboys', 'Patriots', 'Packers', 'Ravens'],
        MLB: ['Yankees', 'Red Sox', 'Dodgers', 'Astros', 'Giants', 'Mets'],
        NHL: ['Rangers', 'Lightning', 'Bruins', 'Kings', 'Penguins', 'Capitals'],
      };

      const positions: { [key: string]: string[] } = {
        NBA: ['PG', 'SG', 'SF', 'PF', 'C'],
        NFL: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'],
        MLB: ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'],
        NHL: ['C', 'LW', 'RW', 'D', 'G'],
      };

      const injuriesList = [
        'Ankle Sprain',
        'Knee Injury',
        'Hamstring Strain',
        'Shoulder Injury',
        'Concussion',
        'Back Spasms',
        'Groin Strain',
        'Wrist Injury',
        'Hip Injury',
        'Calf Strain',
        'Neck Injury',
        'Foot Injury',
      ];

      const bodyParts = [
        'Ankle',
        'Knee',
        'Hamstring',
        'Shoulder',
        'Head',
        'Back',
        'Groin',
        'Wrist',
        'Hip',
        'Calf',
        'Neck',
        'Foot',
      ];

      const injuryData: InjuryReport[] = Array.from({ length: 15 }, (_, index) => {
        const sport = sports[Math.floor(Math.random() * sports.length)];
        const team = teams[sport][Math.floor(Math.random() * teams[sport].length)];
        const severity: InjuryReport['severity'] =
          Math.random() > 0.7 ? 'severe' : Math.random() > 0.4 ? 'moderate' : 'minor';

        return {
          id: `injury-${index}`,
          player: `Player ${Math.floor(Math.random() * 100) + 1}`,
          team,
          sport,
          position: positions[sport][Math.floor(Math.random() * positions[sport].length)],
          injury: injuriesList[Math.floor(Math.random() * injuriesList.length)],
          bodyPart: bodyParts[Math.floor(Math.random() * bodyParts.length)],
          severity,
          status: severity === 'severe' ? 'out' : Math.random() > 0.5 ? 'questionable' : 'doubtful',
          expectedReturn:
            severity === 'severe'
              ? '4-6 weeks'
              : severity === 'moderate'
              ? '1-2 weeks'
              : '3-5 days',
          impact: {
            team:
              severity === 'severe'
                ? 80 + Math.random() * 20
                : severity === 'moderate'
                ? 50 + Math.random() * 30
                : 20 + Math.random() * 30,
            fantasy:
              severity === 'severe'
                ? 90 + Math.random() * 10
                : severity === 'moderate'
                ? 60 + Math.random() * 30
                : 30 + Math.random() * 40,
            betting:
              severity === 'severe'
                ? 70 + Math.random() * 30
                : severity === 'moderate'
                ? 40 + Math.random() * 40
                : 15 + Math.random() * 35,
          },
          timeline: `${Math.floor(Math.random() * 12) + 1}h ago`,
          reportedDate: `${Math.floor(Math.random() * 7) + 1} days ago`,
          source: ['Team Report', 'Beat Reporter', 'Medical Staff', 'Player Statement'][
            Math.floor(Math.random() * 4)
          ],
          reliability: 70 + Math.random() * 30,
        };
      });

      // Generate team impacts
      const teamMap = new Map<string, InjuryReport[]>();
      injuryData.forEach(injury => {
        const key = `${injury.team}-${injury.sport}`;
        if (!teamMap.has(key)) {
          teamMap.set(key, []);
        }
        teamMap.get(key)!.push(injury);
      });

      const teamImpactData: TeamImpact[] = Array.from(teamMap.entries())
        .map(([key, teamInjuries]) => {
          const [team, sport] = key.split('-');
          const keyPlayerInjuries = teamInjuries.filter(
            (i: InjuryReport) => i.severity === 'severe' || i.severity === 'moderate'
          ).length;

          return {
            team,
            sport,
            totalInjuries: teamInjuries.length,
            keyPlayerInjuries,
            projectedImpact: Math.min(
              100,
              teamInjuries.reduce((sum: number, i: InjuryReport) => sum + i.impact.team, 0) / 3
            ),
            affectedPositions: [...new Set(teamInjuries.map((i: InjuryReport) => i.position))],
          };
        })
        .sort((a, b) => b.projectedImpact - a.projectedImpact);

      setInjuries(injuryData);
      setTeamImpacts(teamImpactData);
    } catch (error) {
      console.error('Failed to load injury data:', error);
    }
  };

  const _loadQuantumData = async () => {
    try {
      const { nodes: networkNodes, connections: networkConnections } = _generateQuantumNetwork();
      setQuantumNodes(networkNodes);
      setQuantumConnections(networkConnections);
      setQuantumPredictions(generateQuantumPredictions());
      setQuantumMetrics(generateQuantumMetrics());
    } catch (error) {
      console.error('Failed to load quantum data:', error);
    }
  };

  const _generateQuantumNetwork = (): {
    nodes: QuantumNode[];
    connections: QuantumConnection[];
  } => {
    const networkNodes: QuantumNode[] = [];
    const networkConnections: QuantumConnection[] = [];

    // Input layer
    for (let i = 0; i < 4; i++) {
      networkNodes.push({
        id: `input-${i}`,
        type: 'input',
        position: { x: 50, y: 100 + i * 80 },
        value: Math.random(),
      });
    }

    // Quantum layers
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < 6; i++) {
        networkNodes.push({
          id: `quantum-${layer}-${i}`,
          type: 'quantum',
          position: { x: 200 + layer * 150, y: 50 + i * 60 },
          value: Math.random(),
          qubits: Math.floor(Math.random() * 4) + 2,
          entangled: Math.random() > 0.5,
          superposition: Math.random() > 0.5,
        });
      }
    }

    // Output layer
    for (let i = 0; i < 2; i++) {
      networkNodes.push({
        id: `output-${i}`,
        type: 'output',
        position: { x: 650, y: 200 + i * 120 },
        value: Math.random(),
      });
    }

    // Connections
    for (let i = 0; i < 18; i++) {
      networkConnections.push({
        from: `quantum-${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 6)}`,
        to: `output-${Math.floor(Math.random() * 2)}`,
        strength: Math.random(),
        type: Math.random() > 0.5 ? 'quantum' : 'classical',
        entanglement: Math.random() > 0.5,
      });
    }

    return { nodes: networkNodes, connections: networkConnections };
  };

  const _generateQuantumPredictions = (): QuantumPrediction[] => {
    const games: { game: string; sport: string }[] = [
      { game: 'Lakers vs Warriors', sport: 'NBA' },
      { game: 'Chiefs vs Bills', sport: 'NFL' },
      { game: 'Celtics vs Heat', sport: 'NBA' },
      { game: 'Yankees vs Red Sox', sport: 'MLB' },
      { game: 'Rangers vs Lightning', sport: 'NHL' },
    ];

    return games.map((g: { game: string; sport: string }, index: number) => {
      const classicalProb = 0.5 + (Math.random() - 0.5) * 0.3;
      const quantumAdv = Math.random() * 0.15;

      return {
        id: `qpred-${index}`,
        game: g.game,
        sport: g.sport,
        prediction: `${Math.random() > 0.5 ? 'Over' : 'Under'} ${(Math.random() * 10 + 20).toFixed(
          1
        )}`,
        confidence: 75 + Math.random() * 20,
        quantumStates: Math.floor(Math.random() * 512) + 256,
        superpositions: Math.floor(Math.random() * 32) + 16,
        entanglements: Math.floor(Math.random() * 16) + 8,
        classicalProbability: classicalProb,
        quantumAdvantage: quantumAdv,
        timestamp: `${Math.floor(Math.random() * 2) + 1}h ago`,
      };
    });
  };

  const _generateQuantumMetrics = (): QuantumMetrics => ({
    coherenceTime: 50 + Math.random() * 50,
    fidelity: 0.95 + Math.random() * 0.04,
    entanglementDegree: Math.random() * 0.8 + 0.2,
    quantumVolume: Math.floor(Math.random() * 64) + 32,
    errorRate: Math.random() * 0.02 + 0.001,
  });

  const _runQuantumSimulation = () => {
    if (!isQuantumActive) return;

    setQuantumNodes(prev =>
      prev.map(node => ({
        ...node,
        value:
          node.type === 'quantum'
            ? node.superposition
              ? Math.random()
              : Math.sin(Date.now() * 0.001 + node.position.x * 0.01)
            : node.value + (Math.random() - 0.5) * 0.1,
      }))
    );

    setQuantumMetrics(generateQuantumMetrics());
  };

  const _getNodeColor = (node: QuantumNode) => {
    switch (node.type) {
      case 'input':
        return '#3B82F6';
      case 'quantum':
        if (node.superposition) return '#A855F7';
        if (node.entangled) return '#06B6D4';
        return '#8B5CF6';
      case 'neural':
        return '#10B981';
      case 'output':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const _getConnectionColor = (connection: QuantumConnection) => {
    if (connection.entanglement) return '#EC4899';
    return connection.type === 'quantum' ? '#8B5CF6' : '#6B7280';
  };

  const _getAlgorithmDescription = (algorithm: string) => {
    switch (algorithm) {
      case 'grover':
        return 'Quantum search algorithm for unstructured databases';
      case 'shor':
        return 'Quantum factoring algorithm for cryptographic analysis';
      case 'qaoa':
        return 'Quantum Approximate Optimization Algorithm';
      case 'vqe':
        return 'Variational Quantum Eigensolver for optimization';
      default:
        return 'Advanced quantum computing algorithm';
    }
  };

  const _loadWeatherData = async () => {
    try {
      const weatherGames: { game: string; sport: string; venue: string; city: string }[] = [
        { game: 'Chiefs vs Bills', sport: 'NFL', venue: 'Arrowhead Stadium', city: 'Kansas City' },
        { game: 'Yankees vs Red Sox', sport: 'MLB', venue: 'Yankee Stadium', city: 'New York' },
        { game: 'Lakers vs Warriors', sport: 'NBA', venue: 'Staples Center', city: 'Los Angeles' },
        {
          game: 'Rangers vs Lightning',
          sport: 'NHL',
          venue: 'Madison Square Garden',
          city: 'New York',
        },
        {
          game: 'Patriots vs Dolphins',
          sport: 'NFL',
          venue: 'Gillette Stadium',
          city: 'Foxborough',
        },
      ];

      const weatherDataGenerated: WeatherData[] = weatherGames.map(
        (g: { game: string; sport: string; venue: string; city: string }, index: number) => {
          const temp = 32 + Math.random() * 68;
          const windSpeed = Math.random() * 25;
          const humidity = 30 + Math.random() * 50;

          return {
            gameId: `weather-${index}`,
            ...g,
            gameTime: `${6 + Math.floor(Math.random() * 6)}:00 PM ET`,
            current: {
              temperature: temp,
              humidity,
              windSpeed,
              windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][
                Math.floor(Math.random() * 8)
              ],
              visibility: 5 + Math.random() * 5,
              condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Snow'][
                Math.floor(Math.random() * 6)
              ],
              pressure: 29.5 + Math.random() * 1.5,
            },
            forecast: {
              temperature: temp + (Math.random() - 0.5) * 10,
              precipitation: Math.random() * 100,
              windSpeed: windSpeed + (Math.random() - 0.5) * 10,
              condition: ['Clear', 'Cloudy', 'Rain', 'Snow'][Math.floor(Math.random() * 4)],
            },
            impact: {
              overall:
                windSpeed > 15 || humidity > 80
                  ? 'high'
                  : windSpeed > 10 || humidity > 60
                  ? 'medium'
                  : 'low',
              passing: Math.max(0, Math.min(100, 90 - windSpeed * 2)),
              kicking: Math.max(0, Math.min(100, 95 - windSpeed * 3)),
              visibility: Math.max(0, Math.min(100, humidity < 80 ? 95 : 70)),
              player_comfort: Math.max(0, Math.min(100, temp > 45 && temp < 75 ? 90 : 60)),
            },
          };
        }
      );

      setWeatherData(weatherDataGenerated);
      setSelectedWeatherGame(weatherDataGenerated[0]);
    } catch (error) {
      console.error('Failed to load weather data:', error);
    }
  };

  const _getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className='w-5 h-5 text-yellow-400' />;
      case 'partly cloudy':
        return <Cloud className='w-5 h-5 text-gray-400' />;
      case 'cloudy':
        return <Cloud className='w-5 h-5 text-gray-500' />;
      case 'light rain':
      case 'rain':
        return <CloudRain className='w-5 h-5 text-blue-400' />;
      case 'heavy rain':
        return <CloudRain className='w-5 h-5 text-blue-600' />;
      case 'snow':
        return <Snowflake className='w-5 h-5 text-white' />;
      default:
        return <Cloud className='w-5 h-5 text-gray-400' />;
    }
  };

  const _getWeatherImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400 border-red-400';
      case 'medium':
        return 'text-yellow-400 border-yellow-400';
      case 'low':
        return 'text-green-400 border-green-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const _loadNewsData = async () => {
    try {
      const sports = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer'];
      const categories = ['breaking', 'injury', 'trade', 'analysis', 'prediction'] as const;
      const sources = [
        'ESPN',
        'The Athletic',
        'Bleacher Report',
        'Yahoo Sports',
        'CBS Sports',
        'NBC Sports',
      ];

      const sampleNews = [
        {
          title: "Star Player Questionable for Tonight's Game",
          summary:
            'Team officials report that the All-Star player is dealing with a minor injury that could affect availability for the crucial matchup tonight.',
        },
        {
          title: 'Trade Deadline Approaching: Teams Making Final Moves',
          summary:
            'Multiple teams are reportedly in talks for last-minute trades that could reshape the playoff picture.',
        },
        {
          title: 'Weather Forecast Could Impact Outdoor Games',
          summary:
            'Meteorologists predict adverse conditions that may affect several games scheduled for this weekend.',
        },
        {
          title: 'Record-Breaking Performance Lights Up Social Media',
          summary:
            "Fans and analysts are buzzing about a historic achievement that happened in last night's game.",
        },
        {
          title: 'Coaching Change Rumored After Poor Start',
          summary:
            'Sources close to the organization suggest management is considering major changes following recent struggles.',
        },
        {
          title: 'Rookie Sensation Continues Impressive Campaign',
          summary:
            'The first-year player has exceeded all expectations and is now in the conversation for major awards.',
        },
        {
          title: 'Vegas Lines Moving Significantly on Upcoming Matchup',
          summary:
            'Sharp money appears to be influencing odds on what was expected to be a straightforward game.',
        },
        {
          title: 'International Player Visa Issues Cause Uncertainty',
          summary:
            'Administrative complications could sideline key international talent for several games.',
        },
      ];

      const newsData: NewsArticle[] = Array.from({ length: 12 }, (_, index) => {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const sport = sports[Math.floor(Math.random() * sports.length)];
        const newsItem = sampleNews[Math.floor(Math.random() * sampleNews.length)];

        return {
          id: `news-${index}`,
          title: newsItem.title,
          summary: newsItem.summary,
          source: sources[Math.floor(Math.random() * sources.length)],
          author: `Reporter ${Math.floor(Math.random() * 100)}`,
          timestamp: `${Math.floor(Math.random() * 12) + 1}h ago`,
          category,
          sport,
          team: Math.random() > 0.5 ? `Team ${Math.floor(Math.random() * 30) + 1}` : undefined,
          player: Math.random() > 0.6 ? `Player ${Math.floor(Math.random() * 100) + 1}` : undefined,
          impact: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
          credibility: 70 + Math.random() * 30,
          engagement: Math.floor(Math.random() * 10000),
          url: `https://example.com/article-${index}`,
          imageUrl:
            Math.random() > 0.5 ? `https://picsum.photos/300/200?random=${index}` : undefined,
        };
      });

      const _topics = [
        'Trade Deadline',
        'Playoff Race',
        'MVP Candidates',
        'Injury Updates',
        'Rookie Records',
        'Coaching Changes',
        'Contract Extensions',
        'Draft Prospects',
      ];

      const _topicsData: NewsImpactTopic[] = topics.map(topic => ({
        topic,
        mentions: Math.floor(Math.random() * 5000 + 1000),
        sentiment: Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative',
        growth: (Math.random() - 0.5) * 200,
      }));

      setNewsArticles(newsData);
      setNewsTopics(_topicsData);
    } catch (error) {
      console.error('Failed to load news data:', error);
    }
  };

  const _getNewsCategoryIcon = (category: string) => {
    switch (category) {
      case 'breaking':
        return <AlertTriangle className='w-4 h-4' />;
      case 'injury':
        return <Heart className='w-4 h-4' />;
      case 'trade':
        return <Users className='w-4 h-4' />;
      case 'analysis':
        return <Brain className='w-4 h-4' />;
      case 'prediction':
        return <Target className='w-4 h-4' />;
      default:
        return <BookOpen className='w-4 h-4' />;
    }
  };

  const _getNewsImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400 border-red-400';
      case 'medium':
        return 'text-yellow-400 border-yellow-400';
      case 'low':
        return 'text-green-400 border-green-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const _getNewsSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      case 'neutral':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  // Filter and sort news articles
  const _filteredNewsArticles = newsArticles
    .filter(article => {
      if (selectedNewsCategory !== 'all' && article.category !== selectedNewsCategory) return false;
      if (selectedNewsSport !== 'all' && article.sport !== selectedNewsSport) return false;
      if (
        newsSearchQuery &&
        !article.title.toLowerCase().includes(newsSearchQuery.toLowerCase()) &&
        !article.summary.toLowerCase().includes(newsSearchQuery.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      switch (newsSortBy) {
        case 'impact':
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'credibility':
          return b.credibility - a.credibility;
        case 'engagement':
          return b.engagement - a.engagement;
        case 'timestamp':
        default:
          return 0; // Mock timestamp sorting
      }
    });

  const _loadRiskData = async () => {
    try {
      const _mockAlerts: RiskAlert[] = [
        {
          id: 'alert-001',
          type: 'portfolio',
          severity: 'high',
          title: 'Concentration Risk Detected',
          description:
            'Over 40% of portfolio allocated to NBA props, exceeding safe diversification limits',
          recommendation: 'Reduce NBA exposure by 15% and increase allocation to NFL markets',
          impact: 8.5,
          probability: 0.72,
          timeframe: 'Next 7 days',
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          dismissed: false,
        },
        {
          id: 'alert-002',
          type: 'bet',
          severity: 'medium',
          title: 'Correlated Bets Warning',
          description: 'Multiple bets on Lakers players may create unwanted correlation exposure',
          recommendation: 'Consider hedging with opposing team props or reducing position sizes',
          impact: 5.2,
          probability: 0.65,
          timeframe: 'Game time: 3 hours',
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
          dismissed: false,
        },
        {
          id: 'alert-003',
          type: 'market',
          severity: 'critical',
          title: 'Volatility Spike Detected',
          description:
            'Unusual betting pattern detected in Chiefs vs Bills game - possible insider activity',
          recommendation: 'Avoid placing additional bets on this game until market stabilizes',
          impact: 9.8,
          probability: 0.89,
          timeframe: 'Immediate',
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
          dismissed: false,
        },
      ];

      const _mockMetrics: RiskMetric[] = [
        {
          id: 'var-95',
          name: 'Value at Risk (95%)',
          value: 2.3,
          maxValue: 5.0,
          threshold: 3.0,
          status: 'safe',
          trend: 'stable',
          description: 'Maximum expected loss over 1 day with 95% confidence',
          category: 'VaR',
        },
        {
          id: 'max-drawdown',
          name: 'Maximum Drawdown',
          value: 8.7,
          maxValue: 15.0,
          threshold: 12.0,
          status: 'safe',
          trend: 'down',
          description: 'Largest peak-to-trough decline in portfolio value',
          category: 'Drawdown',
        },
        {
          id: 'concentration',
          name: 'Concentration Risk',
          value: 42.3,
          maxValue: 100.0,
          threshold: 35.0,
          status: 'warning',
          trend: 'up',
          description: 'Percentage of portfolio in single strategy/sport',
          category: 'Diversification',
        },
      ];

      const _mockCorrelations: CorrelationMatrix = {
        pairs: [
          { asset1: 'NBA Props', asset2: 'NBA Spreads', correlation: 0.85, risk: 'high' },
          { asset1: 'NFL Totals', asset2: 'Weather Props', correlation: 0.72, risk: 'medium' },
          { asset1: 'MLB Player Props', asset2: 'MLB Team Totals', correlation: 0.45, risk: 'low' },
        ],
      };

      const _mockVaR: VaRAnalysis = {
        oneDay: {
          confidence95: -1247,
          confidence99: -2156,
          expectedShortfall: -2847,
        },
        oneWeek: {
          confidence95: -4523,
          confidence99: -7891,
          expectedShortfall: -9245,
        },
        historicalSimulation: [-500, -1200, -890, -2100, -1567, -945, -1834],
        monteCarloSimulation: [-623, -1456, -1023, -1789, -1334, -876, -1945],
      };

      setRiskAlerts(_mockAlerts);
      setRiskMetrics(_mockMetrics);
      setCorrelationMatrix(_mockCorrelations);
      setVarAnalysis(_mockVaR);
    } catch (error) {
      console.error('Failed to load risk data:', error);
    }
  };

  const _getRiskSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'high':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      case 'low':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      default:
        return 'border-gray-500/50 bg-gray-500/10 text-gray-400';
    }
  };

  const _getRiskStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'danger':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const _getRiskTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='w-4 h-4 text-red-400' />;
      case 'down':
        return <TrendingDown className='w-4 h-4 text-green-400' />;
      case 'stable':
        return <Activity className='w-4 h-4 text-gray-400' />;
      default:
        return null;
    }
  };

  const _dismissRiskAlert = (alertId: string) => {
    setRiskAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, dismissed: true } : alert))
    );
  };

  const _toggleDetails = (modelId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [modelId]: !prev[modelId],
    }));
  };

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20';
      case 'training':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'inactive':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const _getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='w-4 h-4 text-green-400' />;
      case 'down':
        return <TrendingUp className='w-4 h-4 text-red-400 rotate-180' />;
      case 'stable':
        return <Activity className='w-4 h-4 text-gray-400' />;
      default:
        return null;
    }
  };

  // Injury helper functions
  const _getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 border-red-600 bg-red-900/20';
      case 'severe':
        return 'text-red-400 border-red-400 bg-red-900/10';
      case 'moderate':
        return 'text-yellow-400 border-yellow-400 bg-yellow-900/10';
      case 'minor':
        return 'text-green-400 border-green-400 bg-green-900/10';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const _getInjuryStatusColor = (status: string) => {
    switch (status) {
      case 'out':
      case 'ir':
        return 'text-red-400 border-red-400';
      case 'doubtful':
        return 'text-orange-400 border-orange-400';
      case 'questionable':
        return 'text-yellow-400 border-yellow-400';
      case 'healthy':
        return 'text-green-400 border-green-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const _getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'severe':
        return <AlertTriangle className='w-4 h-4' />;
      case 'moderate':
        return <TrendingDown className='w-4 h-4' />;
      case 'minor':
        return <Activity className='w-4 h-4' />;
      default:
        return <Heart className='w-4 h-4' />;
    }
  };

  // Filter injuries
  const _filteredInjuries = injuries.filter(injury => {
    if (selectedSport !== 'all' && injury.sport !== selectedSport) return false;
    if (selectedSeverity !== 'all' && injury.severity !== selectedSeverity) return false;
    if (
      searchQuery &&
      !injury.player.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !injury.team.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <Layout
      title='ML Analytics'
      subtitle='47+ Machine Learning Models • Advanced Performance Analytics'
      headerActions={
        <div className='flex items-center space-x-3'>
          <div className='flex flex-col'>
            <label htmlFor={_filterTimeRangeId} className='text-xs text-gray-400 mb-1'>
              Time Range
            </label>
            <select
              id={_filterTimeRangeId}
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
            >
              <option value='1d'>Last 24 Hours</option>
              <option value='7d'>Last 7 Days</option>
              <option value='30d'>Last 30 Days</option>
              <option value='90d'>Last 90 Days</option>
            </select>
          </div>
          <div className='flex flex-col'>
            <label htmlFor={_filterModelId} className='text-xs text-gray-400 mb-1'>
              Model
            </label>
            <select
              id={_filterModelId}
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
            >
              <option value='all'>All Models</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={_loadAnalyticsData}
            disabled={isLoading}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Overview Metrics */}
      {predictionMetrics && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-400 text-sm'>Total Predictions</p>
                <p className='text-2xl font-bold text-white'>
                  {predictionMetrics.totalPredictions.toLocaleString()}
                </p>
                <p className='text-xs text-cyan-300 mt-1'>All models combined</p>
              </div>
              <Target className='w-8 h-8 text-cyan-400' />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-400 text-sm'>Accuracy</p>
                <p className='text-2xl font-bold text-green-400'>{predictionMetrics.accuracy}%</p>
                <p className='text-xs text-green-300 mt-1'>+2.3% this week</p>
              </div>
              <Target className='w-8 h-8 text-green-400' />
            </div>
          </motion.div>
          {/* ...other metric cards... */}
        </div>
      )}
      {/* Feature Importance & Market Performance */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Feature Importance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Feature Importance</h3>
              <p className='text-gray-400 text-sm'>Global feature impact across all models</p>
            </div>
            <Eye className='w-5 h-5 text-cyan-400' />
          </div>
          <div className='space-y-3'>
            {featureImportance.map((feature, index) => (
              <motion.div
                key={feature.feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.05 }}
                className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'
              >
                <div className='flex items-center space-x-3'>
                  {_getTrendIcon(feature.trend)}
                  <div>
                    <div className='font-medium text-white'>{feature.feature}</div>
                    <div className='text-xs text-gray-400'>{feature.category}</div>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <div className='w-24 bg-slate-700 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full transition-all duration-500'
                      style={{ width: `${feature.importance * 100}%` }}
                    />
                  </div>
                  <span className='text-sm font-medium text-white w-12 text-right'>
                    {(feature.importance * 100).toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Market Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Market Performance</h3>
              <p className='text-gray-400 text-sm'>Accuracy by betting market type</p>
            </div>
            <BarChart3 className='w-5 h-5 text-green-400' />
          </div>
          {predictionMetrics && (
            <div className='space-y-4'>
              {predictionMetrics.topPerformingMarkets.map((market, index) => (
                <motion.div
                  key={market.market}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + index * 0.1 }}
                  className='p-4 bg-slate-900/50 rounded-lg'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='font-medium text-white'>{market.market}</h4>
                    <span className='text-green-400 font-bold'>{market.accuracy}%</span>
                  </div>
                  <div className='flex items-center justify-between text-sm text-gray-400'>
                    <span>{market.count} predictions</span>
                    <div className='w-24 bg-slate-700 rounded-full h-2'>
                      <div
                        className='bg-gradient-to-r from-green-400 to-cyan-400 h-2 rounded-full transition-all duration-500'
                        style={{ width: `${market.accuracy}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      {/* Model Performance Monitoring */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <h3 className='text-xl font-bold text-white mb-6'>Real-Time Model Monitoring</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <h4 className='text-lg font-medium text-white mb-4'>Performance Trends</h4>
            <div className='space-y-3'>
              {[
                { metric: 'Accuracy Trend', value: '+2.3%', status: 'up', period: '7 days' },
                { metric: 'ROI Performance', value: '+15.2%', status: 'up', period: '30 days' },
                { metric: 'Prediction Volume', value: '1,247', status: 'stable', period: 'today' },
                { metric: 'Error Rate', value: '-0.8%', status: 'down', period: '7 days' },
              ].map((metric, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between bg-slate-900/50 rounded-lg p-3'
                >
                  <div>
                    <div className='text-white font-medium'>{metric.metric}</div>
                    <div className='text-gray-400 text-sm'>{metric.period}</div>
                  </div>
                  <div className='text-right'>
                    <div
                      className={`font-bold ${
                        metric.status === 'up'
                          ? 'text-green-400'
                          : metric.status === 'down'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {metric.value}
                    </div>
                    <div
                      className={`text-xs ${
                        metric.status === 'up'
                          ? 'text-green-300'
                          : metric.status === 'down'
                          ? 'text-red-300'
                          : 'text-yellow-300'
                      }`}
                    >
                      {metric.status === 'up' ? '↗' : metric.status === 'down' ? '↘' : '→'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className='text-lg font-medium text-white mb-4'>Model Health Status</h4>
            <div className='space-y-3'>
              {[
                { model: 'XGBoost Ensemble', health: 98, issues: 0 },
                { model: 'Neural Network', health: 95, issues: 1 },
                { model: 'LSTM Predictor', health: 92, issues: 0 },
                { model: 'Random Forest', health: 89, issues: 2 },
              ].map((model, index) => (
                <div key={index} className='bg-slate-900/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium'>{model.model}</span>
                    <span
                      className={`text-sm font-bold ${
                        model.health >= 95
                          ? 'text-green-400'
                          : model.health >= 85
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {model.health}%
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1 bg-slate-700 rounded-full h-2 mr-3'>
                      <div
                        className={`h-2 rounded-full ${
                          model.health >= 95
                            ? 'bg-green-400'
                            : model.health >= 85
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                        }`}
                        style={{ width: `${model.health}%` }}
                      />
                    </div>
                    <span className='text-xs text-gray-400'>{model.issues} issues</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Advanced Feature Engineering */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Feature Engineering Pipeline</h3>
            <p className='text-gray-400 text-sm'>Automated feature discovery and optimization</p>
          </div>
          <Brain className='w-6 h-6 text-purple-400' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Top Generated Features</h4>
            <div className='space-y-2'>
              {[
                { feature: 'Home_Away_Performance_Ratio', impact: 0.24 },
                { feature: 'Weather_Adjusted_Total', impact: 0.19 },
                { feature: 'Injury_Impact_Score', impact: 0.17 },
                { feature: 'Line_Movement_Velocity', impact: 0.15 },
              ].map((feat, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <span className='text-gray-300 text-xs'>{feat.feature}</span>
                  <span className='text-cyan-400 text-sm font-medium'>
                    {(feat.impact * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Feature Categories</h4>
            <div className='space-y-2'>
              {[
                { category: 'Player Stats', count: 147, active: 89 },
                { category: 'Team Metrics', count: 98, active: 76 },
                { category: 'Environmental', count: 45, active: 32 },
                { category: 'Market Data', count: 67, active: 54 },
              ].map((cat, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <span className='text-gray-300 text-xs'>{cat.category}</span>
                  <span className='text-green-400 text-sm'>
                    {cat.active}/{cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Pipeline Status</h4>
            <div className='space-y-2'>
              {[
                { stage: 'Data Ingestion', status: 'Active', color: 'green' },
                { stage: 'Feature Generation', status: 'Processing', color: 'yellow' },
                { stage: 'Model Training', status: 'Queued', color: 'blue' },
                { stage: 'Deployment', status: 'Ready', color: 'green' },
              ].map((stage, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <span className='text-gray-300 text-xs'>{stage.stage}</span>
                  <div className='flex items-center space-x-2'>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        stage.color === 'green'
                          ? 'bg-green-400'
                          : stage.color === 'yellow'
                          ? 'bg-yellow-400'
                          : 'bg-blue-400'
                      }`}
                    ></div>
                    <span
                      className={`text-xs ${
                        stage.color === 'green'
                          ? 'text-green-400'
                          : stage.color === 'yellow'
                          ? 'text-yellow-400'
                          : 'text-blue-400'
                      }`}
                    >
                      {stage.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Ensemble Model Insights */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <h3 className='text-xl font-bold text-white mb-6'>Ensemble Model Analysis</h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Model Contributions</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                { model: 'XGBoost', contribution: 35, predictions: 1247, accuracy: 97.2 },
                { model: 'Neural Net', contribution: 30, predictions: 1189, accuracy: 96.8 },
                { model: 'LSTM', contribution: 20, predictions: 998, accuracy: 95.1 },
                { model: 'Random Forest', contribution: 15, predictions: 876, accuracy: 94.6 },
              ].map((model, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-900/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium'>{model.model}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-cyan-400 font-bold'>{model.contribution}%</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>Predictions: {model.predictions}</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-green-400'>Accuracy: {model.accuracy}%</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='mt-2 bg-slate-700 rounded-full h-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div
                      className='h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full'
                      style={{ width: `${model.contribution}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Consensus Metrics</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='bg-slate-900/50 rounded-lg p-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-3xl font-bold text-green-400 mb-1'>96.4%</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-gray-400 text-sm'>Ensemble Accuracy</div>
                </div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='bg-slate-900/50 rounded-lg p-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-3xl font-bold text-purple-400 mb-1'>1.85</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-gray-400 text-sm'>Sharpe Ratio</div>
                </div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='bg-slate-900/50 rounded-lg p-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-3xl font-bold text-cyan-400 mb-1'>23.7%</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-gray-400 text-sm'>Average ROI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Meta-Analysis Dashboard */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Meta-Analysis & Data Quality</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Advanced analysis framework with quality scoring and trend analysis
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <BarChart3 className='w-6 h-6 text-cyan-400' />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Data Quality Score</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-center mb-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-3xl font-bold text-green-400'>94.2</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-xs text-gray-400'>Out of 100</div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-2'>
              {[
                { metric: 'Completeness', score: 96 },
                { metric: 'Accuracy', score: 94 },
                { metric: 'Consistency', score: 92 },
                { metric: 'Timeliness', score: 95 },
              ].map((item, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span className='text-gray-300 text-xs'>{item.metric}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span className='text-cyan-400 text-xs'>{item.score}%</span>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Prediction Stability</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-center mb-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-3xl font-bold text-purple-400'>87.8%</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-xs text-gray-400'>Consistency Rating</div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-2'>
              {[
                { timeframe: 'Last Hour', stability: 94 },
                { timeframe: 'Last 6 Hours', stability: 89 },
                { timeframe: 'Last 24 Hours', stability: 85 },
                { timeframe: 'Last Week', stability: 82 },
              ].map((item, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span className='text-gray-300 text-xs'>{item.timeframe}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span className='text-purple-400 text-xs'>{item.stability}%</span>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Market Efficiency</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-center mb-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-3xl font-bold text-yellow-400'>78.4%</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-xs text-gray-400'>Efficiency Index</div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-2'>
              {[
                { market: 'Player Props', efficiency: 82 },
                { market: 'Game Totals', efficiency: 76 },
                { market: 'Spreads', efficiency: 79 },
                { market: 'Live Betting', efficiency: 75 },
              ].map((item, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span className='text-gray-300 text-xs'>{item.market}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span className='text-yellow-400 text-xs'>{item.efficiency}%</span>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Sentiment Alignment</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-center mb-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-3xl font-bold text-cyan-400'>91.2%</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-xs text-gray-400'>Correlation Score</div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-2'>
              {[
                { source: 'Social Media', alignment: 93 },
                { source: 'News Sentiment', alignment: 88 },
                { source: 'Expert Analysis', alignment: 95 },
                { source: 'Betting Markets', alignment: 89 },
              ].map((item, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span className='text-gray-300 text-xs'>{item.source}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span className='text-cyan-400 text-xs'>{item.alignment}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Advanced Opportunity Discovery */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Opportunity Discovery Engine</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              AI-powered opportunity identification with confidence scoring
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <Target className='w-6 h-6 text-green-400' />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Top Opportunities</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  type: 'Value Mismatch',
                  player: 'LeBron James Points',
                  confidence: 94,
                  expectedValue: 18.7,
                  rationale: [
                    'Line too low vs. projection',
                    'Favorable matchup history',
                    'High usage rate expected',
                  ],
                },
                {
                  type: 'Sentiment Divergence',
                  player: 'Curry 3-Pointers',
                  confidence: 87,
                  expectedValue: 12.3,
                  rationale: [
                    'Negative market sentiment',
                    'Strong historical vs opponent',
                    'Recent shooting uptick',
                  ],
                },
                {
                  type: 'Model Consensus',
                  player: 'Dončić Triple-Double',
                  confidence: 82,
                  expectedValue: 15.9,
                  rationale: [
                    'All models agree',
                    'Recent triple-double streak',
                    'Opponent pace advantage',
                  ],
                },
              ].map((opp, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{opp.type}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-green-400 text-sm font-bold'>+{opp.expectedValue}%</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-cyan-400 text-sm mb-2'>{opp.player}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2 mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400'>Confidence:</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex-1 bg-slate-700 rounded-full h-1'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div
                        className='h-1 bg-green-400 rounded-full'
                        style={{ width: `${opp.confidence}%` }}
                      />
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-green-400 text-xs'>{opp.confidence}%</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <ul className='text-gray-400 text-xs space-y-1'>
                    {opp.rationale.map((reason, i) => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <li key={i}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Risk Factors Analysis</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  category: 'Weather Impact',
                  level: 'LOW',
                  factors: ['Indoor venue', 'No weather concerns'],
                  mitigation: 'No action needed',
                },
                {
                  category: 'Injury Concerns',
                  level: 'MEDIUM',
                  factors: ['Minor ankle issue reported', 'Listed as probable'],
                  mitigation: 'Monitor warmup performance',
                },
                {
                  category: 'Rest Advantage',
                  level: 'HIGH',
                  factors: ['Back-to-back games', '3 games in 4 nights'],
                  mitigation: 'Reduce exposure significantly',
                },
                {
                  category: 'Line Movement',
                  level: 'MEDIUM',
                  factors: ['Sharp money on over', '70% public on under'],
                  mitigation: 'Consider reverse line movement',
                },
              ].map((risk, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{risk.category}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        risk.level === 'LOW'
                          ? 'bg-green-500/20 text-green-400'
                          : risk.level === 'MEDIUM'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {risk.level}
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <ul className='text-gray-400 text-xs space-y-1 mb-2'>
                    {risk.factors.map((factor, i) => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <li key={i}>• {factor}</li>
                    ))}
                  </ul>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-cyan-400 text-xs font-medium'>Action: {risk.mitigation}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Advanced Betting Intelligence */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Advanced Betting Intelligence</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Unified betting core with CLV analysis and performance optimization
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <Brain className='w-6 h-6 text-cyan-400' />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Closing Line Value (CLV)</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-center mb-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-3xl font-bold text-green-400'>+4.2%</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-xs text-gray-400'>Average CLV</div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                { book: 'DraftKings', clv: '+5.7%', bets: 47, color: 'text-green-400' },
                { book: 'FanDuel', clv: '+3.8%', bets: 34, color: 'text-green-400' },
                { book: 'BetMGM', clv: '+2.1%', bets: 28, color: 'text-green-400' },
                { book: 'Caesars', clv: '-0.3%', bets: 12, color: 'text-red-400' },
              ].map((item, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span className='text-gray-300 text-sm'>{item.book}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-right'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className={`font-bold text-sm ${item.color}`}>{item.clv}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400'>{item.bets} bets</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Kelly Criterion Analysis</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                { metric: 'Optimal Kelly %', value: '2.8%', status: 'Optimal' },
                { metric: 'Current Sizing', value: '1.9%', status: 'Conservative' },
                { metric: 'Kelly Multiplier', value: '0.68x', status: 'Safe' },
                { metric: 'Edge Retention', value: '87.3%', status: 'Excellent' },
              ].map((item, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white text-sm font-medium'>{item.metric}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-cyan-400 text-sm'>{item.value}</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-gray-400 text-xs'>{item.status}</div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Market Efficiency Score</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-center mb-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-3xl font-bold text-purple-400'>82.4</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-xs text-gray-400'>Efficiency Rating</div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-2'>
              {[
                { market: 'Player Props', efficiency: 79, opportunities: 'High' },
                { market: 'Game Totals', efficiency: 84, opportunities: 'Medium' },
                { market: 'Spreads', efficiency: 87, opportunities: 'Low' },
                { market: 'Live Betting', efficiency: 76, opportunities: 'Very High' },
              ].map((item, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span className='text-gray-300 text-xs'>{item.market}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-right'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white text-xs'>{item.efficiency}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div
                      className={`text-xs ${
                        item.opportunities === 'Very High' || item.opportunities === 'High'
                          ? 'text-green-400'
                          : item.opportunities === 'Medium'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {item.opportunities}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Performance Optimization Engine */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Performance Optimization Engine</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Advanced strategy optimization with edge retention analysis
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <TrendingUp className='w-6 h-6 text-green-400' />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Strategy Performance</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  strategy: 'Value Line Hunter',
                  roi: '+23.7%',
                  sharpe: '2.14',
                  variance: '12.3%',
                  bets: 124,
                  winRate: 67.8,
                  avgEdge: '+4.2%',
                },
                {
                  strategy: 'Arbitrage Scanner',
                  roi: '+8.9%',
                  sharpe: '4.87',
                  variance: '2.1%',
                  bets: 89,
                  winRate: 100.0,
                  avgEdge: '+2.8%',
                },
                {
                  strategy: 'Live Betting Edge',
                  roi: '+31.2%',
                  sharpe: '1.89',
                  variance: '18.7%',
                  bets: 67,
                  winRate: 72.4,
                  avgEdge: '+6.1%',
                },
              ].map((strat, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-white font-medium text-sm mb-2'>{strat.strategy}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-3 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message ROI:{' '}
                      <span className='text-green-400'>{strat.roi}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Sharpe:{' '}
                      <span className='text-cyan-400'>{strat.sharpe}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Variance:{' '}
                      <span className='text-yellow-400'>{strat.variance}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Bets:{' '}
                      <span className='text-white'>{strat.bets}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Win Rate:{' '}
                      <span className='text-purple-400'>{strat.winRate}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Avg Edge:{' '}
                      <span className='text-green-400'>{strat.avgEdge}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Optimization Recommendations</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  optimization: 'Increase Kelly Multiplier',
                  current: '0.68x',
                  recommended: '0.85x',
                  impact: '+12% expected growth',
                  risk: 'Low',
                  confidence: 89,
                },
                {
                  optimization: 'Expand Live Betting',
                  current: '15% allocation',
                  recommended: '25% allocation',
                  impact: '+8% portfolio return',
                  risk: 'Medium',
                  confidence: 83,
                },
                {
                  optimization: 'Reduce NBA Concentration',
                  current: '45% exposure',
                  recommended: '35% exposure',
                  impact: '-18% portfolio variance',
                  risk: 'Low',
                  confidence: 91,
                },
                {
                  optimization: 'Add MLB Props',
                  current: '0% allocation',
                  recommended: '10% allocation',
                  impact: '+5% diversification benefit',
                  risk: 'Low',
                  confidence: 76,
                },
              ].map((opt, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{opt.optimization}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        opt.risk === 'Low'
                          ? 'bg-green-500/20 text-green-400'
                          : opt.risk === 'Medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {opt.risk} Risk
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-gray-400 text-xs mb-1'>
                    Current: {opt.current} → Recommended: {opt.recommended}
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-green-400 text-xs mb-1'>{opt.impact}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-purple-400 text-xs'>{opt.confidence}% confidence</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Unified Analytics Engine */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Unified Analytics Engine</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Comprehensive performance tracking with model analysis and trend forecasting
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <BarChart3 className='w-6 h-6 text-green-400' />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-2xl font-bold text-green-400 mb-1'>2,847</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Total Bets</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-2xl font-bold text-cyan-400 mb-1'>84.2%</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Win Rate</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-2xl font-bold text-purple-400 mb-1'>+23.7%</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>ROI</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-2xl font-bold text-yellow-400 mb-1'>$18,420</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Total Profit</div>
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Model Performance Analysis</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  model: 'XGBoost Ensemble',
                  accuracy: 94.7,
                  precision: 92.3,
                  recall: 89.1,
                  f1Score: 90.7,
                  predictions: 1847,
                },
                {
                  model: 'Neural Network',
                  accuracy: 92.3,
                  precision: 90.1,
                  recall: 88.7,
                  f1Score: 89.4,
                  predictions: 1456,
                },
                {
                  model: 'LSTM Predictor',
                  accuracy: 91.8,
                  precision: 89.5,
                  recall: 87.2,
                  f1Score: 88.3,
                  predictions: 1234,
                },
              ].map((model, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{model.model}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-green-400 text-sm'>{model.accuracy}%</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Precision:{' '}
                      <span className='text-cyan-400'>{model.precision}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Recall:{' '}
                      <span className='text-purple-400'>{model.recall}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message F1-Score:{' '}
                      <span className='text-yellow-400'>{model.f1Score}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Predictions:{' '}
                      <span className='text-white'>{model.predictions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Sport Performance Breakdown</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                { sport: 'NBA', bets: 1247, winRate: 87.3, roi: 28.4, profit: 8420 },
                { sport: 'NFL', bets: 834, winRate: 82.1, roi: 19.7, profit: 5630 },
                { sport: 'MLB', bets: 456, winRate: 79.8, roi: 15.2, profit: 2890 },
                { sport: 'NHL', bets: 310, winRate: 85.5, roi: 22.1, profit: 1480 },
              ].map((sport, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{sport.sport}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-green-400 text-sm'>+{sport.roi}%</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Bets:{' '}
                      <span className='text-white'>{sport.bets}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Win Rate:{' '}
                      <span className='text-cyan-400'>{sport.winRate}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Profit:{' '}
                      <span className='text-green-400'>${sport.profit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Market Analysis</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                { market: 'Player Props', volume: 1456, accuracy: 89.7, avgValue: 3.2 },
                { market: 'Game Totals', volume: 734, accuracy: 85.3, avgValue: 2.8 },
                { market: 'Spreads', volume: 456, accuracy: 82.1, avgValue: 2.1 },
                { market: 'Live Betting', volume: 201, accuracy: 91.4, avgValue: 4.7 },
              ].map((market, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{market.market}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-purple-400 text-sm'>{market.avgValue}</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Volume:{' '}
                      <span className='text-white'>{market.volume}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Accuracy:{' '}
                      <span className='text-green-400'>{market.accuracy}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Advanced Trend Analysis */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Advanced Trend Analysis</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Time-series analysis with predictive modeling and streak tracking
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <TrendingUp className='w-6 h-6 text-cyan-400' />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Performance Streaks</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-4 text-center'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='text-3xl font-bold text-green-400 mb-1'>12</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='text-sm text-gray-400'>Current Win Streak</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-4 text-center'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='text-3xl font-bold text-yellow-400 mb-1'>23</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='text-sm text-gray-400'>Longest Win Streak</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='space-y-2'>
                {[
                  { timeframe: 'Today', profit: '+$847', bets: 23 },
                  { timeframe: 'This Week', profit: '+$3,120', bets: 89 },
                  { timeframe: 'This Month', profit: '+$8,420', bets: 247 },
                ].map((period, index) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div key={index} className='flex items-center justify-between text-sm'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>{period.timeframe}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-right'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-green-400 font-medium'>{period.profit}</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-gray-400 text-xs'>{period.bets} bets</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Predictive Insights</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  insight: 'NBA Win Rate Trending Up',
                  confidence: 94,
                  prediction: '+3.2% increase expected',
                  timeframe: 'Next 7 days',
                  impact: 'High',
                },
                {
                  insight: 'Player Props Volume Surge',
                  confidence: 87,
                  prediction: '+15% volume increase',
                  timeframe: 'Next 3 days',
                  impact: 'Medium',
                },
                {
                  insight: 'Live Betting Accuracy Peak',
                  confidence: 91,
                  prediction: '92%+ accuracy window',
                  timeframe: 'Next 24 hours',
                  impact: 'High',
                },
                {
                  insight: 'Market Efficiency Decline',
                  confidence: 78,
                  prediction: 'More opportunities available',
                  timeframe: 'Next 2 weeks',
                  impact: 'Medium',
                },
              ].map((insight, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{insight.insight}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        insight.impact === 'High'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {insight.impact}
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-cyan-400 text-sm mb-1'>{insight.prediction}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>{insight.timeframe}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-purple-400'>{insight.confidence}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Interactive SHAP Analysis Dashboard */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Interactive SHAP Analysis Dashboard</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Real-time prediction explanations with advanced visualizations and feature importance
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <Brain className='w-6 h-6 text-purple-400' />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-2xl font-bold text-green-400 mb-1'>+0.142</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Positive Impact</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-xs text-green-300 mt-1'>Feature boost</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-2xl font-bold text-red-400 mb-1'>-0.087</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Negative Impact</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-xs text-red-300 mt-1'>Feature drag</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-2xl font-bold text-cyan-400 mb-1'>+0.055</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Net Impact</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-xs text-cyan-300 mt-1'>Final contribution</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-2xl font-bold text-purple-400 mb-1'>12</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Active Features</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-xs text-purple-300 mt-1'>Above threshold</div>
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Feature Importance Ranking</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-2'>
              {[
                {
                  feature: 'Recent Form (5 games)',
                  shapValue: 0.142,
                  confidence: 94.2,
                  importance: 100,
                },
                {
                  feature: 'Opponent Defense Rank',
                  shapValue: -0.087,
                  confidence: 89.7,
                  importance: 87,
                },
                { feature: 'Rest Days', shapValue: 0.074, confidence: 92.1, importance: 74 },
                { feature: 'Home/Away Status', shapValue: 0.038, confidence: 85.4, importance: 38 },
                { feature: 'Usage Rate', shapValue: 0.029, confidence: 88.9, importance: 29 },
                { feature: 'Line Movement', shapValue: -0.019, confidence: 76.3, importance: 19 },
              ].map((feature, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white text-xs font-medium'>{feature.feature}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        feature.shapValue > 0
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {feature.shapValue > 0 ? '+' : ''}
                      {feature.shapValue.toFixed(3)}
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='w-full bg-slate-700 rounded-full h-1 mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div
                      className={`h-1 rounded-full ${
                        feature.shapValue > 0 ? 'bg-green-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.abs(feature.importance)}%` }}
                    />
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>Confidence: {feature.confidence}%</div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Model Explanation Analysis</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  model: 'XGBoost Ensemble',
                  baseValue: 0.523,
                  prediction: 0.768,
                  confidence: 94.7,
                  topFeature: 'Recent Form',
                },
                {
                  model: 'Neural Network',
                  baseValue: 0.487,
                  prediction: 0.742,
                  confidence: 91.8,
                  topFeature: 'Usage Rate',
                },
                {
                  model: 'Random Forest',
                  baseValue: 0.501,
                  prediction: 0.734,
                  confidence: 89.2,
                  topFeature: 'Defense Rank',
                },
              ].map((model, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-white font-medium text-sm mb-2'>{model.model}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Base:{' '}
                      <span className='text-white'>{model.baseValue}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Prediction:{' '}
                      <span className='text-cyan-400'>{model.prediction}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Confidence:{' '}
                      <span className='text-green-400'>{model.confidence}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Top:{' '}
                      <span className='text-purple-400'>{model.topFeature}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Visualization Controls</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-3'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='analytics-view-mode'
                  className='text-white text-sm font-medium mb-2 block'
                >
                  View Mode
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <select
                  id='analytics-view-mode'
                  className='w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='waterfall'>Waterfall Plot</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='force'>Force Plot</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='summary'>Summary View</option>
                </select>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-3'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='analytics-confidence-threshold'
                  className='text-white text-sm font-medium mb-2 block'
                >
                  Confidence Threshold: 75%
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <input
                  id='analytics-confidence-threshold'
                  type='range'
                  min='0'
                  max='100'
                  defaultValue='75'
                  className='w-full'
                />
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-3'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='flex items-center space-x-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <input
                    id='analytics-show-positive-only'
                    type='checkbox'
                    className='text-green-400'
                  />
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <label htmlFor='analytics-show-positive-only' className='text-white text-sm'>
                    Show Positive Only
                  </label>
                </div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-3'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='flex items-center space-x-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <input
                    id='analytics-real-time-updates'
                    type='checkbox'
                    className='text-cyan-400'
                    defaultChecked
                  />
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <label htmlFor='analytics-real-time-updates' className='text-white text-sm'>
                    Real-time Updates
                  </label>
                </div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <button className='w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white text-sm font-medium transition-all'>
                Export SHAP Data
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Advanced Time Series Analysis */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.1 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Advanced Time Series Analysis</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              ARIMA, LSTM, and Prophet models for predictive time series forecasting
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <TrendingUp className='w-6 h-6 text-cyan-400' />
        </div>
        {renderAnalyticsSection()}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>ARIMA Model Analysis</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  series: 'NBA Total Points',
                  model: 'ARIMA(2,1,2)',
                  aic: -847.23,
                  forecast: '218.5 ± 3.2',
                  confidence: '95%',
                  trend: 'Upward',
                },
                {
                  series: 'Player Performance',
                  model: 'ARIMA(1,0,1)',
                  aic: -923.47,
                  forecast: '26.8 ± 2.1',
                  confidence: '89%',
                  trend: 'Stable',
                },
                {
                  series: 'Market Efficiency',
                  model: 'ARIMA(3,1,1)',
                  aic: -756.89,
                  forecast: '0.847 ± 0.03',
                  confidence: '92%',
                  trend: 'Declining',
                },
              ].map((arima, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-white font-medium text-sm mb-2'>{arima.series}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Model:{' '}
                      <span className='text-cyan-400'>{arima.model}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message AIC:{' '}
                      <span className='text-purple-400'>{arima.aic}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Forecast:{' '}
                      <span className='text-green-400'>{arima.forecast}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Confidence:{' '}
                      <span className='text-yellow-400'>{arima.confidence}</span>
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-cyan-400 text-xs mt-1'>Trend: {arima.trend}</div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>LSTM Neural Networks</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  network: 'Player Points LSTM',
                  architecture: '128-64-32-1',
                  epochs: 500,
                  loss: 0.0023,
                  valLoss: 0.0031,
                  rmse: 1.47,
                  lookback: 14,
                },
                {
                  network: 'Team Performance LSTM',
                  architecture: '256-128-64-1',
                  epochs: 750,
                  loss: 0.0018,
                  valLoss: 0.0024,
                  rmse: 1.23,
                  lookback: 21,
                },
                {
                  network: 'Market Volatility LSTM',
                  architecture: '64-32-16-1',
                  epochs: 300,
                  loss: 0.0035,
                  valLoss: 0.0042,
                  rmse: 1.89,
                  lookback: 7,
                },
              ].map((lstm, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-white font-medium text-sm mb-2'>{lstm.network}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Architecture:{' '}
                      <span className='text-purple-400'>{lstm.architecture}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Epochs:{' '}
                      <span className='text-cyan-400'>{lstm.epochs}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Loss:{' '}
                      <span className='text-green-400'>{lstm.loss}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Val Loss:{' '}
                      <span className='text-yellow-400'>{lstm.valLoss}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message RMSE:{' '}
                      <span className='text-red-400'>{lstm.rmse}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Lookback:{' '}
                      <span className='text-white'>{lstm.lookback} days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Prophet Forecasting</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  component: 'Seasonal Trends',
                  weekly: '+12.3%',
                  monthly: '+8.7%',
                  yearly: '+4.2%',
                  strength: 'Strong',
                },
                {
                  component: 'Holiday Effects',
                  christmas: '+18.9%',
                  thanksgiving: '+14.2%',
                  playoffs: '+23.7%',
                  strength: 'Very Strong',
                },
                {
                  component: 'Trend Changes',
                  changepoints: 12,
                  flexibility: 0.05,
                  trend: '+2.4% annually',
                  strength: 'Moderate',
                },
              ].map((prophet, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-white font-medium text-sm mb-2'>{prophet.component}</div>
                  {prophet.component === 'Seasonal Trends' && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-gray-400'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message Weekly:{' '}
                        <span className='text-green-400'>{prophet.weekly}</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-gray-400'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message Monthly:{' '}
                        <span className='text-cyan-400'>{prophet.monthly}</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-gray-400'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message Yearly:{' '}
                        <span className='text-purple-400'>{prophet.yearly}</span>
                      </div>
                    </div>
                  )}
                  {prophet.component === 'Holiday Effects' && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-gray-400'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message Christmas:{' '}
                        <span className='text-green-400'>{prophet.christmas}</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-gray-400'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message Thanksgiving:{' '}
                        <span className='text-cyan-400'>{prophet.thanksgiving}</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-gray-400'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message Playoffs:{' '}
                        <span className='text-purple-400'>{prophet.playoffs}</span>
                      </div>
                    </div>
                  )}
                  {prophet.component === 'Trend Changes' && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-gray-400'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message Points:{' '}
                        <span className='text-white'>{prophet.changepoints}</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-gray-400'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message Flexibility:{' '}
                        <span className='text-cyan-400'>{prophet.flexibility}</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-gray-400'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message Trend:{' '}
                        <span className='text-green-400'>{prophet.trend}</span>
                      </div>
                    </div>
                  )}
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-yellow-400 text-xs mt-1'>{prophet.strength}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Advanced Backtesting Engine */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Advanced Backtesting Engine</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Monte Carlo simulation, walk-forward analysis, and regime testing
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <Activity className='w-6 h-6 text-green-400' />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Backtesting Results</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  strategy: 'Value Line Hunter v2.1',
                  period: '2023-2024 Season',
                  trades: 2847,
                  winRate: 73.6,
                  avgReturn: 12.4,
                  sharpe: 2.87,
                  maxDrawdown: -5.2,
                  profitFactor: 2.34,
                },
                {
                  strategy: 'Arbitrage Scanner Pro',
                  period: '2023-2024 Season',
                  trades: 1456,
                  winRate: 96.8,
                  avgReturn: 3.7,
                  sharpe: 4.23,
                  maxDrawdown: -0.8,
                  profitFactor: 8.91,
                },
                {
                  strategy: 'Live Betting Edge',
                  period: '2023-2024 Season',
                  trades: 892,
                  winRate: 68.9,
                  avgReturn: 18.7,
                  sharpe: 1.94,
                  maxDrawdown: -8.3,
                  profitFactor: 1.87,
                },
              ].map((backtest, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-white font-medium text-sm mb-2'>{backtest.strategy}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-gray-400 text-xs mb-2'>{backtest.period}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-3 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Trades:{' '}
                      <span className='text-white'>{backtest.trades}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Win Rate:{' '}
                      <span className='text-green-400'>{backtest.winRate}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Return:{' '}
                      <span className='text-cyan-400'>{backtest.avgReturn}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Sharpe:{' '}
                      <span className='text-purple-400'>{backtest.sharpe}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message Drawdown:{' '}
                      <span className='text-red-400'>{backtest.maxDrawdown}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message PF:{' '}
                      <span className='text-yellow-400'>{backtest.profitFactor}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Monte Carlo Analysis</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='grid grid-cols-2 gap-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-2xl font-bold text-green-400 mb-1'>10,000</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>Simulations</div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-2xl font-bold text-cyan-400 mb-1'>95%</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>Confidence</div>
                </div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='space-y-2'>
                {[
                  { percentile: '95th Percentile', return: '+34.7%', probability: '5%' },
                  { percentile: '75th Percentile', return: '+24.2%', probability: '25%' },
                  { percentile: '50th Percentile', return: '+18.7%', probability: '50%' },
                  { percentile: '25th Percentile', return: '+12.3%', probability: '75%' },
                  { percentile: '5th Percentile', return: '+2.8%', probability: '95%' },
                ].map((percentile, index) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div key={index} className='bg-slate-800/50 rounded-lg p-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex items-center justify-between text-xs'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>{percentile.percentile}</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div className='text-right'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <span className='text-green-400 font-medium'>{percentile.return}</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <div className='text-gray-400'>{percentile.probability} chance</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-3'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-lg font-bold text-purple-400 mb-1'>0.3%</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>Risk of Loss</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Injury Impact Analytics */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <Heart className='w-6 h-6 text-orange-400' />
              Injury Impact Analytics
            </h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Real-time player health monitoring and impact assessment
            </p>
          </div>
          <div className='grid grid-cols-4 gap-4 text-center text-sm'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-lg font-bold text-orange-400'>{injuries.length}</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-gray-400 text-xs'>Total Injuries</div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-lg font-bold text-red-400'>
                {injuries.filter(i => i.severity === 'severe').length}
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-gray-400 text-xs'>Severe</div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-lg font-bold text-yellow-400'>
                {injuries.filter(i => i.status === 'questionable').length}
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-gray-400 text-xs'>Questionable</div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-lg font-bold text-blue-400'>{teamImpacts.length}</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-gray-400 text-xs'>Teams Affected</div>
            </div>
          </div>
        </div>
        {/* Injury Filters */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='bg-slate-900/50 rounded-lg p-4 mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <label htmlFor='injury-sport' className='block text-sm text-gray-400 mb-2'>
                Sport
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <select
                id='injury-sport'
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value='all'>All Sports</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value='NBA'>NBA</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value='NFL'>NFL</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value='MLB'>MLB</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value='NHL'>NHL</option>
              </select>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <label htmlFor='injury-severity' className='block text-sm text-gray-400 mb-2'>
                Severity
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <select
                id='injury-severity'
                value={selectedSeverity}
                onChange={e => setSelectedSeverity(e.target.value)}
                className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value='all'>All Severities</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value='critical'>Critical</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value='severe'>Severe</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                <option value='moderate'>Moderate</option>
                <option value='minor'>Minor</option>
              </select>
            </div>
            <div>
              <label htmlFor='injury-search' className='block text-sm text-gray-400 mb-2'>
                Search
              </label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  id='injury-search'
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Player or team...'
                  className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm'
                />
              </div>
            </div>
            <div className='flex items-end'>
              <Button
                onClick={loadInjuryData}
                className='w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          {/* Active Injury Reports */}
          <div className='xl:col-span-2'>
            <div className='space-y-4'>
              <h4 className='text-lg font-medium text-white'>Active Injury Reports</h4>
              <div className='space-y-3 max-h-96 overflow-y-auto'>
                {filteredInjuries.slice(0, 6).map((injury, index) => (
                  <motion.div
                    key={injury.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className='bg-slate-900/50 rounded-lg p-4 border border-slate-700/30'
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center'>
                          <User className='w-4 h-4 text-white' />
                        </div>
                        <div>
                          <h5 className='font-bold text-white text-sm'>{injury.player}</h5>
                          <p className='text-gray-400 text-xs'>
                            {injury.team} • {injury.position}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant='outline'
                          className={`text-xs ${getSeverityColor(injury.severity)}`}
                        >
                          {getSeverityIcon(injury.severity)}
                          {injury.severity}
                        </Badge>
                        <Badge
                          variant='outline'
                          className={`text-xs ${getInjuryStatusColor(injury.status)}`}
                        >
                          {injury.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-3 mb-3'>
                      <div>
                        <div className='text-xs text-gray-400 mb-1'>Injury Details</div>
                        <div className='text-xs space-y-1'>
                          <div className='text-white'>{injury.injury}</div>
                          <div className='text-gray-400'>Return: {injury.expectedReturn}</div>
                        </div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-400 mb-1'>Impact Analysis</div>
                        <div className='space-y-1'>
                          <div className='flex justify-between text-xs'>
                            <span className='text-gray-400'>Team:</span>
                            <span className='text-orange-400 font-bold'>
                              {injury.impact.team.toFixed(0)}%
                            </span>
                          </div>
                          <div className='flex justify-between text-xs'>
                            <span className='text-gray-400'>Fantasy:</span>
                            <span className='text-purple-400 font-bold'>
                              {injury.impact.fantasy.toFixed(0)}%
                            </span>
                          </div>
                          <div className='flex justify-between text-xs'>
                            <span className='text-gray-400'>Betting:</span>
                            <span className='text-blue-400 font-bold'>
                              {injury.impact.betting.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700'>
                      <span>Source: {injury.source}</span>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-3 h-3' />
                        <span>{injury.timeline}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          {/* Team Impact Rankings */}
          <div>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-lg font-medium text-white mb-4 flex items-center gap-2'>
                <AlertTriangle className='w-5 h-5 text-orange-400' />
                Team Impact Rankings
              </h4>
              <div className='space-y-3 max-h-96 overflow-y-auto'>
                {teamImpacts.slice(0, 8).map((team, index) => (
                  <motion.div
                    key={`${team.team}-${team.sport}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className='p-3 bg-slate-800/50 rounded-lg border border-slate-700/50'
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <h5 className='font-bold text-white text-sm'>{team.team}</h5>
                        <p className='text-gray-400 text-xs'>{team.sport}</p>
                      </div>
                      <div className='text-right'>
                        <div className='text-orange-400 font-bold text-sm'>
                          {team.projectedImpact.toFixed(0)}%
                        </div>
                        <div className='text-xs text-gray-400'>Impact</div>
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                      <div>
                        <span className='text-gray-400'>Total:</span>
                        <div className='text-red-400 font-bold'>{team.totalInjuries}</div>
                      </div>
                      <div>
                        <span className='text-gray-400'>Key Players:</span>
                        <div className='text-yellow-400 font-bold'>{team.keyPlayerInjuries}</div>
                      </div>
                    </div>
                    <div>
                      <div className='text-xs text-gray-400 mb-1'>Affected Positions:</div>
                      <div className='flex flex-wrap gap-1'>
                        {team.affectedPositions.slice(0, 4).map((pos, i) => (
                          <Badge
                            key={i}
                            variant='outline'
                            className='text-xs text-gray-400 border-gray-600'
                          >
                            {pos}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Quantum AI Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white flex items-center gap-2'>
              <Cpu className='w-6 h-6 text-purple-400' />
              Quantum AI Engine
            </h3>
            <p className='text-gray-400 text-sm'>
              Quantum computing enhanced prediction algorithms
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div
              className={`w-3 h-3 rounded-full ${
                isQuantumActive ? 'bg-purple-400 animate-pulse' : 'bg-gray-400'
              }`}
            ></div>
            <span
              className={`text-sm font-medium ${
                isQuantumActive ? 'text-purple-400' : 'text-gray-400'
              }`}
            >
              {isQuantumActive ? 'Quantum Active' : 'Classical Mode'}
            </span>
          </div>
        </div>
        {/* Quantum Controls */}
        <div className='bg-slate-900/50 rounded-lg p-4 mb-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
            <div>
              <label htmlFor='quantum-algorithm' className='block text-sm text-gray-400 mb-2'>
                Quantum Algorithm
              </label>
              <select
                id='quantum-algorithm'
                value={selectedAlgorithm}
                onChange={e => setSelectedAlgorithm(e.target.value as unknown)}
                className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm'
              >
                <option value='qaoa'>QAOA</option>
                <option value='grover'>Grover's Search</option>
                <option value='shor'>Shor's Algorithm</option>
                <option value='vqe'>VQE</option>
              </select>
              <p className='text-xs text-gray-500 mt-1'>
                {getAlgorithmDescription(selectedAlgorithm)}
              </p>
            </div>
            <div>
              <label htmlFor='quantum-depth' className='block text-sm text-gray-400 mb-2'>
                Quantum Depth: {quantumDepth}
              </label>
              <input
                id='quantum-depth'
                type='range'
                min='4'
                max='16'
                value={quantumDepth}
                onChange={e => setQuantumDepth(parseInt(e.target.value))}
                className='w-full'
              />
            </div>
            <div>
              <label
                htmlFor='quantum-simulation-speed'
                className='block text-sm text-gray-400 mb-2'
              >
                Simulation Speed: {simulationSpeed}x
              </label>
              <input
                id='quantum-simulation-speed'
                type='range'
                min='0.5'
                max='4'
                step='0.5'
                value={simulationSpeed}
                onChange={e => setSimulationSpeed(parseFloat(e.target.value))}
                className='w-full'
              />
            </div>
            <div className='flex items-end gap-2'>
              <Button
                onClick={() => setIsQuantumActive(!isQuantumActive)}
                className={`flex-1 ${
                  isQuantumActive
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-600 hover:to-cyan-700'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                }`}
              >
                {isQuantumActive ? 'Active' : 'Inactive'}
              </Button>
              <Button onClick={loadQuantumData} variant='outline'>
                <RotateCcw className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          {/* Quantum Network Visualization */}
          <div className='xl:col-span-2'>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-lg font-medium text-white mb-4 flex items-center gap-2'>
                <GitBranch className='w-5 h-5 text-purple-400' />
                Quantum Neural Network
              </h4>
              <div
                className='relative bg-slate-800/50 rounded-lg p-4 overflow-hidden'
                style={{ height: '400px' }}
              >
                <svg width='100%' height='100%' className='absolute inset-0'>
                  {/* Render connections */}
                  {quantumConnections.map((connection, index) => {
                    const fromNode = quantumNodes.find(n => n.id === connection.from);
                    const toNode = quantumNodes.find(n => n.id === connection.to);

                    if (!fromNode || !toNode) return null;

                    return (
                      <motion.line
                        key={`connection-${index}`}
                        x1={fromNode.position.x}
                        y1={fromNode.position.y}
                        x2={toNode.position.x}
                        y2={toNode.position.y}
                        stroke={getConnectionColor(connection)}
                        strokeWidth={connection.strength * 3 + 1}
                        strokeOpacity={connection.entanglement ? 0.8 : 0.4}
                        strokeDasharray={connection.type === 'quantum' ? '5,5' : 'none'}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, delay: index * 0.02 }}
                      />
                    );
                  })}

                  {/* Render nodes */}
                  {quantumNodes.map((node, index) => (
                    <motion.g key={node.id}>
                      <motion.circle
                        cx={node.position.x}
                        cy={node.position.y}
                        r={node.type === 'quantum' ? 8 : 6}
                        fill={getNodeColor(node)}
                        stroke={node.entangled ? '#EC4899' : 'none'}
                        strokeWidth={2}
                        strokeDasharray={node.superposition ? '3,3' : 'none'}
                        initial={{ scale: 0 }}
                        animate={{
                          scale: 1,
                          opacity: node.superposition ? [0.6, 1, 0.6] : 1,
                        }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.02,
                          opacity: { duration: 2, repeat: Infinity },
                        }}
                      />
                      {/* Quantum indicators */}
                      {node.type === 'quantum' && node.qubits && (
                        <text
                          x={node.position.x}
                          y={node.position.y - 15}
                          textAnchor='middle'
                          fontSize='10'
                          fill='#A855F7'
                        >
                          Q{node.qubits}
                        </text>
                      )}
                    </motion.g>
                  ))}
                </svg>
                {/* Legend */}
                <div className='absolute bottom-4 left-4 space-y-1 text-xs'>
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                    <span className='text-gray-300'>Input</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 bg-purple-500 rounded-full border border-pink-400'></div>
                    <span className='text-gray-300'>Quantum (Entangled)</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span className='text-gray-300'>Neural</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 bg-amber-500 rounded-full'></div>
                    <span className='text-gray-300'>Output</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Quantum Metrics & Predictions */}
          <div className='space-y-4'>
            {/* Quantum Metrics */}
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-lg font-medium text-white mb-4 flex items-center gap-2'>
                <Activity className='w-5 h-5 text-cyan-400' />
                Quantum Metrics
              </h4>
              {quantumMetrics && (
                <div className='space-y-3'>
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                      <div className='text-lg font-bold text-purple-400'>
                        {quantumMetrics.quantumVolume}
                      </div>
                      <div className='text-xs text-gray-400'>Quantum Volume</div>
                    </div>
                    <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                      <div className='text-lg font-bold text-cyan-400'>
                        {(quantumMetrics.fidelity * 100).toFixed(1)}%
                      </div>
                      <div className='text-xs text-gray-400'>Fidelity</div>
                    </div>
                    <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                      <div className='text-lg font-bold text-blue-400'>
                        {quantumMetrics.coherenceTime.toFixed(0)}μs
                      </div>
                      <div className='text-xs text-gray-400'>Coherence</div>
                    </div>
                    <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                      <div className='text-lg font-bold text-pink-400'>
                        {(quantumMetrics.entanglementDegree * 100).toFixed(0)}%
                      </div>
                      <div className='text-xs text-gray-400'>Entanglement</div>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-xs'>
                      <span className='text-gray-400'>Error Rate</span>
                      <span className='text-red-400'>
                        {(quantumMetrics.errorRate * 100).toFixed(3)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-1'>
                      <div
                        className='bg-red-400 h-1 rounded-full'
                        style={{ width: `${(quantumMetrics.errorRate / 0.02) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Quantum Predictions */}
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-lg font-medium text-white mb-4'>Quantum Predictions</h4>
              <div className='space-y-3 max-h-64 overflow-y-auto'>
                {quantumPredictions.slice(0, 5).map((pred, index) => (
                  <div key={pred.id} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <h5 className='font-bold text-white text-sm'>{pred.game}</h5>
                        <p className='text-gray-400 text-xs'>{pred.prediction}</p>
                      </div>
                      <div className='text-right'>
                        <div className='text-purple-400 font-bold text-sm'>
                          {pred.confidence.toFixed(0)}%
                        </div>
                        <div className='text-xs text-gray-400'>Confidence</div>
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      <div>
                        <span className='text-gray-400'>Q-States:</span>
                        <div className='text-cyan-400 font-bold'>{pred.quantumStates}</div>
                      </div>
                      <div>
                        <span className='text-gray-400'>Advantage:</span>
                        <div className='text-green-400 font-bold'>
                          +{(pred.quantumAdvantage * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Weather Intelligence Station */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.8 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <Cloud className='w-6 h-6 text-cyan-400' />
              Weather Intelligence Station
            </h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Environmental impact analysis for outdoor sports
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='grid grid-cols-4 gap-4 text-center text-sm'>
            <div>
              <div className='text-lg font-bold text-cyan-400'>{weatherData.length}</div>
              <div className='text-gray-400 text-xs'>Games Tracked</div>
            </div>
            <div>
              <div className='text-lg font-bold text-red-400'>
                {weatherData.filter(w => w.impact.overall === 'high').length}
              </div>
              <div className='text-gray-400 text-xs'>High Impact</div>
            </div>
            <div>
              <div className='text-lg font-bold text-blue-400'>
                {weatherData.filter(w => w.forecast.precipitation > 50).length}
              </div>
              <div className='text-gray-400 text-xs'>Rain Expected</div>
            </div>
            <div>
              <div className='text-lg font-bold text-gray-400'>
                {weatherData.filter(w => w.current.windSpeed > 15).length}
              </div>
              <div className='text-gray-400 text-xs'>Windy Games</div>
            </div>
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          {/* Games Weather List */}
          <div>
            <h4 className='text-lg font-medium text-white mb-4'>Games Today</h4>
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              {weatherData.map((weather, index) => (
                <motion.div
                  key={weather.gameId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-slate-900/50 rounded-lg p-3 cursor-pointer transition-all ${
                    selectedWeatherGame?.gameId === weather.gameId
                      ? 'border-cyan-500/50 bg-cyan-900/10'
                      : 'border-gray-700/50 hover:border-cyan-500/30'
                  }`}
                  onClick={() => setSelectedWeatherGame(weather)}
                  tabIndex={0}
                  role='button'
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedWeatherGame(weather);
                    }
                  }}
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div>
                      <h5 className='font-bold text-white text-sm'>{weather.game}</h5>
                      <p className='text-gray-400 text-xs'>{weather.venue}</p>
                      <p className='text-gray-400 text-xs'>{weather.gameTime}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      {getWeatherIcon(weather.current.condition)}
                      <Badge
                        variant='outline'
                        className={getWeatherImpactColor(weather.impact.overall)}
                      >
                        {weather.impact.overall}
                      </Badge>
                    </div>
                  </div>
                  <div className='grid grid-cols-3 gap-2 text-xs'>
                    <div className='text-center'>
                      <div className='text-cyan-400 font-bold'>
                        {weather.current.temperature.toFixed(0)}°F
                      </div>
                      <div className='text-gray-400'>Temp</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-blue-400 font-bold'>
                        {weather.current.windSpeed.toFixed(0)} mph
                      </div>
                      <div className='text-gray-400'>Wind</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-purple-400 font-bold'>
                        {weather.current.humidity.toFixed(0)}%
                      </div>
                      <div className='text-gray-400'>Humidity</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Current Conditions */}
          <div>
            {selectedWeatherGame && (
              <div className='bg-slate-900/50 rounded-lg p-4'>
                <h4 className='text-lg font-medium text-white mb-4 flex items-center gap-2'>
                  {getWeatherIcon(selectedWeatherGame.current.condition)}
                  Current Conditions - {selectedWeatherGame.city}
                </h4>
                <div className='grid grid-cols-2 gap-4 mb-4'>
                  <div className='text-center'>
                    <Thermometer className='w-6 h-6 text-red-400 mx-auto mb-2' />
                    <div className='text-xl font-bold text-red-400'>
                      {selectedWeatherGame.current.temperature.toFixed(0)}°F
                    </div>
                    <div className='text-sm text-gray-400'>Temperature</div>
                  </div>
                  <div className='text-center'>
                    <Wind className='w-6 h-6 text-blue-400 mx-auto mb-2' />
                    <div className='text-xl font-bold text-blue-400'>
                      {selectedWeatherGame.current.windSpeed.toFixed(0)} mph
                    </div>
                    <div className='text-sm text-gray-400'>
                      Wind {selectedWeatherGame.current.windDirection}
                    </div>
                  </div>
                  <div className='text-center'>
                    <Droplets className='w-6 h-6 text-purple-400 mx-auto mb-2' />
                    <div className='text-xl font-bold text-purple-400'>
                      {selectedWeatherGame.current.humidity.toFixed(0)}%
                    </div>
                    <div className='text-sm text-gray-400'>Humidity</div>
                  </div>
                  <div className='text-center'>
                    <Eye className='w-6 h-6 text-green-400 mx-auto mb-2' />
                    <div className='text-xl font-bold text-green-400'>
                      {selectedWeatherGame.current.visibility.toFixed(1)} mi
                    </div>
                    <div className='text-sm text-gray-400'>Visibility</div>
                  </div>
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>Condition:</span>
                    <span className='text-white'>{selectedWeatherGame.current.condition}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>Pressure:</span>
                    <span className='text-white'>
                      {selectedWeatherGame.current.pressure.toFixed(2)} inHg
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>Precipitation:</span>
                    <span className='text-blue-400'>
                      {selectedWeatherGame.forecast.precipitation.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Impact Analysis */}
          <div>
            {selectedWeatherGame && (
              <div className='bg-slate-900/50 rounded-lg p-4'>
                <h4 className='text-lg font-medium text-white mb-4'>Impact Analysis</h4>
                <div className='space-y-4'>
                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span className='text-gray-400'>Overall Impact</span>
                      <Badge
                        variant='outline'
                        className={getWeatherImpactColor(selectedWeatherGame.impact.overall)}
                      >
                        {selectedWeatherGame.impact.overall.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-gray-400'>Passing Conditions</span>
                      <span className='text-green-400 font-bold'>
                        {selectedWeatherGame.impact.passing.toFixed(0)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-green-400 h-2 rounded-full'
                        style={{ width: `${selectedWeatherGame.impact.passing}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-gray-400'>Kicking Conditions</span>
                      <span className='text-blue-400 font-bold'>
                        {selectedWeatherGame.impact.kicking.toFixed(0)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-blue-400 h-2 rounded-full'
                        style={{ width: `${selectedWeatherGame.impact.kicking}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-gray-400'>Visibility</span>
                      <span className='text-cyan-400 font-bold'>
                        {selectedWeatherGame.impact.visibility.toFixed(0)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-cyan-400 h-2 rounded-full'
                        style={{ width: `${selectedWeatherGame.impact.visibility}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-gray-400'>Player Comfort</span>
                      <span className='text-purple-400 font-bold'>
                        {selectedWeatherGame.impact.player_comfort.toFixed(0)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-purple-400 h-2 rounded-full'
                        style={{ width: `${selectedWeatherGame.impact.player_comfort}%` }}
                      />
                    </div>
                  </div>
                  <div className='mt-4 p-3 bg-slate-800/50 rounded-lg'>
                    <h5 className='text-sm font-bold text-white mb-2'>Weather Recommendation</h5>
                    <p className='text-xs text-gray-400'>
                      {selectedWeatherGame.impact.overall === 'high'
                        ? 'Significant weather impact expected. Consider under bets and reduced scoring.'
                        : selectedWeatherGame.impact.overall === 'medium'
                        ? 'Moderate weather impact. Monitor conditions closely.'
                        : 'Minimal weather impact expected. Normal betting conditions.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Analytics;
