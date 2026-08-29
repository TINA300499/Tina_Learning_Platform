# Tina Learning Platform v14 FINAL — Personal Deployment Guide

This release is approved for personal production use, a single-machine deployment, or a controlled small pilot. It is not approved as public multi-tenant SaaS.

## macOS: deploy now

Extract the ZIP, open the folder, then double-click:

`DEPLOY-NOW.command`

Or use Terminal:

```bash
cd /path/to/Tina_Learning_Platform_v14_FINAL_PERSONAL_DEPLOY_READY
bash deploy-now.sh
```

The deployment process validates Node.js 22+, checks source syntax, runs HTTP E2E, creates the production environment on first run, asks you to create a new Superadmin password (12+ characters), and starts the same-origin Node + SQLite runtime.

Use:

`http://127.0.0.1:8787`

Do not use VS Code Live Server (`127.0.0.1:5501`) as the deployed runtime.

Superadmin username is `superadmin`. The password is the new password you create during first deployment; no production password is embedded in the package.

Persistent data: `backend/data/`

Secrets/config: `backend/.env`

Stop Tina with `Control + C`.

Restart with:

```bash
bash run-tina.sh
```

Backup:

```bash
bash backup-local.sh
```

Restore:

```bash
bash restore-local.sh /path/to/backup.tar.gz
```

Before exposing Tina to the public Internet, add HTTPS, secure cookies, MFA for privileged accounts, server-side authorization review, off-device backups, monitoring, and incident-response controls.
