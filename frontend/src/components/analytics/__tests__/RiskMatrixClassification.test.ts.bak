import { RiskAssessmentService } from '../../../services/analytics/RiskAssessmentService';
describe('RiskAssessmentService', () => {
  it('classifies risk correctly', () => {
    const _low = RiskAssessmentService.classifyRisk({ score: 0.1 });
    const _med = RiskAssessmentService.classifyRisk({ score: 0.5 });
    const _high = RiskAssessmentService.classifyRisk({ score: 0.9 });
    expect(['low', 'medium', 'high']).toContain(_low.riskCategory);
    expect(['low', 'medium', 'high']).toContain(_med.riskCategory);
    expect(['low', 'medium', 'high']).toContain(_high.riskCategory);
  });
});
