/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CompletionForm from "./CompletionForm.jsx";

afterEach(() => cleanup());

describe("CompletionForm", () => {
  it("shows the official M/ETHANE completion form filled from the Message", () => {
    render(
      <CompletionForm
        fields={{
          dateTime: "2026-08-15T11:20:00.000Z",
          majorIncident: "Yes",
          exactLocation: "junction of Park Road and Harrington Way",
          typeOfIncident: "road traffic collision",
          hazards: "smoke coming from the vehicles",
          access: "via Nelson Way",
          numberOfCasualties: "approximately five or six walking wounded",
          emergencyServices: "fire service, ambulance service, and further police patrols",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: /m\/ethane completion form/i })).toBeTruthy();
    expect(screen.getAllByText(/Park Road and Harrington Way/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Nelson Way/)).toBeTruthy();
    expect(screen.getByText(/RESTRICTED WHEN COMPLETE/i)).toBeTruthy();
  });
});
