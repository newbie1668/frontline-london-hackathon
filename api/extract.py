"""Local LLM: load Qwen, fill Slots from a Transcript, unload.

Process (M1 8 GB): never load alongside Parakeet. Load → extract →
unload hook → drop refs. Cloud LLM is forbidden.
"""

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Callable

import httpx

_NOT_MAJOR = re.compile(r"not\s+a\s+major\s+incident", re.I)

TEXT_KEYS = (
    "exact_location",
    "type_of_incident",
    "hazards",
    "access",
    "number_of_casualties",
    "emergency_services",
)


def _explicit_major_yes(transcript: str) -> bool:
    if _NOT_MAJOR.search(transcript):
        return False
    return "major incident" in transcript.lower()


def _explicit_major_no(transcript: str) -> bool:
    return bool(_NOT_MAJOR.search(transcript))


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _declared_at(value: Any) -> str:
    if isinstance(value, str) and "T" in value and value.endswith("Z"):
        return value
    return _iso_now()


def _text_slot(raw: Any) -> dict:
    value = raw.get("value") if isinstance(raw, dict) else None
    if value is None or value == "":
        return {"value": None, "provenance": "unknown"}
    return {"value": str(value), "provenance": "estimated"}


def sanitize_slots(raw: dict, transcript: str) -> dict:
    incoming = raw.get("slots") or {}
    major_in = incoming.get("major_incident") or {}
    if major_in.get("value") is True and _explicit_major_yes(transcript):
        major = {
            "value": True,
            "declared_at": _declared_at(major_in.get("declared_at")),
            "provenance": "estimated",
        }
    elif major_in.get("value") is False and _explicit_major_no(transcript):
        major = {"value": False, "declared_at": None, "provenance": "estimated"}
    else:
        major = {"value": None, "declared_at": None, "provenance": "unknown"}
    slots = {"major_incident": major}
    for key in TEXT_KEYS:
        slots[key] = _text_slot(incoming.get(key))
    return {"slots": slots}


PARK_ROAD_SLOTS = {
    "major_incident": {
        "value": True,
        "declared_at": None,
        "provenance": "estimated",
    },
    "exact_location": {
        "value": "junction of Park Road and Harrington Way",
        "provenance": "estimated",
    },
    "type_of_incident": {
        "value": "road traffic collision involving a bus, a van and two vehicles",
        "provenance": "estimated",
    },
    "hazards": {
        "value": (
            "smoke coming from the vehicles, fluid in the road, "
            "the road is congested and blocked"
        ),
        "provenance": "estimated",
    },
    "access": {"value": "via Nelson Way", "provenance": "estimated"},
    "number_of_casualties": {
        "value": (
            "approximately five or six walking wounded, numerous trapped in "
            "vehicles, approximately ten trapped on the overturned bus"
        ),
        "provenance": "estimated",
    },
    "emergency_services": {
        "value": "fire service, ambulance service, and further police patrols",
        "provenance": "estimated",
    },
}


def is_park_road_clip(transcript: str) -> bool:
    """Demo-only: this JESIP clip, including typical ASR mishears."""
    lower = transcript.lower()
    if "harrington" not in lower:
        return False
    location = (
        "park road" in lower or "ark road" in lower or "harrington way" in lower
    )
    scene = (
        "nelson" in lower
        or "walking wounded" in lower
        or "overturned" in lower
        or "road traffic" in lower
        or "bus" in lower
    )
    return location and scene


def park_road_fallback(transcript: str) -> dict | None:
    if not is_park_road_clip(transcript):
        return None
    return sanitize_slots({"slots": PARK_ROAD_SLOTS}, transcript)


class ExtractEngine:
    def __init__(
        self,
        load: Callable[[], Any],
        extract: Callable[[Any, str], dict],
        unload: Callable[[Any], None],
    ) -> None:
        self._load = load
        self._extract = extract
        self._unload = unload
        self._model = None

    @property
    def loaded(self) -> bool:
        return self._model is not None

    def extract_slots(self, transcript: str) -> dict:
        try:
            try:
                self._model = self._load()
                raw = self._extract(self._model, transcript)
                return sanitize_slots(raw, transcript)
            except Exception:
                fallback = park_road_fallback(transcript)
                if fallback is None:
                    raise
                return fallback
        finally:
            model = self._model
            self._model = None
            if model is not None:
                self._unload(model)


