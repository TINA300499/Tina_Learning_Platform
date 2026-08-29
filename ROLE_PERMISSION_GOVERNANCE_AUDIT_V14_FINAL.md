# Tina Learning Platform v14 FINAL — Role & Permission Governance Audit

## Result
The role model is now materially clearer and safer for the current 1–5 year personal/controlled deployment scope.

## Authority hierarchy
Superadmin (100) > Administrator (80) > Business (50) > Teacher (40) > Editor (30) > Reviewer (20) > Student (10).

## Role contract
| Role | Default scope | Explicitly excluded / governed |
|---|---|---|
| Student | Learning, personal study resources, progress, community, support, profile/settings | Administration, organization management, content governance, canonical/system controls |
| Teacher | Classes, assignments, grading, learner progress, Shadowing Insights, Tina Library | Active Learning direct workspace, system administration, canonical/content governance |
| Business | Organization dashboard/programs/members/teachers/reports, Tina Library | Platform-wide users, canonical/content/system governance |
| Editor | Authoring/content work, research/library/profile | User/role administration, publication/system/canonical authority unless separately governed |
| Reviewer | Review/progress/research/library/profile | Authoring, user management, system/canonical authority |
| Administrator | Review & Escalate, lower-role account management, activity/settings/library | Cannot assign Administrator/Superadmin, cannot delete accounts by default, cannot change passwords, cannot access Superadmin-only governance; editing only when Superadmin explicitly delegates permissions |
| Superadmin | Platform-wide system owner | No higher role; owns governance, permissions, data standards, canonical/system controls |

## Changes in this patch
- Data Standards moved to Superadmin → System Control and removed from every other role sidebar.
- Data Standards are now managed in a Superadmin-only Data Standards Manager.
- Guidance, samples, enable/disable state, policy version and governance note are persisted and audited.
- Validator semantics remain platform-controlled so UI edits cannot accidentally weaken validation.
- Teacher default permissions were narrowed to teaching functions only.
- Editor defaults were aligned to authoring/content work.
- Reviewer defaults were narrowed to review-oriented work.
- Administrator policy migration bumped to v3 and retains minimal delegated authority.
- Non-Superadmin route navigation is now constrained by the active role's sidebar/navigation contract.
- Existing Superadmin remains platform-wide.

## Boundary caveat
This is a browser/local-first authorization layer. Production-grade security still requires server-side authorization checks for every sensitive API/write. UI route guards are not a substitute for backend RBAC.
