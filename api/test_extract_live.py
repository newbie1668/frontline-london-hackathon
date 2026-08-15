import os

import pytest

from extract import ExtractEngine, extract_qwen, load_qwen, unload_qwen
from test_extract import PARK_ROAD_TRANSCRIPT


@pytest.mark.skipif(os.environ.get("QWEN_LIVE") != "1", reason="loads Qwen via Ollama")
def test_park_road_transcript_fills_speech_faithful_slots():
    engine = ExtractEngine(load_qwen, extract_qwen, unload_qwen)
    result = engine.extract_slots(PARK_ROAD_TRANSCRIPT)
    slots = result["slots"]
    location = (slots["exact_location"]["value"] or "").lower()
    incident = (slots["type_of_incident"]["value"] or "").lower()
    access = (slots["access"]["value"] or "").lower()
    casualties = (slots["number_of_casualties"]["value"] or "").lower()
    services = (slots["emergency_services"]["value"] or "").lower()

    assert "park road" in location
    assert "harrington" in location
    assert slots["exact_location"]["provenance"] == "estimated"
    assert "collision" in incident or "rtc" in incident or "bus" in incident
    assert "nelson" in access
    assert "casualt" in casualties or "wounded" in casualties or "trapped" in casualties
    assert "fire" in services or "ambulance" in services or "police" in services
    assert slots["major_incident"]["value"] is True
    assert slots["major_incident"]["provenance"] == "estimated"
    assert engine.loaded is False
