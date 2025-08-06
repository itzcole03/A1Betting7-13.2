import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Cpu,
  Database,
  Edit,
  Eye,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Types and Interfaces
interface MLModel {
  id: string;
  name: string;
  type: 'transformer' | 'neural_network' | 'ensemble' | 'bayesian';
  status: 'active' | 'training' | 'inactive' | 'error';
  accuracy: number;
  last_updated: string;
  version: string;
  performance_metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc: number;
  };
  deployment: {
    environment: 'development' | 'staging' | 'production';
    replicas: number;
    cpu_usage: number;
    memory_usage: number;
  };
}

const MLModelCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockModels: MLModel[] = [
      {
        id: 'model-1',
        name: 'Sports Transformer v2.1',
        type: 'transformer',
        status: 'active',
        accuracy: 0.847,
        last_updated: '2025-01-05T10:30:00Z',
        version: '2.1.3',
        performance_metrics: {
          precision: 0.832,
          recall: 0.856,
          f1_score: 0.844,
          auc_roc: 0.891,
        },
        deployment: {
          environment: 'production',
          replicas: 3,
          cpu_usage: 65,
          memory_usage: 78,
        },
      },
      {
        id: 'model-2',
        name: 'Bayesian Ensemble Model',
        type: 'bayesian',
        status: 'training',
        accuracy: 0.823,
        last_updated: '2025-01-05T09:15:00Z',
        version: '1.8.2',
        performance_metrics: {
          precision: 0.819,
          recall: 0.827,
          f1_score: 0.823,
          auc_roc: 0.878,
        },
        deployment: {
          environment: 'staging',
          replicas: 1,
          cpu_usage: 45,
          memory_usage: 52,
        },
      },
    ];

    setModels(mockModels);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'text-green-500 bg-green-100';
      case 'training':
      case 'running':
        return 'text-blue-500 bg-blue-100';
      case 'queued':
        return 'text-yellow-500 bg-yellow-100';
      case 'inactive':
        return 'text-gray-500 bg-gray-100';
      case 'error':
      case 'failed':
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getModelIcon = (type: string) => {
    switch (type) {
      case 'transformer':
        return <Brain className='w-5 h-5' />;
      case 'neural_network':
        return <Cpu className='w-5 h-5' />;
      case 'bayesian':
        return <BarChart3 className='w-5 h-5' />;
      case 'ensemble':
        return <Database className='w-5 h-5' />;
      default:
        return <Brain className='w-5 h-5' />;
    }
  };

  const formatMetric = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  const renderModelsOverview = () => (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='flex items-center'>
            <div className='p-3 rounded-full bg-blue-100 text-blue-600 mr-4'>
              <Brain className='w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Models</p>
              <p className='text-2xl font-bold text-gray-900'>{models.length}</p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='flex items-center'>
            <div className='p-3 rounded-full bg-green-100 text-green-600 mr-4'>
              <CheckCircle className='w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Active Models</p>
              <p className='text-2xl font-bold text-gray-900'>
                {models.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='flex items-center'>
            <div className='p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4'>
              <Activity className='w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Training Jobs</p>
              <p className='text-2xl font-bold text-gray-900'>1</p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='flex items-center'>
            <div className='p-3 rounded-full bg-purple-100 text-purple-600 mr-4'>
              <TrendingUp className='w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Avg Accuracy</p>
              <p className='text-2xl font-bold text-gray-900'>
                {formatMetric(models.reduce((acc, m) => acc + m.accuracy, 0) / models.length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Models List */}
      <div className='bg-white rounded-lg shadow-md'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900'>Model Registry</h3>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Model
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Accuracy
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Environment
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Version
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {models.map(model => (
                <tr key={model.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0 mr-3'>{getModelIcon(model.type)}</div>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>{model.name}</div>
                        <div className='text-sm text-gray-500'>{model.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        model.status
                      )}`}
                    >
                      {model.status}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {formatMetric(model.accuracy)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {model.deployment.environment}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {model.version}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                    <button className='text-blue-600 hover:text-blue-900'>
                      <Eye className='w-4 h-4' />
                    </button>
                    <button className='text-green-600 hover:text-green-900'>
                      <Edit className='w-4 h-4' />
                    </button>
                    <button className='text-red-600 hover:text-red-900'>
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 flex items-center space-x-3'>
            <Brain className='w-8 h-8 text-blue-600' />
            <span>AI/ML Model Center</span>
          </h1>
          <p className='text-gray-600 mt-2'>
            Comprehensive AI/ML management platform for enterprise-grade model lifecycle
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <AlertTriangle className='w-5 h-5 text-red-500' />
              <span className='text-red-700'>{error}</span>
            </div>
            <button onClick={() => setError(null)} className='text-red-500 hover:text-red-700'>
              <X className='w-5 h-5' />
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className='mb-6'>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full animate-pulse'
                style={{ width: '45%' }}
              ></div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className='mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              {[
                { id: 'overview', label: 'Models Overview', icon: Brain },
                { id: 'training', label: 'Training Jobs', icon: Activity },
                { id: 'comparison', label: 'Model Comparison', icon: BarChart3 },
                { id: 'deployment', label: 'Deployment', icon: Upload },
                { id: 'performance', label: 'Performance', icon: TrendingUp },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        {renderModelsOverview()}
      </div>
    </div>
  );
};

export default MLModelCenter;
