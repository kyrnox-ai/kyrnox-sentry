import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("SENTRY ops console", () => {
	it("renders the classification banner", () => {
		render(<App />);
		expect(
			screen.getByText(/CLASSIFIED \/\/ KYRNOX SENTRY \/\/ ENFORCEMENT: DENY \/\/ FAIL-CLOSED/),
		).toBeInTheDocument();
	});

	it("starts with an empty decision log", () => {
		render(<App />);
		expect(screen.getByTestId("log-empty")).toHaveTextContent("(no decisions)");
	});

	it("appends a DENIED row when a deny scenario is clicked (fail-closed)", () => {
		render(<App />);
		const denyBtn = screen.getByTestId("redteam-scn-deny-command");
		fireEvent.click(denyBtn);
		const rows = screen.getAllByTestId("log-row");
		expect(rows).toHaveLength(1);
		const status = screen.getByTestId("log-status");
		expect(status.textContent).toContain("DENIED");
		expect(status.className).toMatch(/log__status--deny/);
	});

	it("renders ⚠ STUB chips for the four frozen primitives", () => {
		render(<App />);
		for (const name of ["BundleSigner", "HashChainedAuditLedger", "FirmwareBaselineVerifier", "GeoAOIPolicy"]) {
			expect(screen.getAllByText(name).length).toBeGreaterThan(0);
		}
	});

	it("appends an ALLOWED row for the safe read scenario", () => {
		render(<App />);
		fireEvent.click(screen.getByTestId("redteam-scn-allow-read"));
		const status = screen.getByTestId("log-status");
		expect(status.textContent).toContain("ALLOWED");
	});
});
