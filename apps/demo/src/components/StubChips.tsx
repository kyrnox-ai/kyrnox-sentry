/**
 * Stub-status chips for the four v1-frozen integrity primitives.
 *
 * The OSS SDK ships these symbols with their signatures locked but
 * implementations that throw `not yet implemented`. The demo MUST NOT
 * call them; the chips below surface their status honestly and link
 * straight to STUBS.md for context.
 */
const STUBS_URL = "https://github.com/kyrnox-ai/kyrnox-sentry/blob/main/STUBS.md";

const STUBS = ["BundleSigner", "HashChainedAuditLedger", "FirmwareBaselineVerifier", "GeoAOIPolicy"] as const;

export function StubChips(): React.ReactElement {
	return (
		<p className="stub-chips" aria-label="SDK primitives that are stubs in this build">
			{STUBS.map((name) => (
				<span className="stub-chip" key={name}>
					{"\u26A0 STUB \u2192 "}
					<a href={`${STUBS_URL}#${name.toLowerCase()}`} target="_blank" rel="noreferrer">
						{name}
					</a>
				</span>
			))}
		</p>
	);
}
