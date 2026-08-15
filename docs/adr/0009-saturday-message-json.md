# Saturday Message JSON is seven slots plus envelope

The model returns only `slots`. The app adds `incident_id`, `message_id`, `created_at`, `transcript`, and `coordinates`. Coordinates are browser-only or null — never from the model.

`major_incident.value` is true | false | null (shown as Yes / No / Unknown). `declared_at` is set only when value is true. Every other Slot value is a string or null. Provenance is unknown | estimated | inferred | confirmed. No Quote key, no triage arrays, no present-vs-required split.

QR and SMS plaintext are the seven JESIP lines, not this whole object. `incident_id` is minted on first PTT so a second Message can share it.
