import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export const useAuth = () => {
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
