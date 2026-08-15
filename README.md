<div align="center">

# M/ETHANE

### A spoken JESIP form that still needs the officer.

First officer on scene can talk normally, not in mnemonic order. The official seven boxes fill from that speech, then wait for a check. Audio never leaves the laptop.

[![License: MIT](https://img.shields.io/badge/license-MIT-0b1f33?style=flat-square)](LICENSE)

</div>

![Capture screen with the Park Road sitrep: words on the left, official completion form on the right](docs/screenshot.png)

## Why this exists

UK fire, police and ambulance already use [M/ETHANE](https://www.jesip.org.uk/joint-doctrine/m-ethane/) for that first shared picture. Seven boxes.

The hard part is doing them while you are still looking at the scene, often in gloves, often with a radio in the other hand, sometimes reciting the letters in order because that is how you were taught.

This is a talking version of the same form. It is not a replacement for the officer or the real JESIP app.

## The seven boxes

| | | |
|---|---|---|
| **M** | Major incident | Has one been declared? Not "does this look big?" |
| **E** | Exact location | Somewhere other crews can actually find |
| **T** | Type of incident | What kind of incident |
| **H** | Hazards | What is dangerous, or might be |
| **A** | Access | Best way in and out |
| **N** | Number of casualties | How many people are hurt, and what you know |
| **E** | Emergency services | Who you need, or who is already there |

If major incident is No, the other six stay. That is ETHANE: same form, no declaration.

## Using it

Press Record and talk, or play the Park Road clip. You do not have to hit the mnemonic in order.

Left side is the transcript: what the microphone caught. Right side is the official completion form. Speech only writes into those boxes.

Each box has a label for how the value got there:

- Unknown: empty
- Estimated: taken from speech, including messy numbers ("about ten", "five or six")
- Inferred: nobody said it; the app filled it. Stays inferred until you touch that box
- Confirmed: you edited it, or accepted it. SEND does not confirm the rest for you

Empty boxes can still go out. They go as not stated.

Major incident is never inferred from casualty counts or how many vehicles are involved. Yes only if it was said, or the officer taps Yes.

GPS is only attached if the laptop or phone actually returned a fix. A street name is not a pin.

SEND gives you a short text copy, the full record, and a QR. A phone on the same Wi-Fi can scan the QR and open the form.

## Try it

Get it running ([below](#run-it-here)), then open [http://localhost:5173](http://localhost:5173) once while you still have network so the fonts load. Airplane mode after that is fine.

1. Click Park Road fixture.
2. Wait for the transcript, then the boxes.
3. Change anything you would change on scene.
4. Confirm and SEND. Scan the QR if you want to see what a colleague would see.

The clip is the radio sitrep from [this JESIP animation](https://www.youtube.com/watch?v=RaGcC4qZfZ0).

## Privacy

Speech is transcribed on this laptop. It is not uploaded. Coordinates are a real device fix, or they are missing.

## Run it here

This was built on a MacBook Air M1 with 8 GB of RAM. Speech-to-text and the language model take turns so they are not both loaded together.

You need Python 3.11 or newer, Node.js, and [Ollama](https://ollama.com/) with a small Qwen model (`qwen3:1.7b` unless you set `QWEN_MODEL`).

API:

```bash
cd api
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export QWEN_MODEL="${QWEN_MODEL:-qwen3:1.7b}"
ollama pull "$QWEN_MODEL"
uvicorn main:app --reload --port 8000
```

Interface:

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Not in this demo

No live SMS, no CAD hookup, and it will not declare a major incident for you.

A second message on the same incident is not built either. In the real world those messages stack. Here you only get one.

## Credits

M/ETHANE doctrine and the training audio are © [JESIP](https://www.jesip.org.uk/). This project is unofficial.

Clip: [JESIP METHANE animation](https://www.youtube.com/watch?v=RaGcC4qZfZ0), radio sitrep only.

## License

[MIT](LICENSE)
