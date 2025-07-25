// Mock matchMedia and scrollIntoView for jsdom and framer-motion requirements
// Must be set before importing the component
Object.defineProperty(HTMLDivElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});
const matchMediaMock = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(), // deprecated
  removeListener: jest.fn(), // deprecated
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});
window.matchMedia = matchMediaMock;
global.matchMedia = matchMediaMock;
if (!window.addEventListener) {
  window.addEventListener = jest.fn();
}
if (!document.addEventListener) {
  document.addEventListener = jest.fn();
}
if (!Element.prototype.addEventListener) {
  Element.prototype.addEventListener = jest.fn();
}
if (!Element.prototype.removeEventListener) {
  Element.prototype.removeEventListener = jest.fn();
}
window.alert = jest.fn();

// (imports moved below matchMedia mock)
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import PropOllama from '../PropOllama';

// Composite provider for PropOllama tests
// Replace with actual providers if available in your app (ThemeProvider, AppProvider, AuthProvider)
import { _AppProvider } from '../../../contexts/AppContext';
import { _AuthProvider } from '../../../contexts/AuthContext';
import { _ThemeProvider } from '../../../contexts/ThemeContext';

const CompositeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <_ThemeProvider>
    <_AppProvider>
      <_AuthProvider>{children}</_AuthProvider>
    </_AppProvider>
  </_ThemeProvider>
);

// Mock fetch for all PropOllama endpoints
beforeEach(() => {
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const opts = init;
    if (url === '/api/propollama/health') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', message: 'PropOllama API is healthy.' }),
      });
    }
    if (url === '/api/propollama/models') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ models: ['PropOllama'] }),
      });
    }
    if (url === '/api/propollama/model_health') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            model_health: { PropOllama: { status: 'ready' } },
          }),
      });
    }
    if (url === '/api/propollama/chat') {
      let message = '';
      if (opts && opts.body) {
        if (typeof opts.body === 'string') {
          try {
            message = JSON.parse(opts.body).message;
          } catch {}
        }
      }
      if (message === 'error') {
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
  }) as jest.Mock;
});

afterEach(() => {
  jest.resetAllMocks();
});

test('displays health check status', async () => {
  render(
    <CompositeProvider>
      <PropOllama />
    </CompositeProvider>
  );
  // Use aria-label for robust querying
  const _healthBtn = screen.getByRole('button', { name: /check propollama api health/i });
  fireEvent.click(_healthBtn);
  await waitFor(() => {
    expect(screen.queryByText(/health check failed/i)).not.toBeInTheDocument();
  });
});

test('displays backend error message', async () => {
  render(
    <CompositeProvider>
      <PropOllama />
    </CompositeProvider>
  );
  const _input = screen.getByLabelText(/type your message/i) as HTMLInputElement;
  fireEvent.change(_input, { target: { value: 'error' } });
  fireEvent.submit(_input.form!);
  await waitFor(() => {
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/simulated error/i);
    expect(alert).toHaveTextContent(/traceback/i);
    expect(alert).toHaveTextContent(/http 500/i);
  });
});

test('displays AI response for valid message', async () => {
  render(
    <CompositeProvider>
      <PropOllama />
    </CompositeProvider>
  );
  const _input = screen.getByLabelText(/type your message/i) as HTMLInputElement;
  fireEvent.change(_input, { target: { value: 'hello' } });
  fireEvent.submit(_input.form!);
  await waitFor(() => {
    expect(screen.getByText(/AI response/)).toBeInTheDocument();
  });
});
