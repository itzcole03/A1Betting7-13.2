import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PropOllamaContainer from '../components/containers/PropOllamaContainer';
import {
  usePropOllamaState,
  type PropOllamaActions,
  type PropOllamaState,
} from '../components/hooks/usePropOllamaState';
import type { PropDisplayOptions, SelectedProp } from '../components/shared/PropOllamaTypes';
import type { FeaturedProp } from '../services/unified/FeaturedPropsService';

jest.mock('../components/hooks/usePropOllamaState', () => ({
  usePropOllamaState: jest.fn(),
}));

jest.mock('../components/EnhancedErrorBoundary', () =>
  function MockEnhancedErrorBoundary({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }
);

jest.mock('../components/debug/DirectDataFetchTest', () => () => <div data-testid='direct-data-test' />);
jest.mock('../components/debug/FeaturedPropsServiceTest', () => () => (
  <div data-testid='featured-props-test' />
));
jest.mock('../components/debug/SimpleDirectAPITest', () => () => <div data-testid='simple-direct-test' />);
jest.mock('../components/debug/SimplePropOllamaDebugContainer', () => () => (
  <div data-testid='simple-prop-ollama-debug' />
));
jest.mock('../components/performance/PerformancePanel', () => ({
  PerformancePanel: () => <div data-testid='performance-panel' />,
}));
jest.mock('../components/filters/PropFilters', () => ({
  PropFilters: () => <div data-testid='prop-filters' />,
}));
jest.mock('../components/sorting/PropSorting', () => ({
  PropSorting: () => <div data-testid='prop-sorting' />,
}));
jest.mock('../components/stats/GameStatsPanel', () => ({
  GameStatsPanel: () => <div data-testid='game-stats-panel' />,
}));
jest.mock('../components/betting/BetSlipComponent', () => ({
  BetSlipComponent: ({ selectedProps = [] }: { selectedProps?: Array<unknown> }) => (
    <div data-testid='bet-slip-component'>Bet Slip ({selectedProps.length})</div>
  ),
}));
jest.mock('../components/LoadingOverlay', () => ({ isVisible }: { isVisible: boolean }) =>
  isVisible ? <div data-testid='loading-overlay'>Loading...</div> : null
);

jest.mock('../components/lists/PropList', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');

  function MockPropList({
    props = [],
    onExpandToggle = () => {},
    useVirtualization = false,
  }: {
    props?: Array<any>;
    onExpandToggle?: (id: string) => void;
    useVirtualization?: boolean;
  }) {
    const [expandedId, setExpandedId] = mockReact.useState<string | null>(null);

    const handleToggle = (id: string) => {
      setExpandedId(prev => (prev === id ? null : id));
      onExpandToggle(id);
    };

    if (props.length === 0) {
      return mockReact.createElement(
        'div',
        { 'data-testid': 'prop-list' },
        mockReact.createElement(
          'div',
          { 'data-testid': 'prop-list-empty' },
          'No props found'
        )
      );
    }

    const children = props.map((prop: any) => {
      const button = mockReact.createElement(
        'button',
        { type: 'button', onClick: () => handleToggle(prop.id) },
        prop.player
      );

      const expandedContent =
        expandedId === prop.id
          ? mockReact.createElement(
              'div',
              { 'data-testid': 'prop-card-expanded' },
              mockReact.createElement('p', null, `Stat: ${prop.stat}`)
            )
          : null;

      return mockReact.createElement(
        'div',
        { key: prop.id, 'data-testid': 'prop-card', onClick: () => handleToggle(prop.id) },
        button,
        expandedContent
      );
    });

    const virtualizationNode = useVirtualization
      ? [
          mockReact.createElement(
            'div',
            { key: 'virtualized', 'data-testid': 'virtualization-indicator' },
            'Showing props (virtualized for performance)'
          ),
        ]
      : [];

    return mockReact.createElement('div', { 'data-testid': 'prop-list' }, ...virtualizationNode, ...children);
  }

  return {
    __esModule: true,
    default: MockPropList,
    PropList: MockPropList,
  };
});

jest.mock('../services/HttpClient', () => ({
  httpFetch: jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ status: 'healthy' }),
    })
  ),
}));

const mockUsePropOllamaState = usePropOllamaState as jest.MockedFunction<
  typeof usePropOllamaState
>;

const createFeaturedProp = (overrides: Partial<FeaturedProp> = {}): FeaturedProp => ({
  id: 'prop-1',
  player: 'Shohei Ohtani',
  stat: 'Home Runs',
  line: 1.5,
  confidence: 92,
  matchup: 'LAA vs HOU',
  espnPlayerId: '123',
  overOdds: -110,
  underOdds: -105,
  sport: 'MLB',
  gameTime: '2025-07-29T20:00:00Z',
  pickType: 'player',
  ...overrides,
});

type MockOptions = {
  useVirtualization?: boolean;
  isLoading?: boolean;
  error?: string | null;
};

