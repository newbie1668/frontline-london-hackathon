const TARGET_RATE = 16000;
const TARGET_PEAK = 0.89;
const MAX_GAIN = 25;

function writeString(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function mixMono(audioBuffer) {
  const length = audioBuffer.length;
  const channels = audioBuffer.numberOfChannels;
  const mono = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    let sum = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      sum += audioBuffer.getChannelData(channel)[i];
    }
    mono[i] = sum / channels;
  }
  return mono;
}

function resample(samples, fromRate, toRate) {
  if (fromRate === toRate) return samples;
  const outLength = Math.max(1, Math.round((samples.length * toRate) / fromRate));
  const out = new Float32Array(outLength);
  const ratio = samples.length / outLength;
  for (let i = 0; i < outLength; i += 1) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(i0 + 1, samples.length - 1);
    const frac = src - i0;
    out[i] = samples[i0] * (1 - frac) + samples[i1] * frac;
  }
  return out;
}

function normalize(samples) {
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  if (peak === 0 || peak >= TARGET_PEAK) return samples;
  const gain = Math.min(TARGET_PEAK / peak, MAX_GAIN);
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    out[i] = samples[i] * gain;
  }
  return out;
}

export function encodeWav(audioBuffer) {
  const samples = normalize(resample(mixMono(audioBuffer), audioBuffer.sampleRate, TARGET_RATE));
  const numFrames = samples.length;
  const bytesPerSample = 2;
  const dataSize = numFrames * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_RATE, true);
  view.setUint32(28, TARGET_RATE * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i += 1) {
    const sample = samples[i];
    const clamped = Math.max(-1, Math.min(1, sample));
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export async function blobToWav(blob, { decodeAudioData } = {}) {
  if (blob.type === "audio/wav" || blob.type === "audio/wave") {
    return blob;
  }
  const decode = decodeAudioData ?? defaultDecodeAudioData;
  try {
    const audioBuffer = await decode(await blob.arrayBuffer());
    return encodeWav(audioBuffer);
  } catch {
    throw new Error("Could not convert the recording to wav");
  }
}

async function defaultDecodeAudioData(arrayBuffer) {
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  const ctx = new Context();
  try {
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await ctx.close?.();
  }
}
