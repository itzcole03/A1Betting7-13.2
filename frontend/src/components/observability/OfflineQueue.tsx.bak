import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, AlertTriangle, Clock, CheckCircle, 
  XCircle, Trash2, Play, Pause, Settings 
} from 'lucide-react';

interface QueuedMessage {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: number;
  error?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'retrying' | 'failed' | 'success';
  endpoint?: string;
}

interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
}

interface OfflineQueueProps {
  wsUrl?: string;
  retryPolicy?: Partial<RetryPolicy>;
  onConnectionChange?: (connected: boolean) => void;
  onQueueSizeChange?: (size: number) => void;
  enablePersistence?: boolean;
  maxQueueSize?: number;
}

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterEnabled: true
};

/**
 * Offline Queue Component
 * Epic 8 Implementation - Observability Metrics & Offline Queue
 * 
 * Features:
 * - Queues failed WebSocket messages for retry
 * - Exponential backoff retry logic
 * - Priority-based message processing
 * - Persistent queue storage
 * - Manual retry controls
 * - Queue size monitoring and cleanup
 * - Connection health monitoring
 */
export const OfflineQueue: React.FC<OfflineQueueProps> = ({
  wsUrl = 'ws://localhost:8000/ws/metrics',
  retryPolicy: customRetryPolicy = {},
  onConnectionChange,
  onQueueSizeChange,
  enablePersistence = true,
  maxQueueSize = 1000
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPaused, setProcessingPaused] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [_lastConnectionAttempt, setLastConnectionAttempt] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const retryPolicy: RetryPolicy = { ...DEFAULT_RETRY_POLICY, ...customRetryPolicy };

  // Load queue from persistence on mount
  useEffect(() => {
    if (enablePersistence) {
      try {
        const savedQueue = localStorage.getItem('offline-message-queue');
        if (savedQueue) {
          const parsed = JSON.parse(savedQueue);
          setMessageQueue(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        // Ignore storage errors - graceful degradation
        // eslint-disable-next-line no-console
        console.warn('Failed to load offline queue from storage:', error);
      }
    }
  }, [enablePersistence]);

  // Save queue to persistence whenever it changes
  useEffect(() => {
    if (enablePersistence) {
      try {
        localStorage.setItem('offline-message-queue', JSON.stringify(messageQueue));
      } catch (error) {
        console.warn('Failed to save offline queue to storage:', error);
      }
    }
    
    // Notify parent of queue size changes
    if (onQueueSizeChange) {
      onQueueSizeChange(messageQueue.length);
    }
  }, [messageQueue, enablePersistence, onQueueSizeChange]);

  // Calculate retry delay with exponential backoff
  const calculateRetryDelay = (attempts: number): number => {
    const delay = Math.min(
      retryPolicy.baseDelay * Math.pow(retryPolicy.backoffMultiplier, attempts),
      retryPolicy.maxDelay
    );

    // Add jitter to avoid thundering herd
    if (retryPolicy.jitterEnabled) {
      const jitter = Math.random() * 0.3; // 30% jitter
      return delay * (1 + jitter);
    }

    return delay;
  };

  // Add message to queue
  const queueMessage = useCallback((
    type: string,
    payload: any,
    priority: QueuedMessage['priority'] = 'medium',
    endpoint?: string
  ) => {
    const message: QueuedMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: retryPolicy.maxAttempts,
      priority,
      status: 'pending',
      endpoint
    };

    setMessageQueue(prev => {
      // Implement priority queue
      const newQueue = [...prev, message];
      newQueue.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Enforce max queue size
      return newQueue.slice(0, maxQueueSize);
    });

    return message.id;
  }, [retryPolicy.maxAttempts, maxQueueSize]);

  // Remove message from queue
  const removeMessage = useCallback((messageId: string) => {
    setMessageQueue(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Update message status
  const updateMessageStatus = useCallback((
    messageId: string, 
    status: QueuedMessage['status'], 
    error?: string
  ) => {
    setMessageQueue(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status, error, lastAttempt: Date.now() }
        : msg
    ));
  }, []);

  // Establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionAttempts(0);
        setLastConnectionAttempt(Date.now());
        
        if (onConnectionChange) {
          onConnectionChange(true);
        }

        // Start processing queued messages
        if (!processingPaused) {
          processQueue();
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        
        if (onConnectionChange) {
          onConnectionChange(false);
        }

        // Schedule reconnection attempt
        scheduleReconnect();
      };

      wsRef.current.onerror = () => {
        setIsConnected(false);
        
        if (onConnectionChange) {
          onConnectionChange(false);
        }
      };

      wsRef.current.onmessage = (event) => {
        // Handle incoming messages if needed
        try {
          const data = JSON.parse(event.data);
          
          // Could emit events here for other components to listen to
          if (data.type === 'message_received') {
            // Message was successfully processed, remove from queue if it exists
            if (data.messageId) {
              updateMessageStatus(data.messageId, 'success');
              setTimeout(() => removeMessage(data.messageId), 1000);
            }
          }
        } catch (error) {
          console.warn('Error handling WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      scheduleReconnect();
    }
  }, [wsUrl, onConnectionChange, processingPaused, updateMessageStatus, removeMessage]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = calculateRetryDelay(connectionAttempts);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionAttempts(prev => prev + 1);
      setLastConnectionAttempt(Date.now());
      connectWebSocket();
    }, delay);
  }, [connectionAttempts, calculateRetryDelay, connectWebSocket]);

  // Send message via WebSocket
  const sendMessage = useCallback((message: QueuedMessage): Promise<boolean> => {
    return new Promise((resolve) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          const payload = {
            id: message.id,
            type: message.type,
            data: message.payload,
            timestamp: message.timestamp,
            priority: message.priority
          };

          wsRef.current.send(JSON.stringify(payload));
          resolve(true);
        } catch (error) {
          console.error('Failed to send WebSocket message:', error);
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  }, []);

  // Process queued messages
  const processQueue = useCallback(async () => {
    if (isProcessing || processingPaused || !isConnected) {
      return;
    }

    setIsProcessing(true);

    const pendingMessages = messageQueue.filter(msg => 
      msg.status === 'pending' || msg.status === 'retrying'
    );

    for (const message of pendingMessages.slice(0, 5)) { // Process 5 at a time
      updateMessageStatus(message.id, 'retrying');

      const success = await sendMessage(message);

      if (success) {
        updateMessageStatus(message.id, 'success');
        setTimeout(() => removeMessage(message.id), 2000); // Remove after 2 seconds
      } else {
        const newAttempts = message.attempts + 1;
        
        if (newAttempts >= message.maxAttempts) {
          updateMessageStatus(message.id, 'failed', 'Max retry attempts reached');
        } else {
          // Update attempts and schedule retry
          setMessageQueue(prev => prev.map(msg => 
            msg.id === message.id 
              ? { ...msg, attempts: newAttempts, status: 'pending' }
              : msg
          ));

          // Schedule retry with backoff
          const delay = calculateRetryDelay(newAttempts);
          setTimeout(() => {
            if (!processingPaused) {
              processQueue();
            }
          }, delay);
        }
      }

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsProcessing(false);

    // Schedule next processing cycle if there are still pending messages
    if (pendingMessages.length > 5 && !processingPaused) {
      setTimeout(() => processQueue(), 1000);
    }
  }, [
    isProcessing, 
    processingPaused, 
    isConnected, 
    messageQueue, 
    updateMessageStatus, 
    sendMessage, 
    removeMessage, 
    calculateRetryDelay
  ]);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Auto-process queue when connection is established
  useEffect(() => {
    if (isConnected && !processingPaused && messageQueue.length > 0) {
      processQueue();
    }
  }, [isConnected, processingPaused, processQueue, messageQueue.length]);

  // Manual retry single message
  const retryMessage = useCallback((messageId: string) => {
    const message = messageQueue.find(msg => msg.id === messageId);
    if (message && isConnected) {
      updateMessageStatus(messageId, 'pending');
      processQueue();
    }
  }, [messageQueue, isConnected, updateMessageStatus, processQueue]);

  // Clear all messages
  const clearQueue = useCallback(() => {
    setMessageQueue([]);
  }, []);

  // Clear failed messages only
  const clearFailedMessages = useCallback(() => {
    setMessageQueue(prev => prev.filter(msg => msg.status !== 'failed'));
  }, []);

  // Get queue statistics
  const queueStats = React.useMemo(() => {
    const stats = messageQueue.reduce((acc, msg) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1;
      return acc;
    }, {} as Record<QueuedMessage['status'], number>);

    return {
      total: messageQueue.length,
      pending: stats.pending || 0,
      retrying: stats.retrying || 0,
      failed: stats.failed || 0,
      success: stats.success || 0
    };
  }, [messageQueue]);

  // Format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="p-6 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                {isConnected ? <Wifi className="text-green-400" size={24} /> : <WifiOff className="text-red-400" size={24} />}
              </div>
              Offline Message Queue
            </h2>
            <p className="text-gray-400 mt-1">
              WebSocket reliability layer with exponential backoff retry logic
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setProcessingPaused(!processingPaused)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                processingPaused 
                  ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70'
                  : 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-900/70'
              }`}
            >
              {processingPaused ? <Play size={16} /> : <Pause size={16} />}
              {processingPaused ? 'Resume' : 'Pause'}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-700 hover:bg-gray-600"
            >
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-xl border ${
            isConnected 
              ? 'bg-green-900/20 border-green-700' 
              : 'bg-red-900/20 border-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Connection</span>
              {isConnected ? (
                <CheckCircle className="text-green-400" size={20} />
              ) : (
                <XCircle className="text-red-400" size={20} />
              )}
            </div>
            <div className={`text-lg font-bold ${
              isConnected ? 'text-green-400' : 'text-red-400'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {connectionAttempts > 0 && `${connectionAttempts} attempts`}
            </div>
          </div>

          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Queue Size</span>
              <Clock className="text-blue-400" size={20} />
            </div>
            <div className="text-lg font-bold text-blue-400">
              {queueStats.total}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {queueStats.pending} pending
            </div>
          </div>

          <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Retrying</span>
              <RefreshCw className="text-yellow-400" size={20} />
            </div>
            <div className="text-lg font-bold text-yellow-400">
              {queueStats.retrying}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {isProcessing ? 'Processing...' : 'Idle'}
            </div>
          </div>

          <div className="p-4 bg-red-900/20 border border-red-700 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Failed</span>
              <AlertTriangle className="text-red-400" size={20} />
            </div>
            <div className="text-lg font-bold text-red-400">
              {queueStats.failed}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Max retries reached
            </div>
          </div>
        </div>

        {/* Queue Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-400">
            {messageQueue.length === 0 ? 'No queued messages' : `Showing ${messageQueue.length} messages`}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={processQueue}
              disabled={!isConnected || isProcessing}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-900/70 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
              Process Now
            </button>
            
            <button
              onClick={clearFailedMessages}
              className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/50 text-yellow-300 rounded-lg text-sm font-medium hover:bg-yellow-900/70"
            >
              Clear Failed
            </button>
            
            <button
              onClick={clearQueue}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 text-red-300 rounded-lg text-sm font-medium hover:bg-red-900/70"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          </div>
        </div>

        {/* Message Queue List */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          {messageQueue.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Wifi className="mx-auto mb-3 text-gray-500" size={48} />
              <p className="text-lg font-medium mb-1">Queue is empty</p>
              <p className="text-sm">Messages will appear here when WebSocket is disconnected</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {messageQueue.slice(0, 20).map((message) => (
                <div key={message.id} className="p-4 hover:bg-gray-750/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        message.status === 'success' ? 'bg-green-400' :
                        message.status === 'failed' ? 'bg-red-400' :
                        message.status === 'retrying' ? 'bg-yellow-400 animate-pulse' :
                        'bg-gray-400'
                      }`} />
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{message.type}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            message.priority === 'critical' ? 'bg-red-900/50 text-red-300' :
                            message.priority === 'high' ? 'bg-orange-900/50 text-orange-300' :
                            message.priority === 'medium' ? 'bg-blue-900/50 text-blue-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {message.priority}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-400 mt-1">
                          {formatTimeAgo(message.timestamp)} • 
                          Attempts: {message.attempts}/{message.maxAttempts}
                          {message.endpoint && ` • ${message.endpoint}`}
                        </div>
                        
                        {message.error && (
                          <div className="text-sm text-red-400 mt-1">
                            {message.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        message.status === 'success' ? 'bg-green-900/50 text-green-300' :
                        message.status === 'failed' ? 'bg-red-900/50 text-red-300' :
                        message.status === 'retrying' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {message.status.toUpperCase()}
                      </span>

                      {message.status === 'failed' && (
                        <button
                          onClick={() => retryMessage(message.id)}
                          disabled={!isConnected}
                          className="p-1.5 bg-blue-900/50 text-blue-300 rounded hover:bg-blue-900/70 disabled:opacity-50"
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}

                      <button
                        onClick={() => removeMessage(message.id)}
                        className="p-1.5 bg-red-900/50 text-red-300 rounded hover:bg-red-900/70"
                      >
                        <XCircle size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {messageQueue.length > 20 && (
                <div className="p-4 text-center text-gray-400 bg-gray-750/30">
                  ... and {messageQueue.length - 20} more messages
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-6 p-6 bg-gray-800 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Queue Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-300 mb-3">Retry Policy</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Attempts:</span>
                    <span className="text-white">{retryPolicy.maxAttempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Delay:</span>
                    <span className="text-white">{retryPolicy.baseDelay}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Delay:</span>
                    <span className="text-white">{retryPolicy.maxDelay}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Backoff Multiplier:</span>
                    <span className="text-white">{retryPolicy.backoffMultiplier}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Jitter:</span>
                    <span className="text-white">{retryPolicy.jitterEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-300 mb-3">Queue Configuration</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Queue Size:</span>
                    <span className="text-white">{maxQueueSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Persistence:</span>
                    <span className="text-white">{enablePersistence ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">WebSocket URL:</span>
                    <span className="text-white text-xs break-all">{wsUrl}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm mt-8">
          Epic 8: Observability Metrics & Offline Queue - WebSocket Reliability Layer
          <br />
          Queue: {queueStats.total} messages | Processing: {isProcessing ? 'Active' : 'Idle'} | 
          Connection: {isConnected ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
  );
};

// Hook for using the offline queue in other components
export const useOfflineQueue = (options?: Partial<OfflineQueueProps>) => {
  const queueRef = useRef<{
    queueMessage: (type: string, payload: any, priority?: QueuedMessage['priority'], endpoint?: string) => string;
  }>();

  const queueMessage = useCallback((
    type: string, 
    payload: any, 
    priority: QueuedMessage['priority'] = 'medium',
    endpoint?: string
  ) => {
    if (queueRef.current) {
      return queueRef.current.queueMessage(type, payload, priority, endpoint);
    }
    return '';
  }, []);

  return {
    queueMessage,
    queueRef
  };
};

export default OfflineQueue;