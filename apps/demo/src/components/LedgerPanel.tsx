import { useEffect, useState } from "react";
import { bundleSha256Hex, shortLedgerTail } from "../sdk/ledger-tail";
import { Panel } from "./Panel";

const STUBS_URL = "https://github.com/kyrnox-ai/kyrnox-sentry/blob/main/STUBS.md";

export function LedgerPanel({
	bundleJson,
}: {
	bundleJson: string;
}): React.ReactElement {
	const [tail, setTail] = useState<string>("0x\u2026 (computing)");
	useEffect(() => {
		let cancelled = false;
		bundleSha256Hex(bundleJson).then((hex) => {
			if (!cancelled) setTail(shortLedgerTail(hex));
		});
		return () => {
			cancelled = true;
		};
	}, [bundleJson]);

	return (
		<Panel name="LEDGER">
			<dl className="kv">
				<dt>LEDGER TAIL:</dt>
				<dd className="cyan">{tail}</dd>
				<dt>EVENTS:</dt>
				<dd>(stub)</dd>
			</dl>
			<p style={{ marginTop: "0.5rem" }}>
				<span className="stub-chip">
					{"\u26A0 STUB \u2192 "}
					<a href={STUBS_URL} target="_blank" rel="noreferrer">
						HashChainedAuditLedger
					</a>
				</span>
			</p>
		</Panel>
	);
}
