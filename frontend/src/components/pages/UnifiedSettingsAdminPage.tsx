import React, { useState, useEffect } from 'react';
// @ts-expect-error TS(6142): Module '../../contexts/AuthContext' was resolved t... Remove this comment to see the full error message
import { useAuth } from '../../contexts/AuthContext';
// @ts-expect-error TS(6142): Module '../ui/card' was resolved to 'C:/Users/bcma... Remove this comment to see the full error message
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// @ts-expect-error TS(6142): Module '../ui/button' was resolved to 'C:/Users/bc... Remove this comment to see the full error message
import { Button } from '../ui/button';
// @ts-expect-error TS(6142): Module '../ui/input' was resolved to 'C:/Users/bcm... Remove this comment to see the full error message
import { Input } from '../ui/input';
// @ts-expect-error TS(6142): Module '../ui/tabs' was resolved to 'C:/Users/bcma... Remove this comment to see the full error message
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
// @ts-expect-error TS(6142): Module '../ui/alert' was resolved to 'C:/Users/bcm... Remove this comment to see the full error message
import { Alert, AlertDescription } from '../ui/alert';
// @ts-expect-error TS(6142): Module '../ui/badge' was resolved to 'C:/Users/bcm... Remove this comment to see the full error message
import { Badge } from '../ui/badge';
// @ts-expect-error TS(6142): Module '../ui/progress' was resolved to 'C:/Users/... Remove this comment to see the full error message
import { Progress } from '../ui/progress';
// @ts-expect-error TS(6142): Module '../ui/switch' was resolved to 'C:/Users/bc... Remove this comment to see the full error message
import { Switch } from '../ui/switch';
import {
  Settings,
  Shield,
  Database,
  Brain,
  TrendingUp,
  Users,
  Globe,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  Server,
  Key,
  Clock,
  BarChart3,
} from 'lucide-react';

interface SystemStatus {
  service: string;
  status: 'online' | 'offline' | 'warning';
  uptime: string;
  lastUpdated: string;
  performance: number;
}

interface UserSettings {
  notifications: boolean;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  autoStaking: boolean;
  portfolioSize: number;
  preferredPlatforms: string[];
  aiInsights: boolean;
  quantumAnalysis: boolean;
}

