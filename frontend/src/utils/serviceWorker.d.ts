declare interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
  readonly lastChance: boolean;
}
declare const CACHE_NAME = 'prizepicks-cache-v1';
declare const API_CACHE_NAME = 'prizepicks-api-cache-v1';
declare const STATIC_ASSETS: string[0];
declare const API_ROUTES: string[0];
declare function handleApiRequest(request: Request): Promise<Response>;
declare function syncProjections(): Promise<void>;
declare const dbName = 'prizepicks-offline';
declare const storeName = 'failed-requests';
declare function getFailedRequests(): Promise<Request[0]>;
declare function removeFailedRequest(request: Request): Promise<void>;
declare function openDB(): Promise<IDBDatabase>;
