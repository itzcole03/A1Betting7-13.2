import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import UnifiedBettingInterface from '../components/betting/UnifiedBettingInterface';

type UnifiedBettingProps = React.ComponentProps<typeof UnifiedBettingInterface>;
type BettingOpportunity = Parameters<NonNullable<UnifiedBettingProps['addToBetSlip']>>[0];

type BetSlipItem = {
  opportunityId: string;
  opportunity: BettingOpportunity;
  id: string;
};

const baseOpportunities: BettingOpportunity[] = [
  {
    id: 'opp-1',
    sport: 'MLB',
    market: 'Home Runs',
    selection: 'Shohei Ohtani Over 1.5',
    odds: 2.1,
    edge: 5.2,
    confidence: 92,
    recommended_stake: 100,
    max_stake: 200,
    expected_value: 42.5,
    bookmaker: 'DraftKings',
    game_time: '2025-07-29T20:00:00Z',
    edgeColor: 'bg-green-100 text-green-700',
    confidenceColor: 'bg-blue-100 text-blue-700',
  } as BettingOpportunity,
  {
    id: 'opp-2',
    sport: 'MLB',
    market: 'RBIs',
    selection: 'Aaron Judge Over 2.5',
    odds: 1.8,
    edge: 4.1,
    confidence: 88,
    recommended_stake: 80,
    max_stake: 150,
    expected_value: 28,
    bookmaker: 'FanDuel',
    game_time: '2025-07-29T20:00:00Z',
    edgeColor: 'bg-green-100 text-green-700',
    confidenceColor: 'bg-blue-100 text-blue-700',
  } as BettingOpportunity,
];

type WrappedRenderResult = ReturnType<typeof render> & { placeBetMock: jest.Mock };

const renderInterface = (
  overrideProps: Partial<UnifiedBettingProps> = {}
): WrappedRenderResult => {
  const placeBetMock = jest.fn();

  const Wrapper: React.FC = () => {
    const [betSlip, setBetSlip] = React.useState<BetSlipItem[]>([]);
    const [entryAmount, setEntryAmount] = React.useState<number>(200);
    const [activeTab, setActiveTab] = React.useState<string>('opportunities');

    const addToBetSlip =
      overrideProps.addToBetSlip ??
      ((opportunity: BettingOpportunity) => {
        setBetSlip(prev =>
          prev.some(item => (item.opportunityId ?? item.id) === opportunity.id)
            ? prev
            : [
                ...prev,
                {
                  opportunityId: opportunity.id,
                  opportunity,
                  id: opportunity.id,
                },
              ]
        );
      });

    const removeFromBetSlip =
      overrideProps.removeFromBetSlip ??
      ((id: string) => {
        setBetSlip(prev => prev.filter(item => (item.opportunityId ?? item.id) !== id));
      });

    const handleClearSlip = overrideProps.handleClearSlip ?? (() => setBetSlip([]));
    const handlePlaceBet = overrideProps.handlePlaceBet ?? placeBetMock;

    return (
      <UnifiedBettingInterface
        filteredOpportunities={overrideProps.filteredOpportunities ?? baseOpportunities}
        betSlip={betSlip}
        entryAmount={entryAmount}
        addToBetSlip={addToBetSlip}
        removeFromBetSlip={removeFromBetSlip}
        setEntryAmount={overrideProps.setEntryAmount ?? setEntryAmount}
        handleClearSlip={handleClearSlip}
        handlePlaceBet={handlePlaceBet}
        filters={overrideProps.filters ?? {}}
        setFilters={overrideProps.setFilters ?? (() => undefined)}
        activeTab={overrideProps.activeTab ?? activeTab}
        setActiveTab={overrideProps.setActiveTab ?? setActiveTab}
        loading={overrideProps.loading ?? false}
        error={overrideProps.error ?? null}
        onRetry={overrideProps.onRetry ?? (() => undefined)}
      />
    );
  };

  return { ...render(<Wrapper />), placeBetMock };
};

describe('UnifiedBettingInterface - Bet Slip interactions', () => {
  it('allows adding and removing opportunities from the bet slip', () => {
    renderInterface();
    const addButtons = screen.getAllByRole('button', { name: /Add to Bet Slip/i });
    expect(addButtons).toHaveLength(2);

  fireEvent.click(addButtons[0]);

  fireEvent.click(screen.getByRole('button', { name: /^Bet Slip/i }));
  expect(screen.getByTestId('bet-slip-container')).toBeInTheDocument();
  expect(screen.getByText(/Shohei Ohtani/)).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /Remove/i });
    fireEvent.click(removeButton);
    expect(screen.queryByText(/Shohei Ohtani/)).not.toBeInTheDocument();
  });

  it('invokes handlePlaceBet when Place Bet is clicked', () => {
    const { placeBetMock } = renderInterface();
    const addButtons = screen.getAllByRole('button', { name: /Add to Bet Slip/i });
    fireEvent.click(addButtons[0]);

  fireEvent.click(screen.getByRole('button', { name: /^Bet Slip/i }));

  const placeBetButton = screen.getByRole('button', { name: /Place Bet/i });
    fireEvent.click(placeBetButton);
    expect(placeBetMock).toHaveBeenCalled();
  });

  it('displays error banner when error prop is provided', () => {
    const errorMessage = 'Failed to fetch bets';
    renderInterface({ error: { message: errorMessage }, filteredOpportunities: [] });

    expect(screen.getByTestId('error-banner')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
