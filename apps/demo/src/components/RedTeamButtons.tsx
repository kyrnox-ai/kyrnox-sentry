import {
	type EnterpriseEnforcementDecision,
	type EnterprisePolicyBundle,
	evaluateToolPolicy,
} from "@kyrnox/sentry-sdk";
import type { DecisionLogEntry } from "./DecisionLog";

/**
 * Static red-team scenarios. Each scenario passes through the public
 * `evaluateToolPolicy` evaluator from `@kyrnox/sentry-sdk` and appends
 * the resulting decision to the log. Scenarios are designed so the
 * SAMPLE_BUNDLE shipped with the demo produces a diverse, deterministic
 * log: ALLOWED / ASK / DENIED-tool / DENIED-command / DENIED-path.
 */

export interface RedTeamScenario {
	id: string;
	label: string;
	expected: "allow" | "ask" | "deny";
	tool: string;
	command?: string;
	path?: string;
}

export const SCENARIOS: RedTeamScenario[] = [
	{
		id: "scn-allow-read",
		label: "ALLOWED \u2192 read_file src/main.ts",
		expected: "allow",
		tool: "read_file",
		path: "src/main.ts",
	},
	{
		id: "scn-ask-write",
		label: "ASK \u2192 write_to_file README.md",
		expected: "ask",
		tool: "write_to_file",
		path: "README.md",
	},
	{
		id: "scn-deny-network",
		label: "DENIED \u2192 browser_action launch",
		expected: "deny",
		tool: "browser_action",
	},
	{
		id: "scn-deny-command",
		label: "DENIED \u2192 execute_command rm -rf /var",
		expected: "deny",
		tool: "execute_command",
		command: "rm -rf /var",
	},
	{
		id: "scn-deny-path",
		label: "DENIED \u2192 read_file /etc/shadow",
		expected: "deny",
		tool: "read_file",
		path: "/etc/shadow",
	},
];

function nowIsoUtc(): string {
	return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Fail-closed display gate: any decision that is not an explicit `allow`
 * is rendered as DENIED, mirroring `formatDecision()` in the CLI.
 */
function gateAction(decision: EnterpriseEnforcementDecision): "allow" | "ask" | "deny" {
	if (!decision.allowed) return "deny";
	if (decision.action === "deny") return "deny";
	return decision.action;
}

export function buildEntry(bundle: EnterprisePolicyBundle, scenario: RedTeamScenario): DecisionLogEntry {
	const decision = evaluateToolPolicy({
		bundle,
		claims: bundle.claims,
		toolName: scenario.tool,
		command: scenario.command,
		path: scenario.path,
	});
	const action = gateAction(decision);
	return {
		id: `${scenario.id}-${Date.now()}`,
		action,
		tool: scenario.tool,
		identity: bundle.claims?.subject ?? "anonymous@local",
		reason: decision.reason,
		timestamp: nowIsoUtc(),
	};
}

export function RedTeamButtons({
	bundle,
	onDecision,
}: {
	bundle: EnterprisePolicyBundle;
	onDecision: (entry: DecisionLogEntry) => void;
}): React.ReactElement {
	return (
		<fieldset className="redteam">
			<legend className="redteam__legend">Red-team scenarios</legend>
			{SCENARIOS.map((s) => (
				<button
					key={s.id}
					type="button"
					data-status={s.expected}
					data-testid={`redteam-${s.id}`}
					onClick={() => onDecision(buildEntry(bundle, s))}
				>
					{s.label}
				</button>
			))}
		</fieldset>
	);
}
