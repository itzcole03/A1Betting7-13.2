import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PropOllamaUnified from '../../components/PropOllamaUnified';
import { PropAnalysisAggregator } from '../../services/PropAnalysisAggregator';
import { AnalysisCacheService } from '../../services/AnalysisCacheService';
import { PropOllamaError, PropOllamaErrorType } from '../../types/errors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Mock PropAnalysisAggregator
jest.mock('../../services/PropAnalysisAggregator');

// Mock AnalysisCacheService
jest.mock('../../services/AnalysisCacheService');

// Mock contexts
jest.mock('../../contexts/AppContext', () => ({
  _AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAppContext: () => ({
    state: { theme: 'dark' },
    dispatch: jest.fn(),
  }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  _AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuthContext: () => ({
    isAuthenticated: true,
    user: { id: 'test-user' },
  }),
}));

jest.mock('../../contexts/ThemeContext', () => ({
  _ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useThemeContext: () => ({
    theme: 'dark',
    toggleTheme: jest.fn(),
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </QueryClientProvider>
);

describe('PropOllamaUnified E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock PropAnalysisAggregator.prototype.getAnalysis
    (PropAnalysisAggregator.prototype.getAnalysis as jest.Mock).mockResolvedValue({
      overAnalysis: 'Over analysis content',
      underAnalysis: 'Under analysis content',
      confidenceOver: 85,
      confidenceUnder: 15,
      keyFactorsOver: ['Over Factor 1', 'Over Factor 2'],
      keyFactorsUnder: ['Under Factor 1', 'Under Factor 2'],
      dataQuality: 0.8,
      generationTime: 1500,
      modelUsed: 'llama2',
    });
    
    // Mock AnalysisCacheService.getInstance
    (AnalysisCacheService.getInstance as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      has: jest.fn().mockReturnValue(false),
      delete: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        hits: 0,
        misses: 0,
        stale: 0,
        evictions: 0,
      }),
    });
    
    // Mock AnalysisCacheService.generateCacheKey
    (AnalysisCacheService.generateCacheKey as jest.Mock).mockReturnValue('cache-key-123');
  });
  
  test('renders the component', () => {
    render(
      <TestWrapper>
        <PropOllamaUnified />
      </TestWrapper>
    );
    
    expect(screen.getByText('PropOllama')).toBeInTheDocument();
    expect(screen.getByText('Elite Sports Analyst AI - Ensemble Betting Insights')).toBeInTheDocument();
  });
  
  test('expands prop row and loads analysis', async () => {
    render(
      <TestWrapper>
        <PropOllamaUnified />
      </TestWrapper>
    );
    
    // Find and click the prop row
    const propRow = screen.getByText('LeBron James');
    fireEvent.click(propRow);
    
    // Wait for analysis to load
    await waitFor(() => {
      expect(screen.getByText('Over Analysis')).toBeInTheDocument();
      expect(screen.getByText('Under Analysis')).toBeInTheDocument();
    });
    
    // Verify analysis content
    expect(screen.getByText('Over analysis content')).toBeInTheDocument();
    expect(screen.getByText('Under analysis content')).toBeInTheDocument();
  });
  
  test('shows loading state while fetching analysis', async () => {
    // Mock slow response
    (PropAnalysisAggregator.prototype.getAnalysis as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        overAnalysis: 'Over analysis content',
        underAnalysis: 'Under analysis content',
        confidenceOver: 85,
        confidenceUnder: 15,
        keyFactorsOver: ['Over Factor 1', 'Over Factor 2'],
        keyFactorsUnder: ['Under Factor 1', 'Under Factor 2'],
        dataQuality: 0.8,
        generationTime: 1500,
        modelUsed: 'llama2',
      }), 100))
    );
    
    render(
      <TestWrapper>
        <PropOllamaUnified />
      </TestWrapper>
    );
    
    // Find and click the prop row
    const propRow = screen.getByText('LeBron James');
    fireEvent.click(propRow);
    
    // Verify loading state
    expect(screen.getByText('Loading AI analysis...')).toBeInTheDocument();
    
    // Wait for analysis to load
    await waitFor(() => {
      expect(screen.getByText('Over Analysis')).toBeInTheDocument();
    });
  });
  
  test('handles error when fetching analysis', async () => {
    // Mock error response
    (PropAnalysisAggregator.prototype.getAnalysis as jest.Mock).mockRejectedValue(
      PropOllamaError.networkError('Network error')
    );
    
    render(
      <TestWrapper>
        <PropOllamaUnified />
      </TestWrapper>
    );
    
    // Find and click the prop row
    const propRow = screen.getByText('LeBron James');
    fireEvent.click(propRow);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
    
    // Verify retry button is present
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
  
  test('shows fallback content when LLM is unavailable', async () => {
    // Mock fallback response
    (PropAnalysisAggregator.prototype.getAnalysis as jest.Mock).mockResolvedValue({
      overAnalysis: 'Fallback over analysis',
      underAnalysis: 'Fallback under analysis',
      confidenceOver: 75,
      confidenceUnder: 25,
      keyFactorsOver: ['Fallback Factor 1', 'Fallback Factor 2'],
      keyFactorsUnder: ['Fallback Factor 3', 'Fallback Factor 4'],
      dataQuality: 0.5,
      generationTime: 0,
      modelUsed: 'Fallback Generator',
      isFallback: true,
      error: PropOllamaError.llmUnavailableError('LLM service is unavailable'),
    });
    
    render(
      <TestWrapper>
        <PropOllamaUnified />
      </TestWrapper>
    );
    
    // Find and click the prop row
    const propRow = screen.getByText('LeBron James');
    fireEvent.click(propRow);
    
    // Wait for fallback content to be displayed
    await waitFor(() => {
      expect(screen.getByText('Using Fallback Content')).toBeInTheDocument();
    });
    
    // Verify fallback content
    expect(screen.getByText('Fallback over analysis')).toBeInTheDocument();
    expect(screen.getByText('Fallback under analysis')).toBeInTheDocument();
    
    // Verify try again button is present
    expect(screen.getByText('Try AI Analysis Again')).toBeInTheDocument();
  });
  
  test('shows stale content when refreshing in background', async () => {
    // Mock stale response
    (PropAnalysisAggregator.prototype.getAnalysis as jest.Mock).mockResolvedValue({
      overAnalysis: 'Stale over analysis',
      underAnalysis: 'Stale under analysis',
      confidenceOver: 70,
      confidenceUnder: 30,
      keyFactorsOver: ['Stale Factor 1', 'Stale Factor 2'],
      keyFactorsUnder: ['Stale Factor 3', 'Stale Factor 4'],
      dataQuality: 0.7,
      generationTime: 1000,
      modelUsed: 'llama2',
      isStale: true,
      timestamp: '2025-07-25T12:00:00Z',
    });
    
    render(
      <TestWrapper>
        <PropOllamaUnified />
      </TestWrapper>
    );
    
    // Find and click the prop row
    const propRow = screen.getByText('LeBron James');
    fireEvent.click(propRow);
    
    // Wait for stale content to be displayed
    await waitFor(() => {
      expect(screen.getByText('Showing Cached Analysis')).toBeInTheDocument();
    });
    
    // Verify stale content
    expect(screen.getByText('Stale over analysis')).toBeInTheDocument();
    expect(screen.getByText('Stale under analysis')).toBeInTheDocument();
    
    // Verify refresh button is present
    expect(screen.getByText('Refresh Now')).toBeInTheDocument();
  });
  
  test('collapses expanded row when clicked again', async () => {
    render(
      <TestWrapper>
        <PropOllamaUnified />
      </TestWrapper>
    );
    
    // Find and click the prop row to expand
    const propRow = screen.getByText('LeBron James');
    fireEvent.click(propRow);
    
    // Wait for analysis to load
    await waitFor(() => {
      expect(screen.getByText('Over Analysis')).toBeInTheDocument();
    });
    
    // Click again to collapse
    fireEvent.click(propRow);
    
    // Verify analysis is no longer visible
    await waitFor(() => {
      expect(screen.queryByText('Over Analysis')).not.toBeInTheDocument();
    });
  });
});