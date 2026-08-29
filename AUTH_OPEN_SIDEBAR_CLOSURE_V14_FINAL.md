# v14 FINAL — Authentication, Open Buttons & Sidebar Closure

1. Every governed role now has Show login and Show registration in Superadmin Authentication Gates.
2. If registration is OFF, login UI shows Contact Superadmin and can save an access request.
3. Non-student public registration, when explicitly enabled, creates pending_activation and cannot login until Superadmin activates it.
4. System Administration Open buttons use the canonical role router plus delegated click fallback.
5. Superadmin sidebar groups are expanded on first use. User collapse choices remain persisted.
6. The fixed sidebar shell no longer scrolls. roleSidebarGroups is the dedicated native scroll viewport.
7. Scroll viewport height is calculated in pixels from actual window height minus measured header/footer heights.
