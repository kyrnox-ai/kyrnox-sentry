import { execSync } from "node:child_process"
import figlet from "figlet"
import gradient from "gradient-string"
import { HEX, accents, palette } from "./colors.js"

const WORDMARK = "KYRNOX SENTRY"

/**
 * Resolve the short git SHA for the running build. Falls back to "unknown"
 * when not in a git checkout, when git is missing, or when called inside a
 * sandboxed runtime (CI tarball install, npx, etc.).
 */
function resolveBuildSha(): string {
	try {
		return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "unknown"
	} catch {
		return "unknown"
	}
}

function renderWordmark(): string {
	const ascii = figlet.textSync(WORDMARK, { font: "ANSI Shadow", horizontalLayout: "default" })
	const signalGradient = gradient([HEX.signalAmber, HEX.warningRed])
	return signalGradient.multiline(ascii)
}

function renderFooter(sha: string, ts: string): string {
	const left = accents.dim("// SIGNAL CORPS")
	const mid = `${accents.dim("// BUILD ")}${palette.signalAmber(sha)}`
	const right = `${accents.dim("// ")}${palette.restrictedCyan(ts)}`
	return `${left}  ${mid}  ${right}`
}

function renderClassification(): string {
	return `${accents.dim("[")}${palette.signalAmber.bold("CLASSIFIED")}${accents.dim(" // ")}${palette.warningRed.bold("ENFORCEMENT: DENY")}${accents.dim(" // ")}${palette.restrictedCyan("FAIL-CLOSED")}${accents.dim("]")}`
}

/**
 * Print the SENTRY boot banner.
 *
 * Defaults to stderr so existing JSON-on-stdout consumers (kyrnox-platform,
 * scripts, CI) stay byte-clean. Color is suppressed automatically when the
 * target stream is not a TTY (chalk handles this), so piped output stays
 * machine-parseable while interactive sessions get the cyberpunk treatment.
 */
export function printBanner(stream: NodeJS.WriteStream = process.stderr): void {
	const sha = resolveBuildSha()
	const ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
	const lines = [renderWordmark(), renderClassification(), renderFooter(sha, ts), ""]
	stream.write(`${lines.join("\n")}\n`)
}

/**
 * Render the banner to a string instead of writing it. Intended for tests
 * and the eventual `kyrnox-sentry status` TUI header.
 */
export function renderBanner(opts: { sha?: string; timestamp?: string } = {}): string {
	const sha = opts.sha ?? resolveBuildSha()
	const ts = opts.timestamp ?? new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
	return [renderWordmark(), renderClassification(), renderFooter(sha, ts), ""].join("\n")
}