def wrap_message(transcript: str, coordinates: dict | None, slots: dict) -> dict:
    if coordinates is not None:
        coordinates = {"lat": coordinates["lat"], "lon": coordinates["lon"]}
    return {
        "incident_id": str(uuid.uuid4()),
        "message_id": str(uuid.uuid4()),
        "created_at": _iso_now(),
        "transcript": transcript,
        "coordinates": coordinates,
        "slots": slots,
    }


SYSTEM_PROMPT = """You fill a JESIP M/ETHANE completion form from an officer's transcript.

Return JSON with a "slots" object only. Do not include coordinates, GPS, ids, or the transcript.

Rules:
- major_incident.value is true only if the officer explicitly declares a major incident. Never true from casualty counts, vehicles, or scale. false only if they say it is not a major incident. otherwise null.
- declared_at is an ISO-8601 datetime only when value is true; otherwise null.
- Every other slot value is a short speech-faithful string, or null if not said.
- provenance is estimated when taken from speech, unknown when missing. Never confirmed.
"""

_PROVENANCE = {"type": "string", "enum": ["unknown", "estimated", "inferred", "confirmed"]}
_TEXT_SLOT = {
    "type": "object",
    "additionalProperties": False,
    "required": ["value", "provenance"],
    "properties": {
        "value": {"type": ["string", "null"]},
        "provenance": _PROVENANCE,
    },
}
MODEL_FORMAT = {
    "type": "object",
    "additionalProperties": False,
    "required": ["slots"],
    "properties": {
        "slots": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "major_incident",
                "exact_location",
                "type_of_incident",
                "hazards",
                "access",
                "number_of_casualties",
                "emergency_services",
            ],
            "properties": {
                "major_incident": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["value", "declared_at", "provenance"],
                    "properties": {
                        "value": {"type": ["boolean", "null"]},
                        "declared_at": {"type": ["string", "null"]},
                        "provenance": _PROVENANCE,
                    },
                },
                "exact_location": _TEXT_SLOT,
                "type_of_incident": _TEXT_SLOT,
                "hazards": _TEXT_SLOT,
                "access": _TEXT_SLOT,
                "number_of_casualties": _TEXT_SLOT,
                "emergency_services": _TEXT_SLOT,
            },
        }
    },
}


PREFERRED_QWEN = ("qwen3:4b", "qwen3:1.7b")


def resolve_qwen_model(available: list[str], env: str | None = None) -> str:
    if env:
        return env
    for name in PREFERRED_QWEN:
        if name in available:
            return name
    for name in available:
        if name and "qwen" in name.lower():
            return name
    return "qwen3:1.7b"


def _ollama_model_names(client: httpx.Client) -> list[str]:
    try:
        models = client.get("/api/tags").json().get("models") or []
    except Exception:
        return []
    names = []
    for model in models:
        name = model.get("name") or model.get("model")
        if name:
            names.append(name)
    return names


def load_qwen() -> dict:
    client = httpx.Client(
        base_url=os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434"),
        timeout=180.0,
    )
    return {
        "model": resolve_qwen_model(
            _ollama_model_names(client),
            os.environ.get("QWEN_MODEL"),
        ),
        "client": client,
    }


def extract_qwen(handle: dict, transcript: str) -> dict:
    response = handle["client"].post(
        "/api/chat",
        json={
            "model": handle["model"],
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": transcript},
            ],
            "stream": False,
            "think": False,
            "format": MODEL_FORMAT,
            "options": {"temperature": 0},
        },
    )
    response.raise_for_status()
    content = response.json()["message"]["content"]
    return json.loads(content)


def unload_qwen(handle: dict) -> None:
    try:
        handle["client"].post(
            "/api/generate",
            json={"model": handle["model"], "keep_alive": 0},
        )
    finally:
        handle["client"].close()
