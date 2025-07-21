# User Model & Authentication Best Practices (2025)

## Key Features

- Argon2 password hashing (via Passlib, fallback to bcrypt/PBKDF2)
- Secure API key generation and verification (SHA-256)
- JWT access and refresh token support
- Edge case handling and robust logging
- Serialization excludes sensitive fields
- Ready for MFA, password reset, account lockout, and audit trail

## Setup

- Ensure `argon2_cffi` is installed for Argon2 support: `pip install argon2_cffi`
- All tests in `backend/test_user_model.py` must pass for production readiness

## Security Recommendations

- Enforce strong password policies
- Require MFA for admin/sensitive users
- Lock accounts after repeated failed logins
- Log all authentication and user management events
- Use HTTPS and secure cookies for all tokens

## Maintenance

- Regularly audit code and dependencies for vulnerabilities
- Update documentation with new features and security improvements
- Review audit logs and failed login attempts

## Testing

- Run `python -m pytest backend/test_user_model.py -v` after any change
- Add new tests for edge cases and new features

---

Maintainer: Please review this file and update as new best practices emerge.
