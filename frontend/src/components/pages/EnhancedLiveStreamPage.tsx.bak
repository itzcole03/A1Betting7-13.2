import { ExternalLink, RotateCcw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

const _EnhancedLiveStreamPage: React.FC = () => {
  const [streamUrl, setStreamUrl] = useState('https://the.streameast.app/v91');
  const [isLoading, setIsLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setEmbedBlocked(false);
    setIsLoading(true);
    // Heuristic: after 2.5s, try to access iframe contentWindow.location
    const checkBlocked = setTimeout(() => {
      setIsLoading(false);
      try {
        const iframe = iframeRef.current;
        if (iframe) {
          // Try to access location.href
          // If blocked, this will throw a security error
          // If blank, likely blocked
          const loc = iframe.contentWindow?.location;
          if (!loc || loc.href === 'about:blank') {
            setEmbedBlocked(true);
          }
        }
      } catch (e) {
        setEmbedBlocked(true);
      }
    }, 2500);
    return () => clearTimeout(checkBlocked);
  }, [streamUrl]);

  const _handleReload = () => {
    setIsLoading(true);
    setEmbedBlocked(false);
    const _iframe = iframeRef.current;
    if (_iframe) {
      _iframe.src = _iframe.src;
    }
    setTimeout(() => setIsLoading(false), 3000);
  };

  const _openInNewTab = () => {
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  };

  const _handleUrlUpdate = () => {
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
                onClick={_handleUrlUpdate}
                className='px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors'
              >
                Update URL
              </button>

              <button
                onClick={_handleReload}
                className='flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors'
              >
                <RotateCcw className='w-4 h-4' />
                <span>Reload</span>
              </button>

              <button
                onClick={_openInNewTab}
                className='flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
              >
                // ...existing code...
                <ExternalLink className='w-4 h-4' />
                // ...existing code...
                <span>New Tab</span>
              </button>
            </div>
          </div>
          // ...existing code...
          <div className='mt-2 text-sm text-gray-400'>
            // ...existing code... Current: <span className='text-cyan-400'>{streamUrl}</span>
          </div>
        </div>
        {/* Stream Browser */}
        // ...existing code...
        <div className='bg-black rounded-lg overflow-hidden border border-gray-700 shadow-2xl relative'>
          {/* Loading Overlay */}
          {isLoading && (
            <div className='absolute inset-0 bg-gray-900/95 flex items-center justify-center z-20'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent mx-auto mb-4'></div>
                <div className='text-white text-lg font-medium'>Loading Stream...</div>
              </div>
            </div>
          )}
          {/* Blocked Overlay */}
          {embedBlocked && !isLoading && (
            <div className='absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-30'>
              <div className='text-center max-w-md mx-auto'>
                <div className='text-3xl mb-2 text-cyan-400'>🚫</div>
                <div className='text-white text-xl font-bold mb-2'>Stream Cannot Be Embedded</div>
                <div className='text-gray-400 mb-4'>
                  This stream blocks in-app viewing for security reasons (CSP/X-Frame-Options).
                  <br />
                  <span className='text-cyan-400 break-all'>{streamUrl}</span>
                </div>
                <button
                  onClick={_openInNewTab}
                  className='px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors mb-2'
                >
                  Open in New Tab
                </button>
                <div className='text-xs text-gray-500 mt-2'>
                  <span>
                    For advanced users:{' '}
                    <a
                      href='https://requestly.com/blog/bypass-iframe-busting-header/'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='underline text-cyan-400'
                    >
                      see how to test locally with Requestly
                    </a>
                    .
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Stream Container */}
          <div className='relative w-full' style={{ aspectRatio: '16/9' }}>
            <iframe
              id='stream-iframe'
              ref={iframeRef}
              src={streamUrl}
              className='w-full h-full border-0'
              title='Live Sports Stream'
              allowFullScreen
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'
              referrerPolicy='no-referrer-when-downgrade'
              sandbox='allow-scripts allow-same-origin allow-presentation allow-forms allow-top-navigation'
              style={{
                pointerEvents: embedBlocked ? 'none' : 'auto',
                opacity: embedBlocked ? 0.2 : 1,
              }}
            />
          </div>
        </div>
        {/* Stream Info */}
        // ...existing code...
        <div className='mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4'>
          // ...existing code...
          <div className='flex items-center justify-between'>
            // ...existing code...
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

export default _EnhancedLiveStreamPage;
