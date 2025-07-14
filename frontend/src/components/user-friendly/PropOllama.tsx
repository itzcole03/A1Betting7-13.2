import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { backendDiscovery } from '../../services/backendDiscovery';

interface PropOllamaMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
  shap_explanation?: Record<string, number>;
}

interface PropOllamaProps {
  variant?: 'standard' | 'cyber';
  className?: string;
}

const PropOllama: React.FC<PropOllamaProps> = ({ variant = 'cyber', className = '' }) => {
  const [messages, setMessages] = useState<PropOllamaMessage[]>([]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: PropOllamaMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use the enhanced backendDiscovery for PropOllama chat
      const backendUrl = await backendDiscovery.getBackendUrl();
      const chatApiUrl = `${backendUrl}/api/propollama/chat`;

      const response = await fetch(chatApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          analysisType: detectAnalysisType(input),
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }

      const chatResponse = await response.json();

      const aiResponse: PropOllamaMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: chatResponse.content,
        timestamp: new Date(),
        confidence: chatResponse.confidence,
        suggestions: chatResponse.suggestions,
        shap_explanation: chatResponse.shap_explanation,
      };

      // Simulate AI thinking time for better UX
      setTimeout(
        () => {
          setMessages(prev => [...prev, aiResponse]);
          setIsLoading(false);
        },
        800 + Math.random() * 800
      );
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: PropOllamaMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `🚨 **Error Connecting to PropOllama AI**

I couldn't connect to the backend. Please ensure the backend is running and accessible.

**Details:**
${error instanceof Error ? error.message : 'An unknown error occurred.'}

You can try again in a few moments.`,
        timestamp: new Date(),
        confidence: 0,
        suggestions: ['Try again', 'Check backend status'],
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const detectAnalysisType = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('prop') || lowerMessage.includes('player')) return 'prop';
    if (lowerMessage.includes('spread') || lowerMessage.includes('line')) return 'spread';
    if (
      lowerMessage.includes('total') ||
      lowerMessage.includes('over') ||
      lowerMessage.includes('under')
    )
      return 'total';
    if (
      lowerMessage.includes('strategy') ||
      lowerMessage.includes('bankroll') ||
      lowerMessage.includes('kelly')
    )
      return 'strategy';
    return 'general';
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const baseClasses = `
    w-full h-screen flex flex-col rounded-lg border transition-all duration-200
    ${
      variant === 'cyber'
        ? 'bg-black border-cyan-400/30 text-cyan-300'
        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
    }
    ${className}
  `;

  return (
    <div className={baseClasses}>
      {/* Header */}
      <div
        className={`p-6 border-b ${
          variant === 'cyber' ? 'border-cyan-400/30' : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className={`text-2xl ${variant === 'cyber' ? 'text-cyan-400' : 'text-blue-600'}`}>
              🤖
            </div>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                }`}
              >
                PropOllama AI
              </h1>
              <p
                className={`text-sm ${
                  variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Powered by 96.4% Accuracy ML Ensemble
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className='flex space-x-2'>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                variant === 'cyber'
                  ? 'bg-green-400/10 text-green-400 border border-green-400/30'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              🎯 96.4% Accuracy
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                variant === 'cyber'
                  ? 'bg-purple-400/10 text-purple-400 border border-purple-400/30'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}
            >
              🧠 SHAP AI
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-6 space-y-4'>
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-4xl rounded-lg p-4 ${
                  message.type === 'user'
                    ? variant === 'cyber'
                      ? 'bg-cyan-400/10 border border-cyan-400/30'
                      : 'bg-blue-50 border border-blue-200'
                    : variant === 'cyber'
                      ? 'bg-gray-900/50 border border-cyan-400/20'
                      : 'bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <div className='flex items-start space-x-3'>
                  <div
                    className={`text-lg ${
                      message.type === 'user'
                        ? variant === 'cyber'
                          ? 'text-cyan-400'
                          : 'text-blue-600'
                        : variant === 'cyber'
                          ? 'text-green-400'
                          : 'text-green-600'
                    }`}
                  >
                    {message.type === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className='flex-1'>
                    <div
                      className={`prose prose-sm max-w-none ${
                        variant === 'cyber' ? 'prose-invert' : ''
                      }`}
                    >
                      <div className='whitespace-pre-wrap'>{message.content}</div>
                    </div>

                    {/* AI Message Features */}
                    {message.type === 'ai' && (
                      <div className='mt-4 space-y-3'>
                        {/* Confidence Score */}
                        {message.confidence && (
                          <div className='flex items-center space-x-2'>
                            <span
                              className={`text-xs font-medium ${
                                variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                              }`}
                            >
                              Confidence:
                            </span>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                message.confidence >= 80
                                  ? variant === 'cyber'
                                    ? 'bg-green-400/20 text-green-400'
                                    : 'bg-green-100 text-green-700'
                                  : message.confidence >= 65
                                    ? variant === 'cyber'
                                      ? 'bg-yellow-400/20 text-yellow-400'
                                      : 'bg-yellow-100 text-yellow-700'
                                    : variant === 'cyber'
                                      ? 'bg-red-400/20 text-red-400'
                                      : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {message.confidence}%
                            </div>
                          </div>
                        )}

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div>
                            <span
                              className={`text-xs font-medium ${
                                variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                              }`}
                            >
                              Quick Actions:
                            </span>
                            <div className='flex flex-wrap gap-2 mt-2'>
                              {message.suggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                                    variant === 'cyber'
                                      ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                  }`}
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`text-xs mt-2 ${
                        variant === 'cyber' ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex justify-start'
          >
            <div
              className={`max-w-md rounded-lg p-4 ${
                variant === 'cyber'
                  ? 'bg-gray-900/50 border border-cyan-400/20'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className='flex items-center space-x-3'>
                <div
                  className={`text-lg ${variant === 'cyber' ? 'text-green-400' : 'text-green-600'}`}
                >
                  🤖
                </div>
                <div className='flex space-x-1'>
                  <div
                    className={`w-2 h-2 rounded-full animate-bounce ${
                      variant === 'cyber' ? 'bg-cyan-400' : 'bg-blue-600'
                    }`}
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className={`w-2 h-2 rounded-full animate-bounce ${
                      variant === 'cyber' ? 'bg-cyan-400' : 'bg-blue-600'
                    }`}
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className={`w-2 h-2 rounded-full animate-bounce ${
                      variant === 'cyber' ? 'bg-cyan-400' : 'bg-blue-600'
                    }`}
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
                <span
                  className={`text-sm ${variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'}`}
                >
                  Analyzing with 96.4% accuracy models...
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className={`p-6 border-t ${
          variant === 'cyber' ? 'border-cyan-400/30' : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className='flex space-x-4'>
          <input
            type='text'
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder='Ask me about props, spreads, strategy, or anything betting related...'
            className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
              variant === 'cyber'
                ? 'bg-gray-900/50 border-cyan-400/30 text-cyan-300 placeholder-cyan-400/50 focus:ring-cyan-400/50'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-blue-500'
            }`}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className={`px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              variant === 'cyber'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:from-cyan-300 hover:to-blue-400'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500'
            }`}
          >
            {isLoading ? 'Analyzing...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropOllama;
