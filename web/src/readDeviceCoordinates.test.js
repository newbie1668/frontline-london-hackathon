import { afterEach, describe, expect, it, vi } from "vitest";
import { readDeviceCoordinates } from "./readDeviceCoordinates.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("readDeviceCoordinates", () => {
  it("returns lat and lon from a browser fix", async () => {
    const geolocation = {
      getCurrentPosition(success) {
        success({ coords: { latitude: 51.5074, longitude: -0.1278 } });
      },
    };

    await expect(readDeviceCoordinates(geolocation)).resolves.toEqual({
      lat: 51.5074,
      lon: -0.1278,
    });
  });

  it("returns null when the browser denies or fails the fix", async () => {
    const geolocation = {
      getCurrentPosition(_success, error) {
        error({ code: 1, message: "User denied Geolocation" });
      },
    };

    await expect(readDeviceCoordinates(geolocation)).resolves.toBe(null);
  });

  it("returns null when geolocation is missing", async () => {
    await expect(readDeviceCoordinates(undefined)).resolves.toBe(null);
  });

  it("returns null instead of 0,0 when the fix has no numeric lat/lon", async () => {
    const geolocation = {
      getCurrentPosition(success) {
        success({ coords: { latitude: undefined, longitude: undefined } });
      },
    };

    await expect(readDeviceCoordinates(geolocation)).resolves.toBe(null);
  });

  it("returns null on timeout and asks the browser not to wait forever", async () => {
    let options;
    const geolocation = {
      getCurrentPosition(_success, error, opts) {
        options = opts;
        error({ code: 3, message: "Timeout expired" });
      },
    };

    await expect(readDeviceCoordinates(geolocation)).resolves.toBe(null);
    expect(options.timeout).toBeGreaterThan(0);
  });

  it("returns null if the browser never answers", async () => {
    vi.useFakeTimers();
    const pending = readDeviceCoordinates({
      getCurrentPosition() {},
    });
    await vi.advanceTimersByTimeAsync(8000);
    await expect(pending).resolves.toBe(null);
  });
});