const setupMockState = (projections: FeaturedProp[], options: MockOptions = {}) => {
  mockUsePropOllamaState.mockImplementation(() => {
    const [expandedRowKey, setExpandedRowKey] = React.useState<string | null>(null);
    const [selectedProps, setSelectedProps] = React.useState<SelectedProp[]>([]);
    const [entryAmount, setEntryAmount] = React.useState<number>(100);

    const state: PropOllamaState = {
      connectionHealth: {
        isHealthy: !options.error,
        latency: 12,
        lastChecked: Date.now(),
      },
      projections,
      unifiedResponse: null,
      upcomingGames: [],
      selectedGame: null,
      filters: {
        selectedSport: 'MLB',
        propType: 'player' as const,
        selectedStatType: 'Popular',
        selectedDate: '',
        searchTerm: '',
        showUpcomingGames: false,
      },
      sorting: {
        sortBy: 'confidence',
        sortOrder: 'desc',
      },
      displayOptions: {
        visiblePropsCount: projections.length,
        useVirtualization: options.useVirtualization ?? false,
        expandedRowKey,
      },
      isLoading: options.isLoading ?? false,
      error: options.error ?? null,
      renderError: null,
      loadingStage: null,
      loadingMessage: '',
      enhancedAnalysisCache: {},
      loadingAnalysis: new Set<string>(),
      analyzingPropId: null,
      propAnalystResponses: {},
      selectedProps,
      entryAmount,
      initialLoadingComplete: true,
      clicksEnabled: true,
      propLoadingProgress: 100,
      sportActivationStatus: {},
      ensembleLoading: false,
      ensembleError: null,
      ensembleResult: null,
    };

    const actions: PropOllamaActions = {
      setConnectionHealth: jest.fn(),
      setProjections: jest.fn(),
      setUnifiedResponse: jest.fn(),
      setUpcomingGames: jest.fn(),
      setSelectedGame: jest.fn(),
      updateFilters: jest.fn(),
      updateSorting: jest.fn(),
      updateDisplayOptions: (next: Partial<PropDisplayOptions>) => {
        if (Object.prototype.hasOwnProperty.call(next, 'expandedRowKey')) {
          setExpandedRowKey(prev =>
            next.expandedRowKey === prev ? null : next.expandedRowKey ?? null
          );
        }
      },
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      setRenderError: jest.fn(),
      setLoadingStage: jest.fn(),
      setLoadingMessage: jest.fn(),
      updateEnhancedAnalysisCache: jest.fn(),
      setLoadingAnalysis: jest.fn(),
      setAnalyzingPropId: jest.fn(),
      updatePropAnalystResponse: jest.fn(),
      setSelectedProps: (props: SelectedProp[]) => setSelectedProps(props),
      addSelectedProp: (prop: SelectedProp) =>
        setSelectedProps(prev => (prev.find(p => p.id === prop.id) ? prev : [...prev, prop])),
      removeSelectedProp: (id: string) => setSelectedProps(prev => prev.filter(p => p.id !== id)),
      setEntryAmount: (amount: number) => setEntryAmount(amount),
      setInitialLoadingComplete: jest.fn(),
      setClicksEnabled: jest.fn(),
      setPropLoadingProgress: jest.fn(),
      updateSportActivationStatus: jest.fn(),
      setEnsembleLoading: jest.fn(),
      setEnsembleError: jest.fn(),
      setEnsembleResult: jest.fn(),
    };

    return [state, actions];
  });
};

const baseProps: FeaturedProp[] = [
  createFeaturedProp({ id: 'prop-1', player: 'Shohei Ohtani' }),
  createFeaturedProp({ id: 'prop-2', player: 'Aaron Judge', stat: 'RBIs' }),
];

const originalFetch = global.fetch;
const mockFetch = jest.fn(async (input: RequestInfo | URL) => {
  const normalizedInput =
    typeof input === 'string' && input.startsWith('/') ? `http://localhost${input}` : input;

  return {
    ok: true,
    status: 200,
    url: typeof normalizedInput === 'string' ? normalizedInput : normalizedInput.toString(),
    json: async () => ({ success: true, data: { props: [] }, error: null }),
  } as unknown as Response;
});

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  mockUsePropOllamaState.mockReset();
  mockFetch.mockClear();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('PropOllamaContainer - Prop Card Rendering', () => {
  it('renders prop cards with mock data', async () => {
    setupMockState(baseProps);
    render(<PropOllamaContainer />);

    const propCards = await screen.findAllByTestId('prop-card');
    expect(propCards.length).toBeGreaterThan(0);
    expect(within(propCards[0]).getByText(/Shohei Ohtani/)).toBeInTheDocument();
    expect(within(propCards[1]).getByText(/Aaron Judge/)).toBeInTheDocument();
  });

  it('expands and collapses prop card details', async () => {
    setupMockState(baseProps);
    render(<PropOllamaContainer />);

    const propCards = await screen.findAllByTestId('prop-card');
    fireEvent.click(propCards[0]);

    await waitFor(() => {
      expect(screen.getByTestId('prop-card-expanded')).toBeInTheDocument();
      expect(screen.getByText(/Stat: Home Runs/)).toBeInTheDocument();
    });

    fireEvent.click(propCards[0]);

    await waitFor(() => {
      expect(screen.queryByTestId('prop-card-expanded')).not.toBeInTheDocument();
    });
  });

  it('virtualizes prop list for large datasets', async () => {
    const largeProps = Array.from({ length: 150 }, (_, index) =>
      createFeaturedProp({
        id: `prop-${index + 1}`,
        player: `Player ${index + 1}`,
        stat: 'Hits',
        matchup: `Team${index + 1} vs Opponent${index + 1}`,
      })
    );

    setupMockState(largeProps, { useVirtualization: true });
    render(<PropOllamaContainer />);

    expect(await screen.findByText(/virtualized for performance/i)).toBeInTheDocument();
  });

  it('shows empty state when no props are available', async () => {
    setupMockState([], { error: 'Failed to fetch props' });
    render(<PropOllamaContainer />);

    expect(await screen.findByText(/No props found/)).toBeInTheDocument();
  });
});
