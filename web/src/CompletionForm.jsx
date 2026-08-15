import { decodeFormPayload } from "./formShare.js";

const ROWS = [
  {
    letter: "M",
    heading: "Major incident",
    prompt: "Has a major incident been declared? (Yes/No – If ‘No’, then complete ETHANE message)",
    field: "majorIncident",
  },
  {
    letter: "E",
    heading: "Exact location",
    prompt: "What is the exact location or geographical area of the incident?",
    field: "exactLocation",
  },
  {
    letter: "T",
    heading: "Type of incident",
    prompt: "What kind of incident is it?",
    field: "typeOfIncident",
  },
  {
    letter: "H",
    heading: "Hazards",
    prompt: "What hazards or potential hazards can be identified?",
    field: "hazards",
  },
  {
    letter: "A",
    heading: "Access",
    prompt: "What are the best routes for access and egress?",
    field: "access",
  },
  {
    letter: "N",
    heading: "Number of casualties",
    prompt: "How many casualties are there, and what condition are they in?",
    field: "numberOfCasualties",
  },
  {
    letter: "E",
    heading: "Emergency services",
    prompt: "Which, and how many, emergency responder assets and personnel are required or are already on-scene?",
    field: "emergencyServices",
  },
];

function fieldsFromHash() {
  const payload = globalThis.location?.hash?.replace(/^#/, "") ?? "";
  if (!payload) return null;
  try {
    return decodeFormPayload(payload);
  } catch {
    return null;
  }
}

export default function CompletionForm({ fields } = {}) {
  const data = fields ?? fieldsFromHash();
  if (!data) {
    return (
      <main className="jesip-sheet">
        <h1>M/ETHANE completion form</h1>
        <p>This QR has no Message on it.</p>
      </main>
    );
  }

  return (
    <main className="jesip-sheet">
      <p className="jesip-kicker">JESIP</p>
      <h1>M/ETHANE completion form</h1>
      <dl className="jesip-meta">
        <div>
          <dt>Date / time</dt>
          <dd>{data.dateTime}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{data.exactLocation}</dd>
        </div>
      </dl>
      <ol className="jesip-rows">
        {ROWS.map((row) => (
          <li key={row.field}>
            <span className="jesip-letter" aria-hidden="true">
              {row.letter}
            </span>
            <div>
              <h2>{row.heading}</h2>
              <p className="jesip-prompt">{row.prompt}</p>
              <p className="jesip-value">{data[row.field]}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="jesip-restrict">Restricted when complete</p>
      <p className="jesip-foot">
        M/ETHANE doctrine © <a href="https://www.jesip.org.uk/">JESIP</a>. Unofficial
        capture — not the JESIP app.
      </p>
    </main>
  );
}
