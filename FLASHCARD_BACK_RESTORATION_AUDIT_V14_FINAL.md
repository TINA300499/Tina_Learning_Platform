# Tina Learning Platform v14 FINAL — Flashcard Back Restoration Audit

Generated: 2026-08-28T23:20:03

## Root cause

The Student flashcard used a `<button>` as the whole card while also containing `Listen` buttons inside it. Nested `<button>` elements are invalid HTML and browsers may re-parent the inner controls. That can break the 3D front/back face structure and make the back side disappear.

## Fix

- Replaced the outer flashcard `<button>` with an accessible `<div role="button" tabindex="0">`.
- Preserved separate Listen buttons on the front and back.
- Restored explicit front/back ARIA state.
- Added Enter/Space keyboard flip support.
- Added Safari/Chrome `-webkit-backface-visibility` / `-webkit-transform` support.
- Explicitly promotes the back face when the card is flipped.
- Displays `No answer entered yet.` if a card genuinely has no back content.

## Validation

- PASS — no nested button card.
- PASS — back-face content is retained.
- PASS — flip state updates ARIA.
- PASS — Enter/Space keyboard support.
- PASS — WebKit back-face support.
- PASS — all JS/MJS syntax checks.
- PASS — deployment HTTP E2E: 8 PASS / 0 FAIL.
