import React from 'react';

interface PropOllamaInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  variant?: 'cyber' | 'classic';
}

const PropOllamaInput: React.FC<PropOllamaInputProps> = ({
  input,
  setInput,
  handleSendMessage,
  isLoading,
  error,
  setError,
  variant = 'cyber',
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className={`p-6 border-t ${
        variant === 'cyber' ? 'border-cyan-400/30' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <form
        className='flex space-x-4'
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        aria-label='Send message form'
      >
        <input
          id='propollama-input'
          type='text'
          value={input}
          onChange={e => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyPress={handleKeyPress}
          placeholder='Ask me about props, spreads, strategy, or anything betting related...'
          className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
            variant === 'cyber'
              ? 'bg-gray-900/50 border-cyan-400/30 text-cyan-300 placeholder-cyan-400/50 focus:ring-cyan-400/50'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-blue-500'
          }`}
          disabled={isLoading}
          aria-label='Type your message'
          autoComplete='off'
          required
          aria-describedby='propollama-input-desc'
        />
        <span id='propollama-input-desc' className='sr-only'>
          Enter your message and press Send or Enter to chat with PropOllama AI.
        </span>
        <button
          type='submit'
          disabled={!input.trim() || isLoading}
          className={`px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
            variant === 'cyber'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:from-cyan-300 hover:to-blue-400'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500'
          }`}
          aria-label='Send message'
        >
          {isLoading ? 'Analyzing...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default PropOllamaInput; 