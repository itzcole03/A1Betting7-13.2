import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface CommandSummary {
  id: string;
  name: string;
  description: string;
  category?: string;
  usage?: string;
  [key: string]: unknown;
}

interface CommandQueueItem {
  id: string;
  name: string;
  description: string;
  status: 'queued' | 'running' | 'success' | 'error';
  result?: unknown;
}

interface CommandSummaryContextType {
  commands: CommandSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  queue: CommandQueueItem[];
  addToQueue: (cmd: CommandSummary) => void;
  removeFromQueue: (id: string) => void;
}

const _CommandSummaryContext = createContext<CommandSummaryContextType | undefined>(undefined);

const _executeCommand = async (
  cmd: CommandSummary,
  updateStatus: (status: 'queued' | 'running' | 'success' | 'error', result?: unknown) => void
) => {
  updateStatus('running');
  try {
    const _res = await fetch('/api/commands/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cmd.id }),
    });
    const _data = await _res.json();
    if (_data.status === 'success') {
      updateStatus('success', _data.result);
    } else {
      updateStatus('error', _data.result);
    }
  } catch (e: any) {
    updateStatus('error', e.message);
  }
};

export const _CommandSummaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [commands, setCommands] = useState<CommandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<CommandQueueItem[]>([]);

  const _fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const _res = await fetch('/api/commands/summary');
      if (!_res.ok) throw new Error('Failed to fetch command summary');
      const _data = await _res.json();
      setCommands(Array.isArray(_data) ? _data : []);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      setCommands([]);
    } finally {
      setLoading(false);
    }
  };

  const _addToQueue = (cmd: CommandSummary) => {
    const _item: CommandQueueItem = { ...cmd, status: 'queued' };
    setQueue(q => [...q, _item]);
    // Start execution immediately
    const _updateStatus = (
      status: 'queued' | 'running' | 'success' | 'error',
      result?: unknown
    ) => {
      setQueue(q => q.map(qi => (qi.id === cmd.id ? { ...qi, status, result } : qi)));
    };
    _executeCommand(cmd, _updateStatus);
  };
  const _removeFromQueue = (id: string) => {
    setQueue(q => q.filter(_item => _item.id !== id));
  };

  useEffect(() => {
    _fetchSummary();
    const _interval = setInterval(_fetchSummary, 30000); // Refresh every 30s
    return () => clearInterval(_interval);
  }, []);

  return (
    // Removed unused @ts-expect-error: JSX is supported in this environment
    <_CommandSummaryContext.Provider
      value={{
        commands,
        loading,
        error,
        refresh: _fetchSummary,
        queue,
        addToQueue: _addToQueue,
        removeFromQueue: _removeFromQueue,
      }}
    >
      {children}
    </_CommandSummaryContext.Provider>
  );
};

export const _useCommandSummary = () => {
  const _ctx = useContext(_CommandSummaryContext);
  if (!_ctx) throw new Error('useCommandSummary must be used within CommandSummaryProvider');
  return _ctx;
};
