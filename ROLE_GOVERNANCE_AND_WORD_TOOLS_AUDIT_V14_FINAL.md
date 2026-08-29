# Tina Learning Platform v14 FINAL — Role Governance + Word Tools Audit

Generated: 2026-08-28T21:50:49

## Governance
- Active Learning: Student + Superadmin only.
- Administrator may create and edit non-Superadmin users but cannot assign/remove Superadmin.
- Administrator cannot permanently delete user accounts.
- Superadmin can delete governed accounts except self / the last active Superadmin.
- Teacher/Business hard-delete requires explicit `user-delete-lower` permission and scope validation.
- Teacher hard-delete is limited to Student accounts present in that teacher's classes.
- Business hard-delete is limited to Student/Teacher/Business accounts inside the assigned organization.
- Business ordinary **Remove from Organization** is not account deletion.

## Sidebar
- Expanded/collapsed group state persists per role in localStorage.
- Clicking a child page does not collapse its parent group.
- A group collapses only when its own heading is clicked again.

## English Word Tools
- `Dictionary` toggle is added to the top bar.
- When enabled, click an English word to inspect it.
- Double-click an English word works even when the toggle is off.
- Dictionary lookup uses DictionaryAPI at runtime.
- Translation targets: Vietnamese, Chinese, Japanese, Korean, Thai, French, German, Spanish, Italian and Portuguese.
- Translation uses MyMemory at runtime.
- Fallback buttons open Wiktionary and Google Translate.
- Network access is required for online definition/translation results.

## Validation
- Static runtime syntax: PASS
- Governance checks: PASS
