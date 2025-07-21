// Polyfill ResizeObserver for Mantine/Jsdom compatibility
// @ts-expect-error TS(2300): Duplicate identifier 'ResizeObserver'.
class ResizeObserver {
  constructor(callback: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;
