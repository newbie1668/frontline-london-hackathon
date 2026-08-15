export function editSlot(slots, key, value, now) {
  if (key === "major_incident") {
    return setMajorIncident(slots, value, now);
  }
  return {
    ...slots,
    [key]: { value, provenance: "confirmed" },
  };
}

export function acceptSlot(slots, key, now) {
  if (key === "major_incident") {
    const slot = slots.major_incident;
    return {
      ...slots,
      major_incident: {
        value: slot.value,
        declared_at: slot.value === true ? slot.declared_at ?? now() : null,
        provenance: slot.value == null ? "unknown" : "confirmed",
      },
    };
  }
  return {
    ...slots,
    [key]: { ...slots[key], provenance: "confirmed" },
  };
}

export function setMajorIncident(slots, value, now = () => new Date().toISOString()) {
  return {
    ...slots,
    major_incident: {
      value,
      declared_at: value === true ? now() : null,
      provenance: value == null ? "unknown" : "confirmed",
    },
  };
}

export const NOT_STATED = "Not stated — add or send anyway";

export function shownSlotValue(key, slot) {
  if (key === "major_incident") {
    if (slot.value === true) return "Yes";
    if (slot.value === false) return "No";
    return "Unknown";
  }
  if (slot.value == null || slot.value === "") return NOT_STATED;
  return slot.value;
}
