// LiveStream.tsx
// Modern live stream page with embedded preview of https://gostreameast.link/official/
// Users can browse and select live sports streams directly from the embedded site.

import React from 'react';

export default function LiveStream() {
  return (
    <div className='min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800'>
      {/* Onboarding Banner */}
      <div className='w-full z-20'>
        <div className='bg-blue-900/90 text-blue-100 px-6 py-3 text-sm flex items-center justify-between shadow-md border-b border-blue-400/30'>
          <div>
            <span className='font-bold text-blue-300'>How to Use:</span> Browse the external
            StreamEast site to find your live sports stream.
            <br />
            <div className='mt-2 text-yellow-300 font-bold'>Safety Tips:</div>
            <ul className='list-disc list-inside ml-4'>
              <li>Use an ad blocker for best experience.</li>
              <li>Open streams in a new tab if popups appear.</li>
              <li>No registration or payment is ever required.</li>
            </ul>
          </div>
        </div>
      </div>
      <header className='p-6 border-b border-cyan-400/30 bg-gradient-to-r from-cyan-900/50 to-blue-900/50'>
        <h1 className='text-2xl font-bold text-cyan-300 mb-1'>Live Sports Streams</h1>
        <p className='text-cyan-400/70 text-sm'>
          Browse and watch free HD live sports streams from{' '}
          <a
            href='https://gostreameast.link/official/'
            target='_blank'
            rel='noopener noreferrer'
            className='underline text-blue-300'
          >
            StreamEast
          </a>
          .<span className='text-yellow-300'> Tip:</span> Use the site navigation to select your
          sport or event. For best experience, use an ad blocker and open streams in a new tab if
          needed.
        </p>
      </header>
      <main className='flex-1 flex flex-col items-center justify-center p-4 text-white'>
        <p className='text-lg mb-4'>Click the button below to open the live stream site:</p>
        <a
          href='https://gostreameast.link/official/'
          target='_blank'
          rel='noopener noreferrer'
          className='px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500 transition-all hover:scale-105 shadow-lg'
        >
          Open StreamEast Live Streams
        </a>
        <p className='mt-4 text-sm text-gray-400'>
          (You will be redirected to an external website)
        </p>
      </main>
    </div>
  );
}
