import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface CommandSummary {
  id: string;
  name: string;
  description: string;
  category?: string;
  usage?: string;
  [key: string]: any;
}

interface CommandQueueItem {
  id: string;
  name: string;
  description: string;
  status: 'queued' | 'running' | 'success' | 'error';
  result?: any;
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

const CommandSummaryContext = createContext<CommandSummaryContextType | undefined>(undefined);

const executeCommand = async (
  cmd: CommandSummary,
  updateStatus: (status: string, result?: any) => void
) => {
  updateStatus('running');
  try {
    const res = await fetch('/api/commands/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cmd.id }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      updateStatus('success', data.result);
    } else {
      updateStatus('error', data.result);
    }
  } catch (e) {
    updateStatus('error', e.message);
  }
};

export const CommandSummaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [commands, setCommands] = useState<CommandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<CommandQueueItem[]>([]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/commands/summary');
      if (!res.ok) throw new Error('Failed to fetch command summary');
      const data = await res.json();
      setCommands(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      setCommands([]);
    } finally {
      setLoading(false);
    }
  };

  const addToQueue = (cmd: CommandSummary) => {
    const item: CommandQueueItem = { ...cmd, status: 'queued' };
    setQueue(q => [...q, item]);
    // Start execution immediately
    const updateStatus = (status: string, result?: any) => {
      setQueue(q => q.map(qi => (qi.id === cmd.id ? { ...qi, status, result } : qi)));
    };
    executeCommand(cmd, updateStatus);
  };
  const removeFromQueue = (id: string) => {
    setQueue(q => q.filter(item => item.id !== id));
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <CommandSummaryContext.Provider
      value={{
        commands,
        loading,
        error,
        refresh: fetchSummary,
        queue,
        addToQueue,
        removeFromQueue,
      }}
    >
      {children}
    </CommandSummaryContext.Provider>
  );
};

export const useCommandSummary = () => {
  const ctx = useContext(CommandSummaryContext);
  if (!ctx) throw new Error('useCommandSummary must be used within CommandSummaryProvider');
  return ctx;
};
