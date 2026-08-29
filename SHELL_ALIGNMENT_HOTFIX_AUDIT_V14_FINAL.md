# Tina Learning Platform v14 FINAL — Shell Alignment Hotfix Audit

Generated: 2026-08-28T23:18:37

## Root cause

The previous shell combined:
- CSS Grid on `body`,
- fixed sidebar,
- fixed footer,
- multiple legacy `body` left-padding rules,
- `100vw` footer sizing.

That combination could create a horizontally shifted workspace and a large blank area, especially after older runtime styles were still present.

## Fix

- Removed CSS Grid from the authenticated page shell.
- Header is fixed independently across the viewport.
- Sidebar is fixed only between header and footer.
- Main application uses `margin-left` only; no viewport-width arithmetic.
- Footer uses `left:0; right:0` instead of `width:100vw`.
- Horizontal overflow is disabled at `html/body` and app level.
- Common `.wrap` containers are normalized to the workspace width.
- Legacy inline width / margin-left values are removed by the runtime normalizer.

## Automated validation

- PASS — body uses deterministic block shell.
- PASS — horizontal overflow neutralized.
- PASS — header fixed full width.
- PASS — sidebar fixed between header/footer.
- PASS — app fills remaining width.
- PASS — footer full width without `100vw`.
- PASS — all JS/MJS syntax checks.
- PASS — deployment HTTP E2E: 8 PASS / 0 FAIL.
