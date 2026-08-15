# UI: edit → Confirmed; Major incident explicit; empty Access hardcoded

Label: `agent`

## Goal

Provenance chips on each official box. Human can edit. SEND does not rewrite tags.

## Acceptance

- Each Slot shows a chip: Unknown / Estimated / Inferred / Confirmed.
- Editing a box (or an explicit per-slot accept) sets that Slot to **Confirmed**.
- Major incident control is Yes / No / Unknown. Tapping Yes is the declaration (`declared_at` set). The extractor must not have auto-set Yes from scale.
- Empty Access (and any empty text Slot) shows hardcoded copy: `Not stated — add or send anyway`. No second model chat.
- Confirm and SEND does **not** bulk-promote tags. Mixed tags may remain.

## Out of scope

QR generation, live SMS, span-highlight of transcript quotes.
