# v14 FINAL — Status, Governance Sync & CTO Security Audit

## Canonical account lifecycle status data
- pending_activation — Pending activation / Chưa kích hoạt — cannot login
- active — Active / Đang hoạt động — can login and operate
- inactive — Inactive / Chưa hoạt động — cannot login
- suspended — Suspended / Tạm ngưng — cannot login
- locked — Locked / Bị khóa — cannot login
- archived — Archived / Lưu trữ — cannot login

The status registry is visible in Superadmin Data Standards and is used by account management, authentication eligibility and System Health.

## Governance synchronization
A central ROLE_GOVERNANCE_POLICY v4 is now the authoritative descriptive policy source for:
- Governance Map
- Role Permission Matrix
- Role Guides
- role-facing guide descriptions

The matrix now includes Student, Teacher, Business, Editor, Reviewer, Administrator and Superadmin.

## CTO security assessment
Current baseline is appropriate for a personal/single-machine or tightly controlled pilot.
It is not yet an enterprise/public SaaS security boundary.

Priority gaps:
1. MFA/WebAuthn for privileged accounts.
2. Server-side deny-by-default authorization on every sensitive API.
3. HTTPS/HSTS and hardened secure-cookie deployment.
4. Managed secrets/key rotation.
5. Tamper-evident centralized audit/logging.
6. Automated off-device backups + restore drills + RPO/RTO.
7. Dependency/SAST/secret scanning + vulnerability/patch process.
8. Data classification/retention/privacy controls.
9. Incident response, break-glass access, access review and change management.
