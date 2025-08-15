/**
 * Filters Component Tests - Phase 4.2 Frontend Tests
 * Test suite for filtering functionality components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock components and props
const mockProps = [
  {
    id: 'prop-1',
    sport: 'MLB',
    player_name: 'Mike Trout',
    prop_type: 'runs_scored',
    line: 1.5,
    over_odds: 1.85,
    under_odds: 1.95,
    confidence_score: 0.75,
    recommendation: 'over',
    team: 'LAA'
  },
  {
    id: 'prop-2', 
    sport: 'MLB',
    player_name: 'Aaron Judge',
    prop_type: 'hits',
    line: 1.5,
    over_odds: 2.10,
    under_odds: 1.75,
    confidence_score: 0.68,
    recommendation: 'under',
    team: 'NYY'
  },
  {
    id: 'prop-3',
    sport: 'NFL',
    player_name: 'Josh Allen',
    prop_type: 'passing_yards',
    line: 265.5,
    over_odds: 1.90,
    under_odds: 1.90,
    confidence_score: 0.82,
    recommendation: 'over',
    team: 'BUF'
  }
];

// Mock Filter Component (create a simple version for testing)
interface FilterProps {
  props: typeof mockProps;
  onFiltersChange: (filteredProps: typeof mockProps) => void;
  initialFilters?: {
    sport?: string;
    propType?: string;
    team?: string;
    confidenceMin?: number;
    recommendation?: string;
  };
}

const MockPropFilters: React.FC<FilterProps> = ({ 
  props, 
  onFiltersChange, 
  initialFilters = {} 
}) => {
  const [filters, setFilters] = React.useState(initialFilters);
  
  React.useEffect(() => {
    // Apply filters
    const filtered = props.filter(prop => {
      if (filters.sport && prop.sport !== filters.sport) return false;
      if (filters.propType && prop.prop_type !== filters.propType) return false;
      if (filters.team && prop.team !== filters.team) return false;
      if (filters.confidenceMin && prop.confidence_score < filters.confidenceMin) return false;
      if (filters.recommendation && prop.recommendation !== filters.recommendation) return false;
      return true;
    });
    
    onFiltersChange(filtered);
  }, [filters, props, onFiltersChange]);
  
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div data-testid="prop-filters">
      <select 
        data-testid="sport-filter"
        value={filters.sport || ''}
        onChange={(e) => handleFilterChange('sport', e.target.value || undefined)}
      >
        <option value="">All Sports</option>
        <option value="MLB">MLB</option>
        <option value="NFL">NFL</option>
      </select>
      
      <select
        data-testid="prop-type-filter"
        value={filters.propType || ''}
        onChange={(e) => handleFilterChange('propType', e.target.value || undefined)}
      >
        <option value="">All Prop Types</option>
        <option value="runs_scored">Runs Scored</option>
        <option value="hits">Hits</option>
        <option value="passing_yards">Passing Yards</option>
      </select>
      
      <select
        data-testid="team-filter"
        value={filters.team || ''}
        onChange={(e) => handleFilterChange('team', e.target.value || undefined)}
      >
        <option value="">All Teams</option>
        <option value="LAA">LAA</option>
        <option value="NYY">NYY</option>
        <option value="BUF">BUF</option>
      </select>
      
      <input
        type="range"
        data-testid="confidence-filter"
        min="0"
        max="1"
        step="0.01"
        value={filters.confidenceMin || 0}
        onChange={(e) => handleFilterChange('confidenceMin', parseFloat(e.target.value))}
      />
      <span data-testid="confidence-display">
        Min Confidence: {((filters.confidenceMin || 0) * 100).toFixed(0)}%
      </span>
      
      <select
        data-testid="recommendation-filter"
        value={filters.recommendation || ''}
        onChange={(e) => handleFilterChange('recommendation', e.target.value || undefined)}
      >
        <option value="">All Recommendations</option>
        <option value="over">Over</option>
        <option value="under">Under</option>
      </select>
      
      <button
        data-testid="clear-filters"
        onClick={() => setFilters({})}
      >
        Clear Filters
      </button>
    </div>
  );
};

describe('PropFilters Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnFiltersChange = jest.fn();
  
  beforeEach(() => {
    user = userEvent.setup();
    mockOnFiltersChange.mockClear();
  });
  
  it('renders all filter controls', () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    expect(screen.getByTestId('sport-filter')).toBeInTheDocument();
    expect(screen.getByTestId('prop-type-filter')).toBeInTheDocument();
    expect(screen.getByTestId('team-filter')).toBeInTheDocument();
    expect(screen.getByTestId('confidence-filter')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-filter')).toBeInTheDocument();
    expect(screen.getByTestId('clear-filters')).toBeInTheDocument();
  });
  
  it('filters props by sport correctly', async () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    const sportFilter = screen.getByTestId('sport-filter');
    await user.selectOptions(sportFilter, 'MLB');
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        mockProps.filter(prop => prop.sport === 'MLB')
      );
    });
  });
  
  it('filters props by prop type correctly', async () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    const propTypeFilter = screen.getByTestId('prop-type-filter');
    await user.selectOptions(propTypeFilter, 'hits');
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        mockProps.filter(prop => prop.prop_type === 'hits')
      );
    });
  });
  
  it('filters props by team correctly', async () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    const teamFilter = screen.getByTestId('team-filter');
    await user.selectOptions(teamFilter, 'NYY');
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        mockProps.filter(prop => prop.team === 'NYY')
      );
    });
  });
  
  it('filters props by confidence score correctly', async () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    const confidenceFilter = screen.getByTestId('confidence-filter');
    fireEvent.change(confidenceFilter, { target: { value: '0.7' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        mockProps.filter(prop => prop.confidence_score >= 0.7)
      );
    });
    
    // Check display updates
    expect(screen.getByTestId('confidence-display')).toHaveTextContent('Min Confidence: 70%');
  });
  
  it('filters props by recommendation correctly', async () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    const recommendationFilter = screen.getByTestId('recommendation-filter');
    await user.selectOptions(recommendationFilter, 'over');
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        mockProps.filter(prop => prop.recommendation === 'over')
      );
    });
  });
  
  it('applies multiple filters correctly', async () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    // Apply sport filter
    const sportFilter = screen.getByTestId('sport-filter');
    await user.selectOptions(sportFilter, 'MLB');
    
    // Apply recommendation filter
    const recommendationFilter = screen.getByTestId('recommendation-filter');
    await user.selectOptions(recommendationFilter, 'over');
    
    await waitFor(() => {
      const expectedFiltered = mockProps.filter(
        prop => prop.sport === 'MLB' && prop.recommendation === 'over'
      );
      expect(mockOnFiltersChange).toHaveBeenCalledWith(expectedFiltered);
    });
  });
  
  it('clears all filters when clear button is clicked', async () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange}
        initialFilters={{ sport: 'MLB', team: 'NYY' }}
      />
    );
    
    const clearButton = screen.getByTestId('clear-filters');
    await user.click(clearButton);
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(mockProps);
    });
    
    // Check that all filters are reset
    expect(screen.getByTestId('sport-filter')).toHaveValue('');
    expect(screen.getByTestId('team-filter')).toHaveValue('');
  });
  
  it('handles empty props array gracefully', () => {
    render(
      <MockPropFilters 
        props={[]} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith([]);
  });
  
  it('maintains filter state after prop updates', async () => {
    const { rerender } = render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    // Set a filter
    const sportFilter = screen.getByTestId('sport-filter');
    await user.selectOptions(sportFilter, 'MLB');
    
    // Update props
    const newProps = [...mockProps, {
      id: 'prop-4',
      sport: 'MLB',
      player_name: 'Shohei Ohtani',
      prop_type: 'home_runs',
      line: 0.5,
      over_odds: 2.50,
      under_odds: 1.50,
      confidence_score: 0.90,
      recommendation: 'over',
      team: 'LAA'
    }];
    
    rerender(
      <MockPropFilters 
        props={newProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    // Filter should still be applied
    await waitFor(() => {
      const expectedFiltered = newProps.filter(prop => prop.sport === 'MLB');
      expect(mockOnFiltersChange).toHaveBeenCalledWith(expectedFiltered);
    });
    
    expect(screen.getByTestId('sport-filter')).toHaveValue('MLB');
  });
  
  it('handles edge cases in confidence filtering', async () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    const confidenceFilter = screen.getByTestId('confidence-filter');
    
    // Test minimum value (0)
    fireEvent.change(confidenceFilter, { target: { value: '0' } });
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(mockProps); // All props should pass
    });
    
    // Test maximum value (1)
    fireEvent.change(confidenceFilter, { target: { value: '1' } });
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith([]); // No props have 1.0 confidence
    });
  });
  
  it('updates filter display correctly', async () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    const confidenceFilter = screen.getByTestId('confidence-filter');
    const confidenceDisplay = screen.getByTestId('confidence-display');
    
    fireEvent.change(confidenceFilter, { target: { value: '0.85' } });
    
    expect(confidenceDisplay).toHaveTextContent('Min Confidence: 85%');
  });
  
  it('calls onFiltersChange with initial props on mount', () => {
    render(
      <MockPropFilters 
        props={mockProps} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith(mockProps);
  });
});
