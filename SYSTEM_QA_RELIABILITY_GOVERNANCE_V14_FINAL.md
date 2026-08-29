# Tina Learning Platform v14 FINAL — System QA & Reliability Governance

## Owner
Superadmin only.

## Sidebar
System Control → System QA & Reliability.

## Purpose
The QA subsystem continuously observes **event-driven runtime signals** while the application is open and groups recurring failures into incidents.

## Signals captured
- JavaScript runtime errors.
- Unhandled promise rejections.
- Failed resource loads.
- Click metadata: element tag/id and route/action data attributes.
- Form submit metadata: form id/action only.
- Route/view transitions when emitted by the platform.
- Browser online/offline transitions.

## Deliberately not captured
- Form values.
- Passwords.
- Keystrokes.
- Message text.
- Clipboard content.
- Audio/video.
- Screen recordings.

Runtime text is sanitized before storage and common email/URL/long numeric content is redacted.

## Repeated-fault policy
A fingerprint becomes a repeated fault at 3 occurrences within 10 minutes. Eight or more recent occurrences are marked high severity.

## Triage lifecycle
open → acknowledged → resolved → optional reopen.

## Storage
Local QA state: `tina.v14.system.qa`.
A privacy-minimized telemetry event is also sent to the existing Tina backend when available.

## Performance
No MutationObserver, polling loop, periodic DOM scan, reload loop or continuous repaint mechanism is used. Collection is event-driven.


## Fix-location management
Every incident now carries a Superadmin-managed fix record:
- fix status: untriaged / investigating / fix-planned / fix-in-progress / fixed / verified;
- source/file/module;
- line and column;
- owner;
- patch/version/commit reference;
- diagnosis and fix notes;
- updated timestamp.

The detected JavaScript/resource source and line are prefilled when available. Superadmin can correct or enrich this location, then copy a compact fix context for implementation work.

Resolving an incident and verifying the fix remain separate concepts: an incident can be acknowledged while the fix is still in progress, and a fix can be marked verified only after validation.
