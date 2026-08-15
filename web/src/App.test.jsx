/** @vitest-environment jsdom */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";

beforeAll(() => {
  if (!URL.createObjectURL) {
    URL.createObjectURL = () => "blob:captured-recording";
    URL.revokeObjectURL = () => {};
  }
});

afterEach(() => cleanup());

const silentWav = new Blob([new Uint8Array([82, 73, 70, 70])], { type: "audio/wav" });

function renderApp(overrides = {}) {
  const pressToTalk = {
    start: async () => {},
    stop: async () => silentWav,
    ...overrides.pressToTalk,
  };
  return render(
    <App
      pressToTalk={pressToTalk}
      readCoordinates={overrides.readCoordinates ?? (async () => null)}
      loadFixture={overrides.loadFixture ?? (async () => silentWav)}
      transcribeAudio={overrides.transcribeAudio}
      extractSlots={overrides.extractSlots}
      renderQr={overrides.renderQr}
      formOrigin={overrides.formOrigin}
    />,
  );
}

async function clickRecordThenStop() {
  fireEvent.click(screen.getByRole("button", { name: "Record" }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Stop" })).toBeTruthy();
  });
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
}

describe("App capture", () => {
  it("starts recording on the first click and stops on the second", async () => {
    let started = false;
    renderApp({
      pressToTalk: {
        start: async () => {
          started = true;
        },
        stop: async () => silentWav,
      },
    });

    const record = screen.getByRole("button", { name: "Record" });
    fireEvent.click(record);

    await waitFor(() => {
      expect(screen.getByText(/^Recording$/)).toBeTruthy();
      expect(screen.getByRole("button", { name: "Stop" })).toBeTruthy();
    });
    expect(started).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));

    await waitFor(() => {
      expect(screen.getByText(/local recording/i)).toBeTruthy();
    });
  });

  it("keeps a local wav after recording without filling the completion form", async () => {
    renderApp();

    await clickRecordThenStop();

    await waitFor(() => {
      expect(screen.getByText(/local recording/i)).toBeTruthy();
    });
    expect(screen.getByText("Unknown").className).toContain("on");
    const location = screen.getByRole("textbox", { name: /exact location/i });
    expect(location.value).toBe("");
  });

  it("does not stop recording when the pointer is released outside the button", async () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    await waitFor(() => {
      expect(screen.getByText(/^Recording$/)).toBeTruthy();
    });
    fireEvent.mouseUp(document);
    fireEvent.touchEnd(document);

    expect(screen.getByText(/^Recording$/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stop" })).toBeTruthy();
  });

  it("shows device coordinates when the browser returns a fix", async () => {
    renderApp({
      readCoordinates: async () => ({ lat: 51.5074, lon: -0.1278 }),
    });

    await clickRecordThenStop();

    await waitFor(() => {
      expect(screen.getByText(/51\.50740, -0\.12780/)).toBeTruthy();
    });
    expect(screen.getByRole("textbox", { name: /exact location/i }).value).toBe("");
  });

  it("clears the recording indicator if the microphone is denied", async () => {
    renderApp({
      pressToTalk: {
        start: async () => {
          throw new Error("NotAllowedError");
        },
        stop: async () => null,
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Record" }));

    await waitFor(() => {
      expect(screen.queryByText(/^Recording$/)).toBeNull();
    });
    expect(screen.getByRole("button", { name: "Record" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("does not attach coordinates when capture produces no audio", async () => {
    renderApp({
      pressToTalk: {
        start: async () => {},
        stop: async () => null,
      },
      readCoordinates: async () => ({ lat: 51.5074, lon: -0.1278 }),
    });

    await clickRecordThenStop();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Record" }).getAttribute("aria-pressed")).toBe(
        "false",
      );
    });
    expect(screen.queryByText(/51\.50740/)).toBeNull();
    expect(screen.getByText(/Coordinates/).textContent).toMatch(/—/);
  });

  it("accepts the Park Road fixture wav as capture input without filling the completion form", async () => {
    const fixtureWav = new Blob([new Uint8Array([82, 73, 70, 70])], { type: "audio/wav" });
    renderApp({
      loadFixture: async () => fixtureWav,
    });

    fireEvent.click(screen.getByRole("button", { name: /park road fixture/i }));

    await waitFor(() => {
      expect(screen.getByText(/local recording/i)).toBeTruthy();
    });
    expect(screen.getByRole("textbox", { name: /exact location/i }).value).toBe("");
  });

  it("shows the Transcript in the left pane without filling a Slot", async () => {
    renderApp({
      loadFixture: async () => silentWav,
      transcribeAudio: async () =>
        "Park Road / Harrington Way, Nelson Way, two casualties, request fire and ambulance.",
    });

    fireEvent.click(screen.getByRole("button", { name: /park road fixture/i }));

    await waitFor(() => {
      const log = document.querySelector(".radio-log");
      expect(log.textContent).toMatch(/Park Road/);
      expect(log.textContent).toMatch(/Nelson Way/);
    });
    expect(screen.getByRole("textbox", { name: /exact location/i }).value).toBe("");
    expect(screen.getByText("Unknown").className).toContain("on");
  });

  it("shows Transcribing in the left pane while ASR is running", async () => {
    let finish;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    renderApp({
      transcribeAudio: () => pending,
    });

    await clickRecordThenStop();

    await waitFor(() => {
      expect(screen.getByText(/^Transcribing$/)).toBeTruthy();
    });
    finish("Park Road / Harrington Way");
    await waitFor(() => {
      expect(document.querySelector(".radio-log").textContent).toMatch(/Harrington Way/);
    });
  });

  it("fills the seven official boxes from extract after the Transcript", async () => {
    let seen;
    renderApp({
      loadFixture: async () => silentWav,
      readCoordinates: async () => ({ lat: 51.5074, lon: -0.1278 }),
      transcribeAudio: async () =>
        "I am declaring this a major incident. Junction of Park Road and Harrington Way.",
      extractSlots: async (transcript, coordinates) => {
        seen = { transcript, coordinates };
        return {
          slots: {
            major_incident: {
              value: true,
              declared_at: "2026-08-15T12:00:00Z",
              provenance: "estimated",
            },
            exact_location: {
              value: "junction of Park Road and Harrington Way",
              provenance: "estimated",
            },
            type_of_incident: {
              value: "road traffic collision involving a bus, a van and two vehicles",
              provenance: "estimated",
            },
            hazards: {
              value: "smoke coming from the vehicles, fluid in the road",
              provenance: "estimated",
            },
            access: { value: "via Nelson Way", provenance: "estimated" },
            number_of_casualties: {
              value: "approximately five or six walking wounded",
              provenance: "estimated",
            },
            emergency_services: {
              value: "fire, ambulance, and further police patrols",
              provenance: "estimated",
            },
          },
        };
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /park road fixture/i }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /exact location/i }).value).toBe(
        "junction of Park Road and Harrington Way",
      );
    });
    expect(seen).toEqual({
      transcript:
        "I am declaring this a major incident. Junction of Park Road and Harrington Way.",
      coordinates: { lat: 51.5074, lon: -0.1278 },
    });
    expect(screen.getByRole("button", { name: /^Yes$/ }).className).toContain("on");
    expect(screen.getByRole("textbox", { name: /type of incident/i }).value).toMatch(
      /road traffic collision/,
    );
    expect(screen.getByRole("textbox", { name: /hazards/i }).value).toMatch(/smoke/);
    expect(screen.getByRole("textbox", { name: /access/i }).value).toBe("via Nelson Way");
    expect(screen.getByRole("textbox", { name: /number of casualties/i }).value).toMatch(
      /five or six/,
    );
    expect(screen.getByRole("textbox", { name: /emergency services/i }).value).toMatch(
      /fire/,
    );
    expect(
      screen.getByRole("textbox", { name: /exact location/i }).closest(".slot").querySelector(".chip")
        .textContent,
    ).toMatch(/estimated/i);
    expect(document.querySelector(".radio-log").textContent).toMatch(/Park Road/);
  });

  it("shows Filling the completion form while extract is running", async () => {
    let finish;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    renderApp({
      transcribeAudio: async () => "Park Road / Harrington Way",
      extractSlots: () => pending,
    });

    fireEvent.click(screen.getByRole("button", { name: /park road fixture/i }));

    await waitFor(() => {
      expect(screen.getByText(/Filling the completion form/i)).toBeTruthy();
    });
    expect(document.querySelector(".radio-log").textContent).toMatch(/Park Road/);
    finish({
      slots: {
        major_incident: { value: null, declared_at: null, provenance: "unknown" },
        exact_location: { value: "junction of Park Road and Harrington Way", provenance: "estimated" },
        type_of_incident: { value: null, provenance: "unknown" },
        hazards: { value: null, provenance: "unknown" },
        access: { value: null, provenance: "unknown" },
        number_of_casualties: { value: null, provenance: "unknown" },
        emergency_services: { value: null, provenance: "unknown" },
      },
    });
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /exact location/i }).value).toBe(
        "junction of Park Road and Harrington Way",
      );
    });
  });

  it("keeps the Transcript if extract fails and shows the error", async () => {
    renderApp({
      transcribeAudio: async () => "Park Road / Harrington Way",
      extractSlots: async () => {
        throw new Error("extract_failed");
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /park road fixture/i }));

    await waitFor(() => {
      expect(document.querySelector(".radio-log").textContent).toMatch(/Park Road/);
      expect(screen.getByText(/extract_failed/)).toBeTruthy();
    });
    expect(screen.getByRole("textbox", { name: /exact location/i }).value).toBe("");
  });

  it("plays the captured recording and surfaces a transcription failure", async () => {
    renderApp({
      transcribeAudio: async () => {
        throw new Error("Failed to load audio");
      },
    });

    await clickRecordThenStop();

    await waitFor(() => {
      expect(screen.getByLabelText(/captured recording/i)).toBeTruthy();
      expect(document.querySelector(".radio-log").textContent).toMatch(/Failed to load audio/);
    });
    expect(screen.getByRole("textbox", { name: /exact location/i }).value).toBe("");
  });

  it("says when the recording contained no recognisable speech", async () => {
    renderApp({
      transcribeAudio: async () => "",
    });

    fireEvent.click(screen.getByRole("button", { name: /park road fixture/i }));

    await waitFor(() => {
      expect(document.querySelector(".radio-log").textContent).toMatch(/No speech/i);
    });
    expect(screen.getByLabelText(/captured recording/i)).toBeTruthy();
  });
});

