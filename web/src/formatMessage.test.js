import { describe, expect, it } from "vitest";
import { emitSend, formatPlaintext } from "./formatMessage.js";

function parkRoadMessage(overrides = {}) {
  return {
    incident_id: "11111111-1111-4111-8111-111111111111",
    message_id: "22222222-2222-4222-8222-222222222222",
    created_at: "2026-08-15T11:20:00.000Z",
    transcript: "Park Road sitrep with extra radio chatter not copied into every box.",
    coordinates: { lat: 51.5074, lon: -0.1278 },
    slots: {
      major_incident: { value: false, declared_at: null, provenance: "confirmed" },
      exact_location: { value: "Park Road / Harrington Way", provenance: "estimated" },
      type_of_incident: { value: "RTC", provenance: "estimated" },
      hazards: { value: "Fuel spill", provenance: "estimated" },
      access: { value: null, provenance: "unknown" },
      number_of_casualties: { value: "3", provenance: "estimated" },
      emergency_services: { value: "Ambulance and Fire", provenance: "estimated" },
    },
    ...overrides,
  };
}

describe("formatPlaintext", () => {
  it("emits DATE/TIME plus the seven JESIP headings and values", () => {
    const plaintext = formatPlaintext(parkRoadMessage());

    expect(plaintext).toBe(
      [
        "DATE/TIME: 2026-08-15T11:20:00.000Z",
        "Major incident: No",
        "Exact location: Park Road / Harrington Way",
        "Type of incident: RTC",
        "Hazards: Fuel spill",
        "Access: Not stated — add or send anyway",
        "Number of casualties: 3",
        "Emergency services: Ambulance and Fire",
      ].join("\n"),
    );
  });
});

describe("emitSend", () => {
  it("does not bulk-promote Provenance", () => {
    const message = parkRoadMessage();
    const before = structuredClone(message.slots);

    const artifacts = emitSend(message);

    expect(message.slots).toEqual(before);
    expect(artifacts.json.slots).toEqual(before);
    expect(artifacts.json.slots.exact_location.provenance).toBe("estimated");
    expect(artifacts.json.slots.access.provenance).toBe("unknown");
    expect(artifacts.json.slots.major_incident.provenance).toBe("confirmed");
  });

  it("does not let the emitted JSON rewrite the Message Provenance", () => {
    const message = parkRoadMessage();
    const { json } = emitSend(message);

    json.slots.exact_location.provenance = "confirmed";

    expect(message.slots.exact_location.provenance).toBe("estimated");
  });

  it("returns the full Message envelope as JSON, not only slots", () => {
    const message = parkRoadMessage();
    const { json } = emitSend(message);

    expect(json).toEqual({
      incident_id: "11111111-1111-4111-8111-111111111111",
      message_id: "22222222-2222-4222-8222-222222222222",
      created_at: "2026-08-15T11:20:00.000Z",
      transcript: message.transcript,
      coordinates: { lat: 51.5074, lon: -0.1278 },
      slots: message.slots,
    });
  });

  it("puts only the plaintext in the QR, not the JSON or the Transcript", () => {
    const message = parkRoadMessage();
    const artifacts = emitSend(message);

    expect(artifacts.qrPayload).toBe(artifacts.plaintext);
    expect(artifacts.qrPayload).not.toBe(JSON.stringify(artifacts.json));
    expect(artifacts.qrPayload).not.toContain("extra radio chatter");
    expect(artifacts.qrPayload).not.toContain(message.incident_id);
  });
});
