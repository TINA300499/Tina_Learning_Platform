# v14 FINAL — Runtime Console Recovery

## Fixed
1. `forceRoleLoginGate is not defined`
   - Root cause: the function was declared inside the workspace IIFE, but the two startup calls were placed after `})();`.
   - Fix: startup scheduling is now inside the same IIFE scope.

2. `/api/health` 404 under VS Code Live Server
   - Static localhost ports such as 5501 are now recognized as frontend-only/local-static mode.
   - Backend probe is skipped there.
   - Production/same-origin backend probing remains enabled outside the static-dev port set.

3. `/api/telemetry` 405 under Live Server
   - Telemetry and telemetry-summary calls now return an offline result immediately when the backend is unavailable.
   - This prevents repeated POST requests to a static file server.

4. `integrations/academy/academy-domain-catalog.json` 404
   - The expected catalog file is now included in the package with the existing 13 Tina Academy domains.
   - Redundant alternate fetch path removed.

## Not an application fault
`[DEFAULT]: WARN : Using DEFAULT root logger` from `5133.libs.chunk.js` is not emitted by Tina source files in this package; it is typically from a browser extension or injected third-party bundle.
