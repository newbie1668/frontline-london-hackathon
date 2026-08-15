import { describe, expect, it } from "vitest";
import { decodeFormPayload, formShareUrl } from "./formShare.js";

function parkRoadMessage() {
  return {
    created_at: "2026-08-15T11:20:00.000Z",
    transcript: "Park Road sitrep with extra radio chatter not copied into every box.",
    slots: {
      major_incident: { value: true, declared_at: "2026-08-15T11:20:00.000Z", provenance: "confirmed" },
      exact_location: { value: "Park Road / Harrington Way", provenance: "estimated" },
      type_of_incident: { value: "RTC", provenance: "estimated" },
      hazards: { value: "Fuel spill", provenance: "estimated" },
      access: { value: "Nelson Way", provenance: "estimated" },
      number_of_casualties: { value: "3", provenance: "estimated" },
      emergency_services: { value: "Ambulance and Fire", provenance: "estimated" },
    },
  };
}

describe("formShareUrl", () => {
  it("builds a URL a phone camera opens as a page, not a search", () => {
    const url = formShareUrl(parkRoadMessage(), "http://192.168.1.12:5173");

    expect(url.startsWith("http://192.168.1.12:5173/form#")).toBe(true);
    expect(url.startsWith("DATE/TIME:")).toBe(false);

    const fields = decodeFormPayload(url.split("#")[1]);
    expect(fields.dateTime).toBe("2026-08-15T11:20:00.000Z");
    expect(fields.majorIncident).toBe("Yes");
    expect(fields.exactLocation).toBe("Park Road / Harrington Way");
    expect(fields.access).toBe("Nelson Way");
    expect(JSON.stringify(fields)).not.toContain("extra radio chatter");
  });
});
