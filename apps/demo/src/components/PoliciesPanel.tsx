import type { EnterprisePolicyBundle } from "@kyrnox/sentry-sdk";
import { Panel } from "./Panel";

function counts(bundle: EnterprisePolicyBundle): {
	allow: number;
	ask: number;
	deny: number;
} {
	const c = { allow: 0, ask: 0, deny: 0 };
	for (const p of bundle.toolPolicies) c[p.action] += 1;
	return c;
}

export function PoliciesPanel({
	bundle,
}: {
	bundle: EnterprisePolicyBundle;
}): React.ReactElement {
	const c = counts(bundle);
	return (
		<Panel name="POLICIES">
			<dl className="kv">
				<dt>TOTAL:</dt>
				<dd>{bundle.toolPolicies.length}</dd>
			</dl>
			<ul className="policies">
				<li className="policies__chip policies__chip--allow">{`\u25AE ALLOW: ${c.allow}`}</li>
				<li className="policies__chip policies__chip--ask">{`\u25AE ASK: ${c.ask}`}</li>
				<li className="policies__chip policies__chip--deny">{`\u25AE DENY: ${c.deny}`}</li>
			</ul>
		</Panel>
	);
}
