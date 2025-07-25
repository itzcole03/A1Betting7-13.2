// @ts-expect-error TS(2307): Cannot find module '@/api/client' or its correspon... Remove this comment to see the full error message
import { apiClient } from '@/api/client';

export class CacheService {
  static async get(key: string) {
    try {
      // @ts-expect-error TS(2552): Cannot find name 'response'. Did you mean 'Respons... Remove this comment to see the full error message
      return response.data?.value ?? null;
    } catch (error) {
      // console statement removed
      return null;
    }
  }

  static async set(key: string, value: unknown) {
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
