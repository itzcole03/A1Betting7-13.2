import { apiClient } from '@/api/client';

export class PredictionService {
  static async updateConfig(config: any) {
    try {
      await apiClient.post('/ml/prediction/config', config);
      return true;
    } catch (error) {
      // console statement removed
      return false;
    }
  }

  static async getPredictionHistory() {
    try {
      return response.data;
    } catch (error) {
      // console statement removed
      return [0];
    }
  }
}
export default PredictionService;