function UnifiedSettingsAdminPage() {
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notifications: true,
    riskTolerance: 'moderate',
    autoStaking: false,
    portfolioSize: 1000,
    preferredPlatforms: ['PrizePicks'],
    aiInsights: true,
    quantumAnalysis: false,
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([
    {
      service: 'Unified Prediction Service',
      status: 'online',
      uptime: '99.8%',
      lastUpdated: '2 minutes ago',
      performance: 98,
    },
    {
      service: 'PrizePicks Data Scraper',
      status: 'online',
      uptime: '97.2%',
      lastUpdated: '1 minute ago',
      performance: 94,
    },
    {
      service: 'MoneyMaker AI Engine',
      status: 'warning',
      uptime: '95.1%',
      lastUpdated: '5 minutes ago',
      performance: 87,
    },
    {
      service: 'Lineup Builder Optimizer',
      status: 'online',
      uptime: '99.1%',
      lastUpdated: '3 minutes ago',
      performance: 96,
    },
  ]);

  const [apiKeys, setApiKeys] = useState({
    prizepicks: '••••••••••••pk_live_',
    draftkings: '••••••••••••dk_prod_',
    fanduel: '••••••••••••fd_api_',
    openai: '••••••••••••sk-',
  });

  // Use real auth context for admin detection
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.permissions?.includes('admin') || false;

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setUserSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      // In real app, this would call an API
      console.log('Saving settings:', userSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleSystemRestart = async (service: string) => {
    try {
      console.log(`Restarting ${service}...`);
      alert(`${service} restart initiated`);
    } catch (error) {
      console.error(`Failed to restart ${service}:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <CheckCircle className='h-4 w-4' />;
      case 'warning':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <AlertTriangle className='h-4 w-4' />;
      case 'offline':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <AlertTriangle className='h-4 w-4' />;
      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Activity className='h-4 w-4' />;
    }
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='max-w-7xl mx-auto space-y-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Settings className='h-8 w-8 text-blue-600' />
              Settings & Administration
            </h1>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-gray-600 mt-2'>
              Configure your betting experience and {isAdmin && 'manage system administration'}
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Badge variant='outline' className='text-sm'>
            {isAdmin ? 'Administrator' : 'User'}
          </Badge>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Tabs defaultValue='user-settings' className='w-full'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsList className='grid w-full grid-cols-5'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsTrigger value='user-settings' className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Users className='h-4 w-4' />
              User Settings
            </TabsTrigger>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsTrigger value='ai-config' className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Brain className='h-4 w-4' />
              AI Configuration
            </TabsTrigger>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsTrigger value='platforms' className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Globe className='h-4 w-4' />
              Platforms
            </TabsTrigger>
            {isAdmin && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <TabsTrigger value='system-status' className='flex items-center gap-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Server className='h-4 w-4' />
                  System Status
                </TabsTrigger>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <TabsTrigger value='admin-tools' className='flex items-center gap-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Shield className='h-4 w-4' />
                  Admin Tools
                </TabsTrigger>
              </>
            )}
          </TabsList>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsContent value='user-settings' className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <TrendingUp className='h-5 w-5' />
                    Risk & Portfolio Settings
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='space-y-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span id='risk-tolerance-label' className='text-sm font-medium'>Risk Tolerance</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='mt-2 grid grid-cols-3 gap-2' aria-labelledby='risk-tolerance-label'>
                      {['conservative', 'moderate', 'aggressive'].map(level => (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Button
                          key={level}
                          variant={userSettings.riskTolerance === level ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => handleSettingChange('riskTolerance', level)}
                          className='capitalize'
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <label htmlFor='portfolio-size' className='text-sm font-medium'>Portfolio Size ($)</label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Input
                      id='portfolio-size'
                      type='number'
                      value={userSettings.portfolioSize}
                      onChange={e => handleSettingChange('portfolioSize', parseInt(e.target.value))}
                      className='mt-2'
                    />
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <label id='auto-stacking-label' htmlFor='auto-stacking-switch' className='text-sm font-medium'>Auto-Stacking</label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Switch
                      aria-labelledby='auto-stacking-label'
                      checked={userSettings.autoStaking}
                      onCheckedChange={checked => handleSettingChange('autoStaking', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Zap className='h-5 w-5' />
                    Notifications & Alerts
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='space-y-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <label id='push-notifications-label' htmlFor='push-notifications-switch' className='text-sm font-medium'>Push Notifications</label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Switch
                      aria-labelledby='push-notifications-label'
                      checked={userSettings.notifications}
                      onCheckedChange={checked => handleSettingChange('notifications', checked)}
                    />
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <label id='ai-insights-label' htmlFor='ai-insights-switch' className='text-sm font-medium'>AI Insights</label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Switch
                      aria-labelledby='ai-insights-label'
                      checked={userSettings.aiInsights}
                      onCheckedChange={checked => handleSettingChange('aiInsights', checked)}
                    />
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <label id='quantum-analysis-label' htmlFor='quantum-analysis-switch' className='text-sm font-medium'>Quantum Analysis (Beta)</label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Switch
                      aria-labelledby='quantum-analysis-label'
                      checked={userSettings.quantumAnalysis}
                      onCheckedChange={checked => handleSettingChange('quantumAnalysis', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex justify-end'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Button onClick={handleSaveSettings} className='bg-blue-600 hover:bg-blue-700'>
                Save Settings
              </Button>
            </div>
          </TabsContent>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsContent value='ai-config' className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Brain className='h-5 w-5' />
                    AI Model Configuration
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='space-y-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <label htmlFor='primary-model-select' className='text-sm font-medium'>Primary Model</label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <select id='primary-model-select' className='mt-2 w-full p-2 border rounded-md'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <option>Neural Ensemble v3.2</option>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <option>Quantum Hybrid v2.1</option>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <option>Traditional ML Stack</option>
                    </select>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-sm font-medium'>Confidence Threshold</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='mt-2 flex items-center gap-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Progress value={75} className='flex-1' />
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-medium'>75%</span>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-sm font-medium'>Feature Importance Display</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='mt-2 space-y-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <label className='flex items-center gap-2' htmlFor='shap-checkbox'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <input id='shap-checkbox' type='checkbox' defaultChecked />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm'>SHAP Values</span>
                      </label>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <label className='flex items-center gap-2' htmlFor='correlation-checkbox'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <input id='correlation-checkbox' type='checkbox' defaultChecked />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm'>Correlation Heatmap</span>
                      </label>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <label className='flex items-center gap-2' htmlFor='advanced-explanations-checkbox'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <input id='advanced-explanations-checkbox' type='checkbox' />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm'>Advanced Explanations</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle className='flex items-center gap-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <BarChart3 className='h-5 w-5' />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardContent className='space-y-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-center p-3 bg-green-50 rounded-lg'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-2xl font-bold text-green-600'>87.3%</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-600'>Accuracy (7d)</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-center p-3 bg-blue-50 rounded-lg'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-2xl font-bold text-blue-600'>+12.4%</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-600'>ROI (30d)</div>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-sm font-medium'>Model Training</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='mt-2 space-y-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex justify-between items-center'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm'>Last Training</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm text-gray-600'>2 hours ago</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex justify-between items-center'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm'>Next Training</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm text-gray-600'>In 6 hours</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Button size='sm' variant='outline' className='w-full'>
                        Trigger Manual Training
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TabsContent value='platforms' className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {['PrizePicks', 'DraftKings', 'FanDuel'].map(platform => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Card key={platform}>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardHeader>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <CardTitle className='flex items-center justify-between'>
                      {platform}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Badge
                        variant={
                          userSettings.preferredPlatforms.includes(platform)
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {userSettings.preferredPlatforms.includes(platform) ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardContent className='space-y-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span id={`enable-platform-label-${platform}`} className='text-sm'>Enable Platform</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Switch
                        aria-labelledby={`enable-platform-label-${platform}`}
                        checked={userSettings.preferredPlatforms.includes(platform)}
                        onCheckedChange={checked => {
                          if (checked) {
                            handleSettingChange('preferredPlatforms', [
                              ...userSettings.preferredPlatforms,
                              platform,
                            ]);
                          } else {
                            handleSettingChange(
                              'preferredPlatforms',
                              userSettings.preferredPlatforms.filter(p => p !== platform)
                            );
                          }
                        }}
                      />
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-medium'>API Status</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='mt-2 flex items-center gap-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <CheckCircle className='h-4 w-4 text-green-600' />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm text-green-600'>Connected</span>
                      </div>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-medium'>Data Freshness</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='mt-2 text-sm text-gray-600'>Updated 30 seconds ago</div>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Button size='sm' variant='outline' className='w-full'>
                      Test Connection
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {isAdmin && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsContent value='system-status' className='space-y-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Card>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardHeader>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <CardTitle className='flex items-center gap-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Server className='h-5 w-5' />
                      Service Status
                    </CardTitle>
                  </CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardContent>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='space-y-4'>
                      {systemStatus.map(service => (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div
                          key={service.service}
                          className='flex items-center justify-between p-3 border rounded-lg'
                        >
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='flex items-center gap-3'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Badge className={getStatusColor(service.status)}>
                              {getStatusIcon(service.status)}
                              {service.status}
                            </Badge>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='font-medium'>{service.service}</div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='text-sm text-gray-600'>Uptime: {service.uptime}</div>
                            </div>
                          </div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='text-right'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div className='text-sm font-medium'>{service.performance}%</div>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div className='text-xs text-gray-600'>{service.lastUpdated}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Card>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardHeader>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <CardTitle className='flex items-center gap-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Activity className='h-5 w-5' />
                      System Resources
                    </CardTitle>
                  </CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardContent className='space-y-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex justify-between items-center mb-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm font-medium'>CPU Usage</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm'>34%</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Progress value={34} />
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex justify-between items-center mb-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm font-medium'>Memory Usage</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm'>67%</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Progress value={67} />
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex justify-between items-center mb-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm font-medium'>Disk Usage</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm'>23%</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Progress value={23} />
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex justify-between items-center mb-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm font-medium'>Network I/O</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm'>12 MB/s</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Progress value={45} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {isAdmin && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TabsContent value='admin-tools' className='space-y-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Card>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardHeader>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <CardTitle className='flex items-center gap-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Key className='h-5 w-5' />
                      API Key Management
                    </CardTitle>
                  </CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardContent className='space-y-4'>
                    {Object.entries(apiKeys).map(([platform, key]) => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div key={platform} className='space-y-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <label htmlFor={`api-key-input-${platform}`} className='text-sm font-medium capitalize'>{platform} API Key</label>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex gap-2'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Input id={`api-key-input-${platform}`} type='password' value={key} readOnly className='font-mono' />
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Button size='sm' variant='outline'>
                            Rotate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Card>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardHeader>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <CardTitle className='flex items-center gap-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Database className='h-5 w-5' />
                      Data Management
                    </CardTitle>
                  </CardHeader>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardContent className='space-y-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='grid grid-cols-2 gap-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Button size='sm' variant='outline'>
                        Export Logs
                      </Button>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Button size='sm' variant='outline'>
                        Backup Data
                      </Button>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Button size='sm' variant='outline'>
                        Clear Cache
                      </Button>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Button size='sm' variant='outline'>
                        Reset Models
                      </Button>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Alert>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <AlertTriangle className='h-4 w-4' />
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <AlertDescription>
                        System maintenance scheduled for tonight at 2:00 AM EST
                      </AlertDescription>
                    </Alert>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-sm font-medium'>Maintenance Mode</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='mt-2 flex items-center gap-4'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Button size='sm' variant='destructive'>
                          Enable Maintenance
                        </Button>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-sm text-gray-600'>Last maintenance: 3 days ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default UnifiedSettingsAdminPage;
