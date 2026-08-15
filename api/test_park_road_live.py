import os
from pathlib import Path

import pytest

from asr import (
    ParakeetEngine,
    load_parakeet,
    transcribe_parakeet,
    unload_parakeet,
)

FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "park-road-sitrep.wav"


@pytest.mark.skipif(os.environ.get("PARAKEET_LIVE") != "1", reason="loads Parakeet weights")
def test_park_road_fixture_transcribes_readable_english():
    engine = ParakeetEngine(load_parakeet, transcribe_parakeet, unload_parakeet)
    text = engine.transcribe_wav(FIXTURE.read_bytes())
    lower = text.lower()

    assert "park road" in lower
    assert "harrington" in lower
    assert "nelson" in lower
    assert "casualt" in lower
    assert "fire" in lower or "ambulance" in lower
    assert engine.loaded is False
