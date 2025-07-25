// Ensure onboarding is skipped by mocking localStorage before any test files are loaded
// Fetch polyfill moved to jest.fetch.polyfill.js and loaded in setupFiles
// Jest E2E Setup: Global mocks and state resets for robust, cross-platform testing

// Restore all mocks after each test for isolation
afterEach(() => {
  jest.restoreAllMocks();
});
// (Removed global fetch mock to allow unifiedApiService mock to be used)
jest.mock('./src/onboarding/OnboardingFlow', () => ({
  OnboardingFlow: () => null,
}));
jest.mock('./src/update/UpdateModal', () => ({
  UpdateModal: () => null,
}));
jest.mock('./src/contexts/AuthContext', () => {
  const actual = jest.requireActual('./src/contexts/AuthContext');
  // Dynamic admin/regular user mock
  let defaultUser = { id: '1', email: 'user@example.com', role: 'user' };
  let currentUser = defaultUser;
  let isAdmin = false;
  // Reset function to restore defaults
  const resetAuthMock = () => {
    currentUser = defaultUser;
    isAdmin = false;
  };
  // Helper to set user state directly from tests
  const setAuthUser = (user, admin = false) => {
    currentUser = user;
    isAdmin = admin;
  };
  return {
    __esModule: true,
    _AuthProvider: actual._AuthProvider,
    useAuth: () => ({
      user: currentUser,
      isAdmin,
      isAuthenticated: !!currentUser,
      requiresPasswordChange: false,
      changePassword: jest.fn(),
      loading: false,
      error: undefined,
      login: jest.fn(async email => {
        currentUser = {
          id: '1',
          email,
          role: email === 'admin@example.com' || email === 'cole@example.com' ? 'admin' : 'user',
        };
        isAdmin = email === 'admin@example.com' || email === 'cole@example.com';
        return true;
      }),
      register: jest.fn(async email => {
        currentUser = {
          id: '1',
          email,
          role: email === 'admin@example.com' || email === 'cole@example.com' ? 'admin' : 'user',
        };
        isAdmin = email === 'admin@example.com' || email === 'cole@example.com';
        return true;
      }),
      logout: jest.fn(async () => {
        currentUser = null;
        isAdmin = false;
        return true;
      }),
      checkAdminStatus: jest.fn(() => {
        if (!currentUser || !currentUser.email) return false;
        return (
          currentUser.email === 'admin@example.com' || currentUser.email === 'cole@example.com'
        );
      }),
    }),
    // Expose reset and setAuthUser for test setup
    __resetAuthMock: resetAuthMock,
    __setAuthUser: setAuthUser,
  };
});
