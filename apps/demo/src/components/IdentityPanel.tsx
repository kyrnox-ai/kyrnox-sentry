import type { EnterprisePolicyBundle } from "@kyrnox/sentry-sdk";
import { Panel } from "./Panel";

export function IdentityPanel({
	bundle,
}: {
	bundle: EnterprisePolicyBundle;
}): React.ReactElement {
	const subject = bundle.claims?.subject ?? "anonymous@local";
	const org = bundle.claims?.organizationId ?? "\u2014";
	const roles = bundle.claims?.roles ?? [];
	const rolesText = roles.length > 0 ? roles.join(" \u25AE ") : "(no roles)";
	return (
		<Panel name="IDENTITY">
			<dl className="kv">
				<dt>OPERATOR:</dt>
				<dd className="cyan">{subject}</dd>
				<dt>ORG:</dt>
				<dd>{org}</dd>
				<dt>ROLES:</dt>
				<dd>{rolesText}</dd>
			</dl>
		</Panel>
	);
}
