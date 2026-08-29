# Tina Learning Platform v14 FINAL — Button Binding Audit

Generated: 2026-08-28T21:37:48

This is a static source audit of explicit button IDs. Buttons using `data-*` delegated handlers may appear unbound here even when they are intentionally routed.

- Explicit button IDs scanned: 158
- IDs without direct ID-specific binding: 2

## Directly unbound IDs requiring delegated-handler review

- `workspace-completion-v14.js` → `pwaSave`
- `admin-final-v14.js` → `${u.id}`