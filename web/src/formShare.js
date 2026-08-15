import { shownSlotValue } from "./updateSlot.js";

const SLOT_FIELDS = [
  ["major_incident", "majorIncident"],
  ["exact_location", "exactLocation"],
  ["type_of_incident", "typeOfIncident"],
  ["hazards", "hazards"],
  ["access", "access"],
  ["number_of_casualties", "numberOfCasualties"],
  ["emergency_services", "emergencyServices"],
];

export function formFields(message) {
  const fields = { dateTime: message.created_at };
  for (const [key, name] of SLOT_FIELDS) {
    fields[name] = shownSlotValue(key, message.slots[key]);
  }
  return fields;
}

export function encodeFormPayload(message) {
  const json = JSON.stringify(formFields(message));
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeFormPayload(payload) {
  const pad = payload.length % 4 === 0 ? "" : "=".repeat(4 - (payload.length % 4));
  const binary = atob(payload.replaceAll("-", "+").replaceAll("_", "/") + pad);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function formShareUrl(message, origin) {
  return `${origin.replace(/\/$/, "")}/form#${encodeFormPayload(message)}`;
}

export async function shareOrigin(fetchImpl = globalThis.fetch, loc = globalThis.location) {
  const port = loc.port || "5173";
  try {
    const response = await fetchImpl("/health");
    if (response.ok) {
      const body = await response.json();
      if (body.lan_ip) return `${loc.protocol}//${body.lan_ip}:${port}`;
    }
  } catch {
    // Same-machine origin is still a URL a camera can open.
  }
  return loc.origin;
}
