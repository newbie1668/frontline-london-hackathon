export async function transcribeAudio(blob, fetchImpl = globalThis.fetch) {
  const body = new FormData();
  body.append("audio", blob, "capture.wav");
  const response = await fetchImpl("/transcribe", { method: "POST", body });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || payload.error || "Transcription failed");
  }
  const payload = await response.json();
  return payload.transcript;
}
