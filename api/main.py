"""M/ETHANE capture API.

/transcribe runs local ASR then unloads it. /extract runs local Qwen
then unloads it. Never load Parakeet and an LLM at the same time.
"""

from __future__ import annotations

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from asr import (
    ParakeetEngine,
    load_parakeet,
    transcribe_parakeet,
    unload_parakeet,
)
from extract import ExtractEngine, extract_qwen, load_qwen, unload_qwen, wrap_message

app = FastAPI(title="M/ETHANE capture", version="0.0.0")

asr_engine = ParakeetEngine(load_parakeet, transcribe_parakeet, unload_parakeet)
extract_engine = ExtractEngine(load_qwen, extract_qwen, unload_qwen)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Coordinates(BaseModel):
    lat: float
    lon: float


class ExtractRequest(BaseModel):
    transcript: str
    coordinates: Optional[Coordinates] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    transcribe: str = "not wired"
    extract: str = "not wired"
    asr_loaded: bool = False


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        transcribe="parakeet",
        extract="qwen",
        asr_loaded=asr_engine.loaded,
    )


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    wav = await audio.read()
    try:
        text = asr_engine.transcribe_wav(wav)
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"error": "asr_failed", "detail": str(exc)},
        )
    return {"transcript": text}


@app.post("/extract")
async def extract(body: ExtractRequest):
    if asr_engine.loaded:
        return JSONResponse(
            status_code=409,
            content={
                "error": "asr_loaded",
                "detail": "Unload ASR before extract.",
            },
        )
    try:
        output = extract_engine.extract_slots(body.transcript)
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"error": "extract_failed", "detail": str(exc)},
        )
    coordinates = None
    if body.coordinates is not None:
        coordinates = {"lat": body.coordinates.lat, "lon": body.coordinates.lon}
    return wrap_message(body.transcript, coordinates, output["slots"])
