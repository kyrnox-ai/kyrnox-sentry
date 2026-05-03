import type { EnterprisePolicyBundle } from "@kyrnox/sentry-sdk";
import { render } from "ink-testing-library";
import React from "react";
import stripAnsi from "strip-ansi";
import { describe, expect, it } from "vitest";
import StatusApp from "../StatusApp.js";

const NOW = "2025-11-04T12:00:00Z";

const mockBundle: EnterprisePolicyBundle = {
	id: "bundle-test",
	version: "1.4.2",
	source: "control-plane",
	issuedAt: "2025-11-04T11:00:00Z",
	expiresAt: "2025-12-04T11:00:00Z",
	claims: {
		subject: "alice@dod.mil",
		organizationId: "org-signal-corps",
		roles: ["operator", "auditor"],
		groups: [],
		rawClaims: {},
	},
	artifacts: [],
	toolPolicies: [
		{ id: "p1", toolName: "execute_command", action: "allow", requiresApproval: false },
		{ id: "p2", toolName: "read_file", action: "allow", requiresApproval: false },
		{ id: "p3", toolName: "write_file", action: "ask", requiresApproval: true },
		{ id: "p4", toolName: "browser_action", action: "deny", requiresApproval: false },
		{ id: "p5", toolName: "use_mcp_tool", action: "deny", requiresApproval: false },
	],
	telemetry: {
		enabled: true,
		serviceName: "kyrnox-sentry-test",
		promptCapture: "metadata",
		metricsEnabled: true,
		auditEnabled: true,
	},
	featureFlags: {},
};

const claimlessBundle: EnterprisePolicyBundle = {
	...mockBundle,
	id: "bundle-claimless",
	claims: undefined,
};

describe("StatusApp", () => {
	it("renders bundle metadata, policy counts, ledger stub, and identity", () => {
		const { lastFrame } = render(React.createElement(StatusApp, { bundle: mockBundle, now: () => NOW }));
		const out = stripAnsi(lastFrame() ?? "");

		// banner header
		expect(out).toContain("SIGNAL CORPS");
		expect(out).toContain("CLASSIFIED");

		// BUNDLE panel
		expect(out).toContain("BUNDLE");
		expect(out).toContain("bundle-test");
		expect(out).toContain("1.4.2");
		expect(out).toContain("control-plane");
		expect(out).toContain("VERIFIED");

		// POLICIES panel
		expect(out).toContain("ALLOW: 2");
		expect(out).toContain("ASK: 1");
		expect(out).toContain("DENY: 2");

		// LEDGER panel — stub contract: tail derived from sha256, events "(stub)"
		expect(out).toContain("LEDGER TAIL: 0x");
		expect(out).toMatch(/0x[0-9a-f]{8}…[0-9a-f]{4}/);
		expect(out).toContain("EVENTS:");
		expect(out).toContain("(stub)");

		// IDENTITY panel
		expect(out).toContain("alice@dod.mil");
		expect(out).toContain("org-signal-corps");
		expect(out).toContain("operator ▮ auditor");

		// status bar + clock
		expect(out).toContain("[ q ] EXIT");
		expect(out).toContain("[ r ] REFRESH");
		expect(out).toContain("[ j/k ] FOCUS");
		expect(out).toContain(`UPDATED ${NOW}`);
	});

	it("fail-closed: a bundle with no claims renders anonymous@local and does not crash", () => {
		const { lastFrame } = render(React.createElement(StatusApp, { bundle: claimlessBundle, now: () => NOW }));
		const out = stripAnsi(lastFrame() ?? "");

		expect(out).toContain("anonymous@local");
		expect(out).toContain("(no roles)");
		// Bundle panel still renders metadata
		expect(out).toContain("bundle-claimless");
		expect(out).toContain("VERIFIED");
	});

	it("renders UNVERIFIED and anonymous@local when no bundle is provided", () => {
		const { lastFrame } = render(React.createElement(StatusApp, { now: () => NOW }));
		const out = stripAnsi(lastFrame() ?? "");

		expect(out).toContain("UNVERIFIED");
		expect(out).toContain("anonymous@local");
		expect(out).toContain("ALLOW: 0");
		expect(out).toContain("DENY: 0");
	});

	it("snapshots the stripped frame layout so the dashboard contract is locked", () => {
		const { lastFrame } = render(React.createElement(StatusApp, { bundle: mockBundle, now: () => NOW }));
		const out = stripAnsi(lastFrame() ?? "");
		// Anchor on the structural lines we care about; don't snapshot the
		// figlet wordmark since it varies with terminal width.
		const interesting = out
			.split("\n")
			.filter((line) => /BUNDLE|POLICIES|LEDGER|IDENTITY|ALLOW|ASK|DENY|UPDATED|EXIT/.test(line))
			.join("\n");
		expect(interesting).toMatchSnapshot();
	});
});
