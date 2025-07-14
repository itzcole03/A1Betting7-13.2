import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageCircle,
  Bot,
  User,
  TrendingUp,
  Target,
  Zap,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PropOllamaMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
}

interface PropOllamaChatBoxProps {
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const PropOllamaChatBox: React.FC<PropOllamaChatBoxProps> = ({
  className = '',
  isMinimized = false,
  onToggleMinimize,
}) => {
  const [messages, setMessages] = useState<PropOllamaMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: PropOllamaMessage = {
      id: 'welcome',
      type: 'ai',
      content: `🤖 **PropOllama AI Assistant**

Welcome! I'm your AI sports betting expert. I can help with:

🎯 **Bet Analysis** - Analyze specific props and players
📊 **Strategy Advice** - Kelly criterion, bankroll management
🔍 **Player Insights** - Performance trends and matchup analysis
⚡ **Live Updates** - Real-time game situations

*Ask me about any player or betting strategy!*`,
      timestamp: new Date(),
      confidence: 95,
      suggestions: [
        'Analyze Luka Dončić over 28.5 points',
        'Best NBA props for tonight',
        'Kelly criterion for prop betting',
        'How to read confidence scores',
      ],
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: PropOllamaMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`http://localhost:8000/api/propollama/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          context: 'sports_betting_analysis',
          enhanced: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const aiResponse: PropOllamaMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content:
          data.content || data.response || 'I apologize, but I could not process that request.',
        timestamp: new Date(),
        confidence: data.confidence || 85,
        suggestions: data.suggestions || [],
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Generate intelligent fallback response based on user input
      let fallbackContent = `🤖 **PropOllama AI (Offline Mode)**

I'm currently offline, but here's some general advice:`;

      if (
        currentInput.toLowerCase().includes('luka') ||
        currentInput.toLowerCase().includes('dončić')
      ) {
        fallbackContent += `

📊 **Luka Dončić Analysis:**
- Averages 32.4 PPG this season
- Strong over trend in home games (68%)
- Consider matchup pace and defensive efficiency
- Check recent injury reports before betting`;
      } else if (
        currentInput.toLowerCase().includes('kelly') ||
        currentInput.toLowerCase().includes('bankroll')
      ) {
        fallbackContent += `

💰 **Kelly Criterion Basics:**
- Bet Size = (bp - q) / b
- Only bet when you have edge (positive expected value)
- Never bet more than 25% of bankroll on single prop
- Track results to verify your edge`;
      } else if (
        currentInput.toLowerCase().includes('nba') ||
        currentInput.toLowerCase().includes('basketball')
      ) {
        fallbackContent += `

🏀 **NBA Props Strategy:**
- Focus on player props over team totals
- Check pace, rest days, and motivational factors
- Use multiple sportsbooks for line shopping
- Track weather for outdoor games (rare but relevant)`;
      } else {
        fallbackContent += `

🎯 **General Betting Tips:**
- Always check injury reports before betting
- Compare lines across multiple sportsbooks
- Focus on sports/players you know well
- Set stop-losses and profit targets`;
      }

      fallbackContent += `

*Try refreshing or check back later for full AI analysis.*`;

      const errorMessage: PropOllamaMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: fallbackContent,
        timestamp: new Date(),
        confidence: 70,
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('🔌 AI temporarily offline - Using cached responses');
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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={onToggleMinimize}
          className='bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110'
        >
          <MessageCircle className='w-6 h-6' />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-cyan-500/30 rounded-2xl shadow-2xl ${className}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-cyan-600/10 to-blue-600/10'>
        <div className='flex items-center space-x-3'>
          <div className='relative p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl shadow-lg'>
            <Bot className='w-5 h-5 text-white' />
            <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-gray-800'></div>
          </div>
          <div>
            <h3 className='text-lg font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent'>
              PropOllama AI
            </h3>
            <p className='text-sm text-gray-400'>Elite Sports Betting Expert</p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='text-gray-400 hover:text-white transition-colors'
          >
            {isExpanded ? <Minimize2 className='w-4 h-4' /> : <Maximize2 className='w-4 h-4' />}
          </button>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className='text-gray-400 hover:text-white transition-colors'
            >
              <X className='w-4 h-4' />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className={`${isExpanded ? 'h-96' : 'h-64'} overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-gray-900/20`}
      >
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-cyan-600 text-white ml-4'
                  : 'bg-gray-700 text-gray-100 mr-4'
              }`}
            >
              <div className='flex items-start space-x-2'>
                {message.type === 'ai' && (
                  <Bot className='w-4 h-4 text-cyan-400 mt-1 flex-shrink-0' />
                )}
                {message.type === 'user' && (
                  <User className='w-4 h-4 text-white mt-1 flex-shrink-0' />
                )}
                <div className='flex-1'>
                  <div className='text-sm whitespace-pre-wrap'>{message.content}</div>
                  {message.confidence && (
                    <div className='flex items-center space-x-1 mt-2'>
                      <Target className='w-3 h-3 text-cyan-400' />
                      <span className='text-xs text-cyan-400'>
                        {message.confidence}% confidence
                      </span>
                    </div>
                  )}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className='mt-2 space-y-1'>
                      <div className='text-xs text-gray-400'>Quick actions:</div>
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className='block text-xs text-cyan-400 hover:text-cyan-300 transition-colors'
                        >
                          → {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className='flex justify-start'>
            <div className='bg-gray-700 text-gray-100 px-4 py-2 rounded-lg mr-4'>
              <div className='flex items-center space-x-2'>
                <Bot className='w-4 h-4 text-cyan-400' />
                <div className='flex space-x-1'>
                  <div className='w-2 h-2 bg-cyan-400 rounded-full animate-bounce'></div>
                  <div
                    className='w-2 h-2 bg-cyan-400 rounded-full animate-bounce'
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className='w-2 h-2 bg-cyan-400 rounded-full animate-bounce'
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className='p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50'>
        <div className='flex space-x-2'>
          <input
            type='text'
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder='Ask about any player or betting strategy...'
            className='flex-1 bg-gray-700/80 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-sm'
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className='bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 hover:scale-105'
          >
            <Send className='w-4 h-4' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropOllamaChatBox;
