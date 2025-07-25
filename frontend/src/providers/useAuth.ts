import { useContext } from 'react';
// @ts-expect-error TS(2305): Module '"./AuthProvider"' has no exported member '... Remove this comment to see the full error message
import { AuthContext } from './AuthProvider';

export const _useAuth = () => {
  // @ts-expect-error TS(2304): Cannot find name 'context'.
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // @ts-expect-error TS(2304): Cannot find name 'context'.
  return context;
};
