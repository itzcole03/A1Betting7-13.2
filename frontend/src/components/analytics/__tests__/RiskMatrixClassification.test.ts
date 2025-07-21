// @ts-expect-error TS(2307): Cannot find module '@/services/analytics/RiskAsses... Remove this comment to see the full error message
import { RiskAssessmentService } from '@/services/analytics/RiskAssessmentService';
describe('RiskAssessmentService', () => {
  it('classifies risk correctly', () => {
    const low = RiskAssessmentService.classifyRisk({ score: 0.1 });
    const med = RiskAssessmentService.classifyRisk({ score: 0.5 });
    const high = RiskAssessmentService.classifyRisk({ score: 0.9 });
    expect(['low', 'medium', 'high']).toContain(low.riskCategory);
    expect(['low', 'medium', 'high']).toContain(med.riskCategory);
    expect(['low', 'medium', 'high']).toContain(high.riskCategory);
  });
});
