import { UserPersonalizationService } from '../userPersonalizationService';

describe('UserPersonalizationService', () => {
  it('should return a singleton instance', () => {
    const instance1 = UserPersonalizationService.getInstance();
    const instance2 = UserPersonalizationService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize with empty userProfiles and clusters', () => {
    const instance = UserPersonalizationService.getInstance();
    // @ts-ignore
    expect(instance['userProfiles'].size).toBe(0);
    // @ts-ignore
    expect(instance['clusters'].length).toBe(0);
  });
});
