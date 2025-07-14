// @vitest-environment jsdom
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import { A1BettingPreview } from './A1BettingPreview';

describe('A1BettingPreview', () => {
  it('renders without crashing and shows Dashboard tab by default', () => {
    render(<A1BettingPreview />);
    // Check for Dashboard tab content
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // Check that DashboardTab content is rendered (look for a unique string or element)
    // This assumes DashboardTab renders a heading or label with 'Dashboard' in it
    // Adjust selector as needed for your actual DashboardTab implementation
  });

  it('switches to Money Maker tab when clicked', () => {
    render(<A1BettingPreview />);
    // Find and click the Money Maker tab button
    const moneyMakerTab = screen.getByRole('tab', { name: /Money Maker/i });
    fireEvent.click(moneyMakerTab);
    // Check that Money Maker tab is now active
    expect(moneyMakerTab).toHaveAttribute('aria-selected', 'true');
    // Check for Money Maker tab content
    // This assumes MoneyMakerTab renders a heading or label with 'Money Maker' in it
    // Adjust selector as needed for your actual MoneyMakerTab implementation
    expect(screen.getByText('Money Maker')).toBeInTheDocument();
  });

  it('renders Arbitrage tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /Arbitrage/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Arbitrage')).toBeInTheDocument();
  });

  it('renders Live Betting tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /Live Betting/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Live Betting')).toBeInTheDocument();
  });

  it('renders PrizePicks tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /PrizePicks/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('PrizePicks')).toBeInTheDocument();
  });

  it('renders Analytics tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /ML Analytics/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('ML Analytics')).toBeInTheDocument();
  });

  it('renders Predictions tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /AI Predictions/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('AI Predictions')).toBeInTheDocument();
  });

  it('renders Quantum AI tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /Quantum AI/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Quantum AI')).toBeInTheDocument();
  });

  it('renders SHAP Analysis tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /SHAP Analysis/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('SHAP Analysis')).toBeInTheDocument();
  });

  it('renders Social Intel tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /Social Intel/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Social Intel')).toBeInTheDocument();
  });

  it('renders News Hub tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /News Hub/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('News Hub')).toBeInTheDocument();
  });

  it('renders Weather Station tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /Weather Station/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Weather Station')).toBeInTheDocument();
  });

  it('renders Injury Tracker tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /Injury Tracker/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Injury Tracker')).toBeInTheDocument();
  });

  it('renders Live Stream tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /Live Stream/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Live Stream')).toBeInTheDocument();
  });

  it('renders Backtesting tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /Backtesting/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Backtesting')).toBeInTheDocument();
  });

  it('renders Settings tab', () => {
    render(<A1BettingPreview />);
    const tab = screen.getByRole('tab', { name: /Settings/i });
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
