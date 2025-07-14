import base from '../eslint-config/base.js';
export default {
  ...base,
  root: true,
  parserOptions: {
    ...base.parserOptions,
    project: './tsconfig.json'
  }
};
