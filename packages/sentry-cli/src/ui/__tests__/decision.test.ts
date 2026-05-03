import type { EnterpriseEnforcementDecision } from "@kyrnox/sentry-sdk"
import stripAnsi from "strip-ansi"
import { describe, expect, it } from "vitest"
import { formatDecision, formatDecisionTable } from "../decision.js"

const TS = "2025-11-04T12:00:00Z"

const allow: EnterpriseEnforcementDecision = {
	allowed: true,
	action: "allow",
	reason: "Allowed by enterprise policy execute_command",
	matchedPolicyIds: ["execute_command"],
	auditRequired: true,
}

const deny: EnterpriseEnforcementDecision = {
	allowed: false,
	action: "deny",
	reason: "Denied by enterprise policy execute_command",
	matchedPolicyIds: ["execute_command"],
	auditRequired: true,
}

const ask: EnterpriseEnforcementDecision = {
	allowed: true,
	action: "ask",
	reason: "Approval required by enterprise policy session.start",
	matchedPolicyIds: ["session.start"],
	auditRequired: true,
}

describe("formatDecision", () => {
	it("renders ALLOWED with green status and the column contract", () => {
		const out = stripAnsi(formatDecision(allow, { toolName: "execute_command", identity: "alice@dod.mil", timestamp: TS }))
		expect(out).toContain("STATUS")
		expect(out).toContain("[ ALLOWED  ]")
		expect(out).toContain("execute_command")
		expect(out).toContain("alice@dod.mil")
		expect(out).toContain("Allowed by enterprise policy")
		expect(out).toContain(TS)
	})

	it("renders DENIED for a deny decision", () => {
		const out = stripAnsi(formatDecision(deny, { toolName: "execute_command", identity: "mallory@redteam", timestamp: TS }))
		expect(out).toContain("[  DENIED  ]")
		expect(out).toContain("Denied by enterprise policy")
	})

	it("renders REQUIRED for an ask decision", () => {
		const out = stripAnsi(formatDecision(ask, { toolName: "session.start", identity: "bob@nro.gov", timestamp: TS }))
		expect(out).toContain("[ REQUIRED ]")
		expect(out).toContain("Approval required")
	})

	it("fail-closed: a decision with allowed=false renders DENIED even if action is mutated", () => {
		// Defense-in-depth — caller cannot soften a denial by lying about action.
		const sneaky = { ...deny, action: "allow" } as EnterpriseEnforcementDecision
		const out = stripAnsi(formatDecision(sneaky, { toolName: "execute_command", identity: "mallory", timestamp: TS }))
		expect(out).toContain("[  DENIED  ]")
		expect(out).not.toContain("[ ALLOWED  ]")
	})

	it("snapshots the stripped row layout so the column contract is locked", () => {
		const out = stripAnsi(formatDecision(allow, { toolName: "execute_command", identity: "alice@dod.mil", timestamp: TS }))
		expect(out).toMatchInlineSnapshot(`
			"STATUS       TOOL                     IDENTITY               REASON                                           TS                  
			[ ALLOWED  ] ▮ execute_command          ▮ alice@dod.mil          ▮ Allowed by enterprise policy execute_command     ▮ 2025-11-04T12:00:00Z"
		`)
	})
})

describe("formatDecisionTable", () => {
	it("renders the header once and one row per decision", () => {
		const out = stripAnsi(
			formatDecisionTable([
				{ decision: allow, ctx: { toolName: "execute_command", identity: "alice", timestamp: TS } },
				{ decision: deny, ctx: { toolName: "execute_command", identity: "mallory", timestamp: TS } },
				{ decision: ask, ctx: { toolName: "session.start", identity: "bob", timestamp: TS } },
			]),
		)
		expect(out.match(/STATUS/g)).toHaveLength(1)
		expect(out).toContain("[ ALLOWED  ]")
		expect(out).toContain("[  DENIED  ]")
		expect(out).toContain("[ REQUIRED ]")
	})

	it("returns a sentinel row when no decisions are passed", () => {
		const out = stripAnsi(formatDecisionTable([]))
		expect(out).toContain("(no decisions)")
	})
})
