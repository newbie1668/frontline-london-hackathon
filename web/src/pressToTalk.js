export function createPressToTalk({ getUserMedia, MediaRecorder, toWav }) {
  let active = null;
  let starting = null;

  return {
    async start() {
      if (active || starting) return;
      starting = (async () => {
        const stream = await getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data?.size) chunks.push(event.data);
        });
        const stopped = new Promise((resolve) => {
          recorder.addEventListener("stop", () => {
            stream.getTracks().forEach((track) => track.stop());
            resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
          });
        });
        recorder.start();
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
      if (recorder.state !== "inactive") recorder.stop();
      return toWav(await stopped);
    },
  };
}
