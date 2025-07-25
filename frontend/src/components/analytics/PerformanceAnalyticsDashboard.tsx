import CircularProgress from '@mui/material/CircularProgress';
import React, { Suspense, lazy, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

const AnalyticsWidget = lazy(() => import('./AnalyticsWidget'));

// Example analytics data
interface AnalyticsData {
  id: number;
  name: string;
  value: number;
}
const data: AnalyticsData[] = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  name: `Metric ${i + 1}`,
  value: Math.round(Math.random() * 1000),
}));

const PerformanceAnalyticsDashboard: React.FC = () => {
  const processedData = useMemo(() => {
    return data.map(item => ({ ...item, score: Math.random() }));
  }, []);

  const renderRow = useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      return (
        <div style={style} key={processedData[index].id}>
          <Suspense fallback={<CircularProgress />}>
            <AnalyticsWidget data={processedData[index]} />
          </Suspense>
        </div>
      );
    },
    [processedData]
  );

  return (
    <div style={{ width: '100%', padding: 16 }}>
      <List height={600} itemCount={processedData.length} itemSize={120} width={'100%'}>
        {renderRow}
      </List>
    </div>
  );
};

export default PerformanceAnalyticsDashboard;
