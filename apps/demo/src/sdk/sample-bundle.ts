import { type EnterprisePolicyBundle, EnterprisePolicyBundleSchema } from "@kyrnox/sentry-sdk";

/**
 * Static, identity-filtered policy bundle that drives the browser demo.
 *
 * Validated through `EnterprisePolicyBundleSchema.parse(...)` at module
 * load: a regression in the SDK schema fails the demo build, not the
 * runtime. The bundle covers every red-team button:
 *   - p-read-allow      → action: "allow"
 *   - p-write-ask       → action: "ask"  (requires approval)
 *   - p-shell-deny      → action: "deny" (commandDenylist hit)
 *   - p-path-deny       → action: "deny" (pathDenylist hit)
 *   - p-network-deny    → action: "deny" (tool-name match only)
 *
 * `claims` reflects the redacted operator persona used across the docs:
 * `alice@dod.mil`, org-signal-corps, roles operator + auditor.
 */
const RAW_BUNDLE = {
	id: "bundle-demo-001",
	version: "1.4.2",
	source: "control-plane",
	issuedAt: "2026-05-03T01:00:00.000Z",
	expiresAt: "2026-06-03T01:00:00.000Z",
	claims: {
		subject: "alice@dod.mil",
		email: "alice@dod.mil",
		preferredUsername: "alice",
		organizationId: "org-signal-corps",
		projectIds: ["proj-sentry-demo"],
		roles: ["operator", "auditor"],
		groups: ["dod-blue-team"],
		rawClaims: {},
	},
	artifacts: [
		{
			id: "rule-fail-closed",
			name: "Fail-closed runtime contract",
			kind: "rule",
			source: "enterprise",
			contents: "Any decision that is not an explicit allow MUST collapse to deny.",
			alwaysEnabled: true,
			enforcement: "deny",
			priority: 100,
		},
	],
	toolPolicies: [
		{
			id: "p-read-allow",
			toolName: "read_file",
			action: "allow",
			requiresApproval: false,
			roles: ["operator", "auditor"],
		},
		{
			id: "p-write-ask",
			toolName: "write_to_file",
			action: "ask",
			requiresApproval: true,
			roles: ["operator"],
		},
		{
			id: "p-shell-deny",
			toolName: "execute_command",
			action: "deny",
			requiresApproval: false,
			commandDenylist: ["rm -rf", "shutdown", "mkfs"],
		},
		{
			id: "p-path-deny",
			toolName: "read_file",
			action: "deny",
			requiresApproval: false,
			pathDenylist: ["/etc/shadow", "/.ssh/", "/var/secrets/"],
		},
		{
			id: "p-network-deny",
			toolName: "browser_action",
			action: "deny",
			requiresApproval: false,
		},
	],
	telemetry: {
		enabled: false,
		serviceName: "kyrnox-sentry-demo",
		promptCapture: "off",
		metricsEnabled: false,
		auditEnabled: true,
	},
	featureFlags: {
		"demo.console": true,
	},
	metadata: {
		origin: "apps/demo/src/sdk/sample-bundle.ts",
	},
} as const;

export const SAMPLE_BUNDLE: EnterprisePolicyBundle = EnterprisePolicyBundleSchema.parse(
	RAW_BUNDLE,
) as EnterprisePolicyBundle;
