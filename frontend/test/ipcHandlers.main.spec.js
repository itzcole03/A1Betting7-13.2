describe('Main Process IPC Handlers', () => {
const { ipcMain } = require('electron');

describe('Main Process IPC Handlers', () => {
const { ipcMain } = require('electron');

describe('Main Process IPC Handlers', () => {
  test('should have fetchESPNData handler registered', () => {
    expect(typeof ipcMain._invokeHandlers['fetchESPNData']).toBe('function');
  });
  test('should have fetchSportsRadarData handler registered', () => {
    expect(typeof ipcMain._invokeHandlers['fetchSportsRadarData']).toBe('function');
  });
  test('should have fetchOdds handler registered', () => {
    expect(typeof ipcMain._invokeHandlers['fetchOdds']).toBe('function');
  });
  test('should have fetchOpticOdds handler registered', () => {
    expect(typeof ipcMain._invokeHandlers['fetchOpticOdds']).toBe('function');
  });
  test('should have fetchSportsDataIO handler registered', () => {
    expect(typeof ipcMain._invokeHandlers['fetchSportsDataIO']).toBe('function');
  });
});
