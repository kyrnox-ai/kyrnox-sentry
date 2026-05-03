import type { EnterpriseEnforcementDecision, EnterpriseIdentityClaims, EnterprisePolicyBundle, EnterpriseToolPolicy } from "../types/index.js"

export interface ToolPolicyEvaluationInput {
	bundle?: EnterprisePolicyBundle
	claims?: EnterpriseIdentityClaims
	toolName: string
	command?: string
	path?: string
	risk?: "low" | "medium" | "high"
}

const riskRank = { low: 1, medium: 2, high: 3 } as const

export function evaluateToolPolicy(input: ToolPolicyEvaluationInput): EnterpriseEnforcementDecision {
	const matching = (input.bundle?.toolPolicies ?? []).filter((policy) => policyMatches(policy, input))
	const deny = matching.find((policy) => policy.action === "deny")
	if (deny) return decision(false, "deny", `Denied by enterprise policy ${policyId(deny)}`, matching)

	const ask = matching.find((policy) => policy.action === "ask" || policy.requiresApproval)
	if (ask) return decision(true, "ask", `Approval required by enterprise policy ${policyId(ask)}`, matching)

	const allow = matching.find((policy) => policy.action === "allow")
	if (allow) return decision(true, "allow", `Allowed by enterprise policy ${policyId(allow)}`, matching)

	return { allowed: true, action: "ask", reason: "No enterprise tool policy matched; defaulting to approval", matchedPolicyIds: [], auditRequired: true }
}

function policyMatches(policy: EnterpriseToolPolicy, input: ToolPolicyEvaluationInput): boolean {
	if (policy.toolName !== "*" && policy.toolName !== input.toolName) return false
	if (policy.roles?.length && !intersects(policy.roles, input.claims?.roles ?? [])) return false
	if (policy.maxRisk && input.risk && riskRank[input.risk] > riskRank[policy.maxRisk]) return false
	if (input.command) {
		if (policy.commandDenylist?.some((pattern) => input.command?.includes(pattern))) return true
		if (policy.action === "deny" && policy.commandDenylist?.length) return false
		if (policy.commandAllowlist?.length && !policy.commandAllowlist.some((pattern) => input.command?.includes(pattern))) return false
	}
	if (input.path) {
		if (policy.pathDenylist?.some((pattern) => input.path?.includes(pattern))) return true
		if (policy.action === "deny" && policy.pathDenylist?.length) return false
		if (policy.pathAllowlist?.length && !policy.pathAllowlist.some((pattern) => input.path?.includes(pattern))) return false
	}
	return true
}

function decision(allowed: boolean, action: "allow" | "ask" | "deny", reason: string, policies: EnterpriseToolPolicy[]): EnterpriseEnforcementDecision {
	return { allowed, action, reason, matchedPolicyIds: policies.map(policyId), auditRequired: true }
}

function policyId(policy: EnterpriseToolPolicy): string {
	return policy.id ?? policy.toolName
}

function intersects(required: string[], actual: string[]): boolean {
	return required.some((role) => actual.includes(role))
}
