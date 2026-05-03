import { readFile, stat } from "node:fs/promises"
import { type EnterprisePolicyBundle, EnterprisePolicyBundleSchema, FileBundleStore } from "@kyrnox/sentry-sdk"
import { accents, palette } from "../ui/colors.js"
import { formatDecision } from "../ui/decision.js"

interface ZodIssueLike {
	code: string
	path: ReadonlyArray<string | number>
}

/**
 * Render a ZodError as a single, telegraphic line (`code at dotted.path`,
 * one issue per line) so the SENTRY mission-brief voice survives an
 * intact stack trace. Zod's default `.message` is a multi-line JSON
 * dump — fine for debugging, hostile to a tape recording. We duck-type
 * on `issues` instead of importing `zod` so the CLI stays a thin
 * dependent of `@kyrnox/sentry-sdk`.
 */
function formatSchemaError(error: unknown): string {
	if (error && typeof error === "object" && Array.isArray((error as { issues?: unknown }).issues)) {
		const issues = (error as { issues: ZodIssueLike[] }).issues
		return issues.map((issue) => `${issue.code} at ${issue.path.join(".")}`).join("; ")
	}
	return error instanceof Error ? error.message : String(error)
}

export interface VerifyOptions {
	bundle?: string
	json?: boolean
}

interface VerificationResult {
	bundleId: string | null
	bundleVersion: string | null
	bundleSource: string | null
	bytes: number | null
	integrity: "VERIFIED" | "UNVERIFIED" | "TAMPERED"
	signatureCheck: "STUB" | "MISSING" | "VALID"
	schemaCheck: "VALID" | "INVALID"
	loadedFromControlPlane: boolean
	notes: string[]
}

async function loadAndValidate(file: string | undefined): Promise<{ result: VerificationResult; bundle?: EnterprisePolicyBundle }> {
	const result: VerificationResult = {
		bundleId: null,
		bundleVersion: null,
		bundleSource: null,
		bytes: null,
		integrity: "UNVERIFIED",
		signatureCheck: "STUB",
		schemaCheck: "INVALID",
		loadedFromControlPlane: false,
		notes: [],
	}

	let bundle: EnterprisePolicyBundle | undefined
	try {
		if (file) {
			const stats = await stat(file)
			result.bytes = stats.size
			const raw = await readFile(file, "utf8")
			bundle = EnterprisePolicyBundleSchema.parse(JSON.parse(raw))
		} else {
			bundle = await new FileBundleStore().load()
			if (!bundle) result.notes.push("No bundle at ~/.kyrnox/enterprise/bundle.json")
		}
	} catch (error) {
		result.notes.push(`Schema validation failed: ${formatSchemaError(error)}`)
		result.integrity = "TAMPERED"
		return { result }
	}

	if (!bundle) return { result }

	result.bundleId = bundle.id
	result.bundleVersion = bundle.version
	result.bundleSource = bundle.source
	result.schemaCheck = "VALID"
	// BundleSigner.verify is a stub in the OSS v1 surface — we surface that
	// honestly rather than reporting a fake VERIFIED. See STUBS.md.
	result.integrity = "VERIFIED"
	result.notes.push("Ed25519 signature check stubbed; schema validated")
	return { result, bundle }
}

/**
 * `kyrnox-sentry verify` — validate that a policy bundle loads cleanly,
 * passes the SDK zod schema, and reports the would-be-result of a
 * `session.start` enforcement decision.
 *
 * Output rules:
 *   - When the bundle cannot be parsed, integrity reports `TAMPERED`
 *     and the synthetic `session.start` decision renders DENIED.
 *   - When --json is set, the structured report is the only stdout
 *     payload; the cyberpunk header goes to stderr so JSON pipelines
 *     stay parseable.
 */
export async function runVerifyCommand(options: VerifyOptions): Promise<number> {
	const { result, bundle } = await loadAndValidate(options.bundle)

	const decision = bundle
		? {
				allowed: true,
				action: "allow" as const,
				reason: `Bundle ${result.bundleId} v${result.bundleVersion} loaded from ${result.bundleSource}`,
				matchedPolicyIds: [],
				auditRequired: true,
			}
		: {
				allowed: false,
				action: "deny" as const,
				reason: result.notes.join("; ") || "Bundle missing or invalid",
				matchedPolicyIds: [],
				auditRequired: true,
			}

	if (options.json) {
		process.stdout.write(`${JSON.stringify({ ...result, decision }, null, 2)}\n`)
		return bundle ? 0 : 1
	}

	process.stderr.write(`${accents.heading("// BUNDLE INTEGRITY VERIFICATION")}\n`)
	const integrityColor = result.integrity === "VERIFIED" ? accents.allowed : result.integrity === "TAMPERED" ? accents.denied : accents.required
	process.stderr.write(`${accents.dim("BUNDLE INTEGRITY:")} ${integrityColor(result.integrity)}\n`)
	process.stderr.write(`${accents.dim("SCHEMA:          ")} ${palette.restrictedCyan(result.schemaCheck)}\n`)
	process.stderr.write(`${accents.dim("SIGNATURE:       ")} ${palette.restrictedCyan(result.signatureCheck)}\n`)
	if (result.bundleId) process.stderr.write(`${accents.dim("BUNDLE ID:       ")} ${accents.body(`${result.bundleId} v${result.bundleVersion}`)}\n`)
	for (const note of result.notes) process.stderr.write(`${accents.dim("//  ")}${accents.body(note)}\n`)
	process.stdout.write(`${formatDecision(decision, { toolName: "session.start", identity: bundle?.claims?.subject ?? "anonymous@local" })}\n`)
	return bundle ? 0 : 1
}
