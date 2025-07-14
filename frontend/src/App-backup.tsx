import { motion } from 'framer-motion';
import { Brain, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PrizePicksData {
  id: number;
  player_name: string;
  stat_type: string;
  line_score: number;
  team: string;
  league: string;
  sport: string;
  confidence: number;
  recommendation: string;
  expected_value: number;
  kelly_fraction: number;
  opponent: string;
  venue: string;
}

interface SelectedProp {
  propId: number;
  choice: 'over' | 'under';
}

export default function App() {
  const [prizePicksData, setPrizePicksData] = useState<PrizePicksData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProps, setSelectedProps] = useState<Map<string, SelectedProp>>(new Map());
  const [entryAmount] = useState(25);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/prizepicks/props');

      if (response.ok) {
        const result = await response.json();
        console.log('🎯 Real PrizePicks Data:', result); // For debugging

        if (Array.isArray(result)) {
          setPrizePicksData(result.slice(0, 12));
        } else {
          setPrizePicksData([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectProp = (propId: number, choice: 'over' | 'under') => {
    const key = `${propId}_${choice}`;
    const newProps = new Map(selectedProps);

    if (selectedProps.has(key)) {
      newProps.delete(key);
    } else if (selectedProps.size < 6) {
      const existingKey = `${propId}_${choice === 'over' ? 'under' : 'over'}`;
      if (newProps.has(existingKey)) {
        newProps.delete(existingKey);
      }
      newProps.set(key, { propId, choice });
    }

    setSelectedProps(newProps);
  };

  const calculatePayout = () => {
    const count = selectedProps.size;
    const multipliers: Record<number, number> = { 2: 3, 3: 5, 4: 10, 5: 20, 6: 50 };
    return count >= 2 ? entryAmount * (multipliers[count] || 0) * 1.5 : 0;
  };

  if (loading) {
    return (
      <motion.div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              width: '48px',
              height: '48px',
              border: '3px solid transparent',
              borderTop: '3px solid #06b6d4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px',
            }}
          ></div>
          <div style={{ fontSize: '1.25rem', color: '#06b6d4', fontWeight: 'bold' }}>
            Loading PrizePicks Pro...
          </div>
          <div style={{ color: '#94a3b8', marginTop: '8px' }}>Fetching real player data</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '24px',
        color: 'white',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <motion.h1
          style={{
            fontSize: '3rem',
            fontWeight: '900',
            background: 'linear-gradient(45deg, #06b6d4, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          PrizePicks Pro
        </motion.h1>
        <motion.p
          style={{
            fontSize: '1.25rem',
            color: '#94a3b8',
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          AI-Enhanced Props Analysis • Real Data Integration
        </motion.p>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#ef4444',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Props Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {prizePicksData.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '48px 0',
            }}
          >
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <Brain
                style={{
                  width: '64px',
                  height: '64px',
                  color: '#06b6d4',
                  margin: '0 auto 16px',
                  animation: 'pulse 2s infinite',
                }}
              />
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                }}
              >
                PrizePicks Analysis Engine Ready
              </h3>
              <p
                style={{
                  color: '#94a3b8',
                  marginBottom: '16px',
                }}
              >
                Waiting for live PrizePicks projections to analyze using our advanced prediction
                models.
              </p>
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'left',
                }}
              >
                <h4
                  style={{
                    color: '#06b6d4',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  Analysis Features:
                </h4>
                <ul
                  style={{
                    fontSize: '0.875rem',
                    color: '#d1d5db',
                    listStyle: 'none',
                    padding: 0,
                  }}
                >
                  <li>• Real PrizePicks API integration</li>
                  <li>• Multi-factor confidence scoring</li>
                  <li>• AI-enhanced prop reasoning</li>
                  <li>• Live game correlation analysis</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          prizePicksData.map(prop => {
            const overKey = `${prop.id}_over`;
            const underKey = `${prop.id}_under`;
            const isOverSelected = selectedProps.has(overKey);
            const isUnderSelected = selectedProps.has(underKey);
            const trend = prop.recommendation === 'OVER' ? 'up' : 'down';

            return (
              <motion.div
                key={prop.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(107, 114, 128, 0.5)',
                  transition: 'all 0.2s',
                }}
                whileHover={{ scale: 1.02 }}
                layout
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        marginBottom: '4px',
                      }}
                    >
                      {prop.player_name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: '#94a3b8',
                        fontFamily: 'monospace',
                      }}
                    >
                      {prop.team} • vs {prop.opponent}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {trend === 'up' ? (
                      <TrendingUp style={{ width: '20px', height: '20px', color: '#22c55e' }} />
                    ) : (
                      <TrendingDown style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                    )}
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: '#a855f7',
                        fontFamily: 'monospace',
                      }}
                    >
                      {prop.sport}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.125rem',
                      color: '#94a3b8',
                      fontFamily: 'monospace',
                    }}
                  >
                    {prop.stat_type}
                  </div>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#06b6d4',
                      fontFamily: 'monospace',
                    }}
                  >
                    {prop.line_score}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <motion.button
                    onClick={() => selectProp(prop.id, 'over')}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      border: '2px solid',
                      background: isOverSelected
                        ? 'rgba(34, 197, 94, 0.3)'
                        : 'rgba(30, 41, 59, 0.5)',
                      borderColor: isOverSelected ? '#22c55e' : '#4b5563',
                      color: isOverSelected ? '#86efac' : '#d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div style={{ fontSize: '1.125rem' }}>OVER</div>
                    <div style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      {prop.line_score}
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={() => selectProp(prop.id, 'under')}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      border: '2px solid',
                      background: isUnderSelected
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'rgba(30, 41, 59, 0.5)',
                      borderColor: isUnderSelected ? '#ef4444' : '#4b5563',
                      color: isUnderSelected ? '#fca5a5' : '#d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div style={{ fontSize: '1.125rem' }}>UNDER</div>
                    <div style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      {prop.line_score}
                    </div>
                  </motion.button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(30, 41, 59, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Brain style={{ width: '16px', height: '16px', color: '#a855f7' }} />
                      <span
                        style={{
                          fontSize: '0.875rem',
                          color: '#a855f7',
                          fontFamily: 'monospace',
                        }}
                      >
                        Confidence
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        color: '#06b6d4',
                        fontFamily: 'monospace',
                      }}
                    >
                      {prop.confidence || 75}%
                    </div>
                  </div>

                  {prop.expected_value && (
                    <div
                      style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        <Zap style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#06b6d4',
                            fontFamily: 'monospace',
                          }}
                        >
                          AI Analysis
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#d1d5db',
                          lineHeight: '1.5',
                          margin: 0,
                        }}
                      >
                        Recommendation: {prop.recommendation} • Expected Value:{' '}
                        {(prop.expected_value * 100).toFixed(1)}%
                        {prop.kelly_fraction && ` • Kelly: ${prop.kelly_fraction.toFixed(3)}`}
                      </p>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>League:</span>
                    <span style={{ color: '#06b6d4', fontFamily: 'monospace' }}>{prop.league}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Entry Summary */}
      {selectedProps.size > 0 && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            maxWidth: '320px',
          }}
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                margin: 0,
              }}
            >
              Entry Summary
            </h3>
            <div
              style={{
                color: '#06b6d4',
                fontFamily: 'monospace',
              }}
            >
              {selectedProps.size}/6
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Entry:</span>
              <span style={{ fontFamily: 'monospace' }}>${entryAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Payout:</span>
              <span style={{ color: '#06b6d4', fontFamily: 'monospace' }}>
                ${calculatePayout().toFixed(2)}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                color: '#a855f7',
              }}
            >
              {selectedProps.size >= 2
                ? `${selectedProps.size} picks selected`
                : `Select ${2 - selectedProps.size} more`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button
              onClick={() => setSelectedProps(new Map())}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear
            </motion.button>
            <motion.button
              onClick={() => alert('Lineup saved! (Demo mode)')}
              disabled={selectedProps.size < 2}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: selectedProps.size >= 2 ? '#06b6d4' : '#4b5563',
                color: selectedProps.size >= 2 ? 'black' : '#9ca3af',
                border: 'none',
                borderRadius: '8px',
                cursor: selectedProps.size >= 2 ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
              whileHover={{ scale: selectedProps.size >= 2 ? 1.05 : 1 }}
              whileTap={{ scale: selectedProps.size >= 2 ? 0.95 : 1 }}
            >
              Save
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: '80px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(107, 114, 128, 0.5)',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '0.875rem',
        }}
      >
        <div>
          PrizePicks Pro • Powered by Real API Data • Last updated: {new Date().toLocaleString()}
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </motion.div>
  );
}
