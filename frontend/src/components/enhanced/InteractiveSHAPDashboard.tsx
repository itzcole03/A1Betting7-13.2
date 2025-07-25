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
// @ts-expect-error TS(2307): Cannot find module 'react-chartjs-2' or its corres... Remove this comment to see the full error message
import { Bar } from 'react-chartjs-2';
import { safeNumber } from '../../utils/UniversalUtils';
// @ts-expect-error TS(6142): Module '../ui/Badge' was resolved to 'C:/Users/bcm... Remove this comment to see the full error message
import { Badge } from '../ui/Badge';
// @ts-expect-error TS(6142): Module '../ui/Button' was resolved to 'C:/Users/bc... Remove this comment to see the full error message
import { Button } from '../ui/Button';
// @ts-expect-error TS(6142): Module '../ui/Card' was resolved to 'C:/Users/bcma... Remove this comment to see the full error message
import { Card, CardContent, CardHeader } from '../ui/Card';
// @ts-expect-error TS(6142): Module '../ui/Slider' was resolved to 'C:/Users/bc... Remove this comment to see the full error message
import { Slider } from '../ui/Slider';
// @ts-expect-error TS(6142): Module '../ui/Switch' was resolved to 'C:/Users/bc... Remove this comment to see the full error message
import { Switch } from '../ui/Switch';
// @ts-expect-error TS(6142): Module '../ui/Tabs' was resolved to 'C:/Users/bcma... Remove this comment to see the full error message
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

