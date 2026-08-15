import { useRef, useState } from "react";
import { encodeQr } from "./encodeQr.js";
import { emitSend } from "./formatMessage.js";
import { editSlot, setMajorIncident } from "./updateSlot.js";

const EMPTY_TEXT = { value: null, provenance: "unknown" };

export const emptySlots = {
  major_incident: { value: null, declared_at: null, provenance: "unknown" },
  exact_location: { ...EMPTY_TEXT },
  type_of_incident: { ...EMPTY_TEXT },
  hazards: { ...EMPTY_TEXT },
  access: { ...EMPTY_TEXT },
  number_of_casualties: { ...EMPTY_TEXT },
  emergency_services: { ...EMPTY_TEXT },
};

const FORM_ROWS = [
  {
    key: "major_incident",
    letter: "M",
    heading: "Major incident",
    prompt: "Has a major incident been declared? Yes / No. If No, this is an ETHANE message.",
  },
  {
    key: "exact_location",
    letter: "E",
    heading: "Exact location",
    prompt: "Street, landmark, building number, postcode. GPS only if the device returned a fix.",
  },
  {
    key: "type_of_incident",
    letter: "T",
    heading: "Type of incident",
    prompt: "What kind of incident is it?",
  },
  {
    key: "hazards",
    letter: "H",
    heading: "Hazards",
    prompt: "Known, suspected, and potential hazards.",
  },
  {
    key: "access",
    letter: "A",
    heading: "Access",
    prompt: "Best routes for access and egress, including RVP.",
  },
  {
    key: "number_of_casualties",
    letter: "N",
    heading: "Number of casualties",
    prompt: "How many casualties, and what condition are they in?",
  },
  {
    key: "emergency_services",
    letter: "E",
    heading: "Emergency services",
    prompt: "Which, and how many, are required or already on scene?",
  },
];

function formatNow() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

function displayValue(key, slot) {
  if (key === "major_incident") {
    if (slot.value === true) return "Yes";
    if (slot.value === false) return "No";
    return "";
  }
  return slot.value ?? "";
}

function ProvenanceChip({ value }) {
  return <span className={`chip chip-${value}`}>{value}</span>;
}

