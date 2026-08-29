# v14 FINAL — Sidebar Viewport Final Closure

- Sidebar is fixed with CSS `top` + `bottom`; no computed pixel height for the menu.
- `.roleSidebarGroups` is `flex: 1 1 0; min-height: 0; height: 0; overflow-y: scroll`.
- Header/footer remain fixed.
- Superadmin menu density is reduced at normal 100% browser zoom.
- 64–80px bottom scroll clearance prevents the final menu items from hiding behind the footer.
- `END OF MENU` sentinel confirms that the true bottom has been reached.
- Existing manual collapse/expand persistence remains.
