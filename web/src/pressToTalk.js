const MIC_CONSTRAINTS = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  },
};

function pickMimeType(MediaRecorder) {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return undefined;
}

export function createPressToTalk({ getUserMedia, MediaRecorder, toWav }) {
  let active = null;
  let starting = null;

  return {
    async start() {
      if (active || starting) return;
      starting = (async () => {
        const stream = await getUserMedia(MIC_CONSTRAINTS).catch(() =>
          getUserMedia({ audio: true }),
        );
        const mimeType = pickMimeType(MediaRecorder);
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        const chunks = [];
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data?.size) chunks.push(event.data);
        });
        const stopped = new Promise((resolve) => {
          recorder.addEventListener("stop", () => {
            stream.getTracks().forEach((track) => track.stop());
            const blobFromChunks = () =>
              new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
            if (chunks.length) {
              resolve(blobFromChunks());
              return;
            }
            setTimeout(() => resolve(blobFromChunks()), 80);
          });
        });
        recorder.start(250);
        active = { recorder, stopped };
      })();
      try {
        await starting;
      } finally {
        starting = null;
      }
    },

    async stop() {
      if (starting) await starting;
      if (!active) return null;
      const { recorder, stopped } = active;
      active = null;
      if (recorder.state !== "inactive") {
        recorder.requestData?.();
        recorder.stop();
      }
      return toWav(await stopped);
    },
  };
}
