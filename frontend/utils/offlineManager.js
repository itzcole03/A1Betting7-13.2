// Offline mode manager for Electron app
const { app } = require('electron');
const Knex = require('knex');
const knexConfig = require('../knexfile');
const knex = Knex(knexConfig);
const logger = require('./logger');

let isOffline = false;
let queuedRequests = [];

function setOffline(status) {
  isOffline = status;
  logger.info('Offline mode set to: %s', status);
}

function queueRequest(request) {
  queuedRequests.push(request);
  logger.info('Request queued for offline sync', { request });
}

async function syncQueuedRequests() {
  for (const req of queuedRequests) {
    try {
      await req();
      logger.info('Queued request synced successfully');
    } catch (err) {
      logger.error('Error syncing queued request: %s', err.message);
    }
  }
  queuedRequests = [];
}

function getOfflineStatus() {
  return isOffline;
}

module.exports = {
  setOffline,
  queueRequest,
  syncQueuedRequests,
  getOfflineStatus,
};
