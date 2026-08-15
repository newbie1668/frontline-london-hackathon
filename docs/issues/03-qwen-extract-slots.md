# Qwen: Transcript → seven official boxes + Provenance

Label: `agent`

Checkpoint: clip fills the completion form by 16:30.

## Goal

Unload ASR first. Local Ollama Qwen (~1.7B or smaller) writes `slots` per `docs/message.schema.json` (`$defs.modelOutput`). App wraps envelope (`incident_id`, `message_id`, `created_at`, `transcript`, `coordinates`).

## Acceptance

- `POST /extract` accepts `{ transcript, coordinates }` and returns a Message matching the schema.
- Right pane is the official seven boxes; values are speech-faithful strings (Major incident is Yes/No/Unknown).
- Provenance is `unknown | estimated | inferred | confirmed`. Speech → `estimated`. Missing → `unknown`.
- `major_incident.value` is **never** `true` from casualty counts, vehicles, or scale. Explicit spoken declaration may be `true` + `estimated` until the officer confirms.
- `coordinates` echo the browser value or `null`. The model must not receive a chance to invent them (strip/ignore any model-supplied geo).
- If Qwen OOMs: smaller quant/model. If still dead: keyword fallback **for this clip only** so the demo is not zero — do not pitch the fallback.

## Out of scope

SEND, QR, second Message, maps, Quote field, P1 arrays.

## Constraints

M1 8 GB. One model in RAM. No cloud LLM in the critical path.
