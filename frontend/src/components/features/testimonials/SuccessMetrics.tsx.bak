import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Zap,
  Target,
  Award,
  Users,
  BarChart3,
  ChevronRight,
  Star,
  Trophy,
  Gauge,
  Brain,
  Shield,
} from 'lucide-react';

interface ComparisonMetric {
  label: string;
  propFinder: string | number;
  a1Betting: string | number;
  advantage: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '' 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const SuccessMetrics: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<number | null>(null);

  // Data from research document findings
  const comparisonMetrics: ComparisonMetric[] = [
    {
      label: 'Annual Cost',
      propFinder: '$348-588',
      a1Betting: 'Free Forever',
      advantage: 'Save $348+ annually',
      icon: DollarSign,
      color: 'text-green-400',
    },
    {
      label: 'Response Time',
      propFinder: '2-5 seconds',
      a1Betting: '<1 second',
      advantage: '4x faster performance',
      icon: Zap,
      color: 'text-yellow-400',
    },
    {
      label: 'AI Analysis',
      propFinder: 'None',
      a1Betting: 'Local LLM + SHAP',
      advantage: 'Privacy + Explainability',
      icon: Brain,
      color: 'text-purple-400',
    },
    {
      label: 'Data Sources',
      propFinder: 'Limited',
      a1Betting: 'Sportradar + Multi-API',
      advantage: 'Official + Comprehensive',
      icon: BarChart3,
      color: 'text-blue-400',
    },
    {
      label: 'Risk Management',
      propFinder: 'Basic',
      a1Betting: 'Kelly + Portfolio',
      advantage: 'Advanced optimization',
      icon: Shield,
      color: 'text-cyan-400',
    },
    {
      label: 'Customization',
      propFinder: 'None',
      a1Betting: 'Full source access',
      advantage: 'Unlimited modifications',
      icon: Target,
      color: 'text-orange-400',
    },
  ];

  const performanceMetrics = [
    {
      label: 'Load Time Improvement',
      value: 300,
      suffix: '%',
      description: 'PropFinder 3.2s → A1Betting 0.8s',
      icon: Clock,
    },
    {
      label: 'Search Speed Boost',
      value: 500,
      suffix: '%',
      description: 'PropFinder 1.8s → A1Betting 0.3s',
      icon: Gauge,
    },
    {
      label: 'Annual Savings',
      value: 588,
      prefix: '$',
      description: 'vs PropFinder Premium subscription',
      icon: DollarSign,
    },
    {
      label: 'Feature Advantage',
      value: 150,
      suffix: '%',
      description: 'More features than competitors',
      icon: Award,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            PropFinder Killer Performance
          </h2>
          <p className="text-gray-400 text-lg">
            Superior features, 4x faster performance, and completely free forever
          </p>
        </motion.div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {performanceMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
            >
              <div className="flex items-center justify-center mb-2">
                <metric.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                <AnimatedCounter
                  end={metric.value}
                  prefix={metric.prefix}
                  suffix={metric.suffix}
                  duration={2000 + index * 200}
                />
              </div>
              <div className="text-sm font-medium text-gray-300 mb-1">{metric.label}</div>
              <div className="text-xs text-gray-400">{metric.description}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detailed Comparison */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-white mb-6 text-center">
          Head-to-Head Comparison with PropFinder
        </h3>
        
        <div className="space-y-3">
          {comparisonMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onHoverStart={() => setActiveMetric(index)}
              onHoverEnd={() => setActiveMetric(null)}
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-slate-800 ${metric.color}`}>
                    <metric.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{metric.label}</div>
                    <div className="text-sm text-gray-400">{metric.advantage}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">PropFinder</div>
                    <div className="text-sm text-red-400 font-medium">{metric.propFinder}</div>
                  </div>
                  
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">A1Betting</div>
                    <div className={`text-sm font-bold ${metric.color}`}>{metric.a1Betting}</div>
                  </div>
                </div>
              </div>
              
              <AnimatePresence>
                {activeMetric === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-700 mt-3 pt-3"
                  >
                    <div className="text-sm text-gray-300">
                      {metric.label === 'Annual Cost' && (
                        "PropFinder charges $29-49/month ($348-588/year). A1Betting is completely free forever - save hundreds annually while getting superior features."
                      )}
                      {metric.label === 'Response Time' && (
                        "A1Betting uses React 19 concurrent features and optimized algorithms to deliver results 4x faster than PropFinder's legacy infrastructure."
                      )}
                      {metric.label === 'AI Analysis' && (
                        "While PropFinder offers no AI, A1Betting includes local LLM processing with SHAP explainability, giving you transparent AI insights."
                      )}
                      {metric.label === 'Data Sources' && (
                        "A1Betting integrates official Sportradar data plus multiple APIs for comprehensive coverage beyond PropFinder's limited sources."
                      )}
                      {metric.label === 'Risk Management' && (
                        "Advanced Kelly Criterion calculator and portfolio optimization tools help maximize profits with proper bankroll management."
                      )}
                      {metric.label === 'Customization' && (
                        "Open source means unlimited customization potential. Modify algorithms, add features, or integrate with your existing tools."
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-6 text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-yellow-400 mr-2" />
          <h3 className="text-xl font-bold text-white">Stop Paying for PropFinder</h3>
        </div>
        <p className="text-gray-300 mb-4">
          Get the same interface with superior AI, data, and features - completely free.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">$0</div>
            <div className="text-sm text-gray-400">Forever</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">4x</div>
            <div className="text-sm text-gray-400">Faster</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">∞</div>
            <div className="text-sm text-gray-400">Customizable</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuccessMetrics;
