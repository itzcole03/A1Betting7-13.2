// LiveStream.tsx
// Modern live stream page with embedded preview of https://gostreameast.link/official/
// Users can browse and select live sports streams directly from the embedded site.

import React from 'react';

export default function LiveStream() {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800'>
      {/* Onboarding Banner */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='w-full z-20'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='bg-blue-900/90 text-blue-100 px-6 py-3 text-sm flex items-center justify-between shadow-md border-b border-blue-400/30'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='font-bold text-blue-300'>How to Use:</span> Browse the embedded
            StreamEast site below to find your live sports stream.
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <br />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='font-bold'>Safety Tips:</span> Use an ad blocker for best experience.
            Open streams in a new tab if popups appear.{' '}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-yellow-300'>No registration or payment is ever required.</span>
          </div>
        </div>
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <header className='p-6 border-b border-cyan-400/30 bg-gradient-to-r from-cyan-900/50 to-blue-900/50'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h1 className='text-2xl font-bold text-cyan-300 mb-1'>Live Sports Streams</h1>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <p className='text-cyan-400/70 text-sm'>
          Browse and watch free HD live sports streams from{' '}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <a
            href='https://gostreameast.link/official/'
            target='_blank'
            rel='noopener noreferrer'
            className='underline text-blue-300'
          >
            StreamEast
          </a>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          .<br />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-yellow-300'>Tip:</span> Use the site navigation to select your sport
          or event. For best experience, use an ad blocker and open streams in a new tab if needed.
        </p>
      </header>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <main className='flex-1 flex items-center justify-center p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='w-full max-w-5xl h-[70vh] rounded-lg overflow-hidden shadow-lg border border-cyan-400/20 bg-black'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <iframe
            src='https://gostreameast.link/official/'
            title='StreamEast Live Sports'
            className='w-full h-full border-0'
            allowFullScreen
            aria-label='StreamEast Live Sports Preview'
          />
        </div>
      </main>
    </div>
  );
}
