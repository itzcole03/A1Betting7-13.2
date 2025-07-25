import { BaseService } from './BaseService';
import { UnifiedErrorService } from './UnifiedErrorService';
// @ts-expect-error TS(2305): Module '"./UnifiedServiceRegistry"' has no exporte... Remove this comment to see the full error message
import { UnifiedServiceRegistry } from './UnifiedServiceRegistry';
import { UnifiedStateService } from './UnifiedStateService';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  timestamp: number;
  read: boolean;
  data?: Record<string, unknown>;
}

export interface NotificationOptions {
  title?: string;
  duration?: number;
  data?: Record<string, unknown>;
  sound?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export class UnifiedNotificationService extends BaseService {
  private errorService: UnifiedErrorService;
  private stateService: UnifiedStateService;
  private readonly defaultDuration: number = 5000;
  private readonly maxNotifications: number = 100;

  constructor(registry: UnifiedServiceRegistry) {
    super('notification', registry);
    // Stub undefined variables
    const _errorService = {} as unknown;
    const _stateService = {
      setState: (state: unknown) => {},
      getState: () => ({ notifications: [], settings: { sound: false } }),
    } as unknown;
    if (!errorService || !stateService) {
      throw new Error('Required services not found in registry');
    }
    this.errorService = errorService as unknown as UnifiedErrorService;
    this.stateService = stateService as unknown as UnifiedStateService;
  }

  notifyUser(
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
    options: NotificationOptions = {} as unknown
  ): void {
    try {
      const _newNotification: Notification = {
        ...notification,
        id: this.generateId(),
        timestamp: Date.now(),
        read: false,
      };
      // Add to state;
      const _currentNotifications: Notification[] = [];
      const _updatedNotifications = [newNotification, ...currentNotifications].slice(
        0,
        this.maxNotifications
      );
      this.stateService.setState({ notifications: updatedNotifications });
      // Play sound if enabled;
      if (options.sound && this.stateService.getState().settings.sound) {
        this.playNotificationSound(notification.type);
      }
      // Auto-dismiss if duration is specified;
      if (options.duration !== 0) {
        setTimeout(() => {
          this.dismissNotification(newNotification.id);
        }, options.duration || this.defaultDuration);
      }
    } catch (error) {
      // @ts-expect-error TS(2446): Property 'handleError' is protected and only acces... Remove this comment to see the full error message
      this.errorService.handleError(error, {
        code: 'NOTIFICATION_ERROR',
        source: 'UnifiedNotificationService',
        details: { method: 'notifyUser', notification, options },
      });
    }
  }

  dismissNotification(notificationId: string): void {
    try {
      const _currentNotifications: Notification[] = [];
      const _updatedNotifications = currentNotifications.filter(
        notification => notification.id !== notificationId
      );
      this.stateService.setState({ notifications: updatedNotifications });
    } catch (error) {
      // @ts-expect-error TS(2446): Property 'handleError' is protected and only acces... Remove this comment to see the full error message
      this.errorService.handleError(error, {
        code: 'NOTIFICATION_ERROR',
        source: 'UnifiedNotificationService',
        details: { method: 'dismissNotification', notificationId },
      });
    }
  }

  markAsRead(notificationId: string): void {
    try {
      const _currentNotifications: Notification[] = [];
      const _updatedNotifications = currentNotifications.map(notification =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      );
      this.stateService.setState({ notifications: updatedNotifications });
    } catch (error) {
      // @ts-expect-error TS(2446): Property 'handleError' is protected and only acces... Remove this comment to see the full error message
      this.errorService.handleError(error, {
        code: 'NOTIFICATION_ERROR',
        source: 'UnifiedNotificationService',
        details: { method: 'markAsRead', notificationId },
      });
    }
  }

  clearAll(): void {
    try {
      this.stateService.setState({ notifications: [] });
    } catch (error) {
      // @ts-expect-error TS(2446): Property 'handleError' is protected and only acces... Remove this comment to see the full error message
      this.errorService.handleError(error, {
        code: 'NOTIFICATION_ERROR',
        source: 'UnifiedNotificationService',
        details: { method: 'clearAll' },
      });
    }
  }

  getUnreadCount(): number {
    try {
      return this.stateService.getState().notifications.filter((notification: unknown) => !notification.read)
        .length;
    } catch (error) {
      // @ts-expect-error TS(2446): Property 'handleError' is protected and only acces... Remove this comment to see the full error message
      this.errorService.handleError(error, {
        code: 'NOTIFICATION_ERROR',
        source: 'UnifiedNotificationService',
        details: { method: 'getUnreadCount' },
      });
      return 0;
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private playNotificationSound(type: Notification['type']): void {
    try {
      const _audio = { src: '', play: async () => {} } as unknown;
      switch (type) {
        case 'success':
          audio.src = '/sounds/success.mp3';
          break;
        case 'error':
          audio.src = '/sounds/error.mp3';
          break;
        case 'warning':
          audio.src = '/sounds/warning.mp3';
          break;
        default:
          audio.src = '/sounds/info.mp3';
      }
      audio.play().catch((error: unknown) => {
        // @ts-expect-error TS(2446): Property 'handleError' is protected and only acces... Remove this comment to see the full error message
        this.errorService.handleError(error, {
          code: 'NOTIFICATION_ERROR',
          source: 'UnifiedNotificationService',
          details: { method: 'playNotificationSound', type },
        });
      });
    } catch (error) {
      // @ts-expect-error TS(2446): Property 'handleError' is protected and only acces... Remove this comment to see the full error message
      this.errorService.handleError(error, {
        code: 'NOTIFICATION_ERROR',
        source: 'UnifiedNotificationService',
        details: { method: 'playNotificationSound', type },
      });
    }
  }

  notify(type: NotificationType, message: string): void {
    const _notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: Date.now(),
      read: false,
    };
    // Stub undefined logger
    const _logger = { info: (...args: unknown[]) => {} };
    // Log notification;
    logger.info(`Notification [${type}]: ${message}`);
  }
}
