/**
 * Browser-safe re-export of `@kyrnox/sentry-sdk`.
 *
 * The SDK barrel (`packages/sentry-sdk/src/index.ts`) intentionally
 * re-exports `FileBundleStore`, `AuditService`, and
 * `EnterpriseTelemetryService` which import Node-only modules
 * (`node:fs`, `node:path`, `node:os`). Rollup cannot tree-shake those
 * side-effectful imports cleanly, so the Vite config aliases
 * `@kyrnox/sentry-sdk` to THIS file instead. We re-export ONLY the
 * pure, browser-safe surface the demo actually uses:
 *   - the evaluator (`evaluateToolPolicy`, input/output types)
 *   - the zod schema
 *   - the type-only exports
 *   - the prompt merge helper
 *
 * The four integrity primitives (`BundleSigner`, `HashChainedAuditLedger`,
 * `FirmwareBaselineVerifier`, `GeoAOIPolicy`) are deliberately NOT
 * re-exported here. They are typed v1 stubs whose implementations
 * `throw not yet implemented` (see STUBS.md). The demo must never call
 * them; it surfaces them as `⚠ STUB` chips that link to STUBS.md.
 *
 * This is a re-export shim — no SDK behavior is reimplemented.
 *
 * Imports use the workspace-relative path (resolved by Vite's bundler
 * mode and TypeScript's `Bundler` `moduleResolution`); they are NOT
 * surfaced as a public API to consumers of the demo.
 */
export {
	evaluateToolPolicy,
	type ToolPolicyEvaluationInput,
} from "../../../../packages/sentry-sdk/src/policy/tool-policy-engine";
export { mergeInstructionSources } from "../../../../packages/sentry-sdk/src/prompt/instruction-merge";
export {
	EnterpriseArtifactKindSchema,
	EnterpriseArtifactSourceSchema,
	EnterpriseAuditEventSchema,
	EnterpriseEnforcementDecisionSchema,
	EnterpriseIdentityClaimsSchema,
	EnterprisePolicyBundleSchema,
	EnterpriseTelemetryConfigSchema,
	EnterpriseToolPolicySchema,
	EnforcementModeSchema,
	KeycloakOidcConfigSchema,
	RuntimeHostSchema,
	ToolPolicyActionSchema,
	type EnterprisePolicyBundleInput,
} from "../../../../packages/sentry-sdk/src/types/schema";
export type {
	EnforcementMode,
	EnterpriseArtifactKind,
	EnterpriseArtifactSource,
	EnterpriseAuditEvent,
	EnterpriseEnforcementDecision,
	EnterpriseIdentityClaims,
	EnterprisePolicyBundle,
	EnterpriseTelemetryConfig,
	EnterpriseToolPolicy,
	KeycloakOidcConfig,
	ManagedInstructionArtifact,
	RuntimeHost,
	ToolPolicyAction,
} from "../../../../packages/sentry-sdk/src/types/types";
