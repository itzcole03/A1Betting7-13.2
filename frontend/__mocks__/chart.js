// Jest manual mock for Chart.js
class ChartMock {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.data = config?.data ?? { labels: [], datasets: [] };
  }
  update() {}
  destroy() {}
}

module.exports = {
  Chart: ChartMock,
  registerables: [],
};
