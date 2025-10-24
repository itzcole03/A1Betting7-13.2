// Minimal runtime UnifiedLogger shim (CommonJS)
const exported = {
  _level: 'info',
  getLogger: function (component = 'app') {
    return {
      info: (...args) => console.info(`[${component}]`, ...args),
      warn: (...args) => console.warn(`[${component}]`, ...args),
      error: (...args) => console.error(`[${component}]`, ...args),
      debug: (...args) => console.debug(`[${component}]`, ...args),
      setLevel: lvl => {
        exported._level = lvl;
      },
    };
  },
  setLevel: function (lvl) {
    exported._level = lvl;
  },
};

module.exports = exported;
