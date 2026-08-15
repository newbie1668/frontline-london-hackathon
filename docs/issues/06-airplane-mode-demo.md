# Airplane-mode demo: fixture wav through 1–5 twice without the network

Label: `agent`

## Goal

A 3-minute demo that works in airplane mode, using only the Park Road radio sitrep.

## Acceptance

- Device or browser can be offline (`navigator.onLine === false` or OS airplane mode).
- Path: fixture wav (or PTT) → Transcript → filled completion form → Confirm and SEND → plaintext, JSON, QR.
- Run this path **twice** without touching the network.
- Demo uses **only** the radio sitrep in `fixtures/park-road-sitrep.wav`. Do not play the full JESIP video (caller, narrator, music).
- On-screen credit: M/ETHANE doctrine and training audio © JESIP (jesip.org.uk). YouTube source: https://www.youtube.com/watch?v=RaGcC4qZfZ0
- No slides. Pitch: search-and-rescue / coordination + trusted information (provenance). Not burnout/paperwork.

## Out of scope

Issue 7 (second Message) unless 1–6 are already green.
