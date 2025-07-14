import React from 'react'; // Note: './react' is not a valid import path, assuming it's a typo and using the original import path;

const LoadingSkeleton: React.FC = () => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }} key={531732}>
    <div className='animate-pulse' key={598615}>
      Loading...
    </div>
  </div>
);

export { LoadingSkeleton };
