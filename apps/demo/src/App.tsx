import { useMemo, useState } from "react";
import { Banner } from "./components/Banner";
import { BundlePanel } from "./components/BundlePanel";
import { DecisionLog, type DecisionLogEntry } from "./components/DecisionLog";
import { IdentityPanel } from "./components/IdentityPanel";
import { LedgerPanel } from "./components/LedgerPanel";
import { Panel } from "./components/Panel";
import { PoliciesPanel } from "./components/PoliciesPanel";
import { RedTeamButtons } from "./components/RedTeamButtons";
import { StubChips } from "./components/StubChips";
import { SAMPLE_BUNDLE } from "./sdk/sample-bundle";

/**
 * SENTRY ops console — single-page composition.
 *
 * Layout mirrors the CLI's `kyrnox-sentry status` Ink TUI:
 *   ┌─ BUNDLE ───┬─ POLICIES ─┐
 *   ├─ LEDGER ───┼─ IDENTITY ─┤
 *   └─ RED-TEAM (full row) ───┘
 *   └─ DECISION LOG (full row) ┘
 *
 * Hard contracts:
 *   1. The browser surface NEVER calls SDK stubs (BundleSigner,
 *      HashChainedAuditLedger, FirmwareBaselineVerifier, GeoAOIPolicy).
 *      They are surfaced as ⚠ STUB chips that link to STUBS.md.
 *   2. Decision rendering is fail-closed: any non-allow decision from
 *      `evaluateToolPolicy` becomes a DENIED row, even if upstream
 *      regresses.
 *   3. No marketing copy. The page reads as a control surface.
 */
export default function App(): React.ReactElement {
	const bundle = SAMPLE_BUNDLE;
	const bundleJson = useMemo(() => JSON.stringify(bundle), [bundle]);
	const [entries, setEntries] = useState<DecisionLogEntry[]>([]);

	const append = (entry: DecisionLogEntry): void => {
		setEntries((prev) => [...prev, entry]);
	};

	const reset = (): void => setEntries([]);

	return (
		<div className="app">
			<Banner />

			<div className="grid">
				<BundlePanel bundle={bundle} />
				<PoliciesPanel bundle={bundle} />
				<LedgerPanel bundleJson={bundleJson} />
				<IdentityPanel bundle={bundle} />

				<div className="grid-full">
					<Panel name="RED-TEAM">
						<p style={{ marginTop: 0 }}>
							{
								"Each scenario passes a synthetic tool call through evaluateToolPolicy() from @kyrnox/sentry-sdk. Decisions append to the log below."
							}
						</p>
						<RedTeamButtons bundle={bundle} onDecision={append} />
					</Panel>
				</div>

				<div className="grid-full">
					<Panel name="DECISION LOG">
						<div
							style={{
								display: "flex",
								gap: "0.5rem",
								marginBottom: "0.5rem",
							}}
						>
							<button type="button" onClick={reset} data-testid="log-reset" aria-label="Clear decision log">
								{"\u2715 CLEAR"}
							</button>
						</div>
						<DecisionLog entries={entries} />
					</Panel>
				</div>
			</div>

			<footer className="footer">
				<StubChips />
				<small>
					{"\u25AE OSS \u2192 "}
					<a href="https://github.com/kyrnox-ai/kyrnox-sentry" target="_blank" rel="noreferrer">
						kyrnox-ai/kyrnox-sentry
					</a>
					{" \u25AE APACHE-2.0"}
				</small>
			</footer>
		</div>
	);
}
