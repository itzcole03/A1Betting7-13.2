// Patch Storage.prototype.getItem to always return 'onboardingComplete' for the onboarding key
const originalGetItem = Storage.prototype.getItem;
Storage.prototype.getItem = function (key) {
  if (key === 'onboardingComplete') {
    // eslint-disable-next-line no-console
    console.log('[SETUP] Storage.prototype.getItem called for onboardingComplete, returning true');
    return 'onboardingComplete';
  }
  return originalGetItem.call(this, key);
};
