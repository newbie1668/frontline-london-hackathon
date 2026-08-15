"""M/ETHANE capture API.

Stubs only: /transcribe and /extract return 501 until Saturday issues 2–3.
Never load Parakeet and an LLM in the same process at the same time.
"""

from __future__ import annotations

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="M/ETHANE capture", version="0.0.0")

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


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)) -> JSONResponse:
    _ = audio
    return JSONResponse(
        status_code=501,
        content={
            "error": "not_wired",
            "issue": 2,
            "detail": "Parakeet transcription is Saturday issue 2.",
        },
    )


@app.post("/extract")
async def extract(body: ExtractRequest) -> JSONResponse:
    _ = body
    return JSONResponse(
        status_code=501,
        content={
            "error": "not_wired",
            "issue": 3,
            "detail": "Local Qwen slot fill is Saturday issue 3.",
        },
    )
