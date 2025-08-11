// Comprehensive Dashboard Component Tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../tests/utils/testUtils';
import { TestDataFactory, TestHelpers } from '../../../tests/utils/testUtils';
import Dashboard from '../../../frontend/src/pages/Dashboard';

// Mock the services
jest.mock('../../../frontend/src/services/unified/analyticsService', () => ({
  getAnalytics: jest.fn(() => Promise.resolve({
    totalPredictions: 150,
    accuracyRate: 87.5,
    profitLoss: 1250.75,
    winRate: 72.3,
  })),
  getRecentPredictions: jest.fn(() => Promise.resolve(
    TestDataFactory.createMockPredictions(5)
  )),
}));

jest.mock('../../../frontend/src/services/unified/dataService', () => ({
  getUpcomingGames: jest.fn(() => Promise.resolve(
    TestDataFactory.createMockGames(3)
  )),
  getPlayerStats: jest.fn(() => Promise.resolve(
    TestDataFactory.createMockPlayers(5)
  )),
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dashboard with loading state initially', () => {
      render(<Dashboard />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render main dashboard sections after data loads', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Check for key dashboard sections
      expect(screen.getByText(/analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/predictions/i)).toBeInTheDocument();
      expect(screen.getByText(/upcoming games/i)).toBeInTheDocument();
    });

    it('should display analytics data correctly', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('87.5%')).toBeInTheDocument(); // Accuracy rate
        expect(screen.getByText('$1,250.75')).toBeInTheDocument(); // Profit/Loss
        expect(screen.getByText('150')).toBeInTheDocument(); // Total predictions
        expect(screen.getByText('72.3%')).toBeInTheDocument(); // Win rate
      });
    });
  });

  describe('Interactions', () => {
    it('should handle refresh button click', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      // Should show loading state briefly
      await waitFor(() => {
        expect(screen.getByText(/refreshing/i)).toBeInTheDocument();
      });
    });

    it('should handle filter changes', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      const sportFilter = screen.getByLabelText(/sport/i);
      fireEvent.change(sportFilter, { target: { value: 'NBA' } });

      await waitFor(() => {
        expect(sportFilter).toHaveValue('NBA');
      });
    });

    it('should handle date range selection', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/date range/i);
      fireEvent.change(dateInput, { target: { value: '2025-01-01' } });

      await waitFor(() => {
        expect(dateInput).toHaveValue('2025-01-01');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when analytics service fails', async () => {
      const analyticsService = require('../../../frontend/src/services/unified/analyticsService');
      analyticsService.getAnalytics.mockRejectedValue(new Error('Service unavailable'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error loading analytics/i)).toBeInTheDocument();
      });
    });

    it('should display error message when data service fails', async () => {
      const dataService = require('../../../frontend/src/services/unified/dataService');
      dataService.getUpcomingGames.mockRejectedValue(new Error('Network error'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error loading games/i)).toBeInTheDocument();
      });
    });

    it('should provide retry functionality on error', async () => {
      const analyticsService = require('../../../frontend/src/services/unified/analyticsService');
      analyticsService.getAnalytics
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValueOnce({
          totalPredictions: 150,
          accuracyRate: 87.5,
          profitLoss: 1250.75,
          winRate: 72.3,
        });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error loading analytics/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('87.5%')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should render within acceptable time limits', async () => {
      const start = performance.now();
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
      
      const end = performance.now();
      expect(end - start).toBeLessThan(2000); // Should render within 2 seconds
    });

    it('should handle rapid state updates without errors', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      // Rapidly click refresh multiple times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(refreshButton);
      }

      // Should not crash or show errors
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Dashboard');
      expect(screen.getByRole('button', { name: /refresh/i })).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      refreshButton.focus();
      
      expect(refreshButton).toHaveFocus();

      fireEvent.keyDown(refreshButton, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText(/refreshing/i)).toBeInTheDocument();
      });
    });

    it('should have proper heading structure', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveTextContent(/dashboard/i);
      expect(headings[0]).toHaveAttribute('aria-level', '1');
    });
  });

  describe('Data Validation', () => {
    it('should handle empty analytics data gracefully', async () => {
      const analyticsService = require('../../../frontend/src/services/unified/analyticsService');
      analyticsService.getAnalytics.mockResolvedValue({});

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid data formats', async () => {
      const analyticsService = require('../../../frontend/src/services/unified/analyticsService');
      analyticsService.getAnalytics.mockResolvedValue({
        totalPredictions: 'invalid',
        accuracyRate: null,
        profitLoss: undefined,
        winRate: NaN,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/data format error/i)).toBeInTheDocument();
      });
    });

    it('should validate prediction data structure', async () => {
      const analyticsService = require('../../../frontend/src/services/unified/analyticsService');
      analyticsService.getRecentPredictions.mockResolvedValue([
        { id: 1 }, // Missing required fields
        { playerId: 2 }, // Missing required fields
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/invalid prediction data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update data when WebSocket message received', async () => {
      const mockWebSocket = TestHelpers.createMockWebSocket();
      (global as any).WebSocket = jest.fn(() => mockWebSocket);

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Simulate WebSocket message
      mockWebSocket.triggerEvent('message', {
        type: 'analytics_update',
        data: {
          totalPredictions: 175,
          accuracyRate: 89.2,
          profitLoss: 1450.25,
          winRate: 74.8,
        },
      });

      await waitFor(() => {
        expect(screen.getByText('89.2%')).toBeInTheDocument();
        expect(screen.getByText('$1,450.25')).toBeInTheDocument();
        expect(screen.getByText('175')).toBeInTheDocument();
        expect(screen.getByText('74.8%')).toBeInTheDocument();
      });
    });

    it('should handle WebSocket connection errors', async () => {
      const mockWebSocket = TestHelpers.createMockWebSocket();
      (global as any).WebSocket = jest.fn(() => mockWebSocket);

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Simulate WebSocket error
      mockWebSocket.triggerEvent('error', { message: 'Connection failed' });

      await waitFor(() => {
        expect(screen.getByText(/real-time updates unavailable/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should render mobile layout on small screens', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      const dashboardContainer = screen.getByTestId('dashboard-container');
      expect(dashboardContainer).toHaveClass('mobile-layout');
    });

    it('should handle touch gestures on mobile', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      const dashboardContainer = screen.getByTestId('dashboard-container');
      
      fireEvent.touchStart(dashboardContainer, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchMove(dashboardContainer, {
        touches: [{ clientX: 150, clientY: 100 }],
      });
      
      fireEvent.touchEnd(dashboardContainer);

      // Should handle swipe gesture without errors
      expect(dashboardContainer).toBeInTheDocument();
    });
  });
});
