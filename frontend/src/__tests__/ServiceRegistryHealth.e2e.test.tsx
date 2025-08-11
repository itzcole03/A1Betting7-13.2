import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserFriendlyApp from '../components/user-friendly/UserFriendlyApp';
import { MasterServiceRegistry } from '../services/MasterServiceRegistry';

describe('Service Registry Health Monitoring E2E', () => {
  beforeEach(() => {
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('token', 'test-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['admin'],
      })
    );
  });
  it('shows service health indicators and updates status', async () => {
    render(
      <MemoryRouter>
        <UserFriendlyApp />
      </MemoryRouter>
    );
    // Wait for health indicator to appear
    expect(await screen.findByTestId('api-health-indicator')).toBeInTheDocument();
    // Simulate service registry health check
    const registry = MasterServiceRegistry.getInstance();
    registry.updateServiceHealth('data', 'healthy', 50);
    await waitFor(() => {
      expect(screen.getByText(/Healthy/i)).toBeInTheDocument();
    });
    // Simulate degraded service
    registry.updateServiceHealth('data', 'degraded', -1);
    await waitFor(() => {
      expect(screen.getByText(/Degraded/i)).toBeInTheDocument();
    });
  });
});
