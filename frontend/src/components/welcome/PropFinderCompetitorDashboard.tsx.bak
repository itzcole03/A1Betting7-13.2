/**
 * PropFinder Competitor Welcome Dashboard
 * Showcases all the features that compete with PropFinder and PropGPT
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  BookOpen, 
  Calculator, 
  Zap, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  Star,
  Activity
} from 'lucide-react';

const PropFinderCompetitorDashboard: React.FC = () => {
  const features = [
    {
      title: 'AI-Powered Insights',
      description: 'Local Ollama LLM provides real-time explanations and analysis',
      icon: Brain,
      href: '/player',
      badge: 'AI',
      color: 'from-purple-600 to-blue-600',
      benefits: ['Real-time streaming responses', 'Local processing (no API limits)', 'Sports-specific AI model']
    },
    {
      title: 'Live Odds Comparison',
      description: 'Real-time odds from 8+ sportsbooks with best line identification',
      icon: TrendingUp,
      href: '/odds-comparison',
      badge: 'LIVE',
      color: 'from-blue-600 to-cyan-600',
      benefits: ['Multi-sportsbook aggregation', '30-second refresh rate', 'No-vig fair price calculations']
    },
    {
      title: 'Arbitrage Hunter',
      description: 'Automatic detection of guaranteed profit opportunities',
      icon: Target,
      href: '/arbitrage',
      badge: 'HOT',
      color: 'from-red-600 to-orange-600',
      benefits: ['Guaranteed profit detection', 'Optimal stake calculations', 'Real-time monitoring']
    },
    {
      title: 'Prop Cheatsheets',
      description: 'Ranked opportunities with edge calculation and filtering',
      icon: BookOpen,
      href: '/cheatsheets',
      badge: 'NEW',
      color: 'from-green-600 to-emerald-600',
      benefits: ['Edge percentage ranking', 'Dynamic filters', 'CSV export capability']
    },
    {
      title: 'Kelly Calculator',
      description: 'Professional bankroll management with Monte Carlo simulations',
      icon: Calculator,
      href: '/kelly-calculator',
      badge: 'PRO',
      color: 'from-indigo-600 to-purple-600',
      benefits: ['Full & fractional Kelly', 'Risk assessment', 'Performance tracking']
    },
    {
      title: 'ML Model Center',
      description: 'Advanced machine learning models and predictions',
      icon: Activity,
      href: '/ml-models',
      badge: 'ML',
      color: 'from-teal-600 to-green-600',
      benefits: ['Multiple ML algorithms', 'Model performance tracking', 'Confidence intervals']
    }
  ];

  const competitiveAdvantages = [
    'Local AI processing - no external API dependencies',
    'Real-time arbitrage detection vs manual search',
    'Advanced mathematics: Kelly Criterion & Monte Carlo',
    '100-130+ props per game vs competitors\' ~60',
    'Professional export tools (CSV downloads)',
    'Comprehensive risk management tools'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Demo Mode Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 px-4">
        <p className="text-sm">
          🎉 <strong>Demo Mode Active</strong> - All features working with sample data!
          Start backend (port 8000) for live data integration.
        </p>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Zap className="w-12 h-12 text-yellow-400" />
              <h1 className="text-5xl font-bold text-white">A1 Betting</h1>
            </div>
            <h2 className="text-2xl text-blue-400 mb-4">PropFinder & PropGPT Competitor</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Advanced sports prop research platform with AI-powered insights, real-time arbitrage detection, 
              and professional bankroll management tools.
            </p>
            
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6">
                <div className="text-3xl font-bold text-green-400">100+</div>
                <div className="text-slate-400">Props per game</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-400">8+</div>
                <div className="text-slate-400">Sportsbooks</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6">
                <div className="text-3xl font-bold text-purple-400">AI</div>
                <div className="text-slate-400">Local LLM</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6">
                <div className="text-3xl font-bold text-red-400">Real-time</div>
                <div className="text-slate-400">Arbitrage</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-white text-center mb-12">
          Professional Sports Analytics Tools
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.href}
                className="group relative bg-slate-800/50 backdrop-blur rounded-xl p-6 hover:bg-slate-700/50 transition-all duration-300 border border-slate-700 hover:border-slate-600 hover:shadow-2xl hover:scale-105"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-8 h-8 text-blue-400 group-hover:text-white transition-colors" />
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      feature.badge === 'AI' ? 'bg-purple-600 text-white' :
                      feature.badge === 'LIVE' ? 'bg-blue-600 text-white' :
                      feature.badge === 'HOT' ? 'bg-red-600 text-white' :
                      feature.badge === 'NEW' ? 'bg-green-600 text-white' :
                      feature.badge === 'PRO' ? 'bg-indigo-600 text-white' :
                      feature.badge === 'ML' ? 'bg-teal-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {feature.badge}
                    </span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-slate-300 mb-4">{feature.description}</p>
                  
                  <ul className="space-y-1 mb-4">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex items-center gap-2 text-blue-400 group-hover:text-white transition-colors">
                    <span className="text-sm font-medium">Explore Feature</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Competitive Advantages */}
      <div className="bg-slate-800/30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Why Choose A1 Betting Over PropFinder?
            </h3>
            <p className="text-xl text-slate-300">
              Advanced features that give you the competitive edge
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {competitiveAdvantages.map((advantage, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{advantage}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-700/50 rounded-xl p-6">
              <h4 className="text-xl font-bold text-white mb-4">Quick Start</h4>
              <div className="space-y-3">
                <Link 
                  to="/player" 
                  className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  🧠 Try AI Player Analysis
                </Link>
                <Link 
                  to="/odds-comparison" 
                  className="block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  📊 Compare Live Odds
                </Link>
                <Link 
                  to="/cheatsheets" 
                  className="block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  📋 Browse Prop Opportunities
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Dominate Your Props Research?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join the next generation of sports bettors using AI-powered analytics
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/player"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Start Player Research
            </Link>
            <Link
              to="/odds-comparison"
              className="bg-blue-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors border border-blue-400"
            >
              Compare Odds Now
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-slate-400">
            <p className="mb-2">A1 Betting - PropFinder & PropGPT Competitor</p>
            <p className="text-sm">
              AI • Odds Aggregation • Arbitrage Detection • Risk Management • Professional Analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropFinderCompetitorDashboard;
