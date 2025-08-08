import UnifiedStateService from '../UnifiedStateService';

describe('UnifiedStateService', () => {
  let stateService: UnifiedStateService;

  beforeEach(() => {
    stateService = UnifiedStateService.getInstance();
    stateService.reset();
  });

  it('should return a singleton instance', () => {
    const instance1 = UnifiedStateService.getInstance();
    const instance2 = UnifiedStateService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should get and set state values', () => {
    stateService.set('user.isAuthenticated', true);
    expect(stateService.get('user.isAuthenticated')).toBe(true);
  });

  it('should update state values', () => {
    stateService.set('user.profile', { name: 'Alice' });
    stateService.update('user.profile', profile => ({
      ...(profile as Record<string, any>),
      age: 30,
    }));
    const updatedProfile = stateService.get('user.profile') as Record<string, any>;
    expect(updatedProfile.age).toBe(30);
  });

  it('should merge state values', () => {
    stateService.set('user.preferences', { theme: 'dark' });
    stateService.merge('user.preferences', { notifications: true });
    expect(stateService.get('user.preferences')).toEqual({ theme: 'dark', notifications: true });
  });

  it('should delete state values', () => {
    stateService.set('user.profile', { name: 'Bob' });
    stateService.delete('user.profile');
    expect(stateService.get('user.profile')).toBeUndefined();
  });

  it('should subscribe and unsubscribe to state changes', () => {
    const callback = jest.fn();
    const listenerId = stateService.subscribe('user.isAuthenticated', callback);
    stateService.set('user.isAuthenticated', true);
    expect(callback).toHaveBeenCalledWith(true, false);
    stateService.unsubscribe(listenerId);
    stateService.set('user.isAuthenticated', false);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should reset state to defaults', () => {
    stateService.set('user.isAuthenticated', true);
    stateService.reset();
    expect(stateService.get('user.isAuthenticated')).toBe(false);
  });

  it('should replace full state', () => {
    const newState = {
      user: { isAuthenticated: true },
      sports: {},
      betting: {},
      ui: {},
      system: {},
    };
    stateService.setState(newState);
    expect(stateService.getState()).toEqual(newState);
  });

  it('should persist and restore state', () => {
    stateService.set('user.isAuthenticated', true);
    stateService.persist();
    stateService.set('user.isAuthenticated', false);
    stateService.restore();
    expect(stateService.get('user.isAuthenticated')).toBe(true);
  });
});
