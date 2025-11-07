/**
 * Service Worker TypeScript Definitions
 * 2025 Best Practices - Complete type coverage
 */

declare global {
  interface ServiceWorkerGlobalScope {
    addEventListener<K extends keyof ServiceWorkerGlobalScopeEventMap>(
      type: K,
      listener: (this: ServiceWorkerGlobalScope, ev: ServiceWorkerGlobalScopeEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ): void;

    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void;

    skipWaiting(): Promise<void>;
    clients: Clients;
    registration: ServiceWorkerRegistration;
    location: WorkerLocation;
    navigator: WorkerNavigator;
    importScripts(...urls: string[]): void;

    // Cache API
    caches: CacheStorage;
  }

  interface ServiceWorkerGlobalScopeEventMap {
    install: ExtendableEvent;
    activate: ExtendableEvent;
    fetch: FetchEvent;
    message: ExtendableMessageEvent;
    messageerror: MessageEvent;
    push: PushEvent;
    pushsubscriptionchange: PushSubscriptionChangeEvent;
    notificationclick: NotificationEvent;
    notificationclose: NotificationEvent;
    sync: SyncEvent;
    canmakepayment: CanMakePaymentEvent;
    paymentrequest: PaymentRequestEvent;
  }

  // Extended interfaces for service worker events
  interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void;
  }

  interface FetchEvent extends ExtendableEvent {
    readonly request: Request;
    readonly clientId: string;
    readonly resultingClientId: string;
    readonly replacesClientId: string;
    readonly handled: Promise<undefined>;
    respondWith(response: Promise<Response> | Response): void;
    preloadResponse: Promise<Response | undefined>;
  }

  interface ExtendableMessageEvent extends ExtendableEvent {
    readonly data: any;
    readonly origin: string;
    readonly lastEventId: string;
    readonly source: Client | ServiceWorker | MessagePort | null;
    readonly ports: ReadonlyArray<MessagePort>;
  }

  interface PushEvent extends ExtendableEvent {
    readonly data: PushMessageData | null;
  }

  interface PushMessageData {
    arrayBuffer(): ArrayBuffer;
    blob(): Blob;
    json(): any;
    text(): string;
  }

  interface NotificationEvent extends ExtendableEvent {
    readonly action: string;
    readonly notification: Notification;
    readonly reply?: string;
  }

  interface SyncEvent extends ExtendableEvent {
    readonly tag: string;
    readonly lastChance: boolean;
  }

  // Enhanced NotificationOptions
  interface NotificationOptions {
    actions?: NotificationAction[];
    badge?: string;
    body?: string;
    data?: any;
    dir?: NotificationDirection;
    icon?: string;
    image?: string;
    lang?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    showTrigger?: ShowTriggerOptions;
    silent?: boolean;
    tag?: string;
    timestamp?: number;
    vibrate?: VibratePattern;
  }

  interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
  }

  type NotificationDirection = 'auto' | 'ltr' | 'rtl';
  type VibratePattern = number | number[];

  interface ShowTriggerOptions {
    timestamp?: number;
  }

  // Clients API
  interface Clients {
    claim(): Promise<void>;
    get(id: string): Promise<Client | undefined>;
    matchAll(options?: ClientQueryOptions): Promise<ReadonlyArray<Client>>;
    openWindow(url: string): Promise<WindowClient | null>;
  }

  interface ClientQueryOptions {
    includeUncontrolled?: boolean;
    type?: ClientType;
  }

  type ClientType = 'all' | 'sharedworker' | 'window' | 'worker';

  interface Client {
    readonly frameType: FrameType;
    readonly id: string;
    readonly type: ClientType;
    readonly url: string;
    postMessage(message: any, transfer?: Transferable[]): void;
  }

  interface WindowClient extends Client {
    readonly focused: boolean;
    readonly visibilityState: DocumentVisibilityState;
    focus(): Promise<WindowClient>;
    navigate(url: string): Promise<WindowClient | null>;
  }

  type FrameType = 'auxiliary' | 'nested' | 'none' | 'top-level';
  type DocumentVisibilityState = 'hidden' | 'visible';

  // Additional service worker specific events
  interface PushSubscriptionChangeEvent extends ExtendableEvent {
    readonly newSubscription: PushSubscription | null;
    readonly oldSubscription: PushSubscription | null;
  }

  interface CanMakePaymentEvent extends ExtendableEvent {
    readonly methodData: PaymentMethodData[];
    readonly modifiers: PaymentDetailsModifier[];
    readonly topOrigin: string;
    readonly paymentRequestOrigin: string;
    respondWith(canMakePaymentResponse: Promise<boolean>): void;
  }

  interface PaymentRequestEvent extends ExtendableEvent {
    readonly instrumentKey: string;
    readonly methodData: PaymentMethodData[];
    readonly modifiers: PaymentDetailsModifier[];
    readonly paymentRequestId: string;
    readonly paymentRequestOrigin: string;
    readonly topOrigin: string;
    readonly total: PaymentCurrencyAmount;
    openWindow(url: string): Promise<WindowClient | null>;
    respondWith(handlerResponse: Promise<PaymentHandlerResponse>): void;
  }

  interface PaymentMethodData {
    supportedMethods: string;
    data?: any;
  }

  interface PaymentDetailsModifier {
    supportedMethods: string | string[];
    total?: PaymentItem;
    additionalDisplayItems?: PaymentItem[];
    data?: any;
  }

  interface PaymentItem {
    label: string;
    amount: PaymentCurrencyAmount;
    pending?: boolean;
  }

  interface PaymentCurrencyAmount {
    currency: string;
    value: string;
  }

  interface PaymentHandlerResponse {
    methodName: string;
    details: any;
  }
}

export {};