export default function App({
  pressToTalk,
  readCoordinates,
  loadFixture,
  transcribeAudio,
  extractSlots,
  renderQr = encodeQr,
  formOrigin,
} = {}) {
  const [slots, setSlots] = useState(() => structuredClone(emptySlots));
  const [sent, setSent] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [incidentId, setIncidentId] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [capturedAudio, setCapturedAudio] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [captureError, setCaptureError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [coords, setCoords] = useState(null);
  const recordingRef = useRef(false);
  const startingRef = useRef(false);

  async function applyCapture(blob) {
    if (!blob) return;
    setCapturedAudio(blob);
    setTranscript("");
    setCaptureError("");
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    setIncidentId((id) => id ?? crypto.randomUUID());
    const nextCoords = await readCoordinates();
    setCoords(nextCoords);
    if (!transcribeAudio) return;
    setTranscribing(true);
    try {
      const text = await transcribeAudio(blob);
      if (!text) {
        setCaptureError(
          "No speech recognised. Play the clip louder into the mic, or use Park Road fixture.",
        );
        return;
      }
      setTranscript(text);
      if (extractSlots) {
        setExtracting(true);
        try {
          const message = await extractSlots(text, nextCoords);
          if (message?.slots) setSlots(message.slots);
        } catch (err) {
          setCaptureError(err instanceof Error ? err.message : "Extract failed");
        } finally {
          setExtracting(false);
        }
      }
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  }

  async function onRecordToggle(event) {
    event.preventDefault();
    if (recordingRef.current) {
      try {
        const blob = await pressToTalk.stop();
        recordingRef.current = false;
        setRecording(false);
        await applyCapture(blob);
      } catch (err) {
        recordingRef.current = false;
        setRecording(false);
        setCaptureError(err instanceof Error ? err.message : "Recording failed");
      }
      return;
    }
    if (startingRef.current) return;
    startingRef.current = true;
    recordingRef.current = true;
    setRecording(true);
    try {
      await pressToTalk.start();
    } catch {
      recordingRef.current = false;
      setRecording(false);
    } finally {
      startingRef.current = false;
    }
  }

  async function onFixture() {
    await applyCapture(await loadFixture());
  }

  async function onSend() {
    const id = incidentId ?? crypto.randomUUID();
    if (!incidentId) setIncidentId(id);
    const origin = formOrigin
      ? await formOrigin()
      : globalThis.location?.origin ?? "http://127.0.0.1:5173";
    const artifacts = emitSend(
      {
        incident_id: id,
        message_id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        transcript,
        coordinates: coords,
        slots,
      },
      origin,
    );
    setSent(artifacts);
    setQrUrl(await renderQr(artifacts.qrPayload));
  }

  function logText() {
    if (transcript) return transcript;
    if (captureError) return captureError;
    if (recording) return "Recording";
    if (transcribing) return "Transcribing";
    if (extracting) return "Filling the completion form…";
    if (capturedAudio) return "Local recording captured.";
    return "Click Record, play the sitrep into the mic, then click Stop.";
  }

  return (
    <div className="app">
      <header className="mast">
        <div className="mast-mark">
          <span className="mast-title">M/ETHANE</span>
          <span className="mast-sub">First officer on scene</span>
        </div>
        <div className="mast-meta">
          <span className="pill pill-offline">Local only — no cloud audio</span>
          <span className="pill">
            Coordinates {coords ? `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}` : "—"}
          </span>
        </div>
      </header>

      <div className="workspace">
        <section className="pane transcript-pane" aria-labelledby="transcript-heading">
          <h1 id="transcript-heading">Transcript</h1>
          <pre className="radio-log">{logText()}</pre>
          {extracting ? <p className="status-line">Filling the completion form…</p> : null}
          {captureError && transcript ? (
            <p className="status-line status-error">{captureError}</p>
          ) : null}
          {audioUrl ? (
            <audio className="capture-audio" controls src={audioUrl} aria-label="Captured recording" />
          ) : null}
          <div className="ptt-row">
            <button
              type="button"
              className={recording ? "ptt is-recording" : "ptt"}
              aria-pressed={recording}
              onClick={onRecordToggle}
              onContextMenu={(event) => event.preventDefault()}
            >
              {recording ? "Stop" : "Record"}
            </button>
            <div className="ptt-actions">
              <p className="ptt-hint">
                {recording
                  ? "Click Stop when the sitrep is finished"
                  : "Click Record, play the sitrep into the mic, then click Stop"}
              </p>
              <button type="button" className="fixture" onClick={onFixture}>
                Park Road fixture
              </button>
            </div>
          </div>
        </section>

        <section className="pane form-pane" aria-labelledby="form-heading">
          <div className="form-head">
            <h1 id="form-heading">Completion form</h1>
            <dl className="dt-row">
              <div>
                <dt>Date / time</dt>
                <dd>{formatNow()}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{displayValue("exact_location", slots.exact_location) || "—"}</dd>
              </div>
            </dl>
          </div>

          <ol className="methane">
            {FORM_ROWS.map((row) => {
              const slot = slots[row.key];
              return (
                <li key={row.key} className="slot">
                  <div className="slot-letter" aria-hidden="true">
                    {row.letter}
                  </div>
                  <div className="slot-body">
                    <div className="slot-top">
                      <h2>{row.heading}</h2>
                      <ProvenanceChip value={slot.provenance} />
                    </div>
                    <p className="prompt">{row.prompt}</p>
                    {row.key === "major_incident" ? (
                      <div className="maj">
                        <button
                          type="button"
                          className={slot.value === true ? "on" : ""}
                          onClick={() => setSlots((current) => setMajorIncident(current, true))}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className={slot.value === false ? "on" : ""}
                          onClick={() => setSlots((current) => setMajorIncident(current, false))}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          className={slot.value === null ? "on" : ""}
                          onClick={() => setSlots((current) => setMajorIncident(current, null))}
                        >
                          Unknown
                        </button>
                      </div>
                    ) : (
                      <textarea
                        rows={2}
                        aria-label={row.heading}
                        value={displayValue(row.key, slot)}
                        placeholder="Not stated — add or send anyway"
                        onChange={(event) =>
                          setSlots((current) => editSlot(current, row.key, event.target.value))
                        }
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <button type="button" className="send" onClick={onSend}>
            Confirm and SEND
          </button>
          {sent ? (
            <div className="send-artifacts">
              <pre aria-label="plaintext">{sent.plaintext}</pre>
              <pre aria-label="Message JSON">{JSON.stringify(sent.json, null, 2)}</pre>
              {qrUrl ? <img alt="QR of the completion form" src={qrUrl} /> : null}
              <a className="send-form-link" href={sent.qrPayload} target="_blank" rel="noreferrer">
                Open M/ETHANE completion form
              </a>
            </div>
          ) : (
            <p className="send-hint">Issue 5 — plaintext, JSON, and QR of the plaintext.</p>
          )}
        </section>
      </div>

      <footer className="credit">
        M/ETHANE doctrine and training audio ©{" "}
        <a href="https://www.jesip.org.uk/">JESIP</a>. Demo clip source:{" "}
        <a href="https://www.youtube.com/watch?v=RaGcC4qZfZ0">JESIP METHANE animation</a>
        — radio sitrep only.
      </footer>
    </div>
  );
}
