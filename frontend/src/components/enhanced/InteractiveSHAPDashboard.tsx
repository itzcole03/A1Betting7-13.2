/**
 * Interactive SHAP Dashboard - Phase 8D Implementation
 * Real-time prediction explanations with advanced visualizations
 * Built for production-grade user experience
 */

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useCallback, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { safeNumber } from '../../utils/UniversalUtils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SHAPValue {
  feature: string;
  value: number;
  baseValue: number;
  shapValue: number;
  confidence: number;
  importance: number;
}

interface PredictionExplanation {
  predictionId: string;
  modelName: string;
  predictedValue: number;
  baseValue: number;
  shapValues: SHAPValue[];
  confidence: number;
  timestamp: string;
  metadata: {
    gameId?: string;
    betType?: string;
    context?: string;
  };
}

interface InteractiveSHAPDashboardProps {
  explanation: PredictionExplanation;
  onFeatureSelect?: (feature: string) => void;
  onExportData?: () => void;
  realTimeUpdates?: boolean;
}

const InteractiveSHAPDashboard: React.FC<InteractiveSHAPDashboardProps> = ({
  explanation,
  onFeatureSelect,
  onExportData,
  realTimeUpdates = false,
}) => {
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'importance' | 'shapValue' | 'alphabetical'>('importance');
  const [showPositiveOnly, setShowPositiveOnly] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [viewMode, setViewMode] = useState<'waterfall' | 'force' | 'summary'>('waterfall');

  // Filter and sort SHAP values based on user preferences
  const filteredShapValues = useMemo(() => {
    const filtered = explanation.shapValues.filter(
      sv => sv.confidence >= confidenceThreshold && (!showPositiveOnly || sv.shapValue > 0)
    );

    switch (sortBy) {
      case 'importance':
        filtered.sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));
        break;
      case 'shapValue':
        filtered.sort((a, b) => b.shapValue - a.shapValue);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.feature.localeCompare(b.feature));
        break;
    }

    return filtered;
  }, [explanation.shapValues, sortBy, showPositiveOnly, confidenceThreshold]);

  // Waterfall chart data
  const waterfallData = useMemo(() => {
    const labels = ['Base Value', ...filteredShapValues.map(sv => sv.feature), 'Prediction'];
    const data: number[] = [];
    const backgroundColor: string[] = [];

    let cumulativeValue = explanation.baseValue;
    data.push(cumulativeValue);
    backgroundColor.push('#94a3b8');

    filteredShapValues.forEach(sv => {
      cumulativeValue += sv.shapValue;
      data.push(cumulativeValue);
      backgroundColor.push(sv.shapValue > 0 ? '#10b981' : '#ef4444');
    });

    return {
      labels,
      datasets: [
        {
          label: 'SHAP Values',
          data,
          backgroundColor,
          borderColor: backgroundColor.map(color => color),
          borderWidth: 2,
        },
      ],
    };
  }, [filteredShapValues, explanation.baseValue]);

  // Force plot data (horizontal bar chart)
  const forceData = useMemo(() => {
    const positiveValues = filteredShapValues.filter(sv => sv.shapValue > 0);
    const negativeValues = filteredShapValues.filter(sv => sv.shapValue < 0);

    return {
      labels: filteredShapValues.map(sv => sv.feature),
      datasets: [
        {
          label: 'Positive Impact',
          data: filteredShapValues.map(sv => (sv.shapValue > 0 ? sv.shapValue : 0)),
          backgroundColor: '#10b981',
        },
        {
          label: 'Negative Impact',
          data: filteredShapValues.map(sv => (sv.shapValue < 0 ? Math.abs(sv.shapValue) : 0)),
          backgroundColor: '#ef4444',
        },
      ],
    };
  }, [filteredShapValues]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalPositive = filteredShapValues
      .filter(sv => sv.shapValue > 0)
      .reduce((sum, sv) => sum + sv.shapValue, 0);

    const totalNegative = filteredShapValues
      .filter(sv => sv.shapValue < 0)
      .reduce((sum, sv) => sum + Math.abs(sv.shapValue), 0);

    const topFeatures = filteredShapValues.slice(0, 5).map(sv => ({
      feature: sv.feature,
      impact: sv.shapValue,
      percentage: (Math.abs(sv.shapValue) / (totalPositive + totalNegative)) * 100,
    }));

    return {
      totalPositive,
      totalNegative,
      netImpact: totalPositive - totalNegative,
      topFeatures,
      featureCount: filteredShapValues.length,
    };
  }, [filteredShapValues]);

  const handleFeatureClick = useCallback(
    (feature: string) => {
      const newSelected = new Set(selectedFeatures);
      if (newSelected.has(feature)) {
        newSelected.delete(feature);
      } else {
        newSelected.add(feature);
      }
      setSelectedFeatures(newSelected);
      onFeatureSelect?.(feature);
    },
    [selectedFeatures, onFeatureSelect]
  );

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'SHAP Value Analysis',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const shapValue = filteredShapValues[context.dataIndex];
            if (shapValue) {
              return [
                `SHAP Value: ${safeNumber(shapValue.shapValue).toFixed(4)}`,
                `Feature Value: ${shapValue.value}`,
                `Confidence: ${(shapValue.confidence * 100).toFixed(1)}%`,
              ];
            }
            return context.label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        if (index > 0 && index <= filteredShapValues.length) {
          const feature = filteredShapValues[index - 1]?.feature;
          if (feature) {
            handleFeatureClick(feature);
          }
        }
      }
    },
  };

  return (
    <div className='w-full space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Prediction Explanation</h2>
          <p className='text-gray-600'>
            Model: {explanation.modelName} | Confidence: {(explanation.confidence * 100).toFixed(1)}
            %
          </p>
        </div>
        <div className='flex space-x-2'>
          <Badge variant={explanation.confidence > 0.8 ? 'success' : 'warning'}>
            {explanation.confidence > 0.8 ? 'High Confidence' : 'Medium Confidence'}
          </Badge>
          {realTimeUpdates && <Badge variant='info'>Live</Badge>}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <h3 className='text-lg font-semibold'>Visualization Controls</h3>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className='w-full p-2 border rounded-md'
              >
                <option value='importance'>Importance</option>
                <option value='shapValue'>SHAP Value</option>
                <option value='alphabetical'>Alphabetical</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>
                Confidence Threshold: {safeNumber(confidenceThreshold).toFixed(2)}
              </label>
              <Slider
                value={[confidenceThreshold]}
                onValueChange={value => setConfidenceThreshold(value[0])}
                max={1}
                min={0}
                step={0.1}
                className='w-full'
              />
            </div>

            <div className='flex items-center space-x-2'>
              <Switch checked={showPositiveOnly} onCheckedChange={setShowPositiveOnly} />
              <label className='text-sm font-medium'>Positive Only</label>
            </div>

            <div>
              <Button onClick={onExportData} variant='outline' size='sm'>
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-green-600'>
              +{safeNumber(summaryStats.totalPositive).toFixed(3)}
            </div>
            <div className='text-sm text-gray-600'>Positive Impact</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-red-600'>
              -{safeNumber(summaryStats.totalNegative).toFixed(3)}
            </div>
            <div className='text-sm text-gray-600'>Negative Impact</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-blue-600'>
              {safeNumber(summaryStats.netImpact).toFixed(3)}
            </div>
            <div className='text-sm text-gray-600'>Net Impact</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-gray-900'>
              {safeNumber(summaryStats.featureCount).toFixed(0)}
            </div>
            <div className='text-sm text-gray-600'>Features</div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='waterfall'>Waterfall</TabsTrigger>
          <TabsTrigger value='force'>Force Plot</TabsTrigger>
          <TabsTrigger value='summary'>Summary</TabsTrigger>
        </TabsList>

        <TabsContent value='waterfall' className='space-y-4'>
          <Card>
            <CardHeader>
              <h3 className='text-lg font-semibold'>Waterfall Plot</h3>
              <p className='text-sm text-gray-600'>
                Shows how each feature contributes to the final prediction
              </p>
            </CardHeader>
            <CardContent>
              <div className='h-96'>
                <Bar data={waterfallData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='force' className='space-y-4'>
          <Card>
            <CardHeader>
              <h3 className='text-lg font-semibold'>Force Plot</h3>
              <p className='text-sm text-gray-600'>
                Visualizes the push and pull of each feature on the prediction
              </p>
            </CardHeader>
            <CardContent>
              <div className='h-96'>
                <Bar
                  data={forceData}
                  options={{
                    ...chartOptions,
                    indexAxis: 'y' as const,
                    scales: {
                      x: {
                        stacked: false,
                      },
                      y: {
                        stacked: false,
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='summary' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Top Features */}
            <Card>
              <CardHeader>
                <h3 className='text-lg font-semibold'>Top Contributing Features</h3>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {summaryStats.topFeatures.map((feature, index) => (
                    <div
                      key={feature.feature}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100'
                      onClick={() => handleFeatureClick(feature.feature)}
                    >
                      <div className='flex items-center space-x-3'>
                        <div className='text-sm font-medium text-gray-900'>
                          {index + 1}. {feature.feature}
                        </div>
                        <Badge variant={feature.impact > 0 ? 'success' : 'destructive'}>
                          {feature.impact > 0 ? '+' : ''}
                          {safeNumber(feature.impact).toFixed(3)}
                        </Badge>
                      </div>
                      <div className='text-sm text-gray-600'>
                        {safeNumber(feature.percentage).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Feature Details */}
            <Card>
              <CardHeader>
                <h3 className='text-lg font-semibold'>Feature Analysis</h3>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='text-sm'>
                    <span className='font-medium'>Base Value:</span>{' '}
                    {safeNumber(explanation.baseValue).toFixed(3)}
                  </div>
                  <div className='text-sm'>
                    <span className='font-medium'>Final Prediction:</span>{' '}
                    {safeNumber(explanation.predictedValue).toFixed(3)}
                  </div>
                  <div className='text-sm'>
                    <span className='font-medium'>Total Change:</span>{' '}
                    {safeNumber(explanation.predictedValue - explanation.baseValue).toFixed(3)}
                  </div>

                  {selectedFeatures.size > 0 && (
                    <div className='mt-4'>
                      <h4 className='font-medium mb-2'>Selected Features:</h4>
                      <div className='space-y-2'>
                        {Array.from(selectedFeatures).map(feature => {
                          const shapValue = explanation.shapValues.find(
                            sv => sv.feature === feature
                          );
                          return shapValue ? (
                            <div key={feature} className='text-sm bg-blue-50 p-2 rounded'>
                              <div className='font-medium'>{feature}</div>
                              <div>Value: {shapValue.value}</div>
                              <div>SHAP: {safeNumber(shapValue.shapValue).toFixed(4)}</div>
                              <div>Confidence: {(shapValue.confidence * 100).toFixed(1)}%</div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Real-time Updates Indicator */}
      {realTimeUpdates && (
        <div className='fixed bottom-4 right-4'>
          <Card className='bg-green-50 border-green-200'>
            <CardContent className='p-3'>
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span className='text-sm text-green-700'>Live Updates Active</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InteractiveSHAPDashboard;
