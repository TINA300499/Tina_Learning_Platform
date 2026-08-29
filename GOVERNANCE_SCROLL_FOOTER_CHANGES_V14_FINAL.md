# v14 FINAL — Governance, Scroll & Footer Closure

- Superadmin-only Data Standards Manager.
- System-wide managed data-entry guidance and sample data.
- Data Standards removed from non-Superadmin navigation.
- Native, always-visible sidebar vertical scrollbar; legacy wheel interception removed.
- Footer height is content-driven and measured after render/font changes so the full footer remains visible at 100%.
- Sidebar viewport height is synchronized to the actual fixed header/footer heights.
- Default role permissions tightened.
- Active-role route authorization now follows the visible role navigation contract.
- No MutationObserver or continuous repaint loop added.
