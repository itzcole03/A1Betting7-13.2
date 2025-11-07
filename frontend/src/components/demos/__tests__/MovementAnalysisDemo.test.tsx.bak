import { render, screen, waitFor } from '@testing-library/react';
import { useOddsHistory } from '../../../hooks/useOddsHistory';
import { MovementAnalysisDemo } from '../MovementAnalysisDemo';

// Mock the hook
jest.mock('../../../hooks/useOddsHistory');
const mockUseOddsHistory = useOddsHistory as jest.MockedFunction<typeof useOddsHistory>;

describe('MovementAnalysisDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockUseOddsHistory.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
      totalSnapshots: 0,
      dateRange: null,
    });

    render(<MovementAnalysisDemo />);

    expect(screen.getByText('Loading odds history...')).toBeInTheDocument();
  });

  it('shows error state when API fails', () => {
    mockUseOddsHistory.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to fetch data',
      refetch: jest.fn(),
      totalSnapshots: 0,
      dateRange: null,
    });

    render(<MovementAnalysisDemo />);

    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
  });

  it('shows no data state when no snapshots available', () => {
    mockUseOddsHistory.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
      totalSnapshots: 0,
      dateRange: null,
    });

    render(<MovementAnalysisDemo />);

    expect(screen.getByText('No Data Available')).toBeInTheDocument();
  });

  it('renders MovementAnalysis component with data', async () => {
    const mockData = [
      {
        prop_id: 'test-prop-123',
        sportsbook: 'DraftKings',
        line: 25.5,
        over_odds: -110,
        under_odds: -110,
        captured_at: '2024-01-01T12:00:00Z',
      },
      {
        prop_id: 'test-prop-123',
        sportsbook: 'DraftKings',
        line: 25.5,
        over_odds: -105,
        under_odds: -115,
        captured_at: '2024-01-01T13:00:00Z',
      },
    ];

    mockUseOddsHistory.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: jest.fn(),
      totalSnapshots: 2,
      dateRange: {
        start: '2024-01-01T12:00:00Z',
        end: '2024-01-01T13:00:00Z',
      },
    });

    render(<MovementAnalysisDemo />);

    await waitFor(() => {
      expect(screen.getByText('Line Movement: sample-prop-123')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Snapshots:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('allows changing prop ID', () => {
    mockUseOddsHistory.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
      totalSnapshots: 0,
      dateRange: null,
    });

    render(<MovementAnalysisDemo />);

    const select = screen.getByDisplayValue('sample-prop-123');
    expect(select).toBeInTheDocument();
  });
});
