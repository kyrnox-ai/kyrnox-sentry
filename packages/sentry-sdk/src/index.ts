import type { EnterprisePolicyBundle } from "./types/index.js"
import { evaluateToolPolicy, type ToolPolicyEvaluationInput } from "./policy/tool-policy-engine.js"

export interface StartSessionInput {
	prompt: string
	workspacePath?: string
	host: "vscode" | "cli" | "rpc"
	bundle?: EnterprisePolicyBundle
}

export interface StartSessionResult {
	sessionId: string
	status: "started"
}

/**
 * KyrnoxRuntime is the OSS SENTRY entry point. It wraps the pure
 * `evaluateToolPolicy` evaluator with a session bootstrap that fails
 * closed on `deny` decisions before any side effects run.
 */
export class KyrnoxRuntime {
	constructor(private readonly bundle?: EnterprisePolicyBundle) {}

	async startSession(input: StartSessionInput): Promise<StartSessionResult> {
		const claims = this.bundle?.claims
		const decision = evaluateToolPolicy({ bundle: this.bundle, claims, toolName: "session.start" } as ToolPolicyEvaluationInput)
		if (!decision.allowed || decision.action === "deny") {
			throw new Error(`Kyrnox SENTRY denied session.start: ${decision.reason}`)
		}
		return {
			sessionId: `session-${Date.now()}`,
			status: "started",
		}
	}
}

export * from "./policy/tool-policy-engine.js"
export * from "./prompt/instruction-merge.js"
export * from "./audit/AuditService.js"
export * from "./telemetry/EnterpriseTelemetryService.js"
export * from "./types/index.js"
export * from "./storage/FileBundleStore.js"
export * from "./integrity/BundleSigner.js"
export * from "./integrity/HashChainedAuditLedger.js"
export * from "./integrity/FirmwareBaselineVerifier.js"
export * from "./integrity/GeoAOIPolicy.js"
