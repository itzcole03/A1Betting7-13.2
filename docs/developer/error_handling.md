# Unified Error Handling Best Practices

## Overview

All errors in the A1Betting platform are managed through a unified system that leverages correlation IDs for end-to-end traceability and observability.

## Frontend

- Use the `useErrorStore` Zustand store to record and manage errors.
- All HTTP/API errors should be intercepted and recorded using `ErrorInterceptor.ts`.
- Use `GlobalErrorBoundary.tsx` to catch and display errors, including the correlation ID (with copy-to-clipboard).
- When reporting errors to the backend, always include the correlation ID in the request headers.
- Categorize errors as: `network`, `validation`, `authorization`, `business`, or `unknown`.

## Backend

- Use the custom exception classes in `exceptions/api_exceptions.py` for business, validation, and authorization errors.
- All error responses must include the correlation ID (from request header or generated).
- Use the error handler middleware in `middleware/error_handlers.py` to ensure consistent error format and logging.
- Log all errors with the correlation ID for traceability.

## Correlation ID Propagation

- The correlation ID is generated at the entry point (frontend or API gateway) and propagated through all service calls and logs.
- Always include the `X-Request-ID` header in API requests and responses.

## Example: Recording and Displaying an Error (Frontend)

```typescript
import { handleHttpError } from "../services/ErrorInterceptor";
try {
  await makeRequest("/api/some-endpoint");
} catch (err) {
  handleHttpError(err, correlationId);
}
```

## Example: Raising a Business Logic Error (Backend)

```python
from exceptions.api_exceptions import BusinessLogicException

if not valid:
    raise BusinessLogicException(detail="Invalid bet placement")
```

## Example: Error Response (Backend)

```json
{
  "error": "Invalid bet placement",
  "correlation_id": "123e4567-e89b-12d3-a456-426614174000",
  "error_code": "business_error",
  "details": null
}
```

## Support

- When reporting issues, always provide the correlation ID for rapid debugging.