const _InteractiveSHAPDashboard: React.FC<InteractiveSHAPDashboardProps> = ({
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
  const _filteredShapValues = useMemo(() => {
    const _filtered = explanation.shapValues.filter(
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
  const _waterfallData = useMemo(() => {
    const _labels = ['Base Value', ...filteredShapValues.map(sv => sv.feature), 'Prediction'];
    const _data: number[] = [];
    const _backgroundColor: string[] = [];

    let _cumulativeValue = explanation.baseValue;
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
  const _forceData = useMemo(() => {
    const _positiveValues = filteredShapValues.filter(sv => sv.shapValue > 0);
    const _negativeValues = filteredShapValues.filter(sv => sv.shapValue < 0);

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
  const _summaryStats = useMemo(() => {
    const _totalPositive = filteredShapValues
      .filter(sv => sv.shapValue > 0)
      .reduce((sum, sv) => sum + sv.shapValue, 0);

    const _totalNegative = filteredShapValues
      .filter(sv => sv.shapValue < 0)
      .reduce((sum, sv) => sum + Math.abs(sv.shapValue), 0);

    const _topFeatures = filteredShapValues.slice(0, 5).map(sv => ({
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

  const _handleFeatureClick = useCallback(
    (feature: string) => {
      const _newSelected = new Set(selectedFeatures);
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

  const _chartOptions = {
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
          label: (context: unknown) => {
            const _shapValue = filteredShapValues[context.dataIndex];
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
    onClick: (event: unknown, elements: unknown[]) => {
      if (elements.length > 0) {
        const _index = elements[0].index;
        if (index > 0 && index <= filteredShapValues.length) {
          const _feature = filteredShapValues[index - 1]?.feature;
          if (feature) {
            handleFeatureClick(feature);
          }
        }
      }
    },
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='w-full space-y-6'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex justify-between items-center'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2 className='text-2xl font-bold text-gray-900'>Prediction Explanation</h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-600'>
            Model: {explanation.modelName} | Confidence: {(explanation.confidence * 100).toFixed(1)}
            %
          </p>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex space-x-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Badge variant={explanation.confidence > 0.8 ? 'default' : 'secondary'}>
            {explanation.confidence > 0.8 ? 'High Confidence' : 'Medium Confidence'}
          </Badge>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          {realTimeUpdates && <Badge variant='default'>Live</Badge>}
        </div>
      </div>

      {/* Controls */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Card>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <CardHeader>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3 className='text-lg font-semibold'>Visualization Controls</h3>
        </CardHeader>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <CardContent>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <label className='block text-sm font-medium mb-2' htmlFor='shap-sort-by'>
                Sort By
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <select
                id='shap-sort-by'
                value={sortBy}
                onChange={e => setSortBy(e.target.value as unknown)}
                className='w-full p-2 border rounded-md'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='importance'>Importance</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='shapValue'>SHAP Value</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='alphabetical'>Alphabetical</option>
              </select>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <label className='block text-sm font-medium mb-2' htmlFor='shap-confidence-threshold'>
                Confidence Threshold: {safeNumber(confidenceThreshold).toFixed(2)}
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Slider
                id='shap-confidence-threshold'
                value={[confidenceThreshold]}
                onValueChange={(value: unknown) => setConfidenceThreshold(value[0])}
                max={1}
                min={0}
                step={0.1}
                className='w-full'
              />
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Switch
                id='shap-positive-only'
                checked={showPositiveOnly}
                onCheckedChange={setShowPositiveOnly}
              />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <label className='text-sm font-medium' htmlFor='shap-positive-only'>
                Positive Only
              </label>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Button onClick={onExportData} variant='outline' size='sm'>
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CardContent className='p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-green-600'>
              +{safeNumber(summaryStats.totalPositive).toFixed(3)}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-600'>Positive Impact</div>
          </CardContent>
        </Card>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CardContent className='p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-red-600'>
              -{safeNumber(summaryStats.totalNegative).toFixed(3)}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-600'>Negative Impact</div>
          </CardContent>
        </Card>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CardContent className='p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-blue-600'>
              {safeNumber(summaryStats.netImpact).toFixed(3)}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-600'>Net Impact</div>
          </CardContent>
        </Card>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CardContent className='p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-gray-900'>
              {safeNumber(summaryStats.featureCount).toFixed(0)}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-600'>Features</div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Tabs */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Tabs
        value={viewMode}
        onValueChange={(value: unknown) => setViewMode(value as 'waterfall' | 'force' | 'summary')}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <TabsList className='grid w-full grid-cols-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsTrigger value='waterfall'>Waterfall</TabsTrigger>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsTrigger value='force'>Force Plot</TabsTrigger>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsTrigger value='summary'>Summary</TabsTrigger>
        </TabsList>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <TabsContent value='waterfall' className='space-y-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CardHeader>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-lg font-semibold'>Waterfall Plot</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-sm text-gray-600'>
                Shows how each feature contributes to the final prediction
              </p>
            </CardHeader>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CardContent>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='h-96'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Bar data={waterfallData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <TabsContent value='force' className='space-y-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CardHeader>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-lg font-semibold'>Force Plot</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-sm text-gray-600'>
                Visualizes the push and pull of each feature on the prediction
              </p>
            </CardHeader>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CardContent>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='h-96'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <TabsContent value='summary' className='space-y-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Top Features */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Card>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h3 className='text-lg font-semibold'>Top Contributing Features</h3>
              </CardHeader>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CardContent>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='space-y-3'>
                  {summaryStats.topFeatures.map((feature, index) => (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      key={feature.feature}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100'
                      tabIndex={0}
                      role='button'
                      onClick={() => handleFeatureClick(feature.feature)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleFeatureClick(feature.feature);
                        }
                      }}
                    >
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-center space-x-3'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-sm font-medium text-gray-900'>
                          {index + 1}. {feature.feature}
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Badge variant={feature.impact > 0 ? 'default' : 'destructive'}>
                          {feature.impact > 0 ? '+' : ''}
                          {safeNumber(feature.impact).toFixed(3)}
                        </Badge>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-600'>
                        {safeNumber(feature.percentage).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Feature Details */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Card>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h3 className='text-lg font-semibold'>Feature Analysis</h3>
              </CardHeader>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CardContent>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='space-y-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-sm'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='font-medium'>Base Value:</span>{' '}
                    {safeNumber(explanation.baseValue).toFixed(3)}
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-sm'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='font-medium'>Final Prediction:</span>{' '}
                    {safeNumber(explanation.predictedValue).toFixed(3)}
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-sm'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='font-medium'>Total Change:</span>{' '}
                    {safeNumber(explanation.predictedValue - explanation.baseValue).toFixed(3)}
                  </div>

                  {selectedFeatures.size > 0 && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='mt-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h4 className='font-medium mb-2'>Selected Features:</h4>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='space-y-2'>
                        {Array.from(selectedFeatures).map(feature => {
                          const _shapValue = explanation.shapValues.find(
                            sv => sv.feature === feature
                          );
                          return shapValue ? (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div key={feature} className='text-sm bg-blue-50 p-2 rounded'>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='font-medium'>{feature}</div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div>Value: {shapValue.value}</div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div>SHAP: {safeNumber(shapValue.shapValue).toFixed(4)}</div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='fixed bottom-4 right-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card className='bg-green-50 border-green-200'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CardContent className='p-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
