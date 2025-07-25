import React, { useState } from 'react';

const StreamBackgroundCard: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('https://the.streameast.app');
  const [clickSelector, setClickSelector] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);

  const startSession = () => {
    setStatus('loading');
    setMessage('Starting background session...');
    setScreenshot(null);
    fetch('/api/stream-background/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, clickSelector: clickSelector || undefined }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('ready');
          setMessage('Background session started.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to start background session.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Failed to start background session.');
      });
  };

  const fetchScreenshot = () => {
    setShowScreenshot(false);
    setMessage('Fetching screenshot...');
    fetch('/api/stream-background/screenshot')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.screenshot) {
          setScreenshot(data.screenshot);
          setShowScreenshot(true);
          setMessage('Screenshot loaded.');
        } else {
          setMessage('Failed to fetch screenshot.');
        }
      })
      .catch(() => setMessage('Failed to fetch screenshot.'));
  };

  return (
    <div className='bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center min-h-[350px] min-w-[400px] border-2 border-cyber-primary/30'>
      <div className='mb-4'>
        <span className='text-3xl font-bold text-cyber-primary'>A1</span>
      </div>
      <h2 className='text-xl font-bold text-white mb-2'>StreamEast Background Session</h2>
      <p className='text-gray-400 mb-4 text-center'>
        Start a secure background browser session for{' '}
        <span className='text-cyan-400'>the.streameast.app</span> or any URL.
      </p>
      <div className='flex flex-col gap-2 w-full max-w-xs mb-4'>
        <input
          type='text'
          className='px-3 py-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyber-primary'
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder='Target URL'
        />
        <input
          type='text'
          className='px-3 py-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyber-primary'
          value={clickSelector}
          onChange={e => setClickSelector(e.target.value)}
          placeholder='Optional: CSS selector to click'
        />
        <button
          className='py-2 rounded bg-cyber-primary text-slate-900 font-semibold hover:bg-cyber-accent transition-colors disabled:opacity-60'
          onClick={startSession}
          disabled={status === 'loading'}
        >
          Start Background Session
        </button>
        <button
          className='py-2 rounded bg-cyber-accent text-slate-900 font-semibold hover:bg-cyber-primary transition-colors disabled:opacity-60'
          onClick={fetchScreenshot}
          disabled={status !== 'ready'}
        >
          Show Screenshot
        </button>
      </div>
      {status === 'loading' && (
        <div className='animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mb-4'></div>
      )}
      {status === 'ready' && <div className='text-green-400 font-semibold mb-4'>Ready</div>}
      {status === 'error' && <div className='text-red-400 font-semibold mb-4'>Error</div>}
      <div className='text-sm text-gray-300 mb-2'>{message}</div>
      {showScreenshot && screenshot && (
        <img
          src={`data:image/png;base64,${screenshot}`}
          alt='Screenshot'
          className='rounded-lg border border-slate-700 mt-2 max-w-full max-h-64'
        />
      )}
    </div>
  );
};

export default StreamBackgroundCard;
