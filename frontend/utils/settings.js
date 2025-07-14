// Settings manager for persistent user/app settings
const Knex = require('knex');
const knexConfig = require('../knexfile');
const knex = Knex(knexConfig);
const logger = require('./logger');

async function getSetting(key) {
  try {
    const row = await knex('settings').where({ key }).first();
    return row ? row.value : null;
  } catch (err) {
    logger.error('Error reading setting: %s', err.message, { key });
    return null;
  }
}

async function setSetting(key, value) {
  try {
    await knex('settings').insert({ key, value }).onConflict('key').merge();
    logger.info('Setting updated', { key, value });
    return true;
  } catch (err) {
    logger.error('Error updating setting: %s', err.message, { key, value });
    return false;
  }
}

module.exports = {
  getSetting,
  setSetting,
};
