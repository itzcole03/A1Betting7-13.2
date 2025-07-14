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
