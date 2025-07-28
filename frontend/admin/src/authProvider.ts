// Minimal authProvider (placeholder)
import { AuthProvider } from 'react-admin';

const authProvider: AuthProvider = {
  login: async () => Promise.resolve(),
  logout: async () => Promise.resolve(),
  checkAuth: async () => Promise.resolve(),
  checkError: async () => Promise.resolve(),
  getPermissions: async () => Promise.resolve(),
  getIdentity: async () => Promise.resolve({ id: 'admin', fullName: 'Admin User' }),
};

export default authProvider;
