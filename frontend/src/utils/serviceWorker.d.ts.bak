/// <reference lib="webworker" />
declare interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
  readonly lastChance: boolean;
}
declare const _CACHE_NAME = 'prizepicks-cache-v1';
declare const _API_CACHE_NAME = 'prizepicks-api-cache-v1';
declare const _STATIC_ASSETS: string[0];
declare const _API_ROUTES: string[0];
declare function handleApiRequest(_request: Request): Promise<Response>;
declare function syncProjections(): Promise<void>;
declare const _dbName = 'prizepicks-offline';
declare const _storeName = 'failed-requests';
declare function getFailedRequests(): Promise<Request[0]>;
declare function removeFailedRequest(_request: Request): Promise<void>;
declare function openDB(): Promise<IDBDatabase>;
