/**
 * STUB — verifies an attested firmware/build manifest against an
 * enterprise-signed baseline. Full implementation lands with SENTRY
 * hardening; see docs/SENTRY.md.
 */
export interface FirmwareBaselineEntry {
	componentId: string
	version: string
	digest: string
	algorithm: "sha-256" | "sha-384" | "sha-512"
}

export interface FirmwareCheckInput {
	componentId: string
	version: string
	digest: string
	algorithm: FirmwareBaselineEntry["algorithm"]
}

export class FirmwareBaselineVerifier {
	constructor(private readonly baseline: FirmwareBaselineEntry[] = []) {}

	check(_input: FirmwareCheckInput): { matched: boolean; entry?: FirmwareBaselineEntry; reason?: string } {
		throw new Error("FirmwareBaselineVerifier.check is not yet implemented (see STUBS.md)")
	}
}
