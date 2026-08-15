# PTT records wav; geolocation is a real fix or null

Label: `agent`

## Goal

Press-to-talk captures a wav from the browser. Device coordinates are attached only if the browser returns a fix.

## Acceptance

- PTT (mousedown/touchstart → mouseup/touchend) records via `MediaRecorder` and produces a wav (or webm converted server-side).
- Playing the Park Road fixture wav is also accepted as input for the demo path.
- `navigator.geolocation.getCurrentPosition` on capture: success → `{ lat, lon }`; deny/fail/timeout → `coordinates: null`.
- The model, ASR, and place text never write coordinates. No `0,0`, no geocode.
- Left pane can show a local recording indicator; the completion form is **not** filled by this issue.

## Out of scope

Parakeet, LLM, SEND, maps.

## Constraints

M1 8 GB Air. Sequential models later — do not load ASR here.
