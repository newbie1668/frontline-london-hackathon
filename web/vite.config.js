import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parkRoadFixture = path.join(repoRoot, "fixtures/park-road-sitrep.wav");
const parkRoadFixtureUrl = "/fixtures/park-road-sitrep.wav";

function serveParkRoadFixture() {
  function sendWav(_req, res) {
    if (!fs.existsSync(parkRoadFixture)) {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.setHeader("Content-Type", "audio/wav");
    fs.createReadStream(parkRoadFixture).pipe(res);
  }

  function mount(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split("?")[0] !== parkRoadFixtureUrl) {
        next();
        return;
      }
      sendWav(req, res);
    });
  }

  return {
    name: "park-road-fixture",
    configureServer: mount,
    configurePreviewServer: mount,
    generateBundle() {
      if (!fs.existsSync(parkRoadFixture)) return;
      this.emitFile({
        type: "asset",
        fileName: "fixtures/park-road-sitrep.wav",
        source: fs.readFileSync(parkRoadFixture),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveParkRoadFixture()],
  server: {
    host: true,
    port: 5173,
    fs: { allow: [repoRoot] },
    proxy: {
      "/transcribe": "http://127.0.0.1:8000",
      "/extract": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
    },
  },
  test: {
    environment: "node",
  },
});
