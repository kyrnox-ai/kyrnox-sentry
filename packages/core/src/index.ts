import type { EnterprisePolicyBundle } from "@kyrnox/shared"
import { EnterprisePolicyEngine } from "./policy/EnterprisePolicyEngine.js"

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

export class KyrnoxRuntime {
	readonly #policy: EnterprisePolicyEngine

	constructor(bundle?: EnterprisePolicyBundle) {
		this.#policy = new EnterprisePolicyEngine(bundle, bundle?.claims)
	}

	async startSession(input: StartSessionInput): Promise<StartSessionResult> {
		this.#policy.assertToolAllowed({ toolName: "session.start" })
		return {
			sessionId: `session-${Date.now()}`,
			status: "started",
		}
	}
}

export * from "./policy/tool-policy-engine.js"
export * from "./policy/EnterprisePolicyEngine.js"
export * from "./prompt/instruction-merge.js"
export * from "./audit/AuditService.js"
export * from "./telemetry/EnterpriseTelemetryService.js"
