# Tina Learning Platform v14 FINAL — Role UI, Navigation & Admin Governance Update

## Role scope
- Teacher no longer has a Learning group. Teacher Resources contains Tina Library only.
- Administrator no longer has a Learning group.
- Administrator defaults to review/escalation + lower-role account governance.
- Content, assessment, practice and data editing for Administrator require explicit Superadmin delegation.
- Administrator cannot assign Administrator or Superadmin roles and cannot edit their accounts/credentials.
- Administrator system export/import/credential tools are removed from the Admin dashboard.

## Interface
- Unified sticky header/sidebar/footer spacing for every role.
- Settings adds text scaling from 90% to 150%.
- Theme Studio is linked for every role.
- First authenticated dashboard explicitly restores header/sidebar/footer before one-time onboarding starts.
- Automatic onboarding is marked shown once; Quick Tour remains a manual replay.
- Header Back/Forward use role-aware route history instead of stale hidden navigation labels.
- Footer is role-aware and editable by Superadmin with route/external URL links.

## Core modules
- Canonical Adapter v6 exposes a direct module bridge.
- Unified Runtime v7 exposes a direct Learning Core bridge.
- Superadmin Canonical Data and Learning Core sidebar routes use those bridges directly.

## Validation
See `ROLE_UI_NAVIGATION_ADMIN_GOVERNANCE_AUDIT_V14_FINAL.md`.
