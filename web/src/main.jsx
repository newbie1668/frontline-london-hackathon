import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { blobToWav } from "./encodeWav.js";
import { loadParkRoadFixture } from "./loadParkRoadFixture.js";
import { transcribeAudio } from "./transcribeAudio.js";
import { createPressToTalk } from "./pressToTalk.js";
import { readDeviceCoordinates } from "./readDeviceCoordinates.js";
import "./styles.css";

const pressToTalk = createPressToTalk({
  getUserMedia: (constraints) => navigator.mediaDevices.getUserMedia(constraints),
  MediaRecorder: globalThis.MediaRecorder,
  toWav: blobToWav,
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App
      pressToTalk={pressToTalk}
      readCoordinates={() => readDeviceCoordinates(navigator.geolocation)}
      loadFixture={loadParkRoadFixture}
      transcribeAudio={transcribeAudio}
    />
  </StrictMode>,
);
