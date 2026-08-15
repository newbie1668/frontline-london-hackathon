import { shownSlotValue } from "./updateSlot.js";

const PLAINTEXT_ROWS = [
  ["major_incident", "Major incident"],
  ["exact_location", "Exact location"],
  ["type_of_incident", "Type of incident"],
  ["hazards", "Hazards"],
  ["access", "Access"],
  ["number_of_casualties", "Number of casualties"],
  ["emergency_services", "Emergency services"],
];

export function formatPlaintext(message) {
  const lines = [`DATE/TIME: ${message.created_at}`];
  for (const [key, heading] of PLAINTEXT_ROWS) {
    lines.push(`${heading}: ${shownSlotValue(key, message.slots[key])}`);
  }
  return lines.join("\n");
}

export function emitSend(message) {
  const plaintext = formatPlaintext(message);
  return {
    plaintext,
    json: structuredClone(message),
    qrPayload: plaintext,
  };
}
