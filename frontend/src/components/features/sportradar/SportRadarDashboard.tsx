/**
 * SportRadar Dashboard Component
 * Demonstrates comprehensive SportRadar API integration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AlertCircle, CheckCircle, Clock, Database, Image, TrendingUp, Zap } from 'lucide-react';
import sportRadarService, { SportRadarResponse, QuotaStatus, APIInfo } from '../../../services/sportRadarService';

interface HealthStatus {
  service: string;
  status: string;
  api_key_configured: boolean;
  total_apis: number;
  session_active: boolean;
  monitoring_active: boolean;
  cloud_demo_mode?: boolean;
}

const SportRadarDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<Record<string, QuotaStatus> | null>(null);
  const [availableAPIs, setAvailableAPIs] = useState<Record<string, APIInfo> | null>(null);
  const [liveData, setLiveData] = useState<Record<string, any>>({});
  const [comprehensiveData, setComprehensiveData] = useState<any>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading({ health: true, quota: true, apis: true });
    
    try {
      const [health, quota, apis] = await Promise.all([
        sportRadarService.getHealthStatus(),
        sportRadarService.getQuotaStatus(),
        sportRadarService.getAvailableAPIs()
      ]);

      setHealthStatus(health);
      setQuotaStatus(quota.quota_status);
      setAvailableAPIs(apis.api_details);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading({ health: false, quota: false, apis: false });
    }
  };

  const loadComprehensiveData = async () => {
    setLoading(prev => ({ ...prev, comprehensive: true }));
    
    try {
      const data = await sportRadarService.getComprehensiveData(['mlb', 'nfl', 'nba', 'nhl']);
      setComprehensiveData(data.comprehensive_data);
    } catch (error) {
      console.error('Failed to load comprehensive data:', error);
    } finally {
      setLoading(prev => ({ ...prev, comprehensive: false }));
    }
  };

  const loadLiveData = async (sport: string) => {
    setLoading(prev => ({ ...prev, [`live_${sport}`]: true }));
    
    try {
      const data = await sportRadarService.getLiveData(sport);
      setLiveData(prev => ({ ...prev, [sport]: data.data }));
    } catch (error) {
      console.error(`Failed to load live data for ${sport}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [`live_${sport}`]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'operational':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getQuotaPercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const getQuotaColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SportRadar Integration</h1>
          <p className="text-muted-foreground">
            Comprehensive access to all SportRadar trial APIs
            {healthStatus?.cloud_demo_mode && (
              <Badge variant="secondary" className="ml-2">
                Cloud Demo Mode
              </Badge>
            )}
          </p>
        </div>
        <Button onClick={loadInitialData} disabled={loading.health}>
          <Zap className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(healthStatus?.status || 'unknown')}`}>
              {healthStatus?.status || 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthStatus?.total_apis || 0} APIs Available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Key</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus?.api_key_configured ? (
                <span className="text-green-600">✓ Configured</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Authentication Status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus?.session_active ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-gray-600">Inactive</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Connection Status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus?.monitoring_active ? (
                <span className="text-green-600">On</span>
              ) : (
                <span className="text-gray-600">Off</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Performance Tracking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quota">Quota Status</TabsTrigger>
          <TabsTrigger value="live">Live Data</TabsTrigger>
          <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available APIs</CardTitle>
                <CardDescription>
                  All SportRadar trial APIs and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableAPIs ? (
                  <div className="space-y-3">
                    {Object.entries(availableAPIs).slice(0, 6).map(([key, api]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{key.toUpperCase()}</div>
                          <div className="text-sm text-muted-foreground">
                            {api.endpoints.length} endpoints • {api.packages[0]}
                          </div>
                        </div>
                        <Badge variant={api.quota_remaining > 0 ? "default" : "destructive"}>
                          {api.quota_remaining}/{api.quota_limit}
                        </Badge>
                      </div>
                    ))}
                    {Object.keys(availableAPIs).length > 6 && (
                      <div className="text-center text-sm text-muted-foreground">
                        +{Object.keys(availableAPIs).length - 6} more APIs available
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trial Information</CardTitle>
                <CardDescription>
                  Current trial period and usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Trial Period</span>
                    <Badge variant="outline">08/11/2025 - 09/10/2025</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total APIs</span>
                    <span className="text-sm">{healthStatus?.total_apis || 19}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Categories</span>
                    <span className="text-sm">Sports, Odds, Images</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">QPS Limit</span>
                    <span className="text-sm">1 req/sec per API</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quota Status Tab */}
        <TabsContent value="quota" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Quota Usage</CardTitle>
              <CardDescription>
                Current quota consumption across all SportRadar APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quotaStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(quotaStatus).map(([key, quota]) => {
                    const percentage = getQuotaPercentage(quota.quota_used, quota.quota_limit);
                    return (
                      <div key={key} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{key.toUpperCase()}</h3>
                          <Badge variant={percentage > 80 ? "destructive" : percentage > 50 ? "secondary" : "default"}>
                            {percentage}%
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Used</span>
                            <span className={getQuotaColor(percentage)}>
                              {quota.quota_used}/{quota.quota_limit}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {quota.packages[0]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Data Tab */}
        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {['mlb', 'nfl', 'nba', 'nhl'].map(sport => (
              <Button
                key={sport}
                variant={liveData[sport] ? "default" : "outline"}
                onClick={() => loadLiveData(sport)}
                disabled={loading[`live_${sport}`]}
                className="w-full"
              >
                {loading[`live_${sport}`] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  sport.toUpperCase()
                )}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(liveData).map(([sport, data]) => (
              <Card key={sport}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {sport.toUpperCase()} Live Data
                  </CardTitle>
                  <CardDescription>
                    Real-time scores and game information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data?.games?.length > 0 ? (
                    <div className="space-y-3">
                      {data.games.map((game: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {game.away_team} @ {game.home_team}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {game.status}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
                                {game.score?.away} - {game.score?.home}
                              </div>
                              {game.inning && (
                                <div className="text-sm text-muted-foreground">
                                  Inning {game.inning}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No live games available
                    </div>
                  )}
                  {data?.status === "demo_mode" && (
                    <Badge variant="secondary" className="mt-2">
                      Demo Mode
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Comprehensive Data Tab */}
        <TabsContent value="comprehensive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Comprehensive Sports Data
              </CardTitle>
              <CardDescription>
                Aggregated data from all SportRadar APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={loadComprehensiveData}
                disabled={loading.comprehensive}
                className="mb-4"
              >
                {loading.comprehensive ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Load Comprehensive Data
              </Button>

              {comprehensiveData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sports Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Object.keys(comprehensiveData.sports_data || {}).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Sports Covered</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Odds Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Object.keys(comprehensiveData.odds_data || {}).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Odds Types</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">APIs Used</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {comprehensiveData.metadata?.apis_used?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Active APIs</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Data Summary</h4>
                    <pre className="text-xs overflow-auto max-h-48">
                      {JSON.stringify(comprehensiveData.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SportRadarDashboard;
