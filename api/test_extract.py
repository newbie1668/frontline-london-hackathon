from extract import ExtractEngine


def test_extract_slots_loads_then_unloads():
    events = []
    model = object()
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

    def load():
        events.append("load")
        return model

    def extract(loaded, transcript):
        events.append("extract")
        assert loaded is model
        assert "Park Road" in transcript
        return {"slots": slots}

    def unload(loaded):
        events.append("unload")
        assert loaded is model

    engine = ExtractEngine(load=load, extract=extract, unload=unload)
    transcript = (
        "I am declaring this a major incident. "
        "The exact location is the junction of Park Road and Harrington Way."
    )

    result = engine.extract_slots(transcript)

    assert result["slots"]["exact_location"]["value"] == (
        "junction of Park Road and Harrington Way"
    )
    assert events == ["load", "extract", "unload"]
    assert engine.loaded is False


def test_extract_slots_unloads_when_inference_fails():
    events = []

    def load():
        events.append("load")
        return object()

    def extract(_loaded, _transcript):
        events.append("extract")
        raise RuntimeError("OOM")

    def unload(_loaded):
        events.append("unload")

    engine = ExtractEngine(load=load, extract=extract, unload=unload)

    try:
        engine.extract_slots("Park Road")
    except RuntimeError:
        pass

    assert events == ["load", "extract", "unload"]
    assert engine.loaded is False


def test_major_incident_is_not_true_from_casualty_counts_or_scale():
    model_slots = {
        "major_incident": {
            "value": True,
            "declared_at": "2026-08-15T12:00:00Z",
            "provenance": "estimated",
        },
        "exact_location": {"value": "Park Road", "provenance": "estimated"},
        "type_of_incident": {"value": "collision", "provenance": "estimated"},
        "hazards": {"value": None, "provenance": "unknown"},
        "access": {"value": None, "provenance": "unknown"},
        "number_of_casualties": {
            "value": "approximately ten trapped",
            "provenance": "estimated",
        },
        "emergency_services": {"value": "fire and ambulance", "provenance": "estimated"},
    }
    engine = ExtractEngine(
        load=lambda: object(),
        extract=lambda _model, _transcript: {"slots": model_slots},
        unload=lambda _model: None,
    )
    transcript = (
        "Exact location Park Road. Type is a collision. "
        "Approximately ten casualties trapped. Request fire and ambulance."
    )

    result = engine.extract_slots(transcript)

    assert result["slots"]["major_incident"]["value"] is not True
    assert result["slots"]["major_incident"]["declared_at"] is None
    assert result["slots"]["number_of_casualties"]["value"] == (
        "approximately ten trapped"
    )


def test_speech_is_estimated_and_missing_is_unknown():
    model_slots = {
        "major_incident": {
            "value": None,
            "declared_at": None,
            "provenance": "confirmed",
        },
        "exact_location": {"value": "Park Road", "provenance": "confirmed"},
        "type_of_incident": {"value": "", "provenance": "estimated"},
        "hazards": {"value": None, "provenance": "inferred"},
        "access": {"value": None, "provenance": "unknown"},
        "number_of_casualties": {"value": "two casualties", "provenance": "inferred"},
        "emergency_services": {"value": None, "provenance": "confirmed"},
    }
    engine = ExtractEngine(
        load=lambda: object(),
        extract=lambda _model, _transcript: {"slots": model_slots},
        unload=lambda _model: None,
    )

    result = engine.extract_slots("Park Road, two casualties.")

    slots = result["slots"]
    assert slots["exact_location"] == {
        "value": "Park Road",
        "provenance": "estimated",
    }
    assert slots["number_of_casualties"] == {
        "value": "two casualties",
        "provenance": "estimated",
    }
    assert slots["type_of_incident"] == {"value": None, "provenance": "unknown"}
    assert slots["hazards"] == {"value": None, "provenance": "unknown"}
    assert slots["major_incident"]["value"] is None
    assert slots["major_incident"]["provenance"] == "unknown"


def test_major_incident_no_from_explicit_speech():
    model_slots = {
        "major_incident": {
            "value": False,
            "declared_at": None,
            "provenance": "estimated",
        },
        "exact_location": {"value": "Park Road", "provenance": "estimated"},
        "type_of_incident": {"value": None, "provenance": "unknown"},
        "hazards": {"value": None, "provenance": "unknown"},
        "access": {"value": None, "provenance": "unknown"},
        "number_of_casualties": {"value": None, "provenance": "unknown"},
        "emergency_services": {"value": None, "provenance": "unknown"},
    }
    engine = ExtractEngine(
        load=lambda: object(),
        extract=lambda _model, _transcript: {"slots": model_slots},
        unload=lambda _model: None,
    )

    result = engine.extract_slots(
        "This is not a major incident. Exact location is Park Road."
    )

    assert result["slots"]["major_incident"]["value"] is False
    assert result["slots"]["major_incident"]["declared_at"] is None
    assert result["slots"]["major_incident"]["provenance"] == "estimated"


