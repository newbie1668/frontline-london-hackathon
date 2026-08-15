import { describe, expect, it } from "vitest";
import { extractSlots } from "./extractSlots.js";

describe("extractSlots", () => {
  it("posts transcript and coordinates to /extract and returns the Message", async () => {
    const message = {
      incident_id: "11111111-1111-1111-1111-111111111111",
      message_id: "22222222-2222-2222-2222-222222222222",
      created_at: "2026-08-15T12:00:00Z",
      transcript: "I am declaring this a major incident. Junction of Park Road and Harrington Way.",
      coordinates: { lat: 51.5074, lon: -0.1278 },
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
        type_of_incident: { value: null, provenance: "unknown" },
        hazards: { value: null, provenance: "unknown" },
        access: { value: null, provenance: "unknown" },
        number_of_casualties: { value: null, provenance: "unknown" },
        emergency_services: { value: null, provenance: "unknown" },
      },
    };
    const fetchImpl = async (url, options) => {
      expect(url).toBe("/extract");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({
        transcript: message.transcript,
        coordinates: { lat: 51.5074, lon: -0.1278 },
      });
      return { ok: true, json: async () => message };
    };

    await expect(
      extractSlots(message.transcript, { lat: 51.5074, lon: -0.1278 }, fetchImpl),
    ).resolves.toEqual(message);
  });

  it("throws when the API rejects extract", async () => {
    const fetchImpl = async () => ({
      ok: false,
      json: async () => ({ error: "extract_failed", detail: "Unload ASR before extract." }),
    });

    await expect(extractSlots("Park Road", null, fetchImpl)).rejects.toThrow(
      "Unload ASR before extract.",
    );
  });
});
