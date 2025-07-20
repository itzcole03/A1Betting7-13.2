import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PropOllama from '../PropOllama';

// Mock fetch for health and chat endpoints
beforeEach(() => {
  global.fetch = jest.fn((url, opts) => {
    if (url === '/api/propollama/health') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', message: 'PropOllama API is healthy.' }),
      });
    }
    if (url === '/api/propollama/chat') {
      if (opts && opts.body && JSON.parse(opts.body).message === 'error') {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                detail: {
                  error: 'Internal Server Error',
                  message: 'Simulated error',
                  trace: 'traceback...',
                },
              })
            ),
        });
      }
      return Promise.resolve({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => ({ value: new TextEncoder().encode('AI response'), done: true }),
          }),
        },
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  }) as any;
});

afterEach(() => {
  jest.resetAllMocks();
});

test('displays health check status', async () => {
  render(<PropOllama />);
  const healthBtn = screen.getByRole('button', { name: /check api health/i });
  fireEvent.click(healthBtn);
  await waitFor(() => {
    expect(screen.queryByText(/health check failed/i)).not.toBeInTheDocument();
  });
});

test('displays backend error message', async () => {
  render(<PropOllama />);
  const input = screen.getByLabelText(/type your message/i);
  fireEvent.change(input, { target: { value: 'error' } });
  fireEvent.submit(input.form!);
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/internal server error/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/simulated error/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/traceback/i);
  });
});

test('displays AI response for valid message', async () => {
  render(<PropOllama />);
  const input = screen.getByLabelText(/type your message/i);
  fireEvent.change(input, { target: { value: 'hello' } });
  fireEvent.submit(input.form!);
  await waitFor(() => {
    expect(screen.getByText(/AI response/)).toBeInTheDocument();
  });
});
