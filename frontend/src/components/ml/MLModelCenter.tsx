// ML Model Center - Enterprise ML Lifecycle Management
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
import { DemoModeIndicator } from '../shared/DemoModeIndicator';

export interface MLModelDeployment {
  environment: 'development' | 'staging' | 'production';
  replicas: number;
  cpu_usage: number;
  memory_usage: number;
}

export interface MLModel {
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
  deployment: MLModelDeployment;
}

// MLModelRegistryService - Real API integration
export class MLModelRegistryService {
  private static instance: MLModelRegistryService;
  private baseURL: string;

  private constructor() {
    this.baseURL = '/api/models';
  }

  public static getInstance(): MLModelRegistryService {
    if (!MLModelRegistryService.instance) {
      MLModelRegistryService.instance = new MLModelRegistryService();
    }
    return MLModelRegistryService.instance;
  }

  public async fetchModels(): Promise<MLModel[]> {
    try {
      console.log('[MLModelCenter] Fetching models from API...');
      const response = await fetch(`${this.baseURL}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // Increased timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MLModelCenter] API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[MLModelCenter] API Response:', data);

      // Handle different response formats
      const modelsArray = data.models || data || [];
      if (!Array.isArray(modelsArray)) {
        console.warn('[MLModelCenter] Unexpected response format, expected array');
        throw new Error('Invalid response format: expected models array');
      }

      // Transform API response to MLModel format
      const models: MLModel[] = modelsArray.map((model: any) => ({
        id: model.id,
        name: model.name,
        type: this.mapModelType(model.model_type),
        status: this.mapModelStatus(model.status),
        accuracy: (model.metrics?.accuracy || 0) * 100, // Convert to percentage
        last_updated: model.updated_at || model.created_at,
        version: model.version,
        performance_metrics: {
          precision: (model.metrics?.precision || 0) * 100,
          recall: (model.metrics?.recall || 0) * 100,
          f1_score: (model.metrics?.f1_score || 0) * 100,
          auc_roc: (model.metrics?.auc_score || model.metrics?.auc_roc || 0) * 100,
        },
        deployment: {
          environment: model.status === 'active' ? 'production' : 'staging',
          replicas: 1,
          cpu_usage: Math.floor(Math.random() * 40) + 40, // Mock CPU usage
          memory_usage: Math.floor(Math.random() * 30) + 50, // Mock memory usage
        },
      }));

      console.log('[MLModelCenter] Transformed models:', models);
      return models;

    } catch (error) {
      console.warn('[MLModelCenter] Failed to fetch real data, using demo mode:', error);
      // Fallback to mock data when backend is not running or has errors
      return this.getMockModels();
    }
  }

  public async uploadEvaluation(modelId: string, file: File, description: string = ''): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('evaluation_file', file);
      formData.append('description', description);
      formData.append('dataset_name', 'test_dataset');

      const response = await fetch(`${this.baseURL}/${modelId}/evaluation`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[MLModelCenter] Evaluation upload failed:', error);
      throw error;
    }
  }

  public async deleteModel(modelId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/${modelId}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('[MLModelCenter] Model deletion failed:', error);
      return false;
    }
  }

  private mapModelType(apiType: string): 'transformer' | 'neural_network' | 'ensemble' | 'bayesian' {
    switch (apiType?.toLowerCase()) {
      case 'transformer':
        return 'transformer';
      case 'ensemble':
        return 'ensemble';
      case 'neural_network':
      case 'nn':
        return 'neural_network';
      case 'bayesian':
        return 'bayesian';
      default:
        return 'ensemble';
    }
  }

  private mapModelStatus(apiStatus: string): 'active' | 'training' | 'inactive' | 'error' {
    switch (apiStatus?.toLowerCase()) {
      case 'active':
      case 'deployed':
      case 'production':
        return 'active';
      case 'training':
      case 'running':
        return 'training';
      case 'inactive':
      case 'staging':
      case 'created':
        return 'inactive';
      case 'error':
      case 'failed':
        return 'error';
      default:
        return 'inactive';
    }
  }

  private getMockModels(): MLModel[] {
    console.log('[MLModelCenter] Providing demo mode models (backend unavailable)');
    return [
      {
        id: 'demo-transformer-1',
        name: 'MLB Transformer',
        type: 'transformer',
        status: 'active',
        accuracy: 84.7, // Already in percentage
        last_updated: new Date().toISOString(),
        version: '2.1.3',
        performance_metrics: {
          precision: 83.2,
          recall: 85.6,
          f1_score: 84.4,
          auc_roc: 89.1,
        },
        deployment: {
          environment: 'production',
          replicas: 3,
          cpu_usage: 65,
          memory_usage: 78,
        },
      },
      {
        id: 'demo-ensemble-1',
        name: 'MLB Ensemble Model',
        type: 'ensemble',
        status: 'active',
        accuracy: 89.2,
        last_updated: new Date().toISOString(),
        version: '1.5.2',
        performance_metrics: {
          precision: 87.6,
          recall: 90.4,
          f1_score: 88.9,
          auc_roc: 92.3,
        },
        deployment: {
          environment: 'production',
          replicas: 2,
          cpu_usage: 72,
          memory_usage: 84,
        },
      },
      {
        id: 'demo-bayesian-1',
        name: 'Bayesian Risk Model',
        type: 'bayesian',
        status: 'training',
        accuracy: 82.3,
        last_updated: new Date().toISOString(),
        version: '1.2.1',
        performance_metrics: {
          precision: 81.2,
          recall: 83.4,
          f1_score: 82.3,
          auc_roc: 86.7,
        },
        deployment: {
          environment: 'staging',
          replicas: 1,
          cpu_usage: 45,
          memory_usage: 62,
        },
      },
    ];
  }
}

// Utility for status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'training':
      return 'bg-yellow-100 text-yellow-700';
    case 'inactive':
      return 'bg-gray-100 text-gray-700';
    case 'error':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const MLModelCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; modelId?: string }>({ open: false });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Load models on component mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const fetchedModels = await MLModelRegistryService.getInstance().fetchModels();
      setModels(fetchedModels);
      setError(null);
      // Check if we're using demo data
      setDemoMode(fetchedModels.length > 0 && fetchedModels[0].id.includes('demo'));
    } catch (err) {
      // Don't show error for demo mode fallback
      setError(null);
      setDemoMode(true);
      console.log('[MLModelCenter] Using demo models (backend unavailable)');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEvaluation = async () => {
    if (!uploadFile || !uploadModal.modelId) return;

    setUploading(true);
    try {
      await MLModelRegistryService.getInstance().uploadEvaluation(
        uploadModal.modelId,
        uploadFile,
        uploadDescription
      );

      // Refresh models to show updated metrics
      await loadModels();

      // Close modal and reset state
      setUploadModal({ open: false });
      setUploadFile(null);
      setUploadDescription('');

      console.log('[MLModelCenter] Evaluation uploaded successfully');
    } catch (error) {
      console.error('[MLModelCenter] Evaluation upload failed:', error);
      setError('Failed to upload evaluation');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      const success = await MLModelRegistryService.getInstance().deleteModel(modelId);
      if (success) {
        await loadModels();
        console.log('[MLModelCenter] Model deleted successfully');
      } else {
        setError('Failed to delete model');
      }
    } catch (error) {
      console.error('[MLModelCenter] Model deletion failed:', error);
      setError('Failed to delete model');
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
                {models.filter((m: MLModel) => m.status === 'active').length}
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
                {formatMetric(
                  models.reduce((acc: number, m: MLModel) => acc + m.accuracy, 0) / models.length
                )}
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
              {models.map((model: MLModel) => (
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
                    <button
                      className='text-blue-600 hover:text-blue-900'
                      title="View Details"
                    >
                      <Eye className='w-4 h-4' />
                    </button>
                    <button
                      className='text-purple-600 hover:text-purple-900'
                      onClick={() => setUploadModal({ open: true, modelId: model.id })}
                      title="Upload Evaluation"
                    >
                      <Upload className='w-4 h-4' />
                    </button>
                    <button
                      className='text-green-600 hover:text-green-900'
                      title="Edit Model"
                    >
                      <Edit className='w-4 h-4' />
                    </button>
                    <button
                      className='text-red-600 hover:text-red-900'
                      onClick={() => handleDeleteModel(model.id)}
                      title="Delete Model"
                    >
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
          <h1
            data-testid='ml-model-center-heading'
            className='text-3xl font-bold text-gray-900 flex items-center space-x-3'
          >
            <Brain className='w-8 h-8 text-blue-600' />
            <span>AI/ML Model Center</span>
          </h1>
          <p className='text-gray-600 mt-2'>
            Comprehensive AI/ML management platform for enterprise-grade model lifecycle
          </p>
        </div>

        {/* Demo Mode Indicator */}
        <DemoModeIndicator
          show={demoMode}
          message="Demo Mode - Showing sample ML models (backend unavailable)"
        />

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

      {/* Evaluation Upload Modal */}
      {uploadModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Upload className="h-6 w-6 text-purple-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Upload Model Evaluation
                    </h3>
                    <div className="mt-4 space-y-4">
                      {/* File Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Evaluation File (JSON)
                        </label>
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Upload a JSON file containing evaluation metrics (accuracy, precision, recall, etc.)
                        </p>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Description (Optional)
                        </label>
                        <textarea
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Describe this evaluation..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUploadEvaluation}
                  disabled={!uploadFile || uploading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadModal({ open: false });
                    setUploadFile(null);
                    setUploadDescription('');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLModelCenter;
