export function readDeviceCoordinates(geolocation) {
  if (!geolocation?.getCurrentPosition) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timeoutMs = 8000;
    const timer = setTimeout(() => finish(null), timeoutMs);
    geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        const lat = position?.coords?.latitude;
        const lon = position?.coords?.longitude;
        if (typeof lat !== "number" || typeof lon !== "number" || Number.isNaN(lat) || Number.isNaN(lon)) {
          finish(null);
          return;
        }
        finish({ lat, lon });
      },
      () => {
        clearTimeout(timer);
        finish(null);
      },
      { timeout: timeoutMs },
    );
  });
}
