import { render, screen } from '@testing-library/react';
import App from '../App';

let useAuthMock: any;
jest.mock('../contexts/AuthContext', () => ({
  _AuthProvider: ({ children }: any) => <>{children}</>,
  useAuth: () => useAuthMock(),
}));
jest.mock('../contexts/AppContext', () => ({
  _AppProvider: ({ children }: any) => <>{children}</>,
}));
jest.mock('../contexts/ThemeContext', () => ({
  _ThemeProvider: ({ children }: any) => <>{children}</>,
}));
jest.mock('../contexts/WebSocketContext', () => ({
  _WebSocketProvider: ({ children }: any) => <>{children}</>,
}));
jest.mock('../onboarding/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: any) => <>{children}</>,
}));
jest.mock('../components/auth/AuthPage', () => () => <div>AuthPage</div>);
jest.mock('../components/auth/PasswordChangeForm', () => () => <div>PasswordChangeForm</div>);
jest.mock('../components/core/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
}));
jest.mock('../components/core/ServiceWorkerUpdateNotification', () => () => (
  <div>ServiceWorkerUpdateNotification</div>
));
jest.mock('../components/ErrorBoundaryVersion', () => ({
  ErrorBoundaryVersion: ({ children }: any) => <>{children}</>,
}));
jest.mock('../update/UpdateModal', () => () => <div>UpdateModal</div>);
jest.mock('../components/user-friendly/UserFriendlyApp', () => () => <div>UserFriendlyApp</div>);
jest.mock('../onboarding/OnboardingFlow', () => ({
  OnboardingFlow: () => <div>OnboardingFlow</div>,
}));
jest.mock('../services/serviceWorkerManager', () => ({
  serviceWorkerManager: { register: jest.fn(() => Promise.resolve({})) },
}));
jest.mock('../services/webVitalsService', () => ({
  webVitalsService: { trackCustomMetric: jest.fn() },
}));
jest.mock('../services/SportsService', () => ({
  checkApiVersionCompatibility: jest.fn(() => Promise.resolve('2.0.0')),
}));
jest.mock('../services/backendDiscovery', () => ({
  discoverBackend: jest.fn(() => Promise.resolve('http://localhost:8000')),
}));
jest.mock('../utils/getBackendUrl', () => ({ getBackendUrl: () => 'http://localhost:8000' }));
jest.mock('../utils/location', () => ({ getLocation: () => ({ reload: jest.fn() }) }));
jest.mock('../utils/performance', () => ({
  usePerformanceTracking: () => ({ trackOperation: jest.fn((name, fn) => fn()) }),
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useAuthMock = jest.fn(() => ({
      isAuthenticated: false,
      requiresPasswordChange: false,
      changePassword: jest.fn(),
      loading: false,
      error: null,
      user: null,
    }));
  });

  it('renders AuthPage when not authenticated', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      requiresPasswordChange: false,
      changePassword: jest.fn(),
      loading: false,
      error: null,
      user: null,
    });
    localStorage.setItem('onboardingComplete', 'true');
    render(<App />);
    expect(screen.getByText('AuthPage')).toBeInTheDocument();
  });

  it('renders PasswordChangeForm when requiresPasswordChange is true', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      requiresPasswordChange: true,
      changePassword: jest.fn(),
      loading: false,
      error: null,
      user: { id: '1' },
    });
    localStorage.setItem('onboardingComplete', 'true');
    render(<App />);
    expect(screen.getByText('PasswordChangeForm')).toBeInTheDocument();
  });

  it('renders UserFriendlyApp when authenticated and no password change required', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      requiresPasswordChange: false,
      changePassword: jest.fn(),
      loading: false,
      error: null,
      user: { id: '1' },
    });
    localStorage.setItem('onboardingComplete', 'true');
    render(<App />);
    expect(screen.getByText('UserFriendlyApp')).toBeInTheDocument();
  });

  it('renders OnboardingFlow when not authenticated and onboarding not complete', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      requiresPasswordChange: false,
      changePassword: jest.fn(),
      loading: false,
      error: null,
      user: null,
    });
    localStorage.removeItem('onboardingComplete');
    render(<App />);
    expect(screen.getByText('OnboardingFlow')).toBeInTheDocument();
  });
});
