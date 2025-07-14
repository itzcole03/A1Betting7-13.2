import React, { useState, useEffect } from 'react';
import { ExternalLink, RotateCcw, Monitor } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EnhancedLiveStreamPage: React.FC = () => {
  const [streamUrl, setStreamUrl] = useState('https://the.streameast.app/v91');
  const [isLoading, setIsLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    // Simple loading timeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [streamUrl]);

  const handleReload = () => {
    setIsLoading(true);
    const iframe = document.getElementById('stream-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
    setTimeout(() => setIsLoading(false), 3000);
  };

  const openInNewTab = () => {
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  };

  const handleUrlUpdate = () => {
    if (customUrl.trim()) {
      setStreamUrl(customUrl.trim());
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 3000);
      toast.success('Stream URL updated!');
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Simple Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-white mb-2'>📺 Live Stream</h1>
          <p className='text-gray-400'>Watch live sports streams</p>
        </div>

        {/* URL Controls */}
        <div className='mb-6 bg-gray-800 border border-gray-700 rounded-lg p-4'>
          <div className='flex flex-col sm:flex-row gap-4 items-center'>
            <div className='flex-1'>
              <input
                type='url'
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder='Enter stream URL...'
                className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500'
              />
            </div>
            <div className='flex gap-2'>
              <button
                onClick={handleUrlUpdate}
                className='px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors'
              >
                Update URL
              </button>
              <button
                onClick={handleReload}
                className='flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors'
              >
                <RotateCcw className='w-4 h-4' />
                <span>Reload</span>
              </button>
              <button
                onClick={openInNewTab}
                className='flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
              >
                <ExternalLink className='w-4 h-4' />
                <span>New Tab</span>
              </button>
            </div>
          </div>

          <div className='mt-2 text-sm text-gray-400'>
            Current: <span className='text-cyan-400'>{streamUrl}</span>
          </div>
        </div>

        {/* Stream Browser */}
        <div className='bg-black rounded-lg overflow-hidden border border-gray-700 shadow-2xl'>
          {/* Loading Overlay */}
          {isLoading && (
            <div className='absolute inset-0 bg-gray-900/95 flex items-center justify-center z-10'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent mx-auto mb-4'></div>
                <div className='text-white text-lg font-medium'>Loading Stream...</div>
              </div>
            </div>
          )}

          {/* Stream Container */}
          <div className='relative w-full' style={{ aspectRatio: '16/9' }}>
            <iframe
              id='stream-iframe'
              src={streamUrl}
              className='w-full h-full border-0'
              title='Live Sports Stream'
              allowFullScreen
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'
              referrerPolicy='no-referrer-when-downgrade'
              sandbox='allow-scripts allow-same-origin allow-presentation allow-forms allow-top-navigation'
              onLoad={() => {
                setIsLoading(false);
                toast.success('Stream loaded successfully!');
              }}
              onError={() => {
                setIsLoading(false);
                toast.error('Stream failed to load - try opening in new tab');
              }}
            />
          </div>
        </div>

        {/* Stream Info */}
        <div className='mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-white mb-1'>Stream Information</h3>
              <p className='text-gray-400 text-sm'>
                If the stream doesn't load, the site may block embedding. Click "New Tab" for best
                experience.
              </p>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
              <span className='text-green-400 text-sm font-medium'>Live</span>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className='mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4'>
          <h3 className='text-lg font-semibold text-white mb-3'>Quick Stream Sources</h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
            {[
              { name: 'StreamEast v91', url: 'https://the.streameast.app/v91' },
              { name: 'StreamEast Main', url: 'https://the.streameast.app' },
              { name: 'SportSurge', url: 'https://sportsurge.net' },
              { name: 'ESPN', url: 'https://www.espn.com/watch' },
            ].map(preset => (
              <button
                key={preset.url}
                onClick={() => {
                  setStreamUrl(preset.url);
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 3000);
                  toast.success(`Switched to ${preset.name}`);
                }}
                className='px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors'
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLiveStreamPage;
