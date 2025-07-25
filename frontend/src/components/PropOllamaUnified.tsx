import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { discoverBackend } from '../services/backendDiscovery';
import BestBetsDisplay from './BestBetsDisplay'; // Import BestBetsDisplay

console.log('[DEBUG] PropOllamaUnified.tsx loaded at', new Date().toISOString());

interface PropOllamaMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
}

interface BestBet {
  id: string;
  player_name: string;
  sport: string;
  stat_type: string;
  line: number;
  recommendation: 'OVER' | 'UNDER';
  confidence: number;
  reasoning: string;
  expected_value: number;
}

interface PropOllamaUnifiedProps {
  variant?: 'standard' | 'cyber';
  className?: string;
}

const PropOllamaUnified: React.FC<PropOllamaUnifiedProps> = ({
  // variant = 'cyber',
  className = '',
}) => {
  // Chat state
  const [messages, setMessages] = useState<PropOllamaMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Best bets state (removed from here, now in BestBetsDisplay)
  // const [bestBets, setBestBets] = useState<BestBet[]>([]);
  // const [isRefreshing, setIsRefreshing] = useState(false);
  // const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Health state
  interface ScraperHealth {
    is_healthy?: boolean;
    is_stale?: boolean;
    last_success?: string;
    last_error?: string;
    healing_attempts?: number;
  }
  const [scraperHealth, setScraperHealth] = useState<ScraperHealth | null>(null);

  // Auto-refresh best bets on component mount (removed, now in BestBetsDisplay)
  // useEffect(() => {
  //   _fetchBestBets();
  //   const interval = setInterval(_fetchBestBets, 30 * 60 * 1000);
  //   return () => clearInterval(interval);
  // }, []);

  // Poll scraper health every 30s
  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const backendUrl = (await Promise.race([
          discoverBackend(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Discovery timeout')), 3000)
          ),
        ])) as string;

        const response = await fetch(`${backendUrl}/api/prizepicks/health`, {
          signal: AbortSignal.timeout(3000), // 3 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted) setScraperHealth(data);
        } else {
          if (isMounted)
            setScraperHealth({ is_healthy: false, last_error: 'Failed to fetch health' });
        }
      } catch (e) {
        if (isMounted) {
          console.log('Health check failed (expected in demo mode):', e);
          setScraperHealth({ is_healthy: false, last_error: 'Demo mode - backend unavailable' });
        }
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // _fetchBestBets function (removed from here, now in BestBetsDisplay)
  // const _fetchBestBets = async () => { /* ... */ };

  const handleSendMessage = async () => {
    const trimmed = typeof input === 'string' ? input.trim() : '';
    if (!trimmed || isLoading) return;

    const userMessage: PropOllamaMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const backendUrl = await discoverBackend();
      if (!backendUrl) throw new Error('No backend discovered');
      const aiApiUrl = `${backendUrl}/api/propollama/chat`;
      const payload = {
        message: trimmed,
        analysisType: 'comprehensive',
        includeWebResearch: true,
        requestBestBets:
          trimmed.toLowerCase().includes('best bets') ||
          trimmed.toLowerCase().includes('recommendations'),
      };
      const response = await fetch(`${aiApiUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🤖 Chat response received:', data);

        const aiResponse: PropOllamaMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: data.content,
          timestamp: new Date(),
          confidence: data.confidence,
          suggestions: data.suggestions,
        };

        setMessages(prev => [...prev, aiResponse]);

        // Update best bets if included in response (logic removed, now handled by BestBetsDisplay if needed)
        // if (data.best_bets) {
        //   setBestBets(data.best_bets);
        //   setLastRefresh(new Date());
        // }
      } else {
        console.error('Chat request failed:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: PropOllamaMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `🚨 **Error**: Could not connect to PropOllama AI. Please try again.`,
        timestamp: new Date(),
        confidence: 0,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const _baseClasses = `
    w-full h-screen flex bg-gradient-to-br from-gray-900 to-black text-white
    ${className}
  `;

  return (
    <div className={_baseClasses}>
      {/* Onboarding Banner */}

      <div className='absolute top-0 left-0 w-full z-20'>
        <div className='bg-cyan-900/90 text-cyan-100 px-6 py-3 text-sm flex items-center justify-between shadow-md border-b border-cyan-400/30'>
          <div>
            <span className='font-bold text-cyan-300'>Welcome!</span> This page shows AI-powered
            sports betting recommendations,{' '}
            <span className='font-bold'>sorted by model confidence</span> (highest first).
            <br />
            <span className='font-bold'>Confidence</span> is color-coded and shown as a percentage.
            Click <span className='underline'>Show Explanation</span> on any bet to see detailed AI
            reasoning and insights.
          </div>
        </div>
        {/* Scraper Health Banner */}
        {scraperHealth && (
          <div
            className={`transition-all duration-300 px-6 py-2 text-sm flex items-center justify-between shadow border-b
            ${
              scraperHealth.is_healthy
                ? 'bg-green-900/90 text-green-200 border-green-400/30'
                : scraperHealth.is_stale
                ? 'bg-yellow-900/90 text-yellow-200 border-yellow-400/30'
                : 'bg-red-900/90 text-red-200 border-red-400/30'
            }`}
            style={{ minHeight: '36px' }}
          >
            {scraperHealth.is_healthy && (
              <span>
                ✅ <b>Live data is healthy.</b> All props are up to date.
              </span>
            )}
            {scraperHealth.is_stale && !scraperHealth.is_healthy && (
              <span>
                ⚠️ <b>Warning:</b> Live data may be <b>stale</b>. Last successful scrape:{' '}
                {scraperHealth.last_success
                  ? new Date(scraperHealth.last_success).toLocaleString()
                  : 'unknown'}
                .
              </span>
            )}
            {!scraperHealth.is_healthy && !scraperHealth.is_stale && (
              <span>
                🚨 <b>Error:</b> Live data is use JSX unless the '--jsx' flag is provided... Remove
                this comment to see the full error message
                {scraperHealth.last_error && <span>Reason: {scraperHealth.last_error}</span>}{' '}
              </span>
            )}
            <span className='ml-4 text-xs opacity-70'>
              (Autonomous healing: {scraperHealth.healing_attempts || 0} attempts)
            </span>
          </div>
        )}
      </div>
      {/* Main Chat Interface - 60% width */}

      <div className='flex-1 flex flex-col border-r border-cyan-400/30'>
        {/* Chat Header */}

        <div className='p-6 border-b border-cyan-400/30 bg-gradient-to-r from-cyan-900/50 to-blue-900/50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='text-3xl'>🤖</div>

              <div>
                <h1 className='text-2xl font-bold text-cyan-300'>PropOllama AI</h1>

                <p className='text-sm text-cyan-400/70'>
                  Your AI Sports Betting Expert • Powered by 96.4% Accuracy ML
                </p>
              </div>
            </div>
            <div className='flex space-x-2'>
              <div className='px-3 py-1 rounded-full text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/30'>
                🎯 96.4% Accuracy
              </div>

              <div className='px-3 py-1 rounded-full text-xs font-medium bg-purple-400/10 text-purple-400 border border-purple-400/30'>
                🌐 Web Research
              </div>
            </div>
          </div>
        </div>
        {/* Chat Messages */}

        <div className='flex-1 overflow-y-auto p-6 space-y-4'>
          {messages.length === 0 && (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>🎯</div>

              <h2 className='text-xl font-bold text-cyan-300 mb-2'>Welcome to PropOllama AI</h2>

              <p className='text-cyan-400/70 mb-6'>
                Your intelligent sports betting assistant with web research capabilities
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto'>
                {[
                  'What are the best NBA props tonight?',
                  "Analyze LeBron's scoring trend",
                  'Show me high-confidence MLB picks',
                  'Compare NFL quarterback props',
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(suggestion)}
                    className='p-3 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 transition-all text-sm'
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-4xl rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-cyan-400/10 border border-cyan-400/30'
                      : 'bg-gray-900/50 border border-cyan-400/20'
                  }`}
                >
                  <div className='flex items-start space-x-3'>
                    <div
                      className={`text-lg ${
                        message.type === 'user' ? 'text-cyan-400' : 'text-green-400'
                      }`}
                    >
                      {message.type === 'user' ? '👤' : '🤖'}
                    </div>

                    <div className='flex-1'>
                      <div className='whitespace-pre-wrap text-sm'>{message.content}</div>
                      {message.confidence && (
                        <div className='mt-2 flex items-center space-x-2'>
                          <span className='text-xs text-cyan-400'>Confidence:</span>

                          <div
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              message.confidence >= 80
                                ? 'bg-green-400/20 text-green-400'
                                : message.confidence >= 65
                                ? 'bg-yellow-400/20 text-yellow-400'
                                : 'bg-red-400/20 text-red-400'
                            }`}
                          >
                            {message.confidence}%
                          </div>
                        </div>
                      )}
                      {message.suggestions && (
                        <div className='mt-3'>
                          <div className='flex flex-wrap gap-2'>
                            {message.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => setInput(suggestion)}
                                className='px-3 py-1 rounded-full text-xs bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 transition-all'
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className='text-xs text-gray-500 mt-2'>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='flex justify-start'
            >
              <div className='max-w-md rounded-lg p-4 bg-gray-900/50 border border-cyan-400/20'>
                <div className='flex items-center space-x-3'>
                  <div className='text-lg text-green-400'>🤖</div>

                  <div className='flex space-x-1'>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className='w-2 h-2 rounded-full bg-cyan-400 animate-bounce'
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>

                  <span className='text-sm text-cyan-400'>Analyzing with AI + Web Research...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        {/* Chat Input */}

        <div className='p-6 border-t border-cyan-400/30 bg-gray-900/50'>
          <div className='flex space-x-4'>
            <input
              type='text'
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about any sports prop, strategy, or get today's best bets..."
              className='flex-1 px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-400/30 text-cyan-300 placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent'
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || typeof input !== 'string' || !input.trim()}
              className='px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:from-cyan-300 hover:to-blue-400 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Analyzing...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
      {/* Best Bets Sidebar - 40% width */}
      <BestBetsDisplay />
    </div>
  );
};

export default PropOllamaUnified;
