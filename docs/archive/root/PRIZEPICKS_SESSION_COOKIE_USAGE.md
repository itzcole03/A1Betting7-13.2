# PrizePicks API Session Cookie Usage

To fetch real MLB props from PrizePicks, you must provide a valid session cookie from an authenticated PrizePicks user session. This is required because the PrizePicks API blocks unauthenticated requests.

## How to Set the Session Cookie

1. Log in to PrizePicks in your browser.
2. Open browser dev tools, go to Application/Storage > Cookies, and copy the value of the `_session` cookie.
3. Set the environment variable in your shell or `.env` file:

```
PRIZEPICKS_SESSION_COOKIE=your_session_cookie_value_here
```

- For local development, you can set this in your shell before starting the backend:
  ```bash
  export PRIZEPICKS_SESSION_COOKIE=your_session_cookie_value_here
  python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
  ```
- For Windows (bash):
  ```bash
  export PRIZEPICKS_SESSION_COOKIE=your_session_cookie_value_here
  ```

## Security Warning

- Never commit your session cookie to source control.
- Rotate your session cookie regularly.
- If your cookie expires, repeat the steps above to obtain a new one.

## Error Handling

- If the cookie is missing or invalid, the backend will log a 403 error and provide detailed error context for debugging.
- See backend logs for details.

## Example

```python
import os
session_cookie = os.getenv("PRIZEPICKS_SESSION_COOKIE")
```

## Related Code

- See `backend/services/unified_data_fetcher.py`, method `_generate_mlb_props`
