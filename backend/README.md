# Tina Backend Security Foundation

This backend moves authentication and migration snapshots behind a server boundary.

## Important
No system can guarantee absolute or unhackable security. Production security depends on deployment, HTTPS/TLS, OS/server patching, secret management, monitoring, backups, dependency review, least privilege, and incident response.

## Setup
1. `cd backend`
2. `cp .env.example .env`
3. Run `node generate-secrets.mjs` and copy both generated values into `.env`.
4. Set a new strong `TINA_SUPERADMIN_PASSWORD`.
5. For local development use `TINA_COOKIE_SECURE=false`. In HTTPS production set it to `true`.
6. Configure Google/Microsoft OAuth values only if needed.
7. Run `bash start.sh`.

The API listens on 127.0.0.1 by default and stores encrypted data in `backend/data/store.enc`.

Security baseline:
- AES-256-GCM encrypted server-side store
- scrypt password hashing
- HttpOnly + SameSite session cookies
- login rate limiting
- origin allowlist
- security headers
- OAuth state verification
- no secrets shipped in frontend JavaScript
- Superadmin-only migration endpoint

The current v14 frontend still has legacy modules that read localStorage. Use **Infrastructure → Backend Migration** to migrate a protected snapshot first. A complete server-authoritative conversion requires replacing each legacy localStorage adapter with API-backed repositories; do not delete local caches until that migration is complete.
