import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Zap,
  Clock,
  User,
  Trophy,
  Activity,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import PlayerAvatar from '../PlayerAvatar';
import StatcastMetrics from '../StatcastMetrics';

// Unified interfaces
interface StatBar {
  label: string;
  value: number;
}

interface Insight {
  icon: React.ReactNode;
  text: string;
}

interface UnifiedPlayer {
  name: string;
  team: string;
  position?: string;
  headshot?: string;
  espnPlayerId?: string;
}

interface UnifiedGame {
  opponent?: string;
  date?: string;
  time?: string;
  venue?: string;
  matchup?: string;
}

interface UnifiedProp {
  type: string;
  stat: string;
  line: number;
  overOdds?: number;
  underOdds?: number;
  recommendation?: 'over' | 'under' | 'none';
  confidence: number;
}

interface UnifiedAnalysis {
  aiPrediction?: number;
  trend?: 'up' | 'down' | 'neutral';
  reasoning?: string;
  summary?: string;
  analysis?: React.ReactNode;
  factors?: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  stats: StatBar[];
  insights: Insight[];
}

type PropCardVariant = 'condensed' | 'standard' | 'enhanced';

interface UnifiedPropCardProps {
  // Core data
  player: UnifiedPlayer;
  game: UnifiedGame;
  prop: UnifiedProp;
  analysis: UnifiedAnalysis;
  
  // Variant and behavior
  variant?: PropCardVariant;
  isExpanded?: boolean;
  isAnalysisLoading?: boolean;
  hasAnalysis?: boolean;
  showStatcastMetrics?: boolean;
  
  // Styling and state
  accentColor?: string;
  bookmarked?: boolean;
  logoUrl?: string;
  maxScore?: number;
  
  // Callbacks
  onClick?: () => void;
  onCollapse?: () => void;
  onRequestAnalysis?: () => void;
  
  // Enhanced props specific data
  fetchEnhancedAnalysis?: (proj: any) => Promise<any>;
  enhancedAnalysisCache?: Map<string, any>;
  loadingAnalysis?: Set<string>;
  statcastData?: any;
  alternativeProps?: Array<{
    stat: string;
    line: number;
    confidence: number;
    overOdds?: number;
    underOdds?: number;
  }>;
}

