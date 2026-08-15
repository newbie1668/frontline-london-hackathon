export async function extractSlots(transcript, coordinates, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl("/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, coordinates }),
  });
  if (!response.ok) return null;
  return response.json();
}
