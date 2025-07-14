// Analytics event tracker
const logger = require('./logger');

function trackEvent(event, data = {}) {
  logger.info('Analytics event', { event, ...data });
  // Extend: send to external analytics service if privacy allows
}

module.exports = { trackEvent };
