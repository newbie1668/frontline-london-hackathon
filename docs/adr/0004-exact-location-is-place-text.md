# Exact location is place text; coordinates are an optional device fix

JESIP Exact location is a place other services can find, not a WGS84 point. Invented or geocoded coordinates would break the offline/trust story and the rule that the model never invents GPS.

The Exact location Slot holds spoken or typed place text. Coordinates exist only when the browser actually returned a fix, may be stripped before SEND, and are omitted — not zeroed — when missing.
