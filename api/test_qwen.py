import json

from extract import extract_qwen, unload_qwen


class FakeOllama:
    def __init__(self, content: str):
        self.content = content
        self.posts = []
        self.closed = False

    def post(self, path, json):
        self.posts.append((path, json))

        class Resp:
            def raise_for_status(self_inner):
                return None

            def json(self_inner):
                return {"message": {"content": content}}

        content = self.content
        return Resp()

    def close(self):
        self.closed = True


def test_extract_qwen_sends_transcript_without_coordinates():
    slots = {
        "major_incident": {
            "value": True,
            "declared_at": "2026-08-15T12:00:00Z",
            "provenance": "estimated",
        },
        "exact_location": {
            "value": "junction of Park Road and Harrington Way",
            "provenance": "estimated",
        },
        "type_of_incident": {"value": None, "provenance": "unknown"},
        "hazards": {"value": None, "provenance": "unknown"},
        "access": {"value": None, "provenance": "unknown"},
        "number_of_casualties": {"value": None, "provenance": "unknown"},
        "emergency_services": {"value": None, "provenance": "unknown"},
    }
    client = FakeOllama(json.dumps({"slots": slots}))
    handle = {"model": "qwen3:1.7b", "client": client}

    result = extract_qwen(
        handle,
        "I am declaring this a major incident. Junction of Park Road and Harrington Way.",
    )

    assert result["slots"]["exact_location"]["value"] == (
        "junction of Park Road and Harrington Way"
    )
    assert len(client.posts) == 1
    path, payload = client.posts[0]
    assert path == "/api/chat"
    assert payload["model"] == "qwen3:1.7b"
    assert payload["think"] is False
    assert payload["messages"][-1]["content"] == (
        "I am declaring this a major incident. Junction of Park Road and Harrington Way."
    )
    assert "coordinates" not in payload
    assert "lat" not in json.dumps(payload["messages"])


def test_unload_qwen_stops_keeping_the_model_in_ram():
    client = FakeOllama("{}")
    handle = {"model": "qwen3:1.7b", "client": client}

    unload_qwen(handle)

    assert client.closed is True
    path, payload = client.posts[0]
    assert path == "/api/generate"
    assert payload["model"] == "qwen3:1.7b"
    assert payload["keep_alive"] == 0
