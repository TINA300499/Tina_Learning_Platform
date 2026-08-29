# v14 FINAL — Theme Contrast / Live Reformat Closure

- Dashboard metric values now use `var(--text)` so numbers remain visible in Midnight and High Contrast.
- Metric labels use `var(--muted)`.
- Alternate themes override the later Tina Classic hard-coded white/black compatibility layer.
- Cards, header, sidebar, footer, controls, tables and navigation states now re-project from the active theme variables.
- Changing theme dispatches `tina:theme-changed` and refreshes chrome/footer/sidebar geometry immediately; no page reload is required.
- Tina Classic remains red / black / white.
