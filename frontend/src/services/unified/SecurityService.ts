import { apiClient } from '@/api/client';

export class SecurityService {
  static async authenticate(credentials: { username: string; password: string }) {
    try {
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
