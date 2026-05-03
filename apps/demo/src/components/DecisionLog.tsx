import type { ToolPolicyAction } from "@kyrnox/sentry-sdk";

/**
 * One row of the decision log. Mirrors the CLI's `formatDecision()`
 * column contract (STATUS / TOOL / IDENTITY / REASON / TS).
 */
export interface DecisionLogEntry {
	id: string;
	action: ToolPolicyAction;
	tool: string;
	identity: string;
	reason: string;
	timestamp: string;
}

const STATUS_LABEL: Record<ToolPolicyAction, string> = {
	allow: "[ ALLOWED  ]",
	ask: "[ REQUIRED ]",
	deny: "[  DENIED  ]",
};

function statusClass(action: ToolPolicyAction): string {
	return `cell log__status--${action}`;
}

export function DecisionLog({
	entries,
}: {
	entries: DecisionLogEntry[];
}): React.ReactElement {
	return (
		<table className="log" aria-label="Decision log">
			<thead>
				<tr className="log__header">
					<th scope="col" className="cell">
						STATUS
					</th>
					<th scope="col" className="cell">
						TOOL
					</th>
					<th scope="col" className="cell cell--identity">
						IDENTITY
					</th>
					<th scope="col" className="cell cell--reason">
						REASON
					</th>
					<th scope="col" className="cell cell--ts">
						TS
					</th>
				</tr>
			</thead>
			<tbody>
				{entries.length === 0 ? (
					<tr>
						<td colSpan={5} className="log__empty" data-testid="log-empty">
							{"(no decisions)"}
						</td>
					</tr>
				) : (
					entries.map((e) => (
						<tr className="log__row" key={e.id} data-testid="log-row">
							<td className={statusClass(e.action)} data-testid="log-status">
								{STATUS_LABEL[e.action]}
							</td>
							<td className="cell cell--tool">{e.tool}</td>
							<td className="cell cell--identity">{e.identity}</td>
							<td className="cell cell--reason">{e.reason}</td>
							<td className="cell cell--ts">{e.timestamp}</td>
						</tr>
					))
				)}
			</tbody>
		</table>
	);
}
