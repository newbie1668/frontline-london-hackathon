# M/ETHANE capture

Voice-first capture of JESIP M/ETHANE for a first officer on scene. The officer speaks freely; Slots are filled from the Transcript. The officer still declares Major incident, confirms Slots, and SENDs. This replaces typing and mnemonic-order recitation, not the officer, the JESIP app, or CAD.

## Language

**Message**:
One timestamped M/ETHANE or ETHANE: the seven slots plus provenance. This is the thing the officer confirms and SEND emits.
_Avoid_: form, report, sitrep, “the METHANE”, record

**Incident**:
The event in the world. In this product it is only a grouping identity so more than one Message can belong together. It is not a document we mutate.
_Avoid_: case, job, log, living METHANE

**M/ETHANE**:
The JESIP mnemonic and reporting framework (Major incident, Exact location, Type, Hazards, Access, Number of casualties, Emergency services). A pattern, not an instance.
_Avoid_: NATO 9-line, NEMSIS, US 911, TCCC

**ETHANE**:
A Message whose Major incident is not declared (No). The remaining slots are unchanged.
_Avoid_: treating ETHANE as a different product

**Major incident**:
A declaration by a responder organisation, not a scene observation. Yes is allowed only from explicit speech (until the officer confirms) or from the officer setting Yes. It is never inferred from casualties, vehicles, or scale.
_Avoid_: auto-declared, implied major, “looks like a major”

**Slot**:
One of the seven boxes on the JESIP completion form. Each Slot has a JESIP value and a Provenance chip. The box content is unchanged from JESIP.
_Avoid_: extra boxes, Quote as a form field, casualty physiology widgets, P1/P2/P3 buttons

**Completion form**:
The official JESIP M/ETHANE template: DATE/TIME plus seven boxes (Major incident, Exact location, Type of incident, Hazards, Access, Number of casualties, Emergency services). The right-hand pane is this form. Voice and the model only write into those boxes.
_Avoid_: a redesigned METHANE form, JESIP app casualty-sign screen as the form

**Transcript**:
The officer’s speech as text. Evidence for filling Slots, not a Slot itself.
_Avoid_: notes, dictation, clinical record

**Slot value**:
For Major incident: yes, no, or empty. For every other Slot: a short speech-faithful string, or empty. Not a parsed list, triage breakdown, or on-scene vs required split. Spoken labels such as “P2” or “RVP” stay in the string.
_Avoid_: auto-triage, P1/P2/P3 unless spoken, access/egress/RVP objects, present-vs-required arrays

**Exact location**:
The place-text Slot: a description other services can find. It is not a map pin.
_Avoid_: pin, geocode, “the GPS”

**Coordinates**:
An optional device fix attached to the Message, only if the browser returned one. Never produced from speech, place names, or the model. Absent when there is no fix.
_Avoid_: inferred pin, 0,0, geocoded point

## Provenance

**Provenance**:
The honesty of a Slot’s value: Unknown, Estimated, Inferred, or Confirmed. SEND emits tags as shown and does not change them. Only an explicit per-slot accept or edit may promote a value to Confirmed.
_Avoid_: confidence score, probability, “the AI is sure”

**Unknown**:
No value for this Slot.

**Estimated**:
The value was taken from speech, including approximations (“about 10”, “5 or 6”).

**Inferred**:
The value was not said; a rule or model filled it. It stays Inferred until the officer accepts or edits that Slot.

**Confirmed**:
The officer explicitly accepted or edited this Slot. Not implied by SEND.

**SEND**:
The officer’s explicit emit of the Message as shown: JESIP-ordered plaintext, JSON, and a QR of the plaintext. It does not change Provenance. Empty boxes may go out as Unknown.
_Avoid_: silent auto-send, live SMS/email on Saturday, bulk-promoting tags
