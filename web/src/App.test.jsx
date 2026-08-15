/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";

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
    />,
  );
}

describe("App capture", () => {
  it("shows a local recording indicator while PTT is held", async () => {
    let started = false;
    renderApp({
      pressToTalk: {
        start: async () => {
          started = true;
        },
        stop: async () => silentWav,
      },
    });

    const ptt = screen.getByRole("button", { name: "PTT" });
    expect(ptt.disabled).toBe(false);
    fireEvent.mouseDown(ptt);

    await waitFor(() => {
      expect(screen.getByText(/recording/i)).toBeTruthy();
    });
    expect(started).toBe(true);
  });

  it("keeps a local wav after PTT release without filling the completion form", async () => {
    renderApp();

    const ptt = screen.getByRole("button", { name: "PTT" });
    fireEvent.mouseDown(ptt);
    fireEvent.mouseUp(ptt);

    await waitFor(() => {
      expect(screen.getByText(/local recording/i)).toBeTruthy();
    });
    expect(screen.getByText("Unknown").className).toContain("on");
    const location = screen.getByRole("textbox", { name: /exact location/i });
    expect(location.value).toBe("");
  });

  it("records from touchstart through touchend", async () => {
    renderApp();

    const ptt = screen.getByRole("button", { name: "PTT" });
    fireEvent.touchStart(ptt);
    await waitFor(() => {
      expect(screen.getByText(/^Recording$/)).toBeTruthy();
    });
    fireEvent.touchEnd(ptt);

    await waitFor(() => {
      expect(screen.getByText(/local recording/i)).toBeTruthy();
    });
  });

  it("stops recording when the press is released outside the button", async () => {
    renderApp();

    const ptt = screen.getByRole("button", { name: "PTT" });
    fireEvent.mouseDown(ptt);
    await waitFor(() => {
      expect(screen.getByText(/^Recording$/)).toBeTruthy();
    });
    fireEvent.mouseUp(document);

    await waitFor(() => {
      expect(screen.getByText(/local recording/i)).toBeTruthy();
    });
  });

  it("shows device coordinates when the browser returns a fix", async () => {
    renderApp({
      readCoordinates: async () => ({ lat: 51.5074, lon: -0.1278 }),
    });

    const ptt = screen.getByRole("button", { name: "PTT" });
    fireEvent.mouseDown(ptt);
    fireEvent.mouseUp(ptt);

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

    const ptt = screen.getByRole("button", { name: "PTT" });
    fireEvent.mouseDown(ptt);

    await waitFor(() => {
      expect(screen.queryByText(/^Recording$/)).toBeNull();
    });
    expect(ptt.getAttribute("aria-pressed")).toBe("false");
  });

  it("does not attach coordinates when capture produces no audio", async () => {
    renderApp({
      pressToTalk: {
        start: async () => {},
        stop: async () => null,
      },
      readCoordinates: async () => ({ lat: 51.5074, lon: -0.1278 }),
    });

    const ptt = screen.getByRole("button", { name: "PTT" });
    fireEvent.mouseDown(ptt);
    fireEvent.mouseUp(ptt);

    await waitFor(() => {
      expect(ptt.getAttribute("aria-pressed")).toBe("false");
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

    const ptt = screen.getByRole("button", { name: "PTT" });
    fireEvent.mouseDown(ptt);
    fireEvent.mouseUp(ptt);

    await waitFor(() => {
      expect(screen.getByText(/^Transcribing$/)).toBeTruthy();
    });
    finish("Park Road / Harrington Way");
    await waitFor(() => {
      expect(document.querySelector(".radio-log").textContent).toMatch(/Harrington Way/);
    });
  });
});
