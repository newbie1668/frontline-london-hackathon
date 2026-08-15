# Parakeet: Park Road clip → Transcript, then unload

Label: `agent`

Checkpoint: readable Transcript in the left pane by 14:00. If this fails, Whisper.cpp adapter only.

## Goal

`POST /transcribe` runs parakeet-mlx (`tdt-0.6b-v3`, quantized if needed) on the wav, returns text, then **unloads** the ASR model so RAM is free for Qwen.

## Acceptance

- Fixture `fixtures/park-road-sitrep.wav` (radio sitrep only) transcribes to readable English including Park Road / Harrington Way, Nelson Way, casualties, and the service request.
- Left pane shows the Transcript. It is not a Slot.
- After inference, ASR is unloaded (process documented; do not leave Parakeet resident).
- Never load Parakeet and the LLM at the same time.
- Cloud ASR is forbidden.

## Fallback

Whisper.cpp adapter only if Parakeet cannot produce a usable transcript on this machine.

## Out of scope

Slot filling, provenance, SEND.
