import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../App';
import { useAuth } from '../contexts/AuthContext';

jest.mock('../utils/enhancedLogger', () => ({
  enhancedLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../components/auth/AuthPage', () => ({
  __esModule: true,
  default: () => <div data-testid='mock-auth-page'>Auth Page</div>,
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function renderAppContent() {
  return render(
    <MemoryRouter>
      <AppContent />
    </MemoryRouter>
  );
}

describe('App onboarding gating', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      requiresPasswordChange: false,
      changePassword: jest.fn(),
      loading: false,
      error: null,
      user: null,
      isAdmin: false,
      hydrated: true,
      login: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
      register: jest.fn(),
    });
  });

  it('renders the onboarding welcome screen when unauthenticated', () => {
    renderAppContent();
    expect(screen.getByText(/welcome to a1betting/i)).toBeInTheDocument();
    expect(screen.getByTestId('app-gating-state')).toHaveAttribute('data-state', 'onboarding');
  });

  it('advances to the next onboarding step when Next is clicked', () => {
    renderAppContent();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/set up your profile/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('app-gating-state')[0]).toHaveAttribute('data-state', 'onboarding');
  });

  it('renders the auth page once onboarding is complete but user is unauthenticated', () => {
    localStorage.setItem('onboardingComplete', 'true');
    renderAppContent();
    expect(screen.getByTestId('mock-auth-page')).toBeInTheDocument();
    expect(screen.getByTestId('app-gating-state')).toHaveAttribute('data-state', 'auth');
  });
});