const UnifiedPropCard: React.FC<UnifiedPropCardProps> = ({
  player,
  game,
  prop,
  analysis,
  variant = 'standard',
  isExpanded = false,
  isAnalysisLoading = false,
  hasAnalysis = false,
  showStatcastMetrics = false,
  accentColor = '#222',
  bookmarked = false,
  logoUrl,
  maxScore = 100,
  onClick,
  onCollapse,
  onRequestAnalysis,
  statcastData,
  alternativeProps = [],
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);

  const confidenceScore = Math.round(prop.confidence || 0);

  // Handle analysis toggle
  const handleToggleAnalysis = () => {
    if (!showAnalysis && !hasAnalysis && onRequestAnalysis) {
      onRequestAnalysis();
    }
    setShowAnalysis(!showAnalysis);
  };

  // Handle card click for condensed variant
  const handleCardClick = () => {
    if (variant === 'condensed' && onClick) {
      onClick();
    }
  };

  // Format matchup display
  const getMatchupDisplay = () => {
    if (game.matchup) {
      const parts = game.matchup.split(' ');
      if (parts.length >= 2) {
        return `vs ${parts[1]} ${parts.length > 2 ? parts[2] : ''}`;
      }
      return `vs ${game.matchup}`;
    }
    if (game.opponent) {
      return `vs ${game.opponent}`;
    }
    return '';
  };

  // Render based on variant
  switch (variant) {
    case 'condensed':
      return (
        <div
          data-testid="unified-prop-card-condensed"
          className={`relative rounded-xl p-0 mb-4 cursor-pointer transition-all duration-300 border border-gray-700 overflow-hidden shadow-lg flex items-center${
            isExpanded ? ' ring-2 ring-blue-500' : ''
          }`}
          style={{ backgroundColor: accentColor }}
          onClick={handleCardClick}
        >
          {/* Team logo background */}
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Team Logo"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-20 w-32 h-32 object-contain pointer-events-none select-none"
              style={{ zIndex: 0 }}
            />
          )}
          
          {/* Card content */}
          <div className="flex items-center justify-between relative z-10 w-full p-4">
            {/* Left: Avatar, player info */}
            <div className="flex items-center gap-3">
              <PlayerAvatar 
                playerName={player.name} 
                playerId={player.espnPlayerId} 
                size="md" 
                className="mr-2" 
              />
              <div>
                <div className="text-white font-bold text-lg leading-tight">{player.name}</div>
                <div className="text-gray-300 text-xs font-medium">{getMatchupDisplay()}</div>
              </div>
            </div>
            
            {/* Right: Grade, bookmark */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-black text-green-400 font-bold px-2 py-1 rounded-lg text-xs shadow-md">
                  A+
                </span>
                <button
                  className="bg-transparent border-none p-0 m-0 cursor-pointer"
                  tabIndex={-1}
                  aria-label={bookmarked ? 'Bookmarked' : 'Bookmark'}
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    className={`w-5 h-5 ${bookmarked ? 'text-yellow-400' : 'text-gray-400'}`}
                    fill={bookmarked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5v16l7-5 7 5V5a2 2 0 00-2-2H7a2 2 0 00-2 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Expand indicator */}
          <div className="flex justify-center pb-2">
            <div className={`transition-all duration-300 flex items-center gap-1 ${
              isExpanded ? 'text-blue-400' : 'text-gray-500'
            }`}>
              <div className={`w-6 h-1 rounded-full transition-transform duration-300 ${
                isExpanded ? 'bg-blue-500 rotate-90' : 'bg-gray-600'
              }`}></div>
              <div className="text-xs">
                {isExpanded ? 'Click to collapse' : 'Click for details'}
              </div>
            </div>
          </div>

          {/* Statcast Metrics - Only show when expanded and for MLB */}
          {isExpanded && showStatcastMetrics && (
            <StatcastMetrics
              prop={{
                id: `${player.name}-${prop.stat}`,
                player: player.name,
                stat: prop.stat,
                line: prop.line,
                confidence: prop.confidence,
                matchup: game.matchup || '',
                sport: 'MLB',
                overOdds: prop.overOdds || 0,
                underOdds: prop.underOdds || 0,
                gameTime: game.time || '',
                pickType: 'player',
                espnPlayerId: player.espnPlayerId,
                _originalData: statcastData,
              }}
              isVisible={true}
            />
          )}
        </div>
      );

    case 'enhanced':
      return (
        <motion.div
          data-testid="unified-prop-card-enhanced"
          className="bg-cyber-darker rounded-2xl p-6 mb-6 shadow-2xl border border-cyber-border backdrop-blur-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Enhanced header with player info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {player.headshot ? (
                <motion.img
                  src={player.headshot}
                  alt={player.name}
                  className="w-16 h-16 rounded-full border-2 border-cyber-primary shadow-neon"
                  whileHover={{ scale: 1.05 }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-cyber-dark border-2 border-cyber-primary flex items-center justify-center">
                  <User className="w-8 h-8 text-cyber-primary" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{player.name}</h3>
                <p className="text-cyber-primary text-sm">{player.position} • {player.team}</p>
                <p className="text-gray-400 text-xs">{getMatchupDisplay()}</p>
              </div>
            </div>
            
            {/* Confidence badge */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-primary to-cyber-secondary flex items-center justify-center text-cyber-dark font-bold text-lg shadow-neon">
                {confidenceScore}%
              </div>
            </motion.div>
          </div>

          {/* Prop details */}
          <div className="bg-cyber-glass rounded-lg p-4 mb-4 border border-cyber-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-cyber-primary font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" />
                {prop.type}
              </h4>
              <div className="flex items-center gap-2">
                {prop.recommendation === 'over' && <ArrowUpRight className="w-4 h-4 text-green-400" />}
                {prop.recommendation === 'under' && <ArrowDownRight className="w-4 h-4 text-red-400" />}
                {prop.recommendation === 'none' && <Minus className="w-4 h-4 text-gray-400" />}
                <span className="text-white font-mono">{prop.line}</span>
              </div>
            </div>
            
            {analysis.summary && (
              <p className="text-gray-300 text-sm leading-relaxed">{analysis.summary}</p>
            )}
          </div>

          {/* Analysis toggle */}
          {onRequestAnalysis && (
            <button
              onClick={handleToggleAnalysis}
              className="w-full bg-cyber-glass hover:bg-cyber-border rounded-lg p-4 transition-all duration-300 border border-cyber-border hover:border-cyber-primary group mb-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-cyber-primary" />
                  <span className="text-white font-semibold">AI Analysis</span>
                  {isAnalysisLoading && (
                    <motion.div
                      className="w-4 h-4 border-2 border-cyber-primary border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </div>
                <motion.div
                  animate={{ rotate: showAnalysis ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
            </button>
          )}

          {/* Analysis content */}
          {showAnalysis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="bg-cyber-glass rounded-lg p-4 border-l-4 border-cyber-primary mb-4"
            >
              {isAnalysisLoading ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    className="w-8 h-8 border-2 border-cyber-primary border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="ml-3 text-gray-300">Generating analysis...</span>
                </div>
              ) : analysis.analysis ? (
                <div className="text-gray-200 text-sm leading-relaxed">
                  {analysis.analysis}
                </div>
              ) : (
                <div className="text-gray-400 text-sm italic">No analysis available.</div>
              )}
            </motion.div>
          )}

          {/* Performance metrics */}
          <div className="bg-cyber-glass rounded-lg p-4 mb-4 border border-cyber-border">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyber-primary" />
              Performance Analytics
            </h4>
            
            {/* Stats visualization */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {analysis.stats.slice(0, 10).map((stat, idx) => {
                const percentage = Math.round(stat.value * 100);
                const isTargetHit = stat.value >= 1.0;
                
                return (
                  <motion.div
                    key={idx}
                    className="text-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className={`text-xs font-semibold mb-1 ${
                      isTargetHit ? 'text-green-400' : 'text-white'
                    }`}>
                      {percentage}%
                    </div>
                    <div
                      className={`w-full h-2 rounded-full ${
                        isTargetHit ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ height: `${Math.max(stat.value * 40, 4)}px` }}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {stat.label.replace(/^0/, '')}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-cyber-glass rounded-lg p-4 border border-cyber-border">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyber-primary" />
              Key Insights
            </h4>
            <div className="space-y-3">
              {analysis.insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <span className="text-cyber-primary text-xl flex-shrink-0">{insight.icon}</span>
                  <span className="text-gray-300 text-sm leading-relaxed">{insight.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Collapse button */}
          {onCollapse && (
            <motion.button
              onClick={onCollapse}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-cyber-glass hover:bg-cyber-border rounded-lg transition-all duration-300 border border-cyber-border hover:border-cyber-primary group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span className="text-gray-400 group-hover:text-white font-medium">Collapse</span>
            </motion.button>
          )}
        </motion.div>
      );

    case 'standard':
    default:
      return (
        <div
          className="bg-black rounded-2xl p-5 mb-6 shadow-lg border border-gray-800 max-w-md mx-auto"
          data-testid="unified-prop-card-standard"
        >
          {/* Header with score */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative mb-2">
              <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center border-4 border-green-500 text-3xl font-bold text-green-400">
                {confidenceScore}/{maxScore}
              </div>
            </div>
            <div className="text-xl font-bold text-white text-center">{player.name}</div>
            <div className="text-sm text-gray-400 text-center">
              {player.position} · {player.team}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-900 rounded-lg p-3 mb-3 border border-gray-700/50">
            <div className="text-white text-sm font-medium mb-2 flex items-center justify-between">
              <span>At a Glance</span>
              <div className="w-4 h-4 rounded-full bg-gray-600/50 flex items-center justify-center cursor-help border border-gray-500/30" title="AI Analysis Summary">
                <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20" className="text-gray-400">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-gray-200 text-sm leading-relaxed">{analysis.summary}</div>
          </div>

          {/* Deep AI Analysis Toggle */}
          {onRequestAnalysis && (
            <div className="mb-3">
              <button
                onClick={handleToggleAnalysis}
                className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-all duration-300 border border-gray-600 hover:border-gray-500 group"
                aria-label="Deep AI Analysis"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">🧠</span>
                    <span className="text-white font-semibold">Deep AI Analysis</span>
                    {isAnalysisLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 group-hover:text-white transition-all duration-300 ${
                      showAnalysis ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="text-left text-gray-400 text-xs mt-1">
                  {showAnalysis
                    ? 'Click to hide detailed AI analysis'
                    : hasAnalysis
                    ? 'Click to show detailed AI analysis'
                    : 'Click to generate detailed AI analysis'}
                </div>
              </button>

              {/* Analysis Content */}
              {showAnalysis && (
                <div className="bg-gray-900 rounded-lg p-4 mt-2 border-l-4 border-yellow-400">
                  {isAnalysisLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                      <span className="ml-3 text-gray-300">Generating deep analysis...</span>
                    </div>
                  ) : analysis.analysis ? (
                    <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                      <div>AI's Take</div>
                      <div>{analysis.analysis}</div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm italic">No analysis available.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Performance Analytics */}
          <div className="bg-gray-900 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold text-lg">Performance Analytics</div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-300 font-medium">Target Hit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-300 font-medium">Performance</span>
                </div>
              </div>
            </div>

            {/* Recent Games Stats */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-white font-medium text-sm">Recent Games</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent"></div>
              </div>

              <div className="relative">
                <div className="absolute left-0 right-0 border-t border-gray-600 border-dashed opacity-40" style={{ bottom: `${45 + 25}px` }}>
                  <span className="absolute -right-12 -top-2.5 text-xs text-gray-500 bg-gray-900 px-1 rounded">75%</span>
                </div>

                <div className="flex items-end gap-4 pb-6">
                  {analysis.stats
                    .filter(stat => 
                      !stat.label.toLowerCase().includes('season') &&
                      !stat.label.toLowerCase().includes('vs') &&
                      !stat.label.toLowerCase().includes('opp')
                    )
                    .map((stat, idx) => {
                      const percentage = Math.round(stat.value * 100);
                      const barHeight = Math.max(stat.value * 60, 6);
                      const isTargetHit = stat.value >= 1.0;

                      return (
                        <div key={idx} className="flex flex-col items-center group relative">
                          <div className={`text-xs font-semibold mb-2 transition-all duration-300 ${
                            isTargetHit ? 'text-green-400' : 'text-white'
                          } group-hover:scale-110`}>
                            {percentage}%
                          </div>

                          <div className="relative">
                            <div
                              className={`w-9 rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 shadow-lg ${
                                isTargetHit
                                  ? 'bg-gradient-to-t from-green-600 to-green-400 border-2 border-green-400'
                                  : 'bg-gradient-to-t from-yellow-600 to-yellow-400 border-2 border-yellow-400'
                              }`}
                              style={{ height: `${barHeight}px`, minHeight: '6px' }}
                              title={`${stat.label}: ${percentage}% ${isTargetHit ? '(Target Achieved!)' : ''}`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white to-transparent opacity-20 rounded-lg"></div>
                              {isTargetHit && (
                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-sm animate-pulse">⭐</div>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-gray-400 group-hover:text-white transition-colors mt-3 font-medium">
                            {stat.label.replace(/^0/, '')}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Comparative Statistics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                <h3 className="text-white font-medium text-sm">Comparative Analysis</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {analysis.stats
                  .filter(stat =>
                    stat.label.toLowerCase().includes('season') ||
                    stat.label.toLowerCase().includes('vs') ||
                    stat.label.toLowerCase().includes('opp')
                  )
                  .map((stat, idx) => {
                    const percentage = Math.round(stat.value * 100);
                    const isSeason = stat.label.toLowerCase().includes('season');

                    return (
                      <div
                        key={idx}
                        className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${
                          isSeason
                            ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 hover:border-blue-500/70'
                            : 'bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-700/50 hover:border-red-500/70'
                        } rounded-xl p-4 backdrop-blur-sm`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isSeason ? 'bg-blue-400' : 'bg-red-400'}`}></div>
                            <span className="text-xs font-medium text-gray-300">
                              {isSeason ? 'Season Average' : 'vs Opponent'}
                            </span>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            percentage >= 75 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {percentage >= 75 ? 'Strong' : 'Below Avg'}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className={`text-2xl font-bold mb-1 ${isSeason ? 'text-blue-300' : 'text-red-300'}`}>
                            {percentage}%
                          </div>
                          <div className="text-xs text-gray-400">of target line</div>
                        </div>

                        <div className="mt-3">
                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                isSeason
                                  ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                                  : 'bg-gradient-to-r from-red-600 to-red-400'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-gray-900 rounded-lg p-3 mb-3">
            <div className="text-white font-semibold mb-1">Insights</div>
            <div className="flex flex-col gap-2 mt-2">
              {analysis.insights.map((insight, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-green-400 text-xl">{insight.icon}</span>
                  <span className="text-gray-200 text-sm">{insight.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Collapse button */}
          {onCollapse && (
            <div className="flex items-center justify-center pt-4 pb-2 cursor-pointer group" onClick={onCollapse}>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-all duration-300 border border-gray-600 hover:border-gray-500">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors duration-300 font-medium">
                  Collapse
                </span>
              </div>
            </div>
          )}
        </div>
      );
  }
};

export default UnifiedPropCard;
