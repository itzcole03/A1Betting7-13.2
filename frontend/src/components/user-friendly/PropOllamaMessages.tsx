import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef, useEffect } from 'react';
import Message from './Message';
import { PropOllamaMessage } from './PropOllama'; // Import PropOllamaMessage interface

interface PropOllamaMessagesProps {
  messages: PropOllamaMessage[];
  onSuggestionClick: (suggestion: string) => void;
  variant?: 'cyber' | 'classic';
}

const PropOllamaMessages: React.FC<PropOllamaMessagesProps> = ({
  messages,
  onSuggestionClick,
  variant = 'cyber', // Provide a default value
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className='flex-1 overflow-y-auto p-6 space-y-4'
      aria-live='polite'
      aria-label='Chat message history'
    >
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            role='listitem'
          >
            <Message
              message={message}
              variant={variant}
              onSuggestionClick={onSuggestionClick}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default PropOllamaMessages; 