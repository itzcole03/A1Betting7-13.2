import { useCallback, useEffect, useState } from 'react';

export enum AlertType {
  VALUE_BET = 'value_bet',
  ODDS_MOVEMENT = 'odds_movement',
  INJURY_UPDATE = 'injury_update',
  LINEUP_CHANGE = 'lineup_change',
  WEATHER_ALERT = 'weather_alert',
  BETTING_OPPORTUNITY = 'betting_opportunity',
  PREDICTION_UPDATE = 'prediction_update',
  SYSTEM_ALERT = 'system_alert',
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SmartAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  sport?: string;
  gameId?: string;
  playerId?: string;
  data?: unknown;
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  actionable: boolean;
  actions?: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary' | 'danger';
}

export interface AlertFilters {
  types?: AlertType[];
  priorities?: AlertPriority[];
  sports?: string[];
  unreadOnly?: boolean;
  since?: Date;
}

export interface AlertPreferences {
  enableNotifications: boolean;
  enableSound: boolean;
  enableValueBets: boolean;
  enableOddsMovement: boolean;
  enableInjuryUpdates: boolean;
  enableLineupChanges: boolean;
  enableWeatherAlerts: boolean;
  minimumValue: number;
  minimumOddsMovement: number;
  priorityFilter: AlertPriority;
  sportsFilter: string[];
}

