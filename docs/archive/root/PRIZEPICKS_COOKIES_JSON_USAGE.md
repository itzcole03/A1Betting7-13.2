# PrizePicks API Multi-Cookie Usage

To enable authenticated PrizePicks API access, set all relevant cookies as a JSON string in the environment variable `PRIZEPICKS_COOKIES_JSON`.

## How to Set Multiple Cookies

1. Export all cookies from your browser (see browser dev tools > Application > Cookies).
2. Create a JSON object mapping cookie names to values, e.g.:

```
{
  "_session": "your_session_cookie_value",
  "_cfuvid": "your_cfuvid_value",
  "__cf_bm": "your_cf_bm_value",
  "CSRF-TOKEN": "your_csrf_token_value",
  "pp_uuid": "your_pp_uuid_value",
  ...
}
```

3. Set the environment variable before starting the backend:

**Linux/macOS/bash:**

```
export PRIZEPICKS_COOKIES_JSON='{"_session": "...", "_cfuvid": "...", ...}'
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Windows (bash):**

```
export PRIZEPICKS_COOKIES_JSON='{"_session": "...", "_cfuvid": "...", ...}'
```

### Semicolon-Separated String Format

Set the environment variable `PRIZEPICKS_COOKIES_STRING` to a semicolon-separated string:

```
export PRIZEPICKS_COOKIES_STRING='_session=your_session_cookie_value; _cfuvid=your_cfuvid_value; __cf_bm=your_cf_bm_value; CSRF-TOKEN=your_csrf_token_value; pp_uuid=your_pp_uuid_value'
```

This format is convenient for quick manual use or copy-paste from browser dev tools.

If neither `PRIZEPICKS_COOKIES_JSON` nor `PRIZEPICKS_COOKIES_STRING` is set, the backend will fallback to `PRIZEPICKS_SESSION_COOKIE` for single-cookie usage.

## Security Warning

- Never commit your cookies to source control.
- Rotate cookies regularly.
- If cookies expire, repeat the steps above to obtain new values.

## Error Handling

- If cookies are missing or invalid, the backend will log errors with full context for debugging.
- See backend logs for details.

## Related Code

- See `backend/services/unified_data_fetcher.py`, method `_generate_mlb_props`
