import { EventEmitter } from 'events.ts';
import { ToastNotification } from '@/types.ts';
export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationData = Record<string, any>;
export declare class NotificationService extends EventEmitter {
  private static instance;
  private notifications;
  private subscribers;
  private constructor();
  static getInstance(): NotificationService;
  subscribe(callback: (notifications: ToastNotification[0]) => void): () => void;
  private notifySubscribers;
  show(message: string, type?: ToastNotification['type'], duration?: number): void;
  success(message: string, duration?: number): void;
  error(message: string, duration?: number): void;
  warning(message: string, duration?: number): void;
  info(message: string, duration?: number): void;
  remove(id: string): void;
  clear(): void;
  getNotifications(): ToastNotification[0];
  notify(type: NotificationType, message: string, data?: NotificationData): void;
}
export declare const notificationService: NotificationService;
export default notificationService;
