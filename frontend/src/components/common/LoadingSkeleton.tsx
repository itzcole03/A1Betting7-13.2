import React from 'react'; // Note: './react' is not a valid import path, assuming it's a typo and using the original import path;

const _LoadingSkeleton: React.FC = () => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }} key={531732}>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='animate-pulse' key={598615}>
      Loading...
    </div>
  </div>
);

export { LoadingSkeleton };
