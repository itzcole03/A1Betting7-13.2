# Error Taxonomy - Step 5 Additions

## Payload Safeguard Error Codes

### E1300_PAYLOAD_TOO_LARGE
- **HTTP Status**: 413 Payload Too Large
- **Category**: CLIENT  
- **Retryable**: True (with smaller payload)
- **Description**: Request payload exceeds configured size limit
- **Trigger**: Payload size > `max_json_payload_bytes` setting (default 256KB)
- **Details**: Includes `max_bytes`, `received_bytes`/`declared_bytes`, request method/path
- **Resolution**: Reduce payload size or use pagination/chunking
- **Metric**: Increments `payload_rejected_total{reason="size"}`

### E1400_UNSUPPORTED_MEDIA_TYPE  
- **HTTP Status**: 415 Unsupported Media Type
- **Category**: CLIENT
- **Retryable**: True (with correct content-type)
- **Description**: Content-Type not supported for endpoint
- **Trigger**: Non-JSON content-type when `enforce_json_content_type=True`
- **Details**: Includes `received_content_type`, `allowed_types`, request method/path
- **Resolution**: Use `application/json` or add route-specific override with `@allow_content_types`
- **Metric**: Increments `payload_rejected_total{reason="content-type"}`

## Implementation Notes

Both error codes integrate with:
- Structured response format (success/error/meta)
- Request ID correlation
- Prometheus metrics collection
- Centralized logging with structured data
- Security-conscious error details (no sensitive data exposure)
