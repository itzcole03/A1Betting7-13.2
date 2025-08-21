const babelJest = require('babel-jest');

module.exports = {
  process(src, filename, config, options) {
    // Replace import.meta.env and import.meta references with a global shim
    const replaced = src
      .replace(/\bimport\.meta\.env\b/g, 'globalThis.__import_meta__.env')
      .replace(/\bimport\.meta\b/g, 'globalThis.__import_meta__');

    // Delegate to babel-jest for actual transpilation
    const babelProcessor = babelJest.createTransformer({
      presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
      plugins: [
        [
          'babel-plugin-transform-import-meta',
          {
            module: 'ES6',
          },
        ],
      ],
    });

    return babelProcessor.process(replaced, filename, config, options);
  },
};
