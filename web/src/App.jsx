import { useEffect, useRef, useState } from "react";

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

export const FORM_ROWS = [
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

export default function App({ pressToTalk, readCoordinates, loadFixture } = {}) {
  const slots = emptySlots;
  const transcript = "";
  const sent = false;
  const [recording, setRecording] = useState(false);
  const [capturedAudio, setCapturedAudio] = useState(null);
  const [coords, setCoords] = useState(null);
  const recordingRef = useRef(false);
  const stopPtt = useRef(async () => {});
  recordingRef.current = recording;

  async function applyCapture(blob) {
    if (!blob) return;
    setCapturedAudio(blob);
    setCoords(await readCoordinates());
  }

  async function onPttDown(event) {
    event.preventDefault();
    setRecording(true);
    try {
      await pressToTalk.start();
    } catch {
      setRecording(false);
    }
  }

  async function onPttUp(event) {
    event.preventDefault();
    const blob = await pressToTalk.stop();
    setRecording(false);
    await applyCapture(blob);
  }

  stopPtt.current = onPttUp;

  useEffect(() => {
    function onRelease(event) {
      if (!recordingRef.current) return;
      void stopPtt.current(event);
    }
    document.addEventListener("mouseup", onRelease);
    document.addEventListener("touchend", onRelease);
    return () => {
      document.removeEventListener("mouseup", onRelease);
      document.removeEventListener("touchend", onRelease);
    };
  }, []);

  async function onFixture() {
    await applyCapture(await loadFixture());
  }

  function logText() {
    if (transcript) return transcript;
    if (recording) return "Recording";
    if (capturedAudio) return "Local recording captured. Transcript is issue 2.";
    return "Hold PTT to record, or use the Park Road fixture.";
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
          <div className="ptt-row">
            <button
              type="button"
              className={recording ? "ptt is-recording" : "ptt"}
              aria-pressed={recording}
              onMouseDown={onPttDown}
              onMouseUp={onPttUp}
              onTouchStart={onPttDown}
              onTouchEnd={onPttUp}
              onContextMenu={(event) => event.preventDefault()}
            >
              PTT
            </button>
            <div className="ptt-actions">
              <p className="ptt-hint">{recording ? "Release to stop" : "Hold to talk"}</p>
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
                        <span className={slot.value === true ? "on" : ""}>Yes</span>
                        <span className={slot.value === false ? "on" : ""}>No</span>
                        <span className={slot.value === null ? "on" : ""}>Unknown</span>
                      </div>
                    ) : (
                      <textarea
                        readOnly
                        rows={2}
                        aria-label={row.heading}
                        value={displayValue(row.key, slot)}
                        placeholder="Not stated — add or send anyway"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <button type="button" className="send" disabled>
            Confirm and SEND
          </button>
          {sent ? null : (
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
