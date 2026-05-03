import { readFile } from "node:fs/promises"
import { type EnterprisePolicyBundle, FileBundleStore, evaluateToolPolicy } from "@kyrnox/sentry-sdk"
import { accents } from "../ui/colors.js"
import { formatDecision } from "../ui/decision.js"

export interface EvaluateOptions {
	tool: string
	command?: string
	path?: string
	identity?: string
	bundle?: string
	json?: boolean
}

async function loadBundle(file?: string): Promise<EnterprisePolicyBundle | undefined> {
	if (file) {
		const raw = await readFile(file, "utf8")
		return JSON.parse(raw) as EnterprisePolicyBundle
	}
	return new FileBundleStore().load().catch(() => undefined)
}

/**
 * `kyrnox-sentry evaluate` — run the OSS policy evaluator against a
 * single hypothetical tool call. This is the fastest way for a red-teamer
 * or DoD/IC engineer to ask the loaded bundle "would this be denied?".
 *
 * Fail-closed contract: when --bundle is provided but cannot be parsed,
 * we treat the request as DENIED and return exit code 2. We never print
 * ALLOWED for a tool we couldn't evaluate.
 */
export async function runEvaluateCommand(options: EvaluateOptions): Promise<number> {
	let bundle: EnterprisePolicyBundle | undefined
	try {
		bundle = await loadBundle(options.bundle)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		const decision = {
			allowed: false,
			action: "deny" as const,
			reason: `Bundle unreadable: ${message}`,
			matchedPolicyIds: [],
			auditRequired: true,
		}
		if (options.json) {
			process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`)
		} else {
			process.stderr.write(`${formatDecision(decision, { toolName: options.tool, identity: options.identity })}\n`)
		}
		return 2
	}

	const decision = evaluateToolPolicy({
		bundle,
		claims: bundle?.claims,
		toolName: options.tool,
		command: options.command,
		path: options.path,
	})

	if (options.json) {
		process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`)
	} else {
		process.stderr.write(`${accents.heading("// EVALUATION")}\n`)
		process.stdout.write(`${formatDecision(decision, { toolName: options.tool, identity: options.identity })}\n`)
	}
	return decision.allowed ? 0 : 1
}
