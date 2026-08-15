export async function loadParkRoadFixture(fetchImpl = globalThis.fetch) {
  const response = await fetchImpl("/fixtures/park-road-sitrep.wav");
  if (!response.ok) return null;
  return response.blob();
}
