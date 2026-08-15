import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import CompletionForm from "./CompletionForm.jsx";
import { blobToWav } from "./encodeWav.js";
import { loadParkRoadFixture } from "./loadParkRoadFixture.js";
import { transcribeAudio } from "./transcribeAudio.js";
import { extractSlots } from "./extractSlots.js";
import { shareOrigin } from "./formShare.js";
import { createPressToTalk } from "./pressToTalk.js";
import { readDeviceCoordinates } from "./readDeviceCoordinates.js";
import "./styles.css";

const pressToTalk = createPressToTalk({
  getUserMedia: (constraints) => navigator.mediaDevices.getUserMedia(constraints),
  MediaRecorder: globalThis.MediaRecorder,
  toWav: blobToWav,
});

const root = createRoot(document.getElementById("root"));
const onFormPage = globalThis.location.pathname.replace(/\/$/, "") === "/form";

root.render(
  <StrictMode>
    {onFormPage ? (
      <CompletionForm />
    ) : (
      <App
        pressToTalk={pressToTalk}
        readCoordinates={() => readDeviceCoordinates(navigator.geolocation)}
        loadFixture={loadParkRoadFixture}
        transcribeAudio={transcribeAudio}
        extractSlots={extractSlots}
        formOrigin={shareOrigin}
      />
    )}
  </StrictMode>,
);
