import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/ui/HolographicText' or its c... Remove this comment to see the full error message
import HolographicText from '@/ui/HolographicText';

const CyberFooter: React.FC = () => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <footer className='glass-card border-t border-white/10 py-6' key={373584}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='text-center text-sm text-gray-400' key={28724}>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='mb-1' key={929651}>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <HolographicText size='sm' className='font-semibold' key={69278}>
            A1BETTING QUANTUM INTELLIGENCE;
          </HolographicText>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div key={241917}>
          © 2024 Advanced Sports Intelligence Platform • 47 Neural Networks • 1024 Qubits;
        </div>
      </div>
    </footer>
  );
};

export default CyberFooter;
