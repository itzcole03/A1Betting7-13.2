import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '../AdminDashboard';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock window.location
const mockLocation = {
  href: '',
  reload: jest.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  it('renders access denied for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'user@example.com', role: 'user' },
      isAdmin: false,
      checkAdminStatus: () => false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      setUser: jest.fn(),
      loading: false,
      error: null,
    });

    render(<AdminDashboard />);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText(/You don't have permission to access the admin dashboard/)
    ).toBeInTheDocument();
  });

  it('renders loading state initially for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'admin@example.com', role: 'admin' },
      isAdmin: true,
      checkAdminStatus: () => true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      setUser: jest.fn(),
      loading: false,
      error: null,
    });

    render(<AdminDashboard />);

    expect(screen.getByText('Loading Admin Dashboard...')).toBeInTheDocument();
  });

  it('renders admin dashboard for admin users after loading', async () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'admin@example.com', role: 'admin' },
      isAdmin: true,
      checkAdminStatus: () => true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      setUser: jest.fn(),
      loading: false,
      error: null,
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Exit Admin Mode')).toBeInTheDocument();
  });

  it('handles exit admin mode button click', async () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'admin@example.com', role: 'admin' },
      isAdmin: true,
      checkAdminStatus: () => true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      setUser: jest.fn(),
      loading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Exit Admin Mode')).toBeInTheDocument();
    });

    const exitButton = screen.getByText('Exit Admin Mode');
    await user.click(exitButton);

    expect(mockLocation.href).toBe('/');
  });

  it('handles back to dashboard button in access denied state', async () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'user@example.com', role: 'user' },
      isAdmin: false,
      checkAdminStatus: () => false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      setUser: jest.fn(),
      loading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<AdminDashboard />);

    const backButton = screen.getByText('Back to Dashboard');
    await user.click(backButton);

    expect(mockLocation.href).toBe('/');
  });

  it('displays correct user email in header for admin users', async () => {
    const adminUser = { email: 'cole@example.com', role: 'admin' };

    mockUseAuth.mockReturnValue({
      user: adminUser,
      isAdmin: true,
      checkAdminStatus: () => true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      setUser: jest.fn(),
      loading: false,
      error: null,
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('cole@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });
});
