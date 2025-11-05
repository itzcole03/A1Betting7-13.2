// jest.env.js
// Set NODE_ENV to test for Jest environment detection
process.env.NODE_ENV = "test";
// Provide default API URL for tests
process.env.VITE_API_URL = "http://localhost:8000";
process.env.REACT_APP_API_URL = "http://localhost:8000";

// Ensure onboarding and update modals are bypassed in all tests
if (typeof window !== "undefined" && window.localStorage) {
  window.localStorage.setItem("onboardingComplete", "true");
  window.localStorage.setItem("lastSeenVersion", "1.0.0");
}
if (typeof global !== "undefined" && global.localStorage) {
  global.localStorage.setItem("onboardingComplete", "true");
  global.localStorage.setItem("lastSeenVersion", "1.0.0");
}
// Polyfill window.matchMedia for modules loaded before setup
// Polyfill window.matchMedia for modules loaded before setup
if (typeof window !== "undefined") {
  window.matchMedia =
    window.matchMedia ||
    function (query) {
      return {
        matches: false,
        media: query,
        addListener: function () {},
        removeListener: function () {},
        addEventListener: function () {},
        removeEventListener: function () {},
        onchange: null,
        dispatchEvent: function () {
          return false;
        },
      };
    };
}
