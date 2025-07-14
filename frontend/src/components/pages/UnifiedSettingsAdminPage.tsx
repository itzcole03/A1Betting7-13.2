import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
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
        return <CheckCircle className='h-4 w-4' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4' />;
      case 'offline':
        return <AlertTriangle className='h-4 w-4' />;
      default:
        return <Activity className='h-4 w-4' />;
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4'>
      <div className='max-w-7xl mx-auto space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
              <Settings className='h-8 w-8 text-blue-600' />
              Settings & Administration
            </h1>
            <p className='text-gray-600 mt-2'>
              Configure your betting experience and {isAdmin && 'manage system administration'}
            </p>
          </div>
          <Badge variant='outline' className='text-sm'>
            {isAdmin ? 'Administrator' : 'User'}
          </Badge>
        </div>

        <Tabs defaultValue='user-settings' className='w-full'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='user-settings' className='flex items-center gap-2'>
              <Users className='h-4 w-4' />
              User Settings
            </TabsTrigger>
            <TabsTrigger value='ai-config' className='flex items-center gap-2'>
              <Brain className='h-4 w-4' />
              AI Configuration
            </TabsTrigger>
            <TabsTrigger value='platforms' className='flex items-center gap-2'>
              <Globe className='h-4 w-4' />
              Platforms
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value='system-status' className='flex items-center gap-2'>
                  <Server className='h-4 w-4' />
                  System Status
                </TabsTrigger>
                <TabsTrigger value='admin-tools' className='flex items-center gap-2'>
                  <Shield className='h-4 w-4' />
                  Admin Tools
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value='user-settings' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5' />
                    Risk & Portfolio Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>Risk Tolerance</label>
                    <div className='mt-2 grid grid-cols-3 gap-2'>
                      {['conservative', 'moderate', 'aggressive'].map(level => (
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

                  <div>
                    <label className='text-sm font-medium'>Portfolio Size ($)</label>
                    <Input
                      type='number'
                      value={userSettings.portfolioSize}
                      onChange={e => handleSettingChange('portfolioSize', parseInt(e.target.value))}
                      className='mt-2'
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <label className='text-sm font-medium'>Auto-Stacking</label>
                    <Switch
                      checked={userSettings.autoStaking}
                      onCheckedChange={checked => handleSettingChange('autoStaking', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Zap className='h-5 w-5' />
                    Notifications & Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <label className='text-sm font-medium'>Push Notifications</label>
                    <Switch
                      checked={userSettings.notifications}
                      onCheckedChange={checked => handleSettingChange('notifications', checked)}
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <label className='text-sm font-medium'>AI Insights</label>
                    <Switch
                      checked={userSettings.aiInsights}
                      onCheckedChange={checked => handleSettingChange('aiInsights', checked)}
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <label className='text-sm font-medium'>Quantum Analysis (Beta)</label>
                    <Switch
                      checked={userSettings.quantumAnalysis}
                      onCheckedChange={checked => handleSettingChange('quantumAnalysis', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='flex justify-end'>
              <Button onClick={handleSaveSettings} className='bg-blue-600 hover:bg-blue-700'>
                Save Settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value='ai-config' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Brain className='h-5 w-5' />
                    AI Model Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>Primary Model</label>
                    <select className='mt-2 w-full p-2 border rounded-md'>
                      <option>Neural Ensemble v3.2</option>
                      <option>Quantum Hybrid v2.1</option>
                      <option>Traditional ML Stack</option>
                    </select>
                  </div>

                  <div>
                    <label className='text-sm font-medium'>Confidence Threshold</label>
                    <div className='mt-2 flex items-center gap-4'>
                      <Progress value={75} className='flex-1' />
                      <span className='text-sm font-medium'>75%</span>
                    </div>
                  </div>

                  <div>
                    <label className='text-sm font-medium'>Feature Importance Display</label>
                    <div className='mt-2 space-y-2'>
                      <div className='flex items-center gap-2'>
                        <input type='checkbox' defaultChecked />
                        <span className='text-sm'>SHAP Values</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <input type='checkbox' defaultChecked />
                        <span className='text-sm'>Correlation Heatmap</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <input type='checkbox' />
                        <span className='text-sm'>Advanced Explanations</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5' />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='text-center p-3 bg-green-50 rounded-lg'>
                      <div className='text-2xl font-bold text-green-600'>87.3%</div>
                      <div className='text-sm text-gray-600'>Accuracy (7d)</div>
                    </div>
                    <div className='text-center p-3 bg-blue-50 rounded-lg'>
                      <div className='text-2xl font-bold text-blue-600'>+12.4%</div>
                      <div className='text-sm text-gray-600'>ROI (30d)</div>
                    </div>
                  </div>

                  <div>
                    <label className='text-sm font-medium'>Model Training</label>
                    <div className='mt-2 space-y-2'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm'>Last Training</span>
                        <span className='text-sm text-gray-600'>2 hours ago</span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm'>Next Training</span>
                        <span className='text-sm text-gray-600'>In 6 hours</span>
                      </div>
                      <Button size='sm' variant='outline' className='w-full'>
                        Trigger Manual Training
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='platforms' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {['PrizePicks', 'DraftKings', 'FanDuel'].map(platform => (
                <Card key={platform}>
                  <CardHeader>
                    <CardTitle className='flex items-center justify-between'>
                      {platform}
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
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Enable Platform</span>
                      <Switch
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

                    <div>
                      <label className='text-sm font-medium'>API Status</label>
                      <div className='mt-2 flex items-center gap-2'>
                        <CheckCircle className='h-4 w-4 text-green-600' />
                        <span className='text-sm text-green-600'>Connected</span>
                      </div>
                    </div>

                    <div>
                      <label className='text-sm font-medium'>Data Freshness</label>
                      <div className='mt-2 text-sm text-gray-600'>Updated 30 seconds ago</div>
                    </div>

                    <Button size='sm' variant='outline' className='w-full'>
                      Test Connection
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value='system-status' className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Server className='h-5 w-5' />
                      Service Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {systemStatus.map(service => (
                        <div
                          key={service.service}
                          className='flex items-center justify-between p-3 border rounded-lg'
                        >
                          <div className='flex items-center gap-3'>
                            <Badge className={getStatusColor(service.status)}>
                              {getStatusIcon(service.status)}
                              {service.status}
                            </Badge>
                            <div>
                              <div className='font-medium'>{service.service}</div>
                              <div className='text-sm text-gray-600'>Uptime: {service.uptime}</div>
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='text-sm font-medium'>{service.performance}%</div>
                            <div className='text-xs text-gray-600'>{service.lastUpdated}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Activity className='h-5 w-5' />
                      System Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div>
                      <div className='flex justify-between items-center mb-2'>
                        <span className='text-sm font-medium'>CPU Usage</span>
                        <span className='text-sm'>34%</span>
                      </div>
                      <Progress value={34} />
                    </div>

                    <div>
                      <div className='flex justify-between items-center mb-2'>
                        <span className='text-sm font-medium'>Memory Usage</span>
                        <span className='text-sm'>67%</span>
                      </div>
                      <Progress value={67} />
                    </div>

                    <div>
                      <div className='flex justify-between items-center mb-2'>
                        <span className='text-sm font-medium'>Disk Usage</span>
                        <span className='text-sm'>23%</span>
                      </div>
                      <Progress value={23} />
                    </div>

                    <div>
                      <div className='flex justify-between items-center mb-2'>
                        <span className='text-sm font-medium'>Network I/O</span>
                        <span className='text-sm'>12 MB/s</span>
                      </div>
                      <Progress value={45} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value='admin-tools' className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Key className='h-5 w-5' />
                      API Key Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {Object.entries(apiKeys).map(([platform, key]) => (
                      <div key={platform} className='space-y-2'>
                        <label className='text-sm font-medium capitalize'>{platform} API Key</label>
                        <div className='flex gap-2'>
                          <Input type='password' value={key} readOnly className='font-mono' />
                          <Button size='sm' variant='outline'>
                            Rotate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Database className='h-5 w-5' />
                      Data Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-2 gap-2'>
                      <Button size='sm' variant='outline'>
                        Export Logs
                      </Button>
                      <Button size='sm' variant='outline'>
                        Backup Data
                      </Button>
                      <Button size='sm' variant='outline'>
                        Clear Cache
                      </Button>
                      <Button size='sm' variant='outline'>
                        Reset Models
                      </Button>
                    </div>

                    <Alert>
                      <AlertTriangle className='h-4 w-4' />
                      <AlertDescription>
                        System maintenance scheduled for tonight at 2:00 AM EST
                      </AlertDescription>
                    </Alert>

                    <div>
                      <label className='text-sm font-medium'>Maintenance Mode</label>
                      <div className='mt-2 flex items-center gap-4'>
                        <Button size='sm' variant='destructive'>
                          Enable Maintenance
                        </Button>
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
