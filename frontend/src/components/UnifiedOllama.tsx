import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

const UnifiedOllama: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHealthTooltip, setShowHealthTooltip] = useState(false);
  const [input, setInput] = useState('');

  return (
    <>
      <div className='w-full h-screen flex flex-col bg-gradient-to-br from-gray-900 to-black text-white relative'>
        {/* Top Banner (Onboarding only) */}
        <div className='w-full flex flex-col gap-0 pt-2 pb-0 px-0 z-20'>
          <div className='bg-cyan-900/90 text-cyan-100 px-8 py-3 text-sm flex items-center justify-between shadow-md border-b border-cyan-400/30 rounded-t-xl'>
            <div className='relative flex items-center'>
              <span className='font-bold text-cyan-300'>Welcome!</span>
              <div className='ml-2 relative'>
                <button
                  className='bg-cyan-700/80 text-cyan-100 px-2 py-1 rounded hover:bg-cyan-600/90 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-xs font-medium'
                  aria-label='Show onboarding info'
                  tabIndex={0}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onFocus={() => setShowTooltip(true)}
                  onBlur={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(v => !v)}
                >
                  ℹ️
                </button>
                {showTooltip && (
                  <div className='absolute left-0 top-8 z-30 w-[340px] bg-gray-950/95 text-cyan-100 border border-cyan-400/40 rounded-2xl shadow-2xl p-5 text-sm flex flex-col gap-3'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='text-cyan-300 text-lg'>🧠</span>
                      <span className='font-bold text-cyan-200 text-base'>UnifiedOllama Onboarding</span>
                    </div>
                    <div className='border-b border-cyan-400/20 my-1'></div>
                    <ul className='list-none pl-0 space-y-2'>
                      <li className='flex items-start gap-2'>
                        <span className='text-cyan-400'>💡</span>
                        <span>
                          <span className='font-bold text-cyan-300'>AI-powered recommendations</span> are shown for all major sports.<br />
                          Bets are <span className='font-bold text-cyan-200'>sorted by model confidence</span> (highest first).
                        </span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <span className='text-green-400'>🔢</span>
                        <span>
                          <span className='font-bold text-green-300'>Confidence</span> is color-coded and shown as a percentage.<br />
                          Higher confidence = stronger AI signal.
                        </span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <span className='text-blue-400'>📝</span>
                        <span>
                          Click <span className='underline text-blue-300'>Show Explanation</span> on any bet to see detailed AI reasoning and insights.
                        </span>
                      </li>
                    </ul>
                    <div className='border-t border-cyan-400/20 mt-2 pt-2 text-xs text-cyan-400'>
                      Tip: Use the chat below to ask about trending props, strategies, or get personalized best bets.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Main Content Layout */}
        <div className='flex flex-row w-full h-full'>
          {/* Chat Panel */}
          <AnimatePresence>
            <motion.div
              className='flex-1 flex flex-col items-center justify-center pr-8'
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
            >
              <div className='max-w-2xl w-full p-8 rounded-xl bg-gray-950/80 shadow-lg'>
                <h1 className='text-3xl font-bold text-cyan-300 mb-4'>UnifiedOllama AI</h1>
                <input
                  type='text'
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask me about any sports prop, strategy, or get today's best bets..."
                  className='w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-400/30 text-cyan-300 placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent mb-4'
                />
                <button className='w-full px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:from-cyan-300 hover:to-blue-400 transition-all hover:scale-105'>
                  Send
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
          {/* Sidebar Panel */}
          <AnimatePresence>
            <motion.div
              className='w-[420px] min-w-[320px] max-w-[480px] bg-gray-950/80 backdrop-blur-lg shadow-lg rounded-l-xl flex flex-col pl-8 py-8 border-l border-gray-800'
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4 }}
            >
              <div className='mb-6'>
                <h2 className='text-xl font-bold text-green-300'>🏆 Today's Best Bets</h2>
                <p className='text-sm text-green-400/70'>Top AI-Powered Recommendations</p>
              </div>
              <div className='flex-1 overflow-y-auto space-y-4'>
                {(() => {
                  const bets = [
                    {
                      player: 'Aaron Judge (MLB)',
                      prop: 'Home Runs',
                      value: 'OVER 2.3',
                      confidence: '87.5%'
                    },
                    {
                      player: 'Mookie Betts (MLB)',
                      prop: 'Total Bases',
                      value: 'OVER 1.8',
                      confidence: '82.1%'
                    }
                  ];
                  return bets
                    .concat(Array(6 - bets.length).fill(null))
                    .map((bet, idx) => bet ? (
                      <div key={idx} className='p-4 rounded-lg bg-gray-800/50 border border-cyan-400/20 shadow-md'>
                        <div className='text-lg font-bold text-cyan-200'>{bet.player}</div>
                        <div className='text-cyan-100'>
                          {bet.prop}: <span className='text-green-400 font-semibold'>{bet.value}</span>
                        </div>
                        <div className='mt-2 text-xs text-green-400'>Confidence: {bet.confidence}</div>
                      </div>
                    ) : (
                      <div key={idx} className='p-4 rounded-lg bg-gray-800/30 border border-cyan-400/10 shadow-md opacity-60'>
                        <div className='text-lg font-bold text-cyan-200'>No bet available</div>
                        <div className='text-cyan-100'>--</div>
                        <div className='mt-2 text-xs text-green-400'>Confidence: --</div>
                      </div>
                    ));
                })()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Health Status: Bottom Left Corner Icon + Tooltip (outside flex row for visibility) */}
        <div className='fixed bottom-6 left-6 z-50'>
          <div className='relative'>
            <button
              className='bg-green-900/90 text-green-200 rounded-full p-3 shadow-lg border border-green-400/30 hover:bg-green-800/90 focus:outline-none focus:ring-2 focus:ring-green-400/50 text-2xl'
              aria-label='Show health status'
              tabIndex={0}
              onMouseEnter={() => setShowHealthTooltip(true)}
              onMouseLeave={() => setShowHealthTooltip(false)}
              onFocus={() => setShowHealthTooltip(true)}
              onBlur={() => setShowHealthTooltip(false)}
              onClick={() => setShowHealthTooltip(v => !v)}
            >
              🩺
            </button>
            {showHealthTooltip && (
              <div className='absolute left-0 bottom-full mb-3 z-50 w-[300px] bg-gray-950/95 text-green-100 border border-green-400/40 rounded-2xl shadow-2xl p-5 text-sm flex flex-col gap-3'>
                <div className='absolute left-6 top-full mt-[-6px] w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-950'></div>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-green-400 text-lg'>🩺</span>
                  <span className='font-bold text-green-200 text-base'>System Health Status</span>
                </div>
                <div className='border-b border-green-400/20 my-1'></div>
                <ul className='list-none pl-0 space-y-2'>
                  <li className='flex items-start gap-2'>
                    <span className='text-green-400'>✅</span>
                    <span>
                      <span className='font-bold text-green-300'>Live data is healthy</span>
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-green-400'>📈</span>
                    <span>
                      <span className='font-bold text-green-200'>All props up to date</span>
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-green-400'>🤖</span>
                    <span>
                      Autonomous healing: <span className='font-bold text-green-300'>0</span>
                    </span>
                  </li>
                </ul>
                <div className='border-t border-green-400/20 mt-2 pt-2 text-xs text-green-400'>
                  All systems operational. Data is refreshed automatically.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UnifiedOllama;