export const _useSmartAlerts = () => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<AlertPreferences>({
    enableNotifications: true,
    enableSound: true,
    enableValueBets: true,
    enableOddsMovement: true,
    enableInjuryUpdates: true,
    enableLineupChanges: true,
    enableWeatherAlerts: true,
    minimumValue: 0.05, // 5% value
    minimumOddsMovement: 0.1, // 10% odds movement
    priorityFilter: AlertPriority.LOW,
    sportsFilter: [],
  });

  const _fetchAlerts = useCallback(async (filters?: AlertFilters) => {
    try {
      setLoading(true);
      setError(null);

      const _notificationService = masterServiceRegistry.getService('notifications');
      if (!notificationService) {
        setAlerts([]);
        return;
      }

      const _data = await notificationService.getAlerts(filters);
      setAlerts(data || []);
    } catch (err) {
      const _errorMessage = err instanceof Error ? err.message : 'Failed to fetch alerts';
      setError(errorMessage);
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const _markAsRead = useCallback(async (alertId: string) => {
    try {
      const _notificationService = masterServiceRegistry.getService('notifications');
      if (notificationService?.markAsRead) {
        await notificationService.markAsRead(alertId);
      }

      setAlerts(prev =>
        prev.map(alert => (alert.id === alertId ? { ...alert, read: true } : alert))
      );
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  }, []);

  const _markAllAsRead = useCallback(async () => {
    try {
      const _notificationService = masterServiceRegistry.getService('notifications');
      if (notificationService?.markAllAsRead) {
        await notificationService.markAllAsRead();
      }

      setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  }, []);

  const _dismissAlert = useCallback(async (alertId: string) => {
    try {
      const _notificationService = masterServiceRegistry.getService('notifications');
      if (notificationService?.dismissAlert) {
        await notificationService.dismissAlert(alertId);
      }

      setAlerts(prev =>
        prev.map(alert => (alert.id === alertId ? { ...alert, dismissed: true } : alert))
      );
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  }, []);

  const _clearAlerts = useCallback(async (olderThan?: Date) => {
    try {
      const _notificationService = masterServiceRegistry.getService('notifications');
      if (notificationService?.clearAlerts) {
        await notificationService.clearAlerts(olderThan);
      }

      setAlerts(prev => (olderThan ? prev.filter(alert => alert.timestamp > olderThan) : []));
    } catch (err) {
      console.error('Failed to clear alerts:', err);
    }
  }, []);

  const _updatePreferences = useCallback(
    async (newPreferences: Partial<AlertPreferences>) => {
      try {
        const _updatedPrefs = { ...preferences, ...newPreferences };
        setPreferences(updatedPrefs);

        const _notificationService = masterServiceRegistry.getService('notifications');
        if (notificationService?.updatePreferences) {
          await notificationService.updatePreferences(updatedPrefs);
        }

        // Store in localStorage as backup
        localStorage.setItem('alertPreferences', JSON.stringify(updatedPrefs));
      } catch (err) {
        console.error('Failed to update alert preferences:', err);
      }
    },
    [preferences]
  );

  const _createAlert = useCallback(
    async (alertData: Omit<SmartAlert, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
      try {
        const _notificationService = masterServiceRegistry.getService('notifications');
        if (!notificationService?.createAlert) {
          return null;
        }

        const _alert = await notificationService.createAlert(alertData);
        setAlerts(prev => [alert, ...prev]);

        return alert;
      } catch (err) {
        console.error('Failed to create alert:', err);
        return null;
      }
    },
    []
  );

  const _subscribeToAlerts = useCallback(() => {
    try {
      const _wsService = masterServiceRegistry.getService('websocket');
      if (!wsService) {
        return;
      }

      // Subscribe to different alert types
      wsService.subscribe('value_bet_alert', (data: unknown) => {
        if (preferences.enableValueBets) {
          createAlert({
            type: AlertType.VALUE_BET,
            priority: AlertPriority.HIGH,
            title: 'Value Bet Opportunity',
            message: `${data.value * 100}% value bet found`,
            sport: data.sport,
            gameId: data.gameId,
            data,
            actionable: true,
            actions: [
              {
                id: 'view_bet',
                label: 'View Bet',
                action: () => console.log('Navigate to bet details'),
                type: 'primary',
              },
            ],
          });
        }
      });

      wsService.subscribe('odds_movement', (data: unknown) => {
        if (
          preferences.enableOddsMovement &&
          Math.abs(data.movement) >= preferences.minimumOddsMovement
        ) {
          createAlert({
            type: AlertType.ODDS_MOVEMENT,
            priority: AlertPriority.MEDIUM,
            title: 'Significant Odds Movement',
            message: `Odds moved ${(data.movement * 100).toFixed(1)}%`,
            sport: data.sport,
            gameId: data.gameId,
            data,
            actionable: true,
          });
        }
      });

      wsService.subscribe('injury_update', (data: unknown) => {
        if (preferences.enableInjuryUpdates) {
          createAlert({
            type: AlertType.INJURY_UPDATE,
            priority: AlertPriority.HIGH,
            title: 'Player Injury Update',
            message: `${data.playerName}: ${data.status}`,
            sport: data.sport,
            playerId: data.playerId,
            data,
            actionable: true,
          });
        }
      });
    } catch (err) {
      console.error('Failed to subscribe to alerts:', err);
    }
  }, [preferences, createAlert]);

  const _getUnreadCount = useCallback(() => {
    return alerts.filter(alert => !alert.read && !alert.dismissed).length;
  }, [alerts]);

  const _getAlertsByType = useCallback(
    (type: AlertType) => {
      return alerts.filter(alert => alert.type === type && !alert.dismissed);
    },
    [alerts]
  );

  const _getAlertsByPriority = useCallback(
    (priority: AlertPriority) => {
      return alerts.filter(alert => alert.priority === priority && !alert.dismissed);
    },
    [alerts]
  );

  useEffect(() => {
    // Load preferences from localStorage
    const _savedPrefs = localStorage.getItem('alertPreferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (err) {
        console.error('Failed to load alert preferences:', err);
      }
    }

    fetchAlerts();
    subscribeToAlerts();
  }, [fetchAlerts, subscribeToAlerts]);

  return {
    alerts,
    loading,
    error,
    preferences,
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    clearAlerts,
    updatePreferences,
    createAlert,
    getUnreadCount,
    getAlertsByType,
    getAlertsByPriority,
  };
};

export default useSmartAlerts;
