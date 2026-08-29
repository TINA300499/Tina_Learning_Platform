# Tina Learning Platform v14 FINAL — Sidebar Route Audit

Generated: 2026-08-28T21:12:29

Both grouped navigation and persistent sidebar now call the same authoritative `roleTargetOpen()` router.

| Role | Target | Status |
|---|---|---|
| learner | `home` | PASS |
| learner | `catalog` | PASS |
| learner | `learn` | PASS |
| learner | `games-extra` | PASS |
| learner | `library-extra` | PASS |
| learner | `plans` | PASS |
| learner | `research` | PASS |
| learner | `review` | PASS |
| learner | `progress` | PASS |
| learner | `profile-extra` | PASS |
| learner | `leaderboard-extra` | PASS |
| learner | `achievements-extra` | PASS |
| learner | `settings` | PASS |
| teacher | `teacher-dashboard-extra` | PASS |
| teacher | `teacher-classes-extra` | PASS |
| teacher | `teacher-assignments-extra` | PASS |
| teacher | `teacher-grading-extra` | PASS |
| teacher | `teacher-progress-extra` | PASS |
| teacher | `home` | PASS |
| teacher | `catalog` | PASS |
| teacher | `learn` | PASS |
| teacher | `games-extra` | PASS |
| teacher | `library-extra` | PASS |
| teacher | `research` | PASS |
| teacher | `plans` | PASS |
| teacher | `review` | PASS |
| teacher | `progress` | PASS |
| teacher | `profile-extra` | PASS |
| teacher | `settings` | PASS |
| business | `business-dashboard-extra` | PASS |
| business | `business-programs-extra` | PASS |
| business | `business-members-extra` | PASS |
| business | `business-teachers-extra` | PASS |
| business | `business-reports-extra` | PASS |
| business | `library-extra` | PASS |
| business | `account-extra` | PASS |
| business | `profile-extra` | PASS |
| business | `settings` | PASS |
| editor | `content-v12` | PASS |
| editor | `library-extra` | PASS |
| editor | `research` | PASS |
| editor | `catalog` | PASS |
| editor | `learn` | PASS |
| editor | `profile-extra` | PASS |
| editor | `settings` | PASS |
| reviewer | `review` | PASS |
| reviewer | `assessment-v11` | PASS |
| reviewer | `progress` | PASS |
| reviewer | `library-extra` | PASS |
| reviewer | `research` | PASS |
| reviewer | `profile-extra` | PASS |
| reviewer | `settings` | PASS |
| admin | `admin-v14` | PASS |
| admin | `editing-extra` | PASS |
| admin | `roles-extra` | PASS |
| admin | `author` | PASS |
| admin | `content-v12` | PASS |
| admin | `data` | PASS |
| admin | `catalog` | PASS |
| admin | `learn` | PASS |
| admin | `practice-v10` | PASS |
| admin | `assessment-v11` | PASS |
| admin | `adaptive-v13` | PASS |
| admin | `library-extra` | PASS |
| admin | `research` | PASS |
| admin | `plans` | PASS |
| admin | `core` | PASS |
| admin | `settings` | PASS |
| superadmin | `superadmin-extra` | PASS |
| superadmin | `governance-map-extra` | PASS |
| superadmin | `role-matrix-extra` | PASS |
| superadmin | `role-guides-extra` | PASS |
| superadmin | `auth-gates-extra` | PASS |
| superadmin | `health-extra` | PASS |
| superadmin | `system-admin-extra` | PASS |
| superadmin | `history-extra` | PASS |
| superadmin | `roles-extra` | PASS |
| superadmin | `access-extra` | PASS |
| superadmin | `permissions-extra` | PASS |
| superadmin | `organizations-extra` | PASS |
| superadmin | `academy` | PASS |
| superadmin | `author` | PASS |
| superadmin | `content-v12` | PASS |
| superadmin | `editing-extra` | PASS |
| superadmin | `data` | PASS |
| superadmin | `catalog` | PASS |
| superadmin | `learn` | PASS |
| superadmin | `practice-v10` | PASS |
| superadmin | `assessment-v11` | PASS |
| superadmin | `adaptive-v13` | PASS |
| superadmin | `teacher-extra` | PASS |
| superadmin | `library-extra` | PASS |
| superadmin | `research` | PASS |
| superadmin | `plans` | PASS |
| superadmin | `interface-studio-extra` | PASS |
| superadmin | `app-studio-extra` | PASS |
| superadmin | `infrastructure-extra` | PASS |
| superadmin | `backend-extra` | PASS |
| superadmin | `canon-create-extra` | PASS |
| superadmin | `canonical` | PASS |
| superadmin | `core` | PASS |
| superadmin | `themes-extra` | PASS |
| superadmin | `settings` | PASS |

**Overall static route status: PASS**

> This is a source-level/static routing audit, not a full browser E2E click test.