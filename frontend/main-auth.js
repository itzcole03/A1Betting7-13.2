// Electron main process: Secure user authentication
const { app, ipcMain } = require('electron');
const bcrypt = require('bcryptjs');
const Knex = require('knex');
const knexConfig = require('./knexfile');
const knex = Knex(knexConfig);
const crypto = require('crypto');

let sessions = {};

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

ipcMain.handle('register', async (event, { username, password, email }) => {
  if (!username || !password) return { error: 'Missing credentials' };
  const existing = await knex('users').where({ username }).first();
  if (existing) return { error: 'Username already exists' };
  const hash = await bcrypt.hash(password, 12);
  const [id] = await knex('users').insert({ username, password_hash: hash, email });
  return { success: true, userId: id };
});

ipcMain.handle('login', async (event, { username, password }) => {
  const user = await knex('users').where({ username }).first();
  if (!user) return { error: 'Invalid username or password' };
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return { error: 'Invalid username or password' };
  const token = generateSessionToken();
  sessions[token] = { userId: user.id, created: Date.now() };
  return { success: true, token, userId: user.id };
});

ipcMain.handle('logout', async (event, { token }) => {
  delete sessions[token];
  return { success: true };
});

ipcMain.handle('getSession', async (event, { token }) => {
  const session = sessions[token];
  if (!session) return { error: 'Invalid session' };
  return { success: true, userId: session.userId };
});

// Rate limiting and suspicious activity logging can be added here
