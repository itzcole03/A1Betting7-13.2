import React from 'react';
import { render, screen } from '@testing-library/react';
import { PositiveEVFeedPanel } from '../components/ev/PositiveEVFeedPanel';
import { EVOpportunity, SportType, MarketType, EVTier } from '../types/ev-types';

function makeItem(overrides: Partial<EVOpportunity> = {}): EVOpportunity {
  return {
    id: 'x1',
    player: 'Test Player',
    market: 'Points Over 20.5',
    sport: SportType.NBA,
    market_type: MarketType.PLAYER_PROPS,
    our_fair_odds: -110,
    market_odds: -105,
    ev_percent: 3.25,
    source_book: 'BookA',
    game_info: 'A @ B',
    updated_at: new Date().toISOString(),
    ev_tier: EVTier.MEDIUM,
    implied_probability: 0.5,
    fair_implied_probability: 0.48,
    edgeTier: 'strong',
    // optional fields not strictly needed for this test
    ...overrides,
  } as EVOpportunity;
}

describe('PositiveEVFeedPanel edgeTier mapping', () => {
  it('renders edgeTier label and percentage', () => {
    const item = makeItem();
    render(<PositiveEVFeedPanel items={[item]} />);
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText(/3\.25%/)).toBeInTheDocument();
    expect(screen.getByText('strong')).toBeInTheDocument();
  });

  it('falls back to micro when edgeTier missing', () => {
    const item = makeItem({ edgeTier: undefined });
    render(<PositiveEVFeedPanel items={[item]} />);
    expect(screen.getByText('micro')).toBeInTheDocument();
  });
});
