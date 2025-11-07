jest.mock('axios');

jest.mock('../../../services/propOllamaService');

jest.mock('../../../services/backendDiscovery');

// Mock the exact path used by the component for propOllamaService

// [DEBUG] Top of test file
console.log('[DEBUG] Top of PropOllama.test.tsx');
import { propOllamaService } from '../../../services/propOllamaService';
console.log('[DEBUG] Imported propOllamaService in test:', propOllamaService);

// Mock matchMedia and scrollIntoView for jsdom and framer-motion requirements
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
Object.defineProperty(HTMLDivElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

// Assign matchMedia after function definition
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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { _AppProvider } from '../../../contexts/AppContext';
import { _AuthProvider } from '../../../contexts/AuthContext';
import { _ThemeProvider } from '../../../contexts/ThemeContext';
import PropOllama from '../PropOllama';

const CompositeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    <_AuthProvider>
      <MemoryRouter>
        <_ThemeProvider>
          <_AppProvider>{children}</_AppProvider>
        </_ThemeProvider>
      </MemoryRouter>
    </_AuthProvider>
  </QueryClientProvider>
);

// Mock fetch for all PropOllama endpoints
// Helper to match both relative and absolute URLs for PropOllama endpoints
const isPropOllamaEndpoint = (url: string, endpoint: string) => {
  // Accepts /api/propollama/endpoint and http://localhost:8000/api/propollama/endpoint (and 8001)
  return (
    url.endsWith(`/api/propollama/${endpoint}`) ||
    url === `/api/propollama/${endpoint}` ||
    url === `http://localhost:8000/api/propollama/${endpoint}` ||
    url === `http://localhost:8001/api/propollama/${endpoint}`
  );
};

afterEach(() => {
  jest.resetAllMocks();
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
  // Wait for the model dropdown to be populated
  await waitFor(() => {
    const modelSelect = screen.getByLabelText(/model:/i) as HTMLSelectElement;
    expect(modelSelect.options.length).toBeGreaterThan(0);
  });
  const _input = screen.getByLabelText(/type your message/i) as HTMLInputElement;
  fireEvent.change(_input, { target: { value: 'hello' } });
  fireEvent.submit(_input.form!);
  // Use getAllByText and filter for the actual AI message
  await waitFor(() => {
    const aiResponses = screen.getAllByText(
      (content, node) => typeof content === 'string' && content.includes('AI response'),
      { exact: false }
    );
    // Find the one that is inside a message bubble (has a parent with role="listitem" and aria-label="AI message")
    const aiMessage = aiResponses.find(node => {
      let el = node.parentElement;
      while (el) {
        if (el.getAttribute && el.getAttribute('aria-label') === 'AI message') {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    });
    expect(aiMessage).toBeInTheDocument();
  });
});
