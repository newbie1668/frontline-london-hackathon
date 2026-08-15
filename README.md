# M/ETHANE

Voice-first capture of a JESIP M/ETHANE message for a first officer on scene. Speak freely; a local model fills the official completion form; the officer confirms; SEND emits plaintext, JSON, and a QR. It does not replace the officer, the JESIP app, or CAD.

Doctrine: [JESIP M/ETHANE](https://www.jesip.org.uk/joint-doctrine/m-ethane/). Training audio used in the demo is © JESIP — radio sitrep only from [this animation](https://www.youtube.com/watch?v=RaGcC4qZfZ0).

## Run

Two processes. Models are not wired in this scaffold (`/transcribe` and `/extract` return 501).

```bash
# API
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# UI
cd web
npm install
npm run dev
```

Open http://localhost:5173

## Hardware

MacBook Air M1, 8 GB RAM. Never load Parakeet and the LLM in memory at the same time. Unload ASR, then extract.

## Saturday issues

Execute in order. Label `agent`. Stretch (7) only if 1–6 are done.

| # | Issue |
|---|---|
| 1 | PTT records wav; geolocation is a real fix or `null` |
| 2 | Parakeet: Park Road clip → Transcript, then unload |
| 3 | Qwen: Transcript → seven boxes + Provenance |
| 4 | Edit → Confirmed; Major incident explicit; empty Access hardcoded |
| 5 | SEND: plaintext + JSON + QR of the plaintext |
| 6 | Airplane-mode demo (fixture wav, twice, no network) |
| 7 | Stretch: second Message, same `incident_id` |

After the GitHub remote exists:

```bash
./scripts/create-github-issues.sh
```

## Layout

Transcript on the left. Official JESIP completion form on the right (seven boxes, unchanged). Provenance chips on each box.

## Credit

M/ETHANE is JESIP doctrine. This project is unofficial.