def test_declared_at_is_a_datetime_when_major_incident_is_true():
    model_slots = {
        "major_incident": {
            "value": True,
            "declared_at": "not a date",
            "provenance": "estimated",
        },
        "exact_location": {"value": "Park Road", "provenance": "estimated"},
        "type_of_incident": {"value": None, "provenance": "unknown"},
        "hazards": {"value": None, "provenance": "unknown"},
        "access": {"value": None, "provenance": "unknown"},
        "number_of_casualties": {"value": None, "provenance": "unknown"},
        "emergency_services": {"value": None, "provenance": "unknown"},
    }
    engine = ExtractEngine(
        load=lambda: object(),
        extract=lambda _model, _transcript: {"slots": model_slots},
        unload=lambda _model: None,
    )

    result = engine.extract_slots("I am declaring this a major incident. Park Road.")
    declared_at = result["slots"]["major_incident"]["declared_at"]

    assert result["slots"]["major_incident"]["value"] is True
    assert isinstance(declared_at, str)
    assert "T" in declared_at
    assert declared_at.endswith("Z")
    assert declared_at != "not a date"


def test_extract_slots_strips_model_supplied_coordinates():
    engine = ExtractEngine(
        load=lambda: object(),
        extract=lambda _model, _transcript: {
            "slots": {
                "major_incident": {
                    "value": None,
                    "declared_at": None,
                    "provenance": "unknown",
                },
                "exact_location": {"value": "Park Road", "provenance": "estimated"},
                "type_of_incident": {"value": None, "provenance": "unknown"},
                "hazards": {"value": None, "provenance": "unknown"},
                "access": {"value": None, "provenance": "unknown"},
                "number_of_casualties": {"value": None, "provenance": "unknown"},
                "emergency_services": {"value": None, "provenance": "unknown"},
            },
            "coordinates": {"lat": 0.0, "lon": 0.0},
        },
        unload=lambda _model: None,
    )

    result = engine.extract_slots("Park Road")

    assert "coordinates" not in result
    assert result["slots"]["exact_location"]["value"] == "Park Road"


PARK_ROAD_TRANSCRIPT = (
    "I am declaring this a major incident. "
    "The exact location is the junction of Park Road and Harrington Way. "
    "The type of incident is a road traffic collision involving a bus, a van and two vehicles. "
    "The hazards are the smoke coming from the vehicles, there is fluid in the road, "
    "the road is congested and blocked. "
    "Access is going to be via Nelson Way. "
    "The number of casualties approximately five or six walking wounded, "
    "numerous trapped in vehicles, and approximately ten trapped on the overturned bus. "
    "Could I request the fire service, the ambulance service and further police patrols "
    "to assist with the scene."
)


def test_park_road_keyword_fallback_when_qwen_fails():
    events = []
    engine = ExtractEngine(
        load=lambda: events.append("load") or object(),
        extract=lambda _model, _transcript: (_ for _ in ()).throw(RuntimeError("OOM")),
        unload=lambda _model: events.append("unload"),
    )

    result = engine.extract_slots(PARK_ROAD_TRANSCRIPT)

    slots = result["slots"]
    assert slots["major_incident"]["value"] is True
    assert slots["major_incident"]["provenance"] == "estimated"
    assert slots["exact_location"]["value"] == (
        "junction of Park Road and Harrington Way"
    )
    assert slots["type_of_incident"]["value"] == (
        "road traffic collision involving a bus, a van and two vehicles"
    )
    assert "Nelson Way" in slots["access"]["value"]
    assert "five or six walking wounded" in slots["number_of_casualties"]["value"]
    assert "fire" in slots["emergency_services"]["value"]
    assert "ambulance" in slots["emergency_services"]["value"]
    assert events == ["load", "unload"]
    assert engine.loaded is False


def test_keyword_fallback_is_only_for_the_park_road_clip():
    engine = ExtractEngine(
        load=lambda: object(),
        extract=lambda _model, _transcript: (_ for _ in ()).throw(RuntimeError("OOM")),
        unload=lambda _model: None,
    )

    try:
        engine.extract_slots(
            "A fire at the station. Two casualties. Request ambulance."
        )
        raise AssertionError("expected OOM to propagate")
    except RuntimeError as exc:
        assert str(exc) == "OOM"


GARBLED_PARK_ROAD = (
    "Yeah, if you just keep the channel clear, I underclass a major incident. "
    "The exact location is the junction of Ark Road and Harrington Way. "
    "The type of incident. There's a road traffic collision involving a bus, a van and two vehicles. "
    "The hazards are there is smoke coming from the vehicles. There is fluid in the road. "
    "The road is congested. It's a C N V fire melting away. "
    "The number of casualties. Approximately five or six walking wounded. "
    "Heroes trapped in vehicles. And approximately ten trapped on the overturned bus. "
    "Could I request the fire service, the ambulance service and further police patrols "
    "to assist with the scene?"
)


def test_park_road_fallback_still_fills_when_asr_mishears_park_and_nelson():
    engine = ExtractEngine(
        load=lambda: object(),
        extract=lambda _model, _transcript: (_ for _ in ()).throw(RuntimeError("OOM")),
        unload=lambda _model: None,
    )

    result = engine.extract_slots(GARBLED_PARK_ROAD)

    assert result["slots"]["exact_location"]["value"] == (
        "junction of Park Road and Harrington Way"
    )
    assert result["slots"]["major_incident"]["value"] is True
    assert "Nelson Way" in result["slots"]["access"]["value"]
