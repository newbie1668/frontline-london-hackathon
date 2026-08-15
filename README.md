# M/ETHANE

Voice-first capture of a JESIP M/ETHANE message for a first officer on scene. The officer speaks freely; a local model fills the official completion form; the officer confirms; SEND emits plaintext, JSON, and a QR of the completion form. It does not replace the officer, the JESIP app, or CAD.

Audio never leaves the laptop. The demo runs in airplane mode.

Doctrine: [JESIP M/ETHANE](https://www.jesip.org.uk/joint-doctrine/m-ethane/). Training audio is © JESIP — radio sitrep only from [this animation](https://www.youtube.com/watch?v=RaGcC4qZfZ0).

![Transcript on the left and the official JESIP completion form on the right, filled from the Park Road sitrep. Major incident is Confirmed; other Slots stay Estimated until the officer edits.](docs/screenshot.png)

## Demo

With both processes running (see [Run](#run)):

1. Open http://localhost:5173 once while online so fonts cache, then enable airplane mode.
2. Click **Park Road fixture** (or **Record**, play the sitrep into the mic, **Stop**).
3. Wait for the Transcript on the left, then the seven boxes on the right.
4. Edit a box if needed — that Slot becomes **Confirmed**. SEND does not bulk-confirm the rest.
5. **Confirm and SEND** — JESIP-ordered plaintext, Message JSON, and a QR. Scan the QR on a phone on the same LAN to open the completion form.

Pitch: search-and-rescue / coordination, and honest provenance. Not burnout or paperwork.

## Run

Two processes. `/transcribe` runs local Parakeet then unloads the ASR model. `/extract` runs local Ollama Qwen then unloads it. Never load both at once.

```bash
# API (Python 3.11+ — required by parakeet-mlx)
cd api
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export QWEN_MODEL="${QWEN_MODEL:-qwen3:1.7b}"
ollama pull "$QWEN_MODEL"
uvicorn main:app --reload --port 8000

# UI
cd web
npm install
npm run dev
```

Open http://localhost:5173

## Hardware

MacBook Air M1, 8 GB RAM. Unload ASR, then extract.

## Layout

Transcript on the left. Official JESIP completion form on the right (seven boxes, unchanged). Provenance chips on each box: Unknown, Estimated, Inferred, Confirmed.

Coordinates are a real browser fix or absent — never inferred from speech.

## Status

MVP is done. Stretch (a second Message on the same `incident_id`) is not in this demo.

| # | What | Status |
|---|---|---|
| 1 | PTT records wav; geolocation is a real fix or `null` | Done |
| 2 | Parakeet: Park Road clip → Transcript, then unload | Done |
| 3 | Qwen: Transcript → seven boxes + Provenance | Done |
| 4 | Edit → Confirmed; Major incident explicit | Done |
| 5 | SEND: plaintext, JSON, QR of the completion form | Done |
| 6 | Airplane-mode demo (fixture wav, no network) | Done |
| 7 | Stretch: second Message, same `incident_id` | Not built |

Issues: [docs/issues/](./docs/issues/) · [GitHub](https://github.com/newbie1668/frontline-london-hackathon/issues)

## Tests

```bash
cd web && npm test
cd api && source .venv/bin/activate && pytest
```

Live Parakeet / Qwen tests stay skipped unless `PARAKEET_LIVE=1` or `QWEN_LIVE=1`.

## Credit

M/ETHANE is JESIP doctrine. This project is unofficial.
