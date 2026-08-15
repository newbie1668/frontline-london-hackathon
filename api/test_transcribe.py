from fastapi.testclient import TestClient
import pytest

import main


@pytest.fixture(autouse=True)
def restore_asr_engine():
    previous = main.asr_engine
    yield
    main.asr_engine = previous


class FakeAsr:
    def __init__(self, transcript: str):
        self._transcript = transcript
        self.loaded = False

    def transcribe_wav(self, wav_bytes: bytes) -> str:
        assert wav_bytes
        self.loaded = True
        try:
            return self._transcript
        finally:
            self.loaded = False


def test_post_transcribe_returns_the_engine_transcript():
    fake = FakeAsr(
        "Park Road / Harrington Way, Nelson Way, two casualties, request fire and ambulance."
    )
    main.asr_engine = fake
    client = TestClient(main.app)

    response = client.post(
        "/transcribe",
        files={"audio": ("park-road-sitrep.wav", b"RIFFWAV", "audio/wav")},
    )

    assert response.status_code == 200
    assert (
        response.json()["transcript"]
        == "Park Road / Harrington Way, Nelson Way, two casualties, request fire and ambulance."
    )


def test_health_reports_asr_unloaded_after_transcribe():
    fake = FakeAsr("Park Road")
    main.asr_engine = fake
    client = TestClient(main.app)

    client.post(
        "/transcribe",
        files={"audio": ("park-road-sitrep.wav", b"RIFFWAV", "audio/wav")},
    )
    health = client.get("/health").json()

    assert fake.loaded is False
    assert health["asr_loaded"] is False


def test_post_transcribe_returns_500_when_asr_fails():
    class Boom:
        loaded = False

        def transcribe_wav(self, wav_bytes: bytes) -> str:
            raise RuntimeError("no metal")

    main.asr_engine = Boom()
    response = TestClient(main.app).post(
        "/transcribe",
        files={"audio": ("park-road-sitrep.wav", b"RIFFWAV", "audio/wav")},
    )

    assert response.status_code == 500
    assert response.json()["error"] == "asr_failed"


def test_health_reports_parakeet_ready_and_unloaded_at_rest():
    health = TestClient(main.app).get("/health").json()

    assert health["transcribe"] == "parakeet"
    assert health["asr_loaded"] is False
