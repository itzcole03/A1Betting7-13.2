// Reuse the repository root Babel configuration so jest/babel-jest running
// in the frontend package picks up the TypeScript and React presets and
// consistent plugin set (including transform-import-meta). We installed
// the previously-missing plugin locally so this is safe.
module.exports = require('../babel.config.cjs');
