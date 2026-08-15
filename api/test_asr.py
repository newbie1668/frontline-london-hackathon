from asr import ParakeetEngine


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
