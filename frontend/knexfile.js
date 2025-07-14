// Knex configuration for Electron/SQLite
module.exports = {
  client: 'sqlite3',
  connection: {
    // Make this a function so it's evaluated lazily, not at require time
    filename: function() {
      const { app } = require('electron');
      return require('path').join(app.getPath('userData'), 'a1betting.db');
    }
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
  useNullAsDefault: true,
};
