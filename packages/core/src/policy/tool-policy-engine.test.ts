import { describe, expect, it } from "vitest"
import { evaluateToolPolicy } from "./tool-policy-engine.js"

const bundle = {
	id: "bundle",
	version: "v1",
	source: "control-plane" as const,
	issuedAt: "2026-05-01T00:00:00.000Z",
	artifacts: [],
	toolPolicies: [
		{ id: "deny-rm", toolName: "execute_command", action: "deny" as const, requiresApproval: true, commandDenylist: ["rm -rf"] },
		{ id: "ask-shell", toolName: "execute_command", action: "ask" as const, requiresApproval: true },
	],
	telemetry: { enabled: true, serviceName: "kyrnox", promptCapture: "metadata" as const, metricsEnabled: true, auditEnabled: true },
	featureFlags: {},
}

describe("evaluateToolPolicy", () => {
	it("denies matching command denylist", () => {
		const decision = evaluateToolPolicy({ bundle, toolName: "execute_command", command: "rm -rf ./dist" })
		expect(decision.allowed).toBe(false)
		expect(decision.action).toBe("deny")
	})

	it("asks for shell by default policy", () => {
		const decision = evaluateToolPolicy({ bundle, toolName: "execute_command", command: "npm test" })
		expect(decision.allowed).toBe(true)
		expect(decision.action).toBe("ask")
	})
})
