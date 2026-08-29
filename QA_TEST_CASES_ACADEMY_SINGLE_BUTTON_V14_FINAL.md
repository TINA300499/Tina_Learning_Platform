# Tina Learning Platform v14 FINAL — Tina Academy Button Test Cases

## Automated
Run:

```bash
bash qa/run-v14-targeted-tests.sh
```

Expected final line:

`TARGETED_TESTS=PASS`

The targeted suite checks:
- the Superadmin dashboard contains one canonical `#saAcademy` button;
- the access-closure code recognizes and reuses that button;
- the closure does not append a duplicate on first execution;
- calling the closure repeatedly remains idempotent;
- the reused button receives the `academy` route;
- clicking it routes to Tina Academy;
- Authoring Hub and Data Manager still receive one management button where needed;
- the Superadmin-only guard prevents mutation for non-Superadmin roles;
- JavaScript syntax remains valid;
- backend HTTP E2E remains green.

## Manual browser verification

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| UI-ACA-01 | Superadmin home | Login as Superadmin and open the dashboard | Tina Academy card shows exactly **one** `Open Tina Academy` button |
| UI-ACA-02 | Button navigation | Click `Open Tina Academy` | Tina Academy opens once; no duplicate navigation or double render |
| UI-ACA-03 | Return to dashboard | Go back to Superadmin dashboard | Tina Academy still has exactly one button |
| UI-ACA-04 | Repeated rendering | Switch Dashboard → Settings → Dashboard 5 times | No second Academy button appears |
| UI-ACA-05 | Theme change | Change theme, return to Dashboard | Button count remains one |
| UI-ACA-06 | Font scale | Change font scale, return to Dashboard | Button count remains one and layout remains aligned |
| UI-ACA-07 | Browser refresh | Hard refresh while logged in | Tina Academy card still has one button |
| UI-ACA-08 | Logout/login | Logout, login again as Superadmin | Exactly one button appears |
| UI-ACA-09 | Non-Superadmin role | Login as another permitted role | Superadmin owner-card repair logic does not add Tina Academy controls |
| UI-ACA-10 | Console | Open DevTools Console while performing UI-ACA-01..08 | No duplicate-button-related exception is emitted |

For UI-ACA-01 you can additionally run this in DevTools Console:

```js
[...document.querySelectorAll("#app .card")]
  .find(c => c.querySelector("h3,h2")?.textContent.trim() === "Tina Academy")
  ?.querySelectorAll("button").length
```

Expected value: `1`.
