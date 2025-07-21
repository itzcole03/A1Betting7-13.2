# Backend Production Features: Rate Limiting & Monitoring

## Redis-Based Rate Limiting

- Middleware: `RedisRateLimiterMiddleware` in `backend/redis_rate_limiter.py`
- Config: Update `redis_url` in `main.py` for your production Redis instance
- Default: 100 requests per IP per endpoint per minute
- To adjust limits, change `max_requests` and `window_seconds` in `main.py`
- Redis must be running and accessible to the backend

## OpenTelemetry & SigNoz Monitoring

- Instrumentation: See `backend/otel_instrumentation.py`
- Exporter: OTLP HTTP to SigNoz (`http://localhost:4318/v1/traces` by default)
- To change SigNoz endpoint, update `otel_instrumentation.py`
- All FastAPI endpoints are automatically traced
- For advanced tracing, instrument background tasks and DB calls as needed

## Setup Steps

1. Ensure Redis and SigNoz are running and accessible
2. Install required Python packages:
   - `opentelemetry-api`
   - `opentelemetry-sdk`
   - `opentelemetry-instrumentation-fastapi`
   - `opentelemetry-exporter-otlp`
   - `aioredis`
3. Configure environment variables for Redis and SigNoz endpoints
4. Deploy backend as usual

## Troubleshooting

- If rate limiting fails, check Redis connection and logs
- If traces do not appear in SigNoz, verify exporter endpoint and network
- For more info, see:
  - [FastAPI Rate Limiting Guide](https://thedkpatel.medium.com/rate-limiting-with-fastapi-an-in-depth-guide-c4d64a776b83)
  - [SigNoz FastAPI Instrumentation](https://signoz.io/docs/instrumentation/opentelemetry-fastapi/)

---

Maintainers: For further help, see the project README and linked guides above.
