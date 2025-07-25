// src/components/FooterVersion.jsx;
import React from 'react';

const _FooterVersion = () => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <footer className='text-center text-sm text-gray-400 mt-auto py-2 border-t'>
      AI Sports Betting Prototype — v1.0.0;
    </footer>
  );
};

export default FooterVersion;
