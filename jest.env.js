// jest.env.js
// Ensure onboarding and update modals are bypassed in all tests
if (typeof window !== "undefined" && window.localStorage) {
  window.localStorage.setItem("onboardingComplete", "true");
  window.localStorage.setItem("lastSeenVersion", "1.0.0");
}
if (typeof global !== "undefined" && global.localStorage) {
  global.localStorage.setItem("onboardingComplete", "true");
  global.localStorage.setItem("lastSeenVersion", "1.0.0");
}
