import { describe, expect, it } from "vitest";
import { acceptSlot, editSlot, setMajorIncident, shownSlotValue } from "./updateSlot.js";

function unknownSlots() {
  return {
    major_incident: { value: null, declared_at: null, provenance: "unknown" },
    exact_location: { value: null, provenance: "unknown" },
    type_of_incident: { value: null, provenance: "unknown" },
    hazards: { value: null, provenance: "unknown" },
    access: { value: null, provenance: "unknown" },
    number_of_casualties: { value: null, provenance: "unknown" },
    emergency_services: { value: null, provenance: "unknown" },
  };
}

describe("editSlot", () => {
  it("sets the edited Slot to Confirmed", () => {
    const slots = unknownSlots();
    slots.exact_location = { value: "about Park Road", provenance: "estimated" };

    const next = editSlot(slots, "exact_location", "Park Road / Harrington Way");

    expect(next.exact_location).toEqual({
      value: "Park Road / Harrington Way",
      provenance: "confirmed",
    });
  });

  it("does not mutate the original Slots", () => {
    const slots = unknownSlots();
    slots.exact_location = { value: "about Park Road", provenance: "estimated" };

    editSlot(slots, "exact_location", "Park Road / Harrington Way");

    expect(slots.exact_location).toEqual({
      value: "about Park Road",
      provenance: "estimated",
    });
  });

  it("does not rewrite Provenance on other Slots", () => {
    const slots = unknownSlots();
    slots.hazards = { value: "fuel", provenance: "estimated" };
    slots.access = { value: null, provenance: "unknown" };

    const next = editSlot(slots, "exact_location", "Nelson Way");

    expect(next.hazards).toEqual({ value: "fuel", provenance: "estimated" });
    expect(next.access).toEqual({ value: null, provenance: "unknown" });
  });

  it("does not treat Major incident as a text Slot", () => {
    const slots = unknownSlots();

    const next = editSlot(slots, "major_incident", true, () => "2026-08-15T11:20:00.000Z");

    expect(next.major_incident).toEqual({
      value: true,
      declared_at: "2026-08-15T11:20:00.000Z",
      provenance: "confirmed",
    });
  });
});

describe("setMajorIncident", () => {
  it("treats tapping Yes as the declaration and Confirmed", () => {
    const slots = unknownSlots();

    const next = setMajorIncident(slots, true, () => "2026-08-15T11:20:00.000Z");

    expect(next.major_incident).toEqual({
      value: true,
      declared_at: "2026-08-15T11:20:00.000Z",
      provenance: "confirmed",
    });
  });

  it("sets No without a declaration time", () => {
    const slots = unknownSlots();
    slots.major_incident = {
      value: true,
      declared_at: "2026-08-15T11:20:00.000Z",
      provenance: "confirmed",
    };

    const next = setMajorIncident(slots, false, () => "2026-08-15T12:00:00.000Z");

    expect(next.major_incident).toEqual({
      value: false,
      declared_at: null,
      provenance: "confirmed",
    });
  });

  it("leaves Unknown as no declaration", () => {
    const next = setMajorIncident(unknownSlots(), null, () => "2026-08-15T12:00:00.000Z");

    expect(next.major_incident).toEqual({
      value: null,
      declared_at: null,
      provenance: "unknown",
    });
  });
});

describe("acceptSlot", () => {
  it("promotes a Slot to Confirmed without changing its value", () => {
    const slots = unknownSlots();
    slots.number_of_casualties = { value: "3 P2", provenance: "estimated" };

    const next = acceptSlot(slots, "number_of_casualties");

    expect(next.number_of_casualties).toEqual({
      value: "3 P2",
      provenance: "confirmed",
    });
  });

  it("sets declared_at when the officer Confirms Major incident Yes", () => {
    const slots = unknownSlots();
    slots.major_incident = { value: true, declared_at: null, provenance: "estimated" };

    const next = acceptSlot(slots, "major_incident", () => "2026-08-15T11:20:00.000Z");

    expect(next.major_incident).toEqual({
      value: true,
      declared_at: "2026-08-15T11:20:00.000Z",
      provenance: "confirmed",
    });
  });
});

describe("shownSlotValue", () => {
  it("shows hardcoded copy for empty Access and other empty text Slots", () => {
    expect(shownSlotValue("access", { value: null, provenance: "unknown" })).toBe(
      "Not stated — add or send anyway",
    );
    expect(shownSlotValue("hazards", { value: null, provenance: "unknown" })).toBe(
      "Not stated — add or send anyway",
    );
  });

  it("shows Major incident as Yes, No, or Unknown", () => {
    expect(shownSlotValue("major_incident", { value: true, declared_at: "2026-08-15T11:20:00.000Z", provenance: "confirmed" })).toBe("Yes");
    expect(shownSlotValue("major_incident", { value: false, declared_at: null, provenance: "confirmed" })).toBe("No");
    expect(shownSlotValue("major_incident", { value: null, declared_at: null, provenance: "unknown" })).toBe("Unknown");
  });
});
