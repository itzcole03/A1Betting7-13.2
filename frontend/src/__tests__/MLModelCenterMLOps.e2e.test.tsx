import { render, screen } from '@testing-library/react';
import App from '../App';

describe('ML Model Center and MLOps E2E', () => {
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
  it('renders ML model center and MLOps pipeline controls', async () => {
    render(<App />);
    // Wait for ML Model Center heading
    expect(await screen.findByText(/ML Model Center/i)).toBeInTheDocument();
    // Wait for MLOps pipeline controls
    expect(
      await screen.findByText(/MLOps Pipeline|Deploy Model|Promote Model/i)
    ).toBeInTheDocument();
  });
});
