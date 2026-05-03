import type { EnterpriseEnforcementDecision } from "@kyrnox/sentry-sdk"
import { accents, palette } from "./colors.js"

export interface DecisionRowContext {
	toolName?: string
	identity?: string
	timestamp?: string
}

const COLUMNS = {
	status: 12,
	tool: 24,
	identity: 22,
	reason: 48,
	ts: 20,
} as const

const SEP = palette.muted("▮")

const STATUS_BADGES = {
	allow: () => accents.allowed("[ ALLOWED  ]"),
	deny: () => accents.denied("[  DENIED  ]"),
	ask: () => accents.required("[ REQUIRED ]"),
} as const

function pad(value: string, width: number): string {
	if (value.length === width) return value
	if (value.length > width) return value.slice(0, Math.max(1, width - 1)) + "…"
	return value + " ".repeat(width - value.length)
}

function header(): string {
	const cells = [
		pad("STATUS", COLUMNS.status),
		pad("TOOL", COLUMNS.tool),
		pad("IDENTITY", COLUMNS.identity),
		pad("REASON", COLUMNS.reason),
		pad("TS", COLUMNS.ts),
	]
	return accents.dim(cells.join(" "))
}

function statusCell(action: EnterpriseEnforcementDecision["action"]): string {
	const badge = STATUS_BADGES[action]?.() ?? accents.required("[ REQUIRED ]")
	const visible = action === "allow" ? "[ ALLOWED  ]" : action === "deny" ? "[  DENIED  ]" : "[ REQUIRED ]"
	const padding = COLUMNS.status - visible.length
	return badge + (padding > 0 ? " ".repeat(padding) : "")
}

/**
 * Format a SENTRY enforcement decision as a single fixed-width terminal row.
 *
 * Columns: STATUS  TOOL  IDENTITY  REASON  TS
 *
 * Color is restricted to the STATUS badge so contrast stays predictable on
 * any terminal background; the body cells use accents.body so the row stays
 * legible when redirected to a non-TTY stream (chalk auto-strips ANSI).
 *
 * Fail-closed contract: a decision with `allowed === false` MUST render as
 * `[  DENIED  ]` regardless of `action`. The SDK's `evaluateToolPolicy`
 * already guarantees `action === "deny"` in that case, but we double-gate
 * here so an upstream regression cannot soften a denial visually.
 */
export function formatDecision(decision: EnterpriseEnforcementDecision, ctx: DecisionRowContext = {}): string {
	const action: EnterpriseEnforcementDecision["action"] = decision.allowed ? decision.action : "deny"
	const ts = ctx.timestamp ?? new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
	const reason = decision.reason || "(no reason provided)"
	const toolName = ctx.toolName ?? decision.matchedPolicyIds[0] ?? "(unmatched)"
	const identity = ctx.identity ?? "anonymous@local"

	const row = [
		statusCell(action),
		accents.body(pad(toolName, COLUMNS.tool)),
		palette.restrictedCyan(pad(identity, COLUMNS.identity)),
		accents.body(pad(reason, COLUMNS.reason)),
		accents.dim(pad(ts, COLUMNS.ts)),
	].join(` ${SEP} `)

	return `${header()}\n${row}`
}

/**
 * Convenience renderer for multiple decisions (used by the future `status`
 * TUI and the `verify` command bundle-summary path). Header is printed once.
 */
export function formatDecisionTable(rows: Array<{ decision: EnterpriseEnforcementDecision; ctx?: DecisionRowContext }>): string {
	if (rows.length === 0) return `${header()}\n${accents.dim("(no decisions)")}`
	const body = rows
		.map(({ decision, ctx }) => formatDecision(decision, ctx).split("\n").slice(1).join("\n"))
		.join("\n")
	return `${header()}\n${body}`
}
