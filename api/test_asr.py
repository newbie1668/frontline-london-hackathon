from asr import ParakeetEngine
import os


def test_transcribe_wav_loads_then_unloads():
    events = []
    model = object()

    def load():
        events.append("load")
        return model

    def transcribe(loaded, path):
        events.append("transcribe")
        assert loaded is model
        with open(path, "rb") as fh:
            assert fh.read() == b"RIFFWAV"
        return "Park Road / Harrington Way"

    def unload(loaded):
        events.append("unload")
        assert loaded is model

    engine = ParakeetEngine(load=load, transcribe=transcribe, unload=unload)

    text = engine.transcribe_wav(b"RIFFWAV")

    assert text == "Park Road / Harrington Way"
    assert events == ["load", "transcribe", "unload"]
    assert engine.loaded is False


def test_transcribe_wav_unloads_when_inference_fails():
    events = []

    def load():
        events.append("load")
        return object()

    def transcribe(_loaded, _path):
        events.append("transcribe")
        raise RuntimeError("decode failed")

    def unload(_loaded):
        events.append("unload")

    engine = ParakeetEngine(load=load, transcribe=transcribe, unload=unload)

    try:
        engine.transcribe_wav(b"RIFFWAV")
    except RuntimeError:
        pass

    assert events == ["load", "transcribe", "unload"]
    assert engine.loaded is False


def test_transcribe_wav_releases_model_for_collection():
    import gc
    import weakref

    class Model:
        pass

    model = Model()
    ref = weakref.ref(model)

    engine = ParakeetEngine(
        load=lambda: model,
        transcribe=lambda _loaded, _path: "Park Road",
        unload=lambda _loaded: None,
    )
    engine.transcribe_wav(b"RIFFWAV")
    del model
    gc.collect()

    assert engine.loaded is False
    assert ref() is None


def test_prepare_asr_wav_converts_to_16k_mono(tmp_path):
    import math
    import struct
    import wave

    from asr import prepare_asr_wav

    src = tmp_path / "quiet.wav"
    with wave.open(str(src), "w") as fh:
        fh.setnchannels(2)
        fh.setsampwidth(2)
        fh.setframerate(48000)
        frames = bytearray()
        for i in range(48000):
            sample = int(0.04 * 32767 * math.sin(2 * math.pi * 440 * i / 48000))
            frames.extend(struct.pack("<hh", sample, sample))
        fh.writeframes(frames)

    prepared = prepare_asr_wav(str(src))
    assert prepared != str(src)

    with wave.open(prepared, "r") as fh:
        assert fh.getnchannels() == 1
        assert fh.getframerate() == 16000
        frames = fh.readframes(fh.getnframes())
        peak = max(abs(struct.unpack_from("<h", frames, i)[0]) for i in range(0, len(frames), 2))
        assert peak > 0
    os.unlink(prepared)
