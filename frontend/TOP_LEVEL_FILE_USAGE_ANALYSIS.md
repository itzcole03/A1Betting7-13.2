# Top-Level File Usage Analysis (frontend/)

- **vite.config.ts**  
  _Purpose_: Vite build and dev server configuration.  
  _Exported_: Yes (default export)  
  _Imported_: No (not imported elsewhere; used by Vite CLI)  
  _Implementation_: Complete  
  _Notes_: Uses ES6 imports and exports.

- **tailwind.config.js**  
  _Purpose_: Tailwind CSS configuration.  
  _Exported_: No explicit export  
  _Imported_: No (used by Tailwind CLI)  
  _Implementation_: Complete  
  _Notes_: No ES6 or CommonJS exports; config file only.

- **eslint.config.js**  
  _Purpose_: ESLint configuration for the project.  
  _Exported_: Yes (default export)  
  _Imported_: No (used by ESLint CLI)  
  _Implementation_: Complete  
  _Notes_: Uses ES6 imports and exports.

- **component_audit.js**  
  _Purpose_: Script for auditing React components.  
  _Exported_: No explicit export  
  _Imported_: No (standalone script)  
  _Implementation_: Complete  
  _Notes_: Uses CommonJS `require` for dependencies; not imported elsewhere.

- **babel.config.js**  
  _Purpose_: Babel configuration for transpiling code.  
  _Exported_: No explicit export  
  _Imported_: No (used by Babel CLI)  
  _Implementation_: Complete  
  _Notes_: No ES6 or CommonJS exports; config file only.

- **windsurf_deployment.yaml**  
  _Purpose_: Deployment configuration for Windsurf (YAML).  
  _Exported_: N/A  
  _Imported_: No (used by deployment tools)  
  _Implementation_: Complete

- **tsconfig.sw.json**  
  _Purpose_: TypeScript config for service workers.  
  _Exported_: N/A  
  _Imported_: No (used by TypeScript CLI)  
  _Implementation_: Complete

- **tsconfig.node.json**  
  _Purpose_: TypeScript config for Node.js.  
  _Exported_: N/A  
  _Imported_: No (used by TypeScript CLI)  
  _Implementation_: Complete

- **tsconfig.json**  
  _Purpose_: Main TypeScript configuration.  
  _Exported_: N/A  
  _Imported_: No (used by TypeScript CLI)  
  _Implementation_: Complete

- **tsconfig.jest.json**  
  _Purpose_: TypeScript config for Jest tests.  
  _Exported_: N/A  
  _Imported_: No (used by Jest/TypeScript CLI)  
  _Implementation_: Complete

- **tsconfig.app.json**  
  _Purpose_: TypeScript config for the app build.  
  _Exported_: N/A  
  _Imported_: No (used by TypeScript CLI)  
  _Implementation_: Complete

- **TEST_AUDIT.md**  
  _Purpose_: Manual or automated test audit documentation.  
  _Exported_: N/A  
  _Imported_: No  
  _Implementation_: Complete

- **service-status-and-feature-flags.md**  
  _Purpose_: Documentation of service status and feature flags.  
  _Exported_: N/A  
  _Imported_: No  
  _Implementation_: Complete

- **README_TRACEABILITY.md**  
  _Purpose_: Traceability matrix and documentation.  
  _Exported_: N/A  
  _Imported_: No  
  _Implementation_: Complete

- **README_API.md**  
  _Purpose_: API documentation for the frontend.  
  _Exported_: N/A  
  _Imported_: No  
  _Implementation_: Complete

- **README.md**  
  _Purpose_: Main project readme.  
  _Exported_: N/A  
  _Imported_: No  
  _Implementation_: Complete

- **package.json**  
  _Purpose_: NPM package manifest.  
  _Exported_: N/A  
  _Imported_: No (used by npm/yarn)  
  _Implementation_: Complete

- **package-lock.json**  
  _Purpose_: NPM lockfile for reproducible installs.  
  _Exported_: N/A  
  _Imported_: No (used by npm)  
  _Implementation_: Complete

- **NEXT_FEATURES_PLAN.md**  
  _Purpose_: Planning document for upcoming features.  
  _Exported_: N/A  
  _Imported_: No  
  _Implementation_: Complete

- **netlify.toml**  
  _Purpose_: Netlify deployment configuration.  
  _Exported_: N/A  
  _Imported_: No (used by Netlify)  
  _Implementation_: Complete

- **lint-results.json**  
  _Purpose_: Linting results output.  
  _Exported_: N/A  
  _Imported_: No  
  _Implementation_: Complete

- **jest.config.mjs**  
  _Purpose_: Jest configuration (ESM).  
  _Exported_: No explicit export  
  _Imported_: No (used by Jest CLI)  
  _Implementation_: Complete

---

_Last updated: June 12, 2025_
