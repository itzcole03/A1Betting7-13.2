// Notification manager for Electron app
const { Notification } = require('electron');
const logger = require('./logger');

function showNotification({ title, body, type = 'info' }) {
  try {
    new Notification({ title, body }).show();
    logger.info('Notification shown', { title, body, type });
  } catch (err) {
    logger.error('Notification error: %s', err.message, { title, body, type });
  }
}

module.exports = { showNotification };
