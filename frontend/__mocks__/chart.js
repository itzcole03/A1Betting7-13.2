// Jest manual mock for Chart.js
/* eslint-env node */
/* eslint-disable no-undef */

class ChartMock {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.data = config?.data ?? { labels: [], datasets: [] };
  }
  update() {}
  destroy() {}
}

ChartMock.register = () => {};
ChartMock.unregister = () => {};
ChartMock.defaults = { plugins: {} };
ChartMock.overrides = {};
ChartMock.instances = new Map();
ChartMock.getChart = () => null;

module.exports = {
  Chart: ChartMock,
  registerables: [],
};
