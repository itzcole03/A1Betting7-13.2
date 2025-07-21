import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// @ts-expect-error TS(6142): Module '../PropOllama' was resolved to 'C:/Users/b... Remove this comment to see the full error message
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
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  render(<PropOllama />);
  const healthBtn = screen.getByRole('button', { name: /check api health/i });
  fireEvent.click(healthBtn);
  await waitFor(() => {
    expect(screen.queryByText(/health check failed/i)).not.toBeInTheDocument();
  });
});

test('displays backend error message', async () => {
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  render(<PropOllama />);
  const input = screen.getByLabelText(/type your message/i);
  fireEvent.change(input, { target: { value: 'error' } });
  // @ts-expect-error TS(2339): Property 'form' does not exist on type 'HTMLElemen... Remove this comment to see the full error message
  fireEvent.submit(input.form!);
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/internal server error/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/simulated error/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/traceback/i);
  });
});

test('displays AI response for valid message', async () => {
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  render(<PropOllama />);
  const input = screen.getByLabelText(/type your message/i);
  fireEvent.change(input, { target: { value: 'hello' } });
  // @ts-expect-error TS(2339): Property 'form' does not exist on type 'HTMLElemen... Remove this comment to see the full error message
  fireEvent.submit(input.form!);
  await waitFor(() => {
    expect(screen.getByText(/AI response/)).toBeInTheDocument();
  });
});
