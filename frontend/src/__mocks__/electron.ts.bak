// Electron Mock for Testing
export const ipcRenderer = {
  invoke: jest.fn(() => Promise.resolve({ success: true, result: {} })),
  send: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

export const shell = {
  openExternal: jest.fn(() => Promise.resolve()),
  openPath: jest.fn(() => Promise.resolve('')),
  showItemInFolder: jest.fn(),
};

export const app = {
  getVersion: jest.fn(() => '1.0.0'),
  getName: jest.fn(() => 'A1Betting'),
  getPath: jest.fn(() => '/mock/path'),
  quit: jest.fn(),
  focus: jest.fn(),
};

export const BrowserWindow = jest.fn().mockImplementation(() => ({
  loadURL: jest.fn(),
  loadFile: jest.fn(),
  show: jest.fn(),
  hide: jest.fn(),
  close: jest.fn(),
  minimize: jest.fn(),
  maximize: jest.fn(),
  unmaximize: jest.fn(),
  isMaximized: jest.fn(() => false),
  setFullScreen: jest.fn(),
  isFullScreen: jest.fn(() => false),
  webContents: {
    send: jest.fn(),
    executeJavaScript: jest.fn(),
    openDevTools: jest.fn(),
    closeDevTools: jest.fn(),
  },
}));

export const dialog = {
  showOpenDialog: jest.fn(() => Promise.resolve({ canceled: false, filePaths: [] })),
  showSaveDialog: jest.fn(() => Promise.resolve({ canceled: false, filePath: '' })),
  showMessageBox: jest.fn(() => Promise.resolve({ response: 0 })),
  showErrorBox: jest.fn(),
};

export const Menu = {
  buildFromTemplate: jest.fn(),
  setApplicationMenu: jest.fn(),
};

export const nativeTheme = {
  shouldUseDarkColors: false,
  themeSource: 'system',
  on: jest.fn(),
  removeListener: jest.fn(),
};

export const systemPreferences = {
  getUserDefault: jest.fn(),
  setUserDefault: jest.fn(),
  subscribeNotification: jest.fn(),
  unsubscribeNotification: jest.fn(),
};

export default {
  ipcRenderer,
  shell,
  app,
  BrowserWindow,
  dialog,
  Menu,
  nativeTheme,
  systemPreferences,
};
