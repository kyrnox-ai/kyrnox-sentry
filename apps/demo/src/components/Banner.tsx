/**
 * Mission-brief classification banner. Mirrors the CLI's
 * `// CLASSIFIED // KYRNOX SENTRY // ENFORCEMENT: DENY // FAIL-CLOSED`
 * line so the web preview reads as a control surface, not a marketing page.
 */
export function Banner(): React.ReactElement {
	return (
		<header className="banner" aria-label="SENTRY classification banner">
			<div className="classification">{"// CLASSIFIED // KYRNOX SENTRY // ENFORCEMENT: DENY // FAIL-CLOSED"}</div>
			<div>{"\u25AE SDK + TOOLS + CLI \u25AE APACHE-2.0 \u25AE NO TELEMETRY \u25AE DENY-BY-DEFAULT"}</div>
		</header>
	);
}
