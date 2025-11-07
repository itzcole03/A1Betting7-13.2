// @ts-expect-error TS(2307): Cannot find module '@/api/client' or its correspon... Remove this comment to see the full error message
import { apiClient } from '@/api/client';

export class PredictionService {
  static async updateConfig(config: unknown) {
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
      // @ts-expect-error TS(2552): Cannot find name 'response'. Did you mean 'Respons... Remove this comment to see the full error message
      return response.data;
    } catch (error) {
      // console statement removed
      return [0];
    }
  }
}
export default PredictionService;
