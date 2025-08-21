import React from 'react';
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
  it('updates registry health state programmatically', async () => {
    render(
      <MemoryRouter>
        <UserFriendlyApp />
      </MemoryRouter>
    );
    // Wait for health indicator to appear
    expect(await screen.findByTestId('api-health-indicator')).toBeInTheDocument();
    // Use registry API to assert programmatic state instead of brittle DOM text
    const registry = MasterServiceRegistry.getInstance();

    registry.updateServiceHealth('data', 'healthy', 50);
    await waitFor(() => {
      const h = registry.getServiceHealth('data');
      expect(h).toBeDefined();
      expect(h?.status).toBe('healthy');
    });

    // Simulate degraded service and assert registry reflects it
    registry.updateServiceHealth('data', 'degraded', -1);
    await waitFor(() => {
      const h2 = registry.getServiceHealth('data');
      expect(h2).toBeDefined();
      expect(h2?.status).toBe('degraded');
    });
  });
});
