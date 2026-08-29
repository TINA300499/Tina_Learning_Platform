# v14 FINAL — Sidebar Hard Geometry Closure

This patch replaces the previous sidebar sizing experiments with one authoritative rule:

`sidebar height = window viewport height - actual fixed header height - actual fixed footer height`

The same result is enforced twice:
1. CSS `calc(100vh - header - footer)`.
2. A single runtime geometry sync that writes the exact pixel height after render/resize/font/theme changes.

The sidebar also has a fixed `::before` backing surface from header to footer, so the white/theme surface cannot visually terminate early.

Only `.roleSidebarGroups` scrolls. No MutationObserver, polling loop, reload loop, or continuous repaint mechanism is used.
