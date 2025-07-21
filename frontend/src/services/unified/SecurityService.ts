// @ts-expect-error TS(2307): Cannot find module '@/api/client' or its correspon... Remove this comment to see the full error message
import { apiClient } from '@/api/client';

export class SecurityService {
  static async authenticate(credentials: { username: string; password: string }) {
    try {
      // @ts-expect-error TS(2552): Cannot find name 'response'. Did you mean 'Respons... Remove this comment to see the full error message
      return response.data;
    } catch (error) {
      // console statement removed
      return false;
    }
  }

  static async logout() {
    try {
      await apiClient.post('/auth/logout');
      return true;
    } catch (error) {
      // console statement removed
      return false;
    }
  }
}
export default SecurityService;
