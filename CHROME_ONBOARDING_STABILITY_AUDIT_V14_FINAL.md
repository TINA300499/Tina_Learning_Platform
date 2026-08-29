# v14 FINAL — Edge-to-Edge Chrome & Stable Onboarding Audit

Generated: 2026-08-28T23:04:44

## Result
- PASS — header is full viewport width.
- PASS — footer is full viewport width.
- PASS — sidebar occupies the exact vertical band between header and footer on desktop.
- PASS — main content is offset by sidebar; header/footer are not.
- PASS — onboarding coachmark uses one fixed bottom-right position.
- PASS — onboarding no longer calculates target coordinates with `getBoundingClientRect()`.
- PASS — automatic onboarding remains one-time per user + active role.
- PASS — highlighted sidebar groups are opened without moving the coachmark.
- PASS — all JS/MJS syntax checks.
- PASS — deployment HTTP E2E.

## UI geometry
Desktop:
- Header: 100vw × 72px
- Sidebar: 240px, top=72px, bottom=76px
- Footer: 100vw × minimum 76px
- App: margin-left=240px

Mobile:
- Header: 64px
- Sidebar: overlay below header
- Footer: full width
- App: full width
