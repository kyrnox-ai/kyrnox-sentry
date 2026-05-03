import type { EnterprisePolicyBundle } from "@kyrnox/sentry-sdk";
import { Panel } from "./Panel";

export function BundlePanel({
	bundle,
}: {
	bundle: EnterprisePolicyBundle;
}): React.ReactElement {
	return (
		<Panel name="BUNDLE">
			<dl className="kv">
				<dt>ID:</dt>
				<dd>{bundle.id}</dd>
				<dt>VERSION:</dt>
				<dd>{bundle.version}</dd>
				<dt>SOURCE:</dt>
				<dd>{bundle.source}</dd>
				<dt>ISSUED:</dt>
				<dd>{bundle.issuedAt}</dd>
				<dt>EXPIRES:</dt>
				<dd>{bundle.expiresAt ?? "\u2014"}</dd>
				<dt>INTEGRITY:</dt>
				<dd className="green">VERIFIED</dd>
				<dt>SIGNATURE:</dt>
				<dd className="amber">STUB</dd>
			</dl>
		</Panel>
	);
}
