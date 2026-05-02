import { describe, expect, it } from "vitest"
import { EnterprisePolicyBundleSchema, EnterpriseTelemetryConfigSchema } from "./schema.js"

const validBundle = {
	id: "bundle-1",
	version: "2026.05.01",
	source: "control-plane",
	issuedAt: "2026-05-01T00:00:00.000Z",
	keycloak: {
		issuerUrl: "http://localhost:8081/realms/kyrnox-dev",
		clientId: "kyrnox-cli",
		scopes: ["openid", "profile", "email"],
	},
	artifacts: [
		{
			id: "rule-secure-shell",
			name: "Secure shell usage",
			kind: "rule",
			source: "enterprise",
			contents: "Never exfiltrate secrets.",
			alwaysEnabled: true,
			enforcement: "required",
			priority: 1000,
		},
	],
	toolPolicies: [
		{
			id: "deny-rm-rf",
			toolName: "execute_command",
			action: "deny",
			requiresApproval: true,
			commandDenylist: ["rm -rf /"],
		},
	],
	telemetry: {
		enabled: true,
		serviceName: "kyrnox-runtime",
		promptCapture: "metadata",
		metricsEnabled: true,
		auditEnabled: true,
	},
	featureFlags: {},
}

describe("enterprise schemas", () => {
	it("validates a policy bundle", () => {
		expect(() => EnterprisePolicyBundleSchema.parse(validBundle)).not.toThrow()
	})

	it("rejects missing required artifact fields", () => {
		const invalid = structuredClone(validBundle)
		// @ts-expect-error exercising runtime validation
		delete invalid.artifacts[0].contents
		expect(() => EnterprisePolicyBundleSchema.parse(invalid)).toThrow()
	})

	it("requires at least one Keycloak scope", () => {
		const invalid = structuredClone(validBundle)
		invalid.keycloak.scopes = []
		expect(() => EnterprisePolicyBundleSchema.parse(invalid)).toThrow()
	})

	it("requires audit when prompt capture is full", () => {
		expect(() =>
			EnterpriseTelemetryConfigSchema.parse({
				enabled: true,
				serviceName: "kyrnox-runtime",
				promptCapture: "full",
				metricsEnabled: true,
				auditEnabled: false,
			}),
		).toThrow(/requires auditEnabled/)
	})
})
