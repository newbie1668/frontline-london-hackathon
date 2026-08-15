import { describe, expect, it } from "vitest";
import { loadParkRoadFixture } from "./loadParkRoadFixture.js";

describe("loadParkRoadFixture", () => {
  it("loads the Park Road sitrep wav from the fixtures path", async () => {
    const wav = new Blob([new Uint8Array([82, 73, 70, 70])], { type: "audio/wav" });
    const fetchImpl = async (url) => {
      expect(url).toBe("/fixtures/park-road-sitrep.wav");
      return {
        ok: true,
        blob: async () => wav,
      };
    };

    await expect(loadParkRoadFixture(fetchImpl)).resolves.toBe(wav);
  });

  it("returns null when the Park Road fixture is missing", async () => {
    const fetchImpl = async () => ({
      ok: false,
      blob: async () => new Blob([new Uint8Array([1])], { type: "text/plain" }),
    });

    await expect(loadParkRoadFixture(fetchImpl)).resolves.toBe(null);
  });
});
