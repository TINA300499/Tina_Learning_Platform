# Security Policy

## Supported release

The maintained release line is Tina Learning Platform v14 FINAL.

## Reporting a vulnerability

Do not open a public GitHub issue containing passwords, tokens, private keys, personal data, database contents, or exploit details that expose a live deployment.

For a public repository, use GitHub's private vulnerability reporting feature when enabled, or contact the repository owner through a private channel.

## Repository rules

- Never commit `.env` files or runtime secrets.
- Never commit SQLite/runtime databases or user uploads.
- Never publish production Superadmin credentials.
- Rotate any secret immediately if it is accidentally committed.
- Treat browser-side authorization as UX enforcement only; sensitive authorization must also be enforced by the backend.