describe("App provenance and SEND", () => {
  it("sets a Slot to Confirmed when the officer edits the box", () => {
    renderApp();

    const location = screen.getByRole("textbox", { name: /exact location/i });
    fireEvent.change(location, { target: { value: "Park Road / Harrington Way" } });

    expect(location.value).toBe("Park Road / Harrington Way");
    expect(location.closest(".slot").querySelector(".chip").textContent).toMatch(
      /confirmed/i,
    );
  });

  it("treats tapping Major incident Yes as the declaration", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: /^Yes$/ }));

    const slot = screen.getByRole("button", { name: /^Yes$/ }).closest(".slot");
    expect(screen.getByRole("button", { name: /^Yes$/ }).className).toContain("on");
    expect(slot.querySelector(".chip").textContent).toMatch(/confirmed/i);
  });

  it("emits plaintext, Message JSON, and a QR of the completion form on Confirm and SEND", async () => {
    renderApp({
      formOrigin: async () => "http://192.168.1.12:5173",
      renderQr: async (text) => {
        expect(text).toMatch(/^http:\/\/192\.168\.1\.12:5173\/form#/);
        return `data:image/png;base64,qr:${text.slice(0, 24)}`;
      },
    });

    fireEvent.change(screen.getByRole("textbox", { name: /exact location/i }), {
      target: { value: "Park Road / Harrington Way" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm and send/i }));

    const plaintext = await screen.findByLabelText("plaintext");
    expect(plaintext.textContent).toMatch(/DATE\/TIME:/);
    expect(plaintext.textContent).toMatch(/Exact location: Park Road \/ Harrington Way/);
    expect(plaintext.textContent).toMatch(/Access: Not stated — add or send anyway/);

    const json = JSON.parse((await screen.findByLabelText("Message JSON")).textContent);
    expect(json.slots.exact_location).toEqual({
      value: "Park Road / Harrington Way",
      provenance: "confirmed",
    });
    expect(json.slots.access.provenance).toBe("unknown");
    expect(json.incident_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const qr = await screen.findByRole("img", { name: /qr of the completion form/i });
    expect(qr.getAttribute("src")).toMatch(/^data:image\/png;base64,qr:http/);
    expect(screen.getByRole("textbox", { name: /access/i }).closest(".slot").querySelector(".chip").textContent).toMatch(
      /unknown/i,
    );
  });
});
