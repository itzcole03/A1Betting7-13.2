import React, { useEffect, useState } from 'react';
// @ts-expect-error TS(6142): Module './Card' was resolved to 'C:/Users/bcmad/Do... Remove this comment to see the full error message
import { Card, CardContent, CardHeader } from './Card';

/**
 * WebSocketAnalytics Component
 *
 * Modern, accessible display of real-time WebSocket connection status and analytics.
 * Shows connection state, message count, and last message time.
 */
export const WebSocketAnalytics: React.FC = () => {
  // Mock state for demonstration
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [messageCount, setMessageCount] = useState(128);
  const [lastMessage, setLastMessage] = useState('2025-01-19 14:32:10');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageCount(c => c + 1);
      setLastMessage(new Date().toISOString().replace('T', ' ').slice(0, 19));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Card className='max-w-2xl mx-auto'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardHeader>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h2 className='text-lg font-bold text-white'>WebSocket Analytics</h2>
      </CardHeader>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardContent>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex flex-col gap-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center gap-3'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span
              className={`w-3 h-3 rounded-full ${
                status === 'connected'
                  ? 'bg-green-400'
                  : status === 'connecting'
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
              }`}
            ></span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-gray-300'>Status:</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='font-semibold text-white capitalize'>{status}</span>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center gap-3'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-gray-300'>Messages Received:</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='font-semibold text-cyan-400'>{messageCount}</span>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center gap-3'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-gray-300'>Last Message:</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='font-semibold text-white'>{lastMessage}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebSocketAnalytics;
