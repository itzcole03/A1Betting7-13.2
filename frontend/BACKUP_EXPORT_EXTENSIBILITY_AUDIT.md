# Backup/Export & Extensibility Hooks Audit

## Backup/Export IPC Handler (`exportData`)

- Validates payload with Joi
- Supports types: settings, bets, metrics, all
- Handles missing userId gracefully
- Catches DB errors and logs them
- Edge cases:
  - No data for userId: returns empty object
  - DB unavailable: returns error
  - Large export: consider streaming or chunking for very large datasets

## Extensibility Hooks IPC Handler (`runExtensibilityHook`)

- Validates payload with Joi
- Checks for hook existence in global.pluginRegistry
- Catches execution errors and logs them
- Edge cases:
  - Hook not found: returns error
  - Hook throws: returns error
  - Malformed args: validation error
  - Async hooks: supported via await

## Best Practices

- Always validate input with Joi
- Log all errors and unexpected conditions
- Document available hooks and their expected args
- For backup/export, consider adding progress reporting for large exports
- For extensibility, provide a registry API for plugins to self-register

## Recommendations

- Add automated tests for backup/export with large and missing datasets
- Add automated tests for extensibility hooks with valid, missing, and error cases
- Document plugin API for extensibility
