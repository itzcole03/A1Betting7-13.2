import React from 'react';
import { PropOllamaMessage } from './PropOllama';

interface MessageProps {
  message: PropOllamaMessage;
  variant: 'cyber' | 'classic';
  onSuggestionClick?: (suggestion: string) => void;
}

const _Message: React.FC<MessageProps> = ({ message, variant, onSuggestionClick }) => {
  return (
    <div
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
      role='listitem'
      aria-label={message.type === 'user' ? 'User message' : 'AI message'}
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
              className={`prose prose-sm max-w-none ${variant === 'cyber' ? 'prose-invert' : ''}`}
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
                          onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                            variant === 'cyber'
                              ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20'
                              : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                          }`}
                          aria-label={`Send suggestion: ${suggestion}`}
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
              className={`text-xs mt-2 ${variant === 'cyber' ? 'text-gray-500' : 'text-gray-400'}`}
            >
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default _Message;
