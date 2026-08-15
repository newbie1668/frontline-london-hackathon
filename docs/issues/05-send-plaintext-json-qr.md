# SEND: plaintext + JSON + QR of the plaintext

Label: `agent`

## Goal

Confirm and SEND emits the Message as shown, airplane-mode, no network required.

## Acceptance

- Button **Confirm and SEND** is explicit. It does not change Provenance on other Slots.
- Three artifacts:
  1. JESIP-ordered **plaintext** (SMS body): DATE/TIME plus the seven headings and values.
  2. **Message JSON** on screen (full envelope).
  3. **QR of the plaintext only** (not the JSON, not the Transcript).
- No live SMS, email, or JESIP API.
- Empty boxes go out as Unknown / the hardcoded “Not stated” text as shown.

## Out of scope

Actual telephony, CAD, sharing to the official JESIP app.
