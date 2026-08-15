export async function extractSlots(transcript, coordinates, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl("/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, coordinates }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || payload.error || "Extract failed");
  }
  return response.json();
}
