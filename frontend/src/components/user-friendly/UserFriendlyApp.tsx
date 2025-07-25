import React from 'react';
import UnifiedOllama from '../UnifiedOllama';

const UserFriendlyApp: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'>
      <UnifiedOllama />
    </div>
  );
};

export default UserFriendlyApp;
