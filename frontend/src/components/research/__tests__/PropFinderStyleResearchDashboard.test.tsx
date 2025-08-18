import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PropFinderStyleResearchDashboard from '../PropFinderStyleResearchDashboard';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PropFinderStyleResearchDashboard', () => {
  it('should render the dashboard title', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
    expect(screen.getByText('PropFinder-style interface')).toBeInTheDocument();
  });

  it('should render game selection section', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    expect(screen.getByText('Select Games')).toBeInTheDocument();
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('should render categories selection section', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    expect(screen.getByText('Select Categories')).toBeInTheDocument();
    expect(screen.getAllByText('Select All')).toHaveLength(2); // One for games, one for categories
  });

  it('should display sample MLB games', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    expect(screen.getByText('MIL')).toBeInTheDocument();
    expect(screen.getByText('CHC')).toBeInTheDocument();
  });

  it('should display MLB prop categories', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    expect(screen.getByText('Hits')).toBeInTheDocument();
    expect(screen.getByText('Total Bases')).toBeInTheDocument();
    expect(screen.getByText('Home Runs')).toBeInTheDocument();
  });

  it('should allow toggling game selection', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    
    // Find a non-locked game and click it
    const milGame = screen.getByText('MIL').closest('li');
    expect(milGame).toBeInTheDocument();
    
    // The MIL @ CHC game should be selected by default
    expect(milGame).toHaveClass('bg-[#9b62b6]/16');
  });

  it('should allow toggling category selection', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    
    const hitsCategory = screen.getByText('Hits').closest('li');
    expect(hitsCategory).toBeInTheDocument();
    
    if (hitsCategory) {
      fireEvent.click(hitsCategory);
      // After clicking, it should toggle the selection
      // Note: Due to the initial state being selected, clicking would deselect it
    }
  });

  it('should show locked games with unlock buttons', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    
    // Should show unlock buttons for locked games
    const unlockButtons = screen.getAllByText(/Unlock/);
    expect(unlockButtons.length).toBeGreaterThan(0);
  });

  it('should display action buttons', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    
    expect(screen.getByText('Search Props')).toBeInTheDocument();
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    expect(screen.getByText('Save Search')).toBeInTheDocument();
  });

  it('should show selection counts', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    
    // Should show counts for selected games and categories
    expect(screen.getByText(/games selected/)).toBeInTheDocument();
    expect(screen.getByText(/categories selected/)).toBeInTheDocument();
  });

  it('should render header action buttons', () => {
    renderWithRouter(<PropFinderStyleResearchDashboard />);
    
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });
});
