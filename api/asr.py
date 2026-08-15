"""Local ASR: load Parakeet, transcribe one wav, unload.

Process (M1 8 GB): never leave the model resident, and never load it
alongside an LLM. Load → transcribe → unload hook → drop refs →
gc.collect() → mx.clear_cache(). Cloud ASR is forbidden.
"""

from __future__ import annotations

import gc
import os
import tempfile
from typing import Any, Callable

PARAKEET_MODEL = os.environ.get(
    "PARAKEET_MODEL", "mlx-community/parakeet-tdt-0.6b-v3"
)


def load_parakeet() -> Any:
    from parakeet_mlx import from_pretrained

    homebrew = "/opt/homebrew/bin"
    path = os.environ.get("PATH", "")
    if homebrew not in path:
        os.environ["PATH"] = homebrew + os.pathsep + path
    return from_pretrained(PARAKEET_MODEL)


def transcribe_parakeet(model: Any, path: str) -> str:
    return model.transcribe(path).text.strip()


def unload_parakeet(_model: Any) -> None:
    """Observed by tests. The engine drops the last reference, then frees RAM."""


def _release_mlx_memory() -> None:
    gc.collect()
    try:
        import mlx.core as mx

        mx.clear_cache()
    except Exception:
        pass


class ParakeetEngine:
    def __init__(
        self,
        load: Callable[[], Any],
        transcribe: Callable[[Any, str], str],
        unload: Callable[[Any], None],
    ) -> None:
        self._load = load
        self._transcribe = transcribe
        self._unload = unload
        self._model = None

    @property
    def loaded(self) -> bool:
        return self._model is not None

    def transcribe_wav(self, wav_bytes: bytes) -> str:
        path = None
        try:
            self._model = self._load()
            fd, path = tempfile.mkstemp(suffix=".wav")
            try:
                os.write(fd, wav_bytes)
            finally:
                os.close(fd)
            return self._transcribe(self._model, path)
        finally:
            model = self._model
            self._model = None
            if path:
                try:
                    os.unlink(path)
                except OSError:
                    pass
            if model is not None:
                self._unload(model)
            model = None
            _release_mlx_memory()
