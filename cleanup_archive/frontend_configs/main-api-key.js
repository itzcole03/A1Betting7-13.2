// Electron main process: Secure API key management
const { ipcMain } = require('electron');
const Knex = require('knex');
const knexConfig = require('./knexfile');
const knex = Knex(knexConfig);
const crypto = require('crypto');

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32; // 256 bits

function deriveKey(userSecret) {
  // Derive a key from userSecret using SHA-256
  return crypto.createHash('sha256').update(userSecret).digest();
}

function encryptApiKey(apiKey, userSecret) {
  const iv = crypto.randomBytes(12);
  const key = deriveKey(userSecret);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

function decryptApiKey(encrypted, userSecret) {
  const [ivHex, tagHex, encryptedHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = deriveKey(userSecret);
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

ipcMain.handle('setApiKey', async (event, { userId, apiKey, userSecret }) => {
  if (!userId || !apiKey || !userSecret) return { error: 'Missing parameters' };
  const encrypted = encryptApiKey(apiKey, userSecret);
  await knex('users').where({ id: userId }).update({ api_key_encrypted: encrypted });
  return { success: true };
});

ipcMain.handle('getApiKey', async (event, { userId, userSecret }) => {
  if (!userId || !userSecret) return { error: 'Missing parameters' };
  const user = await knex('users').where({ id: userId }).first();
  if (!user || !user.api_key_encrypted) return { error: 'No API key found' };
  try {
    const apiKey = decryptApiKey(user.api_key_encrypted, userSecret);
    return { success: true, apiKey };
  } catch (e) {
    return { error: 'Decryption failed' };
  }
});
