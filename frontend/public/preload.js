const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: name => ipcRenderer.invoke('get-app-path', name),

  // File system operations
  showSaveDialog: options => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: options => ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: options => ipcRenderer.invoke('show-message-box', options),

  // Theme management
  toggleTheme: () => ipcRenderer.invoke('toggle-theme'),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Menu event listeners
  onMenuAction: callback => {
    ipcRenderer.on('menu-new-analysis', callback);
    ipcRenderer.on('menu-export-data', callback);
    ipcRenderer.on('menu-settings', callback);
    ipcRenderer.on('menu-start-analysis', callback);
    ipcRenderer.on('menu-refresh-predictions', callback);
    ipcRenderer.on('menu-portfolio-optimizer', callback);
    ipcRenderer.on('menu-smart-stacking', callback);
    ipcRenderer.on('menu-feedback', callback);
  },

  // Remove menu event listeners
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-new-analysis');
    ipcRenderer.removeAllListeners('menu-export-data');
    ipcRenderer.removeAllListeners('menu-settings');
    ipcRenderer.removeAllListeners('menu-start-analysis');
    ipcRenderer.removeAllListeners('menu-refresh-predictions');
    ipcRenderer.removeAllListeners('menu-portfolio-optimizer');
    ipcRenderer.removeAllListeners('menu-smart-stacking');
    ipcRenderer.removeAllListeners('menu-feedback');
  },

  // Platform detection
  platform: process.platform,

  // Environment
  isDev: process.env.NODE_ENV === 'development',
});

// Desktop notifications
contextBridge.exposeInMainWorld('notificationAPI', {
  showNotification: (title, options) => {
    if (Notification.permission === 'granted') {
      return new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          return new Notification(title, options);
        }
      });
    }
  },

  requestPermission: () => {
    return Notification.requestPermission();
  },

  getPermission: () => {
    return Notification.permission;
  },
});

// Store API for persistent data
contextBridge.exposeInMainWorld('storeAPI', {
  // TODO: Implement secure storage using electron-store
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  get: (key, defaultValue = null) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  },

  delete: key => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  },
});

// Security: Remove node integration after preload
window.addEventListener('DOMContentLoaded', () => {
  // Clean up any global variables that shouldn't be exposed
  delete window.process;
  delete window.require;
  delete window.exports;
  delete window.module;
});

// Log that preload script has loaded
console.log('Electron preload script loaded successfully');
