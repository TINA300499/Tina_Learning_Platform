# Tina Learning Platform — v14 FINAL

Tina Learning Platform is a local-first learning workspace with role-based learning, Academy, practice, assessment, Tina Dictionary, media-enabled study tools, QA/reliability workflows, and Superadmin governance.

## Public repository scope

This repository contains application source code and public-safe configuration examples. Runtime databases, `.env` files, credentials, user data, uploaded media, logs, backups, private keys, and secrets are intentionally excluded.

## Local development

For static UI development, use the project's development runner or a local static server. Static-server mode is development-only.

## Full local runtime

The production-style local runtime uses the same-origin Node backend and SQLite persistence.

```bash
bash backend/setup-production.sh
bash run-tina.sh
```

Default runtime address:

```text
http://127.0.0.1:8787
```

Create a new Superadmin password during production setup. Do not publish credentials in source code or documentation.

## Validation

Run the targeted regression suite:

```bash
bash qa/run-v14-targeted-tests.sh
```

Run the public-release audit:

```bash
bash qa/public-release-audit.sh
```

## Security

See `SECURITY.md`. Do not report real credentials or personal data in public GitHub issues.

## Release line

This repository remains on the **v14 FINAL** release line. Maintenance changes are v14 FINAL patches/updates rather than new major versions.
