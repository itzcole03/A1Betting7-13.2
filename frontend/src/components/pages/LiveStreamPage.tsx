import React, { useState, useEffect } from 'react';
import { ExternalLink, Tv, Monitor, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LiveStreamPage: React.FC = () => {
  const [streamUrl, setStreamUrl] = useState('https://the.streameast.app');
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    toast.success('📺 Live stream loaded');
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    // Force iframe reload by changing the key
    const iframe = document.getElementById('stream-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById('stream-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (!isFullscreen) {
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const openInNewTab = () => {
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className='min-h-screen bg-gray-900 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-4xl font-bold text-white mb-2'>📺 Live Stream</h1>
              <p className='text-gray-400'>Watch live games while monitoring your locked bets</p>
            </div>

            <div className='flex items-center space-x-3'>
              <button
                onClick={handleReload}
                className='flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors'
                title='Reload stream'
              >
                <RotateCcw className='w-4 h-4' />
                <span>Reload</span>
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className='flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors'
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className='w-4 h-4' /> : <Volume2 className='w-4 h-4' />}
              </button>

              <button
                onClick={handleFullscreen}
                className='flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors'
                title='Toggle fullscreen'
              >
                <Monitor className='w-4 h-4' />
                <span>Fullscreen</span>
              </button>

              <button
                onClick={openInNewTab}
                className='flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors'
                title='Open in new tab'
              >
                <ExternalLink className='w-4 h-4' />
                <span>New Tab</span>
              </button>
            </div>
          </div>

          {/* Stream Info */}
          <div className='bg-gray-800 border border-cyan-500/30 rounded-lg p-4 mb-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <Tv className='w-5 h-5 text-cyan-400' />
                <div>
                  <div className='text-sm text-gray-400'>Streaming from:</div>
                  <div className='text-white font-medium'>{streamUrl}</div>
                </div>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse'></div>
                <span className='text-green-400 text-sm font-medium'>Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Container */}
        <div className='relative bg-black rounded-lg overflow-hidden border border-gray-700'>
          {/* Loading Overlay */}
          {isLoading && (
            <div className='absolute inset-0 bg-gray-900/90 flex items-center justify-center z-10'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4'></div>
                <div className='text-gray-400'>Loading stream...</div>
              </div>
            </div>
          )}

          {/* Embedded Stream */}
          <iframe
            id='stream-iframe'
            src={streamUrl}
            className='w-full h-96 md:h-[600px] lg:h-[700px]'
            title='Live Stream'
            allowFullScreen
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              toast.error('Failed to load stream');
            }}
          />
        </div>

        {/* Stream Controls Info */}
        <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-white mb-4'>🎮 Stream Controls</h3>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-400'>Reload Stream</span>
                <kbd className='px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm'>Ctrl + R</kbd>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-400'>Toggle Fullscreen</span>
                <kbd className='px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm'>F11</kbd>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-400'>Mute/Unmute</span>
                <kbd className='px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm'>M</kbd>
              </div>
            </div>
          </div>

          <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-white mb-4'>⚡ Quick Actions</h3>
            <div className='space-y-3'>
              <button
                onClick={() => (window.location.href = '/?page=locked-bets')}
                className='w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors'
              >
                <div className='text-cyan-400 font-medium'>🎯 View Locked Bets</div>
                <div className='text-gray-400 text-sm'>Check your active predictions</div>
              </button>
              <button
                onClick={() => (window.location.href = '/?page=settings')}
                className='w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors'
              >
                <div className='text-cyan-400 font-medium'>⚙️ Open Settings</div>
                <div className='text-gray-400 text-sm'>Configure your preferences</div>
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className='mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4'>
          <div className='flex items-start space-x-3'>
            <div className='text-yellow-400 text-sm'>⚠️</div>
            <div>
              <div className='text-yellow-400 font-medium text-sm mb-1'>Disclaimer</div>
              <div className='text-gray-300 text-sm'>
                This embedded stream is provided for convenience. A1Betting is not responsible for
                the content, availability, or legality of external streaming services. Please ensure
                you have the right to access the content in your jurisdiction.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPage;
