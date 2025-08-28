/**
 * Smart Alerts Management Component
 * Complete user-facing alert system for PropFinder parity
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  History,
  TestTube,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AlertRule {
  rule_id: string;
  user_id: number;
  rule_type: string;
  is_active: boolean;
  conditions: Record<string, string | number | boolean>;
  cooldown_minutes: number;
  priority: string;
  created_at: string;
  last_triggered?: string;
}

interface AlertTrigger {
  trigger_id: string;
  rule_id: string;
  user_id: number;
  trigger_type: string;
  severity: string;
  message: string;
  data: Record<string, string | number | boolean>;
  triggered_at: string;
  expires_at?: string;
}

interface AlertRuleType {
  type: string;
  name: string;
  description: string;
}

interface SmartAlertsProps {
  className?: string;
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({ className = '' }) => {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertTriggers, setAlertTriggers] = useState<AlertTrigger[]>([]);
  const [ruleTypes, setRuleTypes] = useState<AlertRuleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Load alert rules
  const loadAlertRules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/alert-engine/rules');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setAlertRules(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to load alert rules');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alert rules');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load alert triggers/history
  const loadAlertTriggers = useCallback(async () => {
    try {
      const response = await fetch('/api/alert-engine/triggers?limit=100');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAlertTriggers(result.data);
        }
      }
    } catch {
      // Silently fail for triggers
    }
  }, []);

  // Load rule types
  const loadRuleTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/alert-engine/rule-types');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRuleTypes(result.data);
        }
      }
    } catch {
      // Silently fail for rule types
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadAlertRules();
    loadAlertTriggers();
    loadRuleTypes();
  }, [loadAlertRules, loadAlertTriggers, loadRuleTypes]);

  // Create alert rule
  const createAlertRule = useCallback(async (ruleData: Partial<AlertRule>) => {
    try {
      const response = await fetch('/api/alert-engine/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        await loadAlertRules();
        setShowCreateForm(false);
      } else {
        throw new Error(result.error?.message || 'Failed to create alert rule');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert rule');
    }
  }, [loadAlertRules]);

  // Update alert rule
  const updateAlertRule = useCallback(async (ruleId: string, ruleData: Partial<AlertRule>) => {
    try {
      const response = await fetch(`/api/alert-engine/rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        await loadAlertRules();
        setEditingRule(null);
      } else {
        throw new Error(result.error?.message || 'Failed to update alert rule');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert rule');
    }
  }, [loadAlertRules]);

  // Delete alert rule
  const deleteAlertRule = useCallback(async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/alert-engine/rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        await loadAlertRules();
      } else {
        throw new Error(result.error?.message || 'Failed to delete alert rule');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert rule');
    }
  }, [loadAlertRules]);

  // Toggle rule active status
  const toggleRuleStatus = useCallback(async (rule: AlertRule) => {
    await updateAlertRule(rule.rule_id, { ...rule, is_active: !rule.is_active });
  }, [updateAlertRule]);

  // Test alert rule
  const testAlertRule = useCallback(async (ruleType: string) => {
    try {
      const response = await fetch(`/api/alert-engine/test?rule_type=${ruleType}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`Test completed: ${result.data.triggers_generated} triggers generated from ${result.data.prop_data_count} props`);
        }
      }
    } catch {
      alert('Test failed - check console for details');
    }
  }, []);

  // Filter rules based on status
  const filteredRules = alertRules.filter(rule => {
    if (filterStatus === 'active') return rule.is_active;
    if (filterStatus === 'inactive') return !rule.is_active;
    return true;
  });

  // Get rule type info
  const getRuleTypeInfo = (ruleType: string) => {
    return ruleTypes.find(rt => rt.type === ruleType) || {
      name: ruleType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: 'Custom alert rule'
    };
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get rule type icon
  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'ev_threshold': return TrendingUp;
      case 'line_movement': return Activity;
      case 'arbitrage_opportunity': return DollarSign;
      default: return Bell;
    }
  };

  // Handle save rule (wrapper for create/update)
  const handleSaveRule = useCallback(async (ruleId: string, ruleData: Partial<AlertRule>) => {
    if (editingRule) {
      await updateAlertRule(ruleId, ruleData);
    } else {
      await createAlertRule(ruleData);
    }
  }, [editingRule, updateAlertRule, createAlertRule]);

  if (loading && alertRules.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2 text-gray-500">
            <Activity className="w-5 h-5 animate-spin" />
            <span>Loading alert rules...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <span>Smart Alerts</span>
            </h3>
            <p className="text-sm text-gray-500">
              {filteredRules.length} alert rules • {alertTriggers.length} recent triggers
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white"
            >
              <option value="all">All Rules</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-md transition-colors ${
                showHistory ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle alert history"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Create Rule Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Error:</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {showHistory ? (
          <AlertHistory
            triggers={alertTriggers}
            onClose={() => setShowHistory(false)}
          />
        ) : (
          <div className="space-y-4">
            {/* Alert Rules List */}
            {filteredRules.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Alert Rules</h3>
                <p className="text-gray-500 mb-4">Create your first alert rule to get notified about betting opportunities</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Your First Rule
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRules.map((rule) => {
                  const RuleIcon = getRuleTypeIcon(rule.rule_type);
                  const ruleTypeInfo = getRuleTypeInfo(rule.rule_type);

                  return (
                    <div
                      key={rule.rule_id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <RuleIcon className="w-5 h-5 text-gray-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {ruleTypeInfo.name}
                              </h4>
                              <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(rule.priority)}`}>
                                {rule.priority}
                              </span>
                              {rule.is_active ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400" />
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                              {ruleTypeInfo.description}
                            </p>

                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Cooldown: {rule.cooldown_minutes}min</span>
                              <span>Created: {new Date(rule.created_at).toLocaleDateString()}</span>
                              {rule.last_triggered && (
                                <span>Last triggered: {new Date(rule.last_triggered).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Test Button */}
                          <button
                            onClick={() => testAlertRule(rule.rule_type)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Test this rule"
                          >
                            <TestTube className="w-4 h-4" />
                          </button>

                          {/* Toggle Status */}
                          <button
                            onClick={() => toggleRuleStatus(rule)}
                            className={`p-2 rounded-md transition-colors ${
                              rule.is_active
                                ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                            title={rule.is_active ? 'Pause rule' : 'Activate rule'}
                          >
                            {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingRule(rule)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit rule"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => deleteAlertRule(rule.rule_id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Conditions Display */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                          <strong>Conditions:</strong>{' '}
                          {Object.entries(rule.conditions).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingRule) && (
        <AlertRuleForm
          rule={editingRule}
          ruleTypes={ruleTypes}
          onSave={handleSaveRule}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
};

// Alert Rule Form Component
interface AlertRuleFormProps {
  rule?: AlertRule | null;
  ruleTypes: AlertRuleType[];
  onSave: (ruleId: string, ruleData: Partial<AlertRule>) => Promise<void>;
  onCancel: () => void;
}

const AlertRuleForm: React.FC<AlertRuleFormProps> = ({
  rule,
  ruleTypes,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<AlertRule>>({
    rule_type: rule?.rule_type || 'ev_threshold',
    conditions: rule?.conditions || {},
    cooldown_minutes: rule?.cooldown_minutes || 30,
    priority: rule?.priority || 'medium',
    is_active: rule?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ruleId = rule?.rule_id || `rule_${Date.now()}`;
    await onSave(ruleId, formData);
  };

  const updateCondition = (key: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [key]: value
      }
    }));
  };

  const selectedRuleType = ruleTypes.find(rt => rt.type === formData.rule_type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {rule ? 'Edit Alert Rule' : 'Create Alert Rule'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Type
            </label>
            <select
              value={formData.rule_type}
              onChange={(e) => setFormData(prev => ({ ...prev, rule_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {ruleTypes.map((rt) => (
                <option key={rt.type} value={rt.type}>
                  {rt.name} - {rt.description}
                </option>
              ))}
            </select>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conditions
            </label>
            <div className="space-y-3">
              {selectedRuleType?.type === 'ev_threshold' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min EV %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={typeof formData.conditions?.min_ev_percentage === 'number' ? formData.conditions.min_ev_percentage : ''}
                      onChange={(e) => updateCondition('min_ev_percentage', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5.0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min Confidence %</label>
                    <input
                      type="number"
                      step="1"
                      value={typeof formData.conditions?.min_confidence === 'number' ? formData.conditions.min_confidence : ''}
                      onChange={(e) => updateCondition('min_confidence', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="70"
                    />
                  </div>
                </div>
              )}

              {selectedRuleType?.type === 'line_movement' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Movement Threshold</label>
                    <input
                      type="number"
                      step="0.1"
                      value={typeof formData.conditions?.movement_threshold === 'number' ? formData.conditions.movement_threshold : ''}
                      onChange={(e) => updateCondition('movement_threshold', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1.0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Time Window (hours)</label>
                    <input
                      type="number"
                      value={typeof formData.conditions?.time_window_hours === 'number' ? formData.conditions.time_window_hours : ''}
                      onChange={(e) => updateCondition('time_window_hours', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="24"
                    />
                  </div>
                </div>
              )}

              {selectedRuleType?.type === 'arbitrage_opportunity' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Profit %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={typeof formData.conditions?.min_profit_percentage === 'number' ? formData.conditions.min_profit_percentage : ''}
                    onChange={(e) => updateCondition('min_profit_percentage', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2.0"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Cooldown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cooldown Period (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={formData.cooldown_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, cooldown_minutes: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Rule is active
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Alert History Component
interface AlertHistoryProps {
  triggers: AlertTrigger[];
  onClose: () => void;
}

const AlertHistory: React.FC<AlertHistoryProps> = ({ triggers, onClose }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Alert History</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {triggers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No alert triggers yet</p>
          </div>
        ) : (
          triggers.map((trigger) => (
            <div
              key={trigger.trigger_id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      trigger.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      trigger.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      trigger.severity === 'medium' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trigger.severity}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(trigger.triggered_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="font-medium text-gray-900 mb-1">
                    {trigger.message}
                  </p>

                  <p className="text-sm text-gray-600">
                    Rule: {trigger.rule_id} • Type: {trigger.trigger_type}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SmartAlerts;