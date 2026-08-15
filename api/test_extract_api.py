import json
from pathlib import Path

import jsonschema
import pytest
from fastapi.testclient import TestClient

import main

SCHEMA = json.loads(
    (Path(__file__).resolve().parents[1] / "docs" / "message.schema.json").read_text()
)

SLOTS = {
    "major_incident": {
        "value": True,
        "declared_at": "2026-08-15T12:00:00Z",
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
        "value": "smoke coming from the vehicles, fluid in the road",
        "provenance": "estimated",
    },
    "access": {"value": "via Nelson Way", "provenance": "estimated"},
    "number_of_casualties": {
        "value": "approximately five or six walking wounded",
        "provenance": "estimated",
    },
    "emergency_services": {
        "value": "fire, ambulance, and further police patrols",
        "provenance": "estimated",
    },
}


@pytest.fixture(autouse=True)
def restore_extract_engine():
    previous = getattr(main, "extract_engine", None)
    yield
    main.extract_engine = previous


class FakeExtract:
    def __init__(self, slots: dict):
        self._slots = slots
        self.loaded = False
        self.seen_transcript = None

    def extract_slots(self, transcript: str) -> dict:
        self.seen_transcript = transcript
        self.loaded = True
        try:
            return {"slots": self._slots}
        finally:
            self.loaded = False


def test_post_extract_returns_a_message_matching_the_schema():
    fake = FakeExtract(SLOTS)
    main.extract_engine = fake
    transcript = (
        "I am declaring this a major incident. "
        "The exact location is the junction of Park Road and Harrington Way."
    )

    response = TestClient(main.app).post(
        "/extract",
        json={"transcript": transcript, "coordinates": None},
    )

    assert response.status_code == 200
    payload = response.json()
    jsonschema.validate(payload, SCHEMA, format_checker=jsonschema.FormatChecker())
    assert payload["transcript"] == transcript
    assert payload["coordinates"] is None
    assert payload["slots"]["exact_location"]["value"] == (
        "junction of Park Road and Harrington Way"
    )
    assert fake.seen_transcript == transcript
    assert fake.loaded is False


def test_post_extract_echoes_browser_coordinates():
    fake = FakeExtract(SLOTS)
    main.extract_engine = fake

    response = TestClient(main.app).post(
        "/extract",
        json={
            "transcript": "Park Road",
            "coordinates": {"lat": 51.5074, "lon": -0.1278},
        },
    )

    assert response.status_code == 200
    payload = response.json()
    jsonschema.validate(payload, SCHEMA, format_checker=jsonschema.FormatChecker())
    assert payload["coordinates"] == {"lat": 51.5074, "lon": -0.1278}
    assert fake.seen_transcript == "Park Road"


def test_health_reports_qwen_extract_ready():
    health = TestClient(main.app).get("/health").json()

    assert health["extract"] == "qwen"
    assert health["transcribe"] == "parakeet"


def test_post_extract_returns_500_when_extract_fails():
    class Boom:
        loaded = False

        def extract_slots(self, transcript: str) -> dict:
            raise RuntimeError("OOM")

    main.extract_engine = Boom()
    response = TestClient(main.app).post(
        "/extract",
        json={"transcript": "A fire at the station.", "coordinates": None},
    )

    assert response.status_code == 500
    assert response.json()["error"] == "extract_failed"


def test_post_extract_refuses_while_asr_is_loaded():
    previous_asr = main.asr_engine
    main.asr_engine = type("Asr", (), {"loaded": True})()
    main.extract_engine = FakeExtract(SLOTS)
    try:
        response = TestClient(main.app).post(
            "/extract",
            json={"transcript": "Park Road", "coordinates": None},
        )
    finally:
        main.asr_engine = previous_asr

    assert response.status_code == 409
    assert response.json()["error"] == "asr_loaded"
