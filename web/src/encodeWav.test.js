import { describe, expect, it } from "vitest";
import { blobToWav, encodeWav } from "./encodeWav.js";

function pcmBuffer(samples, sampleRate = 8000) {
  const data = Float32Array.from(samples);
  return {
    sampleRate,
    numberOfChannels: 1,
    length: data.length,
    getChannelData(channel) {
      if (channel !== 0) throw new Error("mono fixture");
      return data;
    },
  };
}

function headerString(bytes, offset, length) {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

describe("encodeWav", () => {
  it("writes a 16-bit PCM wav with a RIFF header", async () => {
    const blob = encodeWav(pcmBuffer([0, 0.5, -0.5, 1], 16000));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(bytes.buffer);

    expect(blob.type).toBe("audio/wav");
    expect(headerString(bytes, 0, 4)).toBe("RIFF");
    expect(headerString(bytes, 8, 4)).toBe("WAVE");
    expect(headerString(bytes, 12, 4)).toBe("fmt ");
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(headerString(bytes, 36, 4)).toBe("data");
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(16383);
    expect(view.getInt16(48, true)).toBe(-16384);
    expect(view.getInt16(50, true)).toBe(32767);
  });

  it("mixes a quiet stereo capture to 16 kHz mono loud enough for ASR", async () => {
    const quiet = Float32Array.from([0.04, -0.04, 0.03, -0.03, 0.04, -0.04]);
    const blob = encodeWav({
      sampleRate: 48000,
      numberOfChannels: 2,
      length: quiet.length,
      getChannelData(channel) {
        return quiet;
      },
    });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(bytes.buffer);

    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(Math.abs(view.getInt16(44, true))).toBeGreaterThan(10000);
  });
});

describe("blobToWav", () => {
  it("does not decode a wav capture again", async () => {
    const wav = encodeWav(pcmBuffer([0], 8000));
    let decoded = false;
    const result = await blobToWav(wav, {
      decodeAudioData: async () => {
        decoded = true;
        return pcmBuffer([0], 8000);
      },
    });
    expect(decoded).toBe(false);
    expect(result.type).toBe("audio/wav");
    expect(result).toBe(wav);
  });

  it("converts a webm recording to wav through the audio decoder", async () => {
    const webm = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
    const wav = await blobToWav(webm, {
      decodeAudioData: async () => pcmBuffer([0, 1], 16000),
    });
    const bytes = new Uint8Array(await wav.arrayBuffer());
    const view = new DataView(bytes.buffer);

    expect(wav.type).toBe("audio/wav");
    expect(headerString(bytes, 0, 4)).toBe("RIFF");
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(32767);
  });

  it("rejects when the audio decoder cannot convert the capture", async () => {
    const webm = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
    await expect(
      blobToWav(webm, {
        decodeAudioData: async () => {
          throw new Error("EncodingError");
        },
      }),
    ).rejects.toThrow(/convert/i);
  });
});
