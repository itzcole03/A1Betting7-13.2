import {
  CacheCategory,
  ConsolidatedCacheManager,
  cacheClear,
  cacheGet,
  cacheRemove,
  cacheSet,
  getCacheManager,
} from '../services/ConsolidatedCacheManager';

export {
  CacheCategory,
  ConsolidatedCacheManager,
  cacheClear,
  cacheGet,
  cacheRemove,
  cacheSet,
  getCacheManager,
};

export type { CacheConfig } from '../services/ConsolidatedCacheManager';

export const set = cacheSet;
export const get = cacheGet;
export const remove = cacheRemove;
export const del = cacheRemove;
export const clear = cacheClear;

export const has = (category: CacheCategory, key: string): boolean => {
  return getCacheManager().has(category, key);
};

export const getInstance = getCacheManager;

const unifiedCacheFacade = Object.freeze({
  set: cacheSet,
  get: cacheGet,
  remove: cacheRemove,
  delete: cacheRemove,
  clear: cacheClear,
  has,
  getInstance,
  categories: CacheCategory,
});

export default unifiedCacheFacade;
