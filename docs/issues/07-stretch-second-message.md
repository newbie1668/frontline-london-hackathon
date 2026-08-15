# [STRETCH] Second Message, same incident_id, both visible, no overwrite

Label: `agent`

Do **not** start unless issues 1–6 are done.

## Goal

A second voice clip produces a second Message on the same Incident. Messages accumulate; the first is not patched.

## Acceptance

- First PTT mints `incident_id`. Second capture reuses it and mints a new `message_id`.
- UI shows both Messages (e.g. two completion forms or a simple diff). No mutating of Message 1.
- Provenance rules unchanged.

## Out of scope

Live multi-responder COP, history database, merging slot values automatically.
