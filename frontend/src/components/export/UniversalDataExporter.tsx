/**
 * Universal Data Exporter
 * Phase 3: Advanced UI Features - Comprehensive data export capabilities
 * 
 * Features:
 * - Multiple format support (CSV, JSON, PDF, Excel)
 * - Customizable data selection
 * - Advanced formatting options
 * - Batch export capabilities
 * - Export templates and presets
 * - Real-time export progress
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Download,
  FileText,
  Database,
  Table,
  Settings,
  Check,
  X,
  Filter,
  Calendar,
  Users,
  BarChart3,
  FileImage,
  FileSpreadsheet,
  Loader,
  Share2,
  Mail,
  Cloud,
  Eye
} from 'lucide-react';

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'excel' | 'xml';

export interface ExportField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  format?: string;
  required?: boolean;
  defaultIncluded?: boolean;
}

export interface ExportOptions {
  format: ExportFormat;
  fields: string[];
  filters: Record<string, any>;
  sorting: { field: string; direction: 'asc' | 'desc' };
  pagination: { limit?: number; offset?: number };
  formatting: {
    dateFormat?: string;
    numberFormat?: string;
    includeHeaders?: boolean;
    includeMetadata?: boolean;
  };
  customization: {
    filename?: string;
    title?: string;
    description?: string;
    watermark?: string;
  };
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  dataType: string;
  options: ExportOptions;
  isPublic: boolean;
  createdAt: string;
}

interface UniversalDataExporterProps {
  dataType: 'bets' | 'players' | 'odds' | 'props' | 'analytics' | 'custom';
  data: any[];
  availableFields: ExportField[];
  onExport: (options: ExportOptions) => Promise<Blob>;
  templates?: ExportTemplate[];
  className?: string;
}

const UniversalDataExporter: React.FC<UniversalDataExporterProps> = ({
  dataType,
  data,
  availableFields,
  onExport,
  templates = [],
  className = ''
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'format' | 'fields' | 'filters' | 'templates'>('format');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    fields: availableFields.filter(f => f.defaultIncluded).map(f => f.key),
    filters: {},
    sorting: { field: 'created_at', direction: 'desc' },
    pagination: { limit: 1000 },
    formatting: {
      dateFormat: 'YYYY-MM-DD',
      numberFormat: '0.00',
      includeHeaders: true,
      includeMetadata: true
    },
    customization: {
      filename: `${dataType}_export_${new Date().toISOString().split('T')[0]}`,
      title: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Export`,
      description: 'Exported data from A1Betting platform'
    }
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Format configurations
  const formatConfigs = {
    csv: {
      name: 'CSV',
      description: 'Comma-separated values for spreadsheets',
      icon: Table,
      extensions: ['.csv'],
      features: ['headers', 'custom_delimiter', 'encoding']
    },
    json: {
      name: 'JSON',
      description: 'JavaScript Object Notation for APIs',
      icon: Database,
      extensions: ['.json'],
      features: ['nested_objects', 'metadata', 'compression']
    },
    pdf: {
      name: 'PDF',
      description: 'Portable Document Format for reports',
      icon: FileText,
      extensions: ['.pdf'],
      features: ['formatting', 'charts', 'watermark', 'pagination']
    },
    excel: {
      name: 'Excel',
      description: 'Microsoft Excel spreadsheet',
      icon: FileSpreadsheet,
      extensions: ['.xlsx', '.xls'],
      features: ['multiple_sheets', 'formulas', 'styling', 'charts']
    },
    xml: {
      name: 'XML',
      description: 'Extensible Markup Language',
      icon: FileImage,
      extensions: ['.xml'],
      features: ['schema', 'validation', 'namespaces']
    }
  };

  // Generate preview data
  const generatePreview = useCallback(() => {
    const filteredData = data.slice(0, 5); // Show first 5 rows
    const selectedFields = exportOptions.fields;
    
    const preview = filteredData.map(item => {
      const previewItem: any = {};
      selectedFields.forEach(fieldKey => {
        const field = availableFields.find(f => f.key === fieldKey);
        if (field && item[fieldKey] !== undefined) {
          previewItem[field.label] = formatFieldValue(item[fieldKey], field);
        }
      });
      return previewItem;
    });
    
    setPreviewData(preview);
  }, [data, exportOptions.fields, availableFields]);

  // Format field value based on type and format
  const formatFieldValue = (value: any, field: ExportField): string => {
    if (value === null || value === undefined) return '';
    
    switch (field.type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return typeof value === 'number' ? value.toFixed(2) : value.toString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'object':
        return JSON.stringify(value);
      default:
        return value.toString();
    }
  };

  // Handle export execution
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const blob = await onExport(exportOptions);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportOptions.customization.filename}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setIsOpen(false);
      }, 1000);
      
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Apply export template
  const applyTemplate = (template: ExportTemplate) => {
    setExportOptions(template.options);
  };

  // Update export options
  const updateOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  };

  // Calculate estimated file size
  const estimatedFileSize = useMemo(() => {
    const dataSize = data.length * exportOptions.fields.length * 50; // Rough estimate
    const sizeInKB = Math.round(dataSize / 1024);
    if (sizeInKB > 1024) {
      return `${(sizeInKB / 1024).toFixed(1)} MB`;
    }
    return `${sizeInKB} KB`;
  }, [data.length, exportOptions.fields.length]);

  // Generate preview when options change
  React.useEffect(() => {
    if (showPreview) {
      generatePreview();
    }
  }, [generatePreview, showPreview]);

  return (
    <div className={`universal-data-exporter ${className}`}>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Download className="w-4 h-4" />
        <span>Export Data</span>
        {data.length > 0 && (
          <span className="px-2 py-1 bg-blue-500 text-xs rounded-full">
            {data.length}
          </span>
        )}
      </button>

      {/* Export Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Export Data</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Export {data.length} records in multiple formats
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'format', label: 'Format', icon: FileText },
                  { id: 'fields', label: 'Fields', icon: Database },
                  { id: 'filters', label: 'Options', icon: Settings },
                  { id: 'templates', label: 'Templates', icon: FileSpreadsheet }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'format' && (
                <FormatSelectionTab
                  formats={formatConfigs}
                  selectedFormat={exportOptions.format}
                  onFormatChange={(format) => updateOptions({ format })}
                  estimatedSize={estimatedFileSize}
                />
              )}

              {activeTab === 'fields' && (
                <FieldSelectionTab
                  availableFields={availableFields}
                  selectedFields={exportOptions.fields}
                  onFieldsChange={(fields) => updateOptions({ fields })}
                  dataType={dataType}
                />
              )}

              {activeTab === 'filters' && (
                <OptionsTab
                  options={exportOptions}
                  onOptionsChange={updateOptions}
                  format={exportOptions.format}
                />
              )}

              {activeTab === 'templates' && (
                <TemplatesTab
                  templates={templates}
                  currentOptions={exportOptions}
                  onTemplateApply={applyTemplate}
                  dataType={dataType}
                />
              )}
            </div>

            {/* Preview Section */}
            {showPreview && previewData.length > 0 && (
              <div className="border-t border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Preview</h3>
                <div className="overflow-x-auto max-h-40">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(previewData[0] || {}).map(key => (
                          <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          {Object.values(row).map((value: any, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-sm text-gray-800">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                </button>
                
                <div className="text-sm text-gray-600">
                  {exportOptions.fields.length} fields • Est. size: {estimatedFileSize}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleExport}
                  disabled={isExporting || exportOptions.fields.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Exporting... {exportProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Format Selection Tab
const FormatSelectionTab: React.FC<{
  formats: any;
  selectedFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  estimatedSize: string;
}> = ({ formats, selectedFormat, onFormatChange, estimatedSize }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-3">Select Export Format</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(formats).map(([formatKey, config]: [string, any]) => (
          <button
            key={formatKey}
            onClick={() => onFormatChange(formatKey as ExportFormat)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              selectedFormat === formatKey
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <config.icon className={`w-6 h-6 ${
                selectedFormat === formatKey ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <h4 className={`font-medium ${
                selectedFormat === formatKey ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {config.name}
              </h4>
            </div>
            <p className={`text-sm ${
              selectedFormat === formatKey ? 'text-blue-700' : 'text-gray-600'
            }`}>
              {config.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {config.features.map((feature: string) => (
                <span
                  key={feature}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                >
                  {feature.replace('_', ' ')}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-2">Export Information</h4>
      <div className="text-sm text-blue-800 space-y-1">
        <p>• Estimated file size: {estimatedSize}</p>
        <p>• Format: {formats[selectedFormat]?.name}</p>
        <p>• Extensions: {formats[selectedFormat]?.extensions.join(', ')}</p>
      </div>
    </div>
  </div>
);

// Field Selection Tab
const FieldSelectionTab: React.FC<{
  availableFields: ExportField[];
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
  dataType: string;
}> = ({ availableFields, selectedFields, onFieldsChange, dataType }) => {
  const toggleField = (fieldKey: string) => {
    if (selectedFields.includes(fieldKey)) {
      onFieldsChange(selectedFields.filter(f => f !== fieldKey));
    } else {
      onFieldsChange([...selectedFields, fieldKey]);
    }
  };

  const selectAll = () => {
    onFieldsChange(availableFields.map(f => f.key));
  };

  const selectNone = () => {
    onFieldsChange([]);
  };

  const selectDefaults = () => {
    onFieldsChange(availableFields.filter(f => f.defaultIncluded).map(f => f.key));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800">Select Fields to Export</h3>
        <div className="flex space-x-2">
          <button onClick={selectAll} className="text-sm text-blue-600 hover:text-blue-700">
            Select All
          </button>
          <button onClick={selectDefaults} className="text-sm text-blue-600 hover:text-blue-700">
            Defaults
          </button>
          <button onClick={selectNone} className="text-sm text-blue-600 hover:text-blue-700">
            None
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
        {availableFields.map(field => (
          <label
            key={field.key}
            className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedFields.includes(field.key)}
              onChange={() => toggleField(field.key)}
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{field.label}</span>
                {field.required && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">Type: {field.type}</p>
              {field.format && (
                <p className="text-xs text-gray-500">Format: {field.format}</p>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="text-sm text-gray-600">
        {selectedFields.length} of {availableFields.length} fields selected
      </div>
    </div>
  );
};

// Options Tab
const OptionsTab: React.FC<{
  options: ExportOptions;
  onOptionsChange: (updates: Partial<ExportOptions>) => void;
  format: ExportFormat;
}> = ({ options, onOptionsChange, format }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-4">Export Options</h3>
      
      {/* Filename */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filename
        </label>
        <input
          type="text"
          value={options.customization.filename || ''}
          onChange={(e) => onOptionsChange({
            customization: { ...options.customization, filename: e.target.value }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter filename without extension"
        />
      </div>

      {/* Formatting Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.formatting.includeHeaders || false}
              onChange={(e) => onOptionsChange({
                formatting: { ...options.formatting, includeHeaders: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Include headers</span>
          </label>
        </div>
        
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.formatting.includeMetadata || false}
              onChange={(e) => onOptionsChange({
                formatting: { ...options.formatting, includeMetadata: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Include metadata</span>
          </label>
        </div>
      </div>

      {/* Date Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date Format
        </label>
        <select
          value={options.formatting.dateFormat || 'YYYY-MM-DD'}
          onChange={(e) => onOptionsChange({
            formatting: { ...options.formatting, dateFormat: e.target.value }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="YYYY-MM-DD">2024-01-15</option>
          <option value="MM/DD/YYYY">01/15/2024</option>
          <option value="DD/MM/YYYY">15/01/2024</option>
          <option value="YYYY-MM-DD HH:mm:ss">2024-01-15 14:30:00</option>
        </select>
      </div>

      {/* Limit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Record Limit (0 = no limit)
        </label>
        <input
          type="number"
          value={options.pagination.limit || 0}
          onChange={(e) => onOptionsChange({
            pagination: { ...options.pagination, limit: parseInt(e.target.value) || undefined }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          max="10000"
        />
      </div>
    </div>
  </div>
);

// Templates Tab
const TemplatesTab: React.FC<{
  templates: ExportTemplate[];
  currentOptions: ExportOptions;
  onTemplateApply: (template: ExportTemplate) => void;
  dataType: string;
}> = ({ templates, currentOptions, onTemplateApply, dataType }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium text-gray-800">Export Templates</h3>
      <button className="text-sm text-blue-600 hover:text-blue-700">
        Create Template
      </button>
    </div>

    {templates.length > 0 ? (
      <div className="space-y-3">
        {templates.filter(t => t.dataType === dataType || t.dataType === 'all').map(template => (
          <div key={template.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    {template.options.format.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {template.options.fields.length} fields
                  </span>
                  {template.isPublic && (
                    <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                      Public
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onTemplateApply(template)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8">
        <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-600 mb-2">No Templates Available</h4>
        <p className="text-gray-500">Create your first export template to save time</p>
      </div>
    )}
  </div>
);

export default UniversalDataExporter;
