// Mock backend responses for E2E tests
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw-server';

export function setupBackendMocks() {
  // Mock health check endpoint
  server.use(
    http.get('http://localhost:8000/api/health/status', () => {
      return HttpResponse.json({ status: 'healthy' });
    }),
    http.get('http://localhost:8000/api/version', () => {
      return HttpResponse.json({ version: '1.0.0' });
    }),
    // Add other API endpoints as needed
    http.post('http://localhost:8000/api/unified/featured-props', () => {
      return HttpResponse.json({
        props: [
          {
            id: 'mlb-1',
            player: 'LeBron James',
            matchup: 'Yankees vs Red Sox',
            stat: 'Home Runs',
            line: 1.5,
            overOdds: 2.1,
            underOdds: 1.7,
            confidence: 92,
            sport: 'MLB',
            gameTime: '2025-07-29T20:00:00Z',
            pickType: 'Home Runs',
            position: 'RF',
            score: 92,
            summary: 'LeBron is on a hot streak with 7 HR in last 8 games.',
            analysis: "AI's Take: LeBron's matchup and recent form favor the OVER.",
            stats: [
              { label: '7/7', value: 1 },
              { label: '7/8', value: 0.6 },
            ],
            insights: [
              { icon: '🔥', text: 'Hot streak: 7 HR in 8 games' },
              { icon: '⚾', text: 'Favorable pitcher matchup' },
            ],
          },
        ],
      });
    })
  );
}
