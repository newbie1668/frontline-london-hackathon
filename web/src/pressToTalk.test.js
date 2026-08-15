import { describe, expect, it } from "vitest";
import { createPressToTalk } from "./pressToTalk.js";

class FakeMediaRecorder {
  constructor(stream) {
    this.stream = stream;
    this.state = "inactive";
    this.mimeType = "audio/webm";
    this.listeners = { dataavailable: [], stop: [] };
  }

  addEventListener(name, fn) {
    this.listeners[name].push(fn);
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    const data = new Blob([new Uint8Array([9, 8, 7])], { type: "audio/webm" });
    this.listeners.dataavailable.forEach((fn) => fn({ data }));
    this.listeners.stop.forEach((fn) => fn());
  }
}

describe("createPressToTalk", () => {
  it("records through MediaRecorder and returns a wav", async () => {
    const wav = new Blob([new Uint8Array([82, 73, 70, 70])], { type: "audio/wav" });
    let micStopped = false;
    const ptt = createPressToTalk({
      getUserMedia: async () => ({
        getTracks: () => [
          {
            stop() {
              micStopped = true;
            },
          },
        ],
      }),
      MediaRecorder: FakeMediaRecorder,
      toWav: async (blob) => {
        expect(blob.type).toBe("audio/webm");
        expect(blob.size).toBeGreaterThan(0);
        return wav;
      },
    });

    await ptt.start();
    const result = await ptt.stop();

    expect(result).toBe(wav);
    expect(micStopped).toBe(true);
  });

  it("waits for an in-flight start before returning the wav", async () => {
    const wav = new Blob([new Uint8Array([82, 73, 70, 70])], { type: "audio/wav" });
    let releaseMic;
    const micReady = new Promise((resolve) => {
      releaseMic = resolve;
    });
    const ptt = createPressToTalk({
      getUserMedia: async () => {
        await micReady;
        return {
          getTracks: () => [{ stop() {} }],
        };
      },
      MediaRecorder: FakeMediaRecorder,
      toWav: async () => wav,
    });

    const started = ptt.start();
    const stopped = ptt.stop();
    releaseMic();
    await started;

    await expect(stopped).resolves.toBe(wav);
  });
});
