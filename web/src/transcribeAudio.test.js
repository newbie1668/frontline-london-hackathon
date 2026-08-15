import { describe, expect, it } from "vitest";
import { transcribeAudio } from "./transcribeAudio.js";

describe("transcribeAudio", () => {
  it("posts the wav to /transcribe and returns the transcript text", async () => {
    const wav = new Blob([new Uint8Array([82, 73, 70, 70])], { type: "audio/wav" });
    const fetchImpl = async (url, options) => {
      expect(url).toBe("/transcribe");
      expect(options.method).toBe("POST");
      expect(options.body).toBeInstanceOf(FormData);
      expect(options.body.get("audio")).toBeInstanceOf(Blob);
      return {
        ok: true,
        json: async () => ({
          transcript:
            "Park Road / Harrington Way, Nelson Way, two casualties, request fire and ambulance.",
        }),
      };
    };

    await expect(transcribeAudio(wav, fetchImpl)).resolves.toBe(
      "Park Road / Harrington Way, Nelson Way, two casualties, request fire and ambulance.",
    );
  });

  it("returns null when the API rejects the wav", async () => {
    const wav = new Blob([new Uint8Array([82, 73, 70, 70])], { type: "audio/wav" });
    const fetchImpl = async () => ({
      ok: false,
      json: async () => ({ error: "failed" }),
    });

    await expect(transcribeAudio(wav, fetchImpl)).resolves.toBe(null);
  });
});
