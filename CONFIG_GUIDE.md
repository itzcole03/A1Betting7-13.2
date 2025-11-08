# Configuration Files Guide

This document explains the purpose of each configuration file in the project.

## Python/Backend Configurations

### Requirements Files
- **backend/requirements.txt** - Production dependencies
- **backend/requirements-dev.txt** - Development dependencies (includes dev tools, linters)
- **backend/requirements-test.txt** - Testing dependencies (pytest, coverage, etc.)

Usage:
```bash
# Production
pip install -r backend/requirements.txt

# Development (includes production + dev tools)
pip install -r backend/requirements-dev.txt

# Testing (includes production + test tools)
pip install -r backend/requirements-test.txt
```

## JavaScript/Frontend Configurations

### ESLint
- **eslint.config.mjs** - Main ESLint configuration (modern flat config format)

### Babel
- **babel.config.cjs** - Main Babel transpilation configuration
- **babel.config.test.cjs** - Test-specific Babel configuration (extends main)

### TypeScript
- **tsconfig.json** - Root TypeScript configuration
- **tsconfig.jest.json** - Jest-specific TypeScript configuration
- **frontend/tsconfig.json** - Frontend-specific TypeScript configuration (if exists)

### Package Management
- **package.json** - Root package.json with workspace configuration
- **frontend/package.json** - Frontend-specific dependencies (if exists)

## Docker Configurations

See [DOCKER_CONFIGS.md](./DOCKER_CONFIGS.md) for detailed Docker Compose documentation.

## Environment Variables

- **.env.example** - Example environment variables (copy to .env)
- **.env** - Actual environment variables (gitignored)

## Testing Configurations

- **pytest.ini** - Pytest configuration
- **backend/pytest.ini** - Backend-specific pytest configuration (if exists)

## Build Configurations

- **vite.config.js** - Vite build configuration (if using Vite)
- **postcss.config.js** - PostCSS configuration for CSS processing
- **tailwind.config.js** - Tailwind CSS configuration

## Best Practices

1. **Don't duplicate configs** - Use a single source of truth
2. **Extend when needed** - Test configs should extend main configs
3. **Document purpose** - Add comments explaining non-obvious settings
4. **Version control** - Commit example configs, ignore actual secrets
5. **Environment-specific** - Use different configs for dev/test/prod when needed

## Troubleshooting

### "Module not found" errors
- Check that dependencies are in the correct requirements file
- Ensure you've installed the right requirements file for your environment

### ESLint not working
- Ensure you're using a compatible ESLint version
- Check that eslint.config.mjs is in the project root

### TypeScript errors
- Verify tsconfig.json settings
- Check that all necessary @types packages are installed
