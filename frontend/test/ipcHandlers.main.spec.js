// test/ipcHandlers.main.spec.js
const { expect } = require('chai');
const { ipcMain } = require('electron');

describe('Main Process IPC Handlers', function () {
  it('should have fetchESPNData handler registered', function () {
    expect(ipcMain._invokeHandlers['fetchESPNData']).to.be.a('function');
  });
  it('should have fetchSportsRadarData handler registered', function () {
    expect(ipcMain._invokeHandlers['fetchSportsRadarData']).to.be.a('function');
  });
  it('should have fetchOdds handler registered', function () {
    expect(ipcMain._invokeHandlers['fetchOdds']).to.be.a('function');
  });
  it('should have fetchOpticOdds handler registered', function () {
    expect(ipcMain._invokeHandlers['fetchOpticOdds']).to.be.a('function');
  });
  it('should have fetchSportsDataIO handler registered', function () {
    expect(ipcMain._invokeHandlers['fetchSportsDataIO']).to.be.a('function');
  });
});
