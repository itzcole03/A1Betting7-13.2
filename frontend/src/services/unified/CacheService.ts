import { apiClient } from '@/api/client';

export class CacheService {
  static async get(key: string) {
    try {
      return response.data?.value ?? null;
    } catch (error) {
      // console statement removed
      return null;
    }
  }

  static async set(key: string, value: any) {
    try {
      await apiClient.post('/cache/set', { key, value });
      return true;
    } catch (error) {
      // console statement removed
      return false;
    }
  }
}
export default CacheService;
