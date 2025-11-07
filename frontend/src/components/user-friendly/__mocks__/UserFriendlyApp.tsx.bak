import React from 'react';
import { mockFeaturedProps } from '../../../__tests__/fixtures/mockFeaturedProps';
import { signalNavReady } from '../../../navigation/navReadySignal';

type Sport = 'NBA' | 'MLB';

type GlobalLike = typeof globalThis & {
  history?: History;
  location?: Location;
  addEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
};

const getInitialPath = () => {
  const loc = (globalThis as GlobalLike).location;
  return loc?.pathname ?? '/';
};

const MockUserFriendlyApp: React.FC = () => {
  const [navOpen, setNavOpen] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState(getInitialPath);
  const [sport, setSport] = React.useState<Sport>('NBA');

  React.useEffect(() => {
    signalNavReady();
  }, []);

  React.useEffect(() => {
    const win = globalThis as GlobalLike;
    const handlePopState = () => setCurrentPath(win.location?.pathname ?? '/');
    win.addEventListener?.('popstate', handlePopState);
    return () => win.removeEventListener?.('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    const win = globalThis as GlobalLike;
    win.history?.pushState?.(null, '', path);
    setCurrentPath(path);
    setNavOpen(false);
    signalNavReady();
  };

  if (
    (globalThis as { __MOCK_GET_ENHANCED_BETS_ERROR__?: boolean }).__MOCK_GET_ENHANCED_BETS_ERROR__
  ) {
    return (
      <div>
        <div data-testid='api-health-indicator'>Demo Mode</div>
        <div data-testid='error-banner'>Cannot connect to backend</div>
      </div>
    );
  }

  const storage = (globalThis as GlobalLike & { localStorage?: Storage }).localStorage;
  const userRaw = storage?.getItem('user');
  let hasAdminPrivileges = true;
  if (userRaw) {
    try {
      const parsed = JSON.parse(userRaw);
      hasAdminPrivileges = Array.isArray(parsed?.permissions)
        ? parsed.permissions.includes('admin')
        : parsed?.role === 'admin';
    } catch {
      hasAdminPrivileges = true;
    }
  }

  const propsForSport = mockFeaturedProps.filter(prop => prop.sport === sport);

  return (
    <div>
      <div data-testid='api-health-indicator'>API Online</div>
      <button
        type='button'
        aria-label='Open Navigation'
        title='Open Navigation'
        onClick={() => setNavOpen(true)}
      >
        Open Navigation
      </button>

      {navOpen && (
        <nav data-testid='primary-nav' role='navigation'>
          <div>Main</div>
          <button type='button' onClick={() => signalNavReady()}>
            Tools
          </button>
          <a
            href='/propfinder'
            onClick={event => {
              event.preventDefault();
              navigate('/propfinder');
            }}
          >
            PropFinder
          </a>
          <a
            href='/ev-feed'
            onClick={event => {
              event.preventDefault();
              navigate('/ev-feed');
            }}
          >
            +EV Feed
          </a>
          <a
            href='/smart-alerts'
            onClick={event => {
              event.preventDefault();
              navigate('/smart-alerts');
            }}
          >
            Smart Alerts
          </a>
        </nav>
      )}

      <div>
        <a
          aria-label='PropFinder Link'
          href='/propfinder'
          onClick={event => {
            event.preventDefault();
            navigate('/propfinder');
          }}
        >
          PropFinder
        </a>
        <a
          aria-label='Plus EV Feed Link'
          href='/ev-feed'
          onClick={event => {
            event.preventDefault();
            navigate('/ev-feed');
          }}
        >
          +EV Feed
        </a>
        <a
          aria-label='Arbitrage Link'
          href='/arbitrage'
          onClick={event => {
            event.preventDefault();
            navigate('/arbitrage');
          }}
        >
          Arbitrage
        </a>
        {hasAdminPrivileges && (
          <>
            <button type='button' aria-label='Admin'>
              Admin
            </button>
            <button type='button' aria-label='Switch to User'>
              Switch to User
            </button>
          </>
        )}
      </div>

      <div role='tablist'>
        <button role='tab' aria-selected={sport === 'NBA'} onClick={() => setSport('NBA')}>
          NBA
        </button>
        <button role='tab' aria-selected={sport === 'MLB'} onClick={() => setSport('MLB')}>
          MLB
        </button>
      </div>

      <h1>MLB AI Props</h1>
      <div>Bet Slip</div>

      <div>
        {propsForSport.map(prop => (
          <div key={prop.id} data-testid='prop-card'>
            <div>{prop.player}</div>
            <div>{prop.matchup}</div>
          </div>
        ))}
      </div>

      {currentPath.includes('/ev-feed') && <h1>+EV Feed</h1>}
      {currentPath.includes('/smart-alerts') && <div>Smart Alerts</div>}
      {currentPath.includes('/arbitrage') && (
        <div data-testid='arbitrage-opportunities-heading'>Arbitrage Opportunities</div>
      )}
    </div>
  );
};

export default MockUserFriendlyApp;
