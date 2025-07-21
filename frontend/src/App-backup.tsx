import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

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

type SelectedProp = {
  propId: number;
  choice: 'over' | 'under';
};

const App: React.FC = () => {
  const [prizePicksData, setPrizePicksData] = useState<PrizePicksData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProps, setSelectedProps] = useState<Map<string, SelectedProp>>(new Map());
  const [entryAmount] = useState<number>(25);
  const selectProp = (id: number, choice: 'over' | 'under') => {};
  const isOverSelected: boolean = false;
  const isUnderSelected: boolean = false;
  const trend: string = 'up';
  const calculatePayout = (): number => entryAmount * 2;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
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
      setError('Failed to load data');
      setLoading(false);
    }
  }

  return (
    <motion.div>
      <div>
        {prizePicksData.map(prop => (
          <motion.div key={prop.id}>
            <div>{prop.player_name}</div>
            {/* ...rest of card UI... */}
          </motion.div>
        ))}
      </div>
      {/* Entry Summary */}
      {selectedProps.size > 0 && (
        <div>
          <span>Payout: ${calculatePayout().toFixed(2)}</span>
        </div>
      )}
      {/* Footer */}
      <footer>
        <div>
          PrizePicks Pro • Powered by Real API Data • Last updated: {new Date().toLocaleString()}
        </div>
      </footer>
      <style>{`
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
`}</style>
    </motion.div>
  );
};

export default App;
