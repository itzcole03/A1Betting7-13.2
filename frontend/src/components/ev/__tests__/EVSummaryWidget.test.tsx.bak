import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EVSummaryWidget from '../EVSummaryWidget';

const mockResponse = {
  total: 10,
  edges_gt_2: 6,
  edges_gt_5: 2,
  avg_edge: 3.45,
  generated_at: new Date().toISOString()
};

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => mockResponse
}) as any;

describe('EVSummaryWidget', () => {
  it('renders summary data', async () => {
    render(<EVSummaryWidget refreshMs={999999} />);
    // Wait for loading skeleton to disappear
    await waitFor(() => expect(screen.queryByTestId('ev-summary-loading')).not.toBeInTheDocument());
    expect(screen.getByText('EV Summary')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText(String(mockResponse.total))).toBeInTheDocument();
  });
});
